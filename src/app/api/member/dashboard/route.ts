


// // src/app/api/member/dashboard/route.ts
// import { NextResponse } from "next/server"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"
// import { startOfMonth, endOfMonth } from "date-fns"

// export async function GET() {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//   const now = new Date()

//   const memberships = await prisma.gymMember.findMany({
//     where: { profileId: session.user.id },
//     include: {
//       gym: {
//         select: {
//           id: true, name: true, city: true, address: true,
//           services: true, facilities: true, gymImages: true,
//           contactNumber: true,
//           owner: { select: { fullName: true, avatarUrl: true, mobileNumber: true } },
//         },
//       },
//       membershipPlan: { select: { name: true, durationMonths: true, features: true, price: true } },
//       assignedTrainer: {
//         include: { profile: { select: { fullName: true, avatarUrl: true } } },
//       },
//     },
//     orderBy: { createdAt: "desc" },
//   })

//   const activeMembership = memberships.find(m => m.status === "ACTIVE") ?? null
//   const memberIds = memberships.map(m => m.id)

//   const [attendanceThisMonth, totalAttendance, recentAttendance, workoutPlans, dietPlans, unreadNotifications] =
//     await Promise.all([
//       prisma.attendance.count({
//         where: { memberId: { in: memberIds }, checkInTime: { gte: startOfMonth(now), lte: endOfMonth(now) } },
//       }),
//       prisma.attendance.count({ where: { memberId: { in: memberIds } } }),
//       prisma.attendance.findMany({
//         where: { memberId: { in: memberIds } },
//         orderBy: { checkInTime: "desc" },
//         take: 5,
//         include: { gym: { select: { name: true } } },
//       }),
//       prisma.workoutPlan.count({
//         where: {
//           OR: [
//             { assignedToMemberId: { in: memberIds } },
//             ...(activeMembership ? [{ gymId: activeMembership.gymId, isGlobal: true }] : []),
//           ],
//           isActive: true,
//         },
//       }),
//       prisma.dietPlan.count({
//         where: {
//           OR: [
//             { assignedToMemberId: { in: memberIds } },
//             ...(activeMembership ? [{ gymId: activeMembership.gymId, isGlobal: true }] : []),
//           ],
//           isActive: true,
//         },
//       }),
//       prisma.notification.count({ where: { profileId: session.user.id, isRead: false } }),
//     ])

//   let daysUntilExpiry: number | null = null
//   if (activeMembership?.endDate) {
//     daysUntilExpiry = Math.ceil(
//       (new Date(activeMembership.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
//     )
//   }

//   return NextResponse.json({
//     memberships, activeMembership,
//     stats: { attendanceThisMonth, totalAttendance, workoutPlans, dietPlans, daysUntilExpiry, unreadNotifications },
//     recentAttendance,
//   })
// }

// src/app/api/member/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()

  const memberships = await prisma.gymMember.findMany({
    where: { profileId: profileId },
    include: {
      gym: {
        select: {
          id: true, name: true, city: true, address: true,
          services: true, facilities: true, gymImages: true,
          contactNumber: true, logoUrl: true,
          owner: { select: { fullName: true, avatarUrl: true, mobileNumber: true } },
        },
      },
      membershipPlan:  { select: { name: true, durationMonths: true, features: true, price: true } },
      assignedTrainer: { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  const activeMembership = memberships.find(m => m.status === "ACTIVE") ?? null
  const memberIds        = memberships.map(m => m.id)

  // Aggregate streak from all memberships — take the best
  const streak = memberships.reduce(
    (best, m) => ({
      current: Math.max(best.current, m.currentStreak ?? 0),
      longest: Math.max(best.longest, m.longestStreak ?? 0),
      total:   best.total + (m.totalCheckins ?? 0),
    }),
    { current: 0, longest: 0, total: 0 }
  )

  const todayStart = startOfDay(now)
  const todayEnd   = endOfDay(now)

  const [
    attendanceThisMonth,
    recentAttendance,
    workoutPlans,
    dietPlans,
    unreadNotifications,
    milestones,
    todayCheckin,
  ] = await Promise.all([
    prisma.attendance.count({
      where: { memberId: { in: memberIds }, checkInTime: { gte: startOfMonth(now), lte: endOfMonth(now) } },
    }),
    prisma.attendance.findMany({
      where:   { memberId: { in: memberIds } },
      orderBy: { checkInTime: "desc" },
      take:    5,
      include: { gym: { select: { name: true } } },
    }),
    prisma.workoutPlan.count({
      where: {
        OR: [
          { assignedToMemberId: { in: memberIds } },
          ...(activeMembership ? [{ gymId: activeMembership.gymId, isGlobal: true }] : []),
        ],
        isActive: true,
      },
    }),
    prisma.dietPlan.count({
      where: {
        OR: [
          { assignedToMemberId: { in: memberIds } },
          ...(activeMembership ? [{ gymId: activeMembership.gymId, isGlobal: true }] : []),
        ],
        isActive: true,
      },
    }),
    prisma.notification.count({
      where: { profileId: profileId, isRead: false },
    }),
    prisma.attendanceMilestone.findMany({
      where:   { memberId: { in: memberIds } },
      orderBy: { achievedAt: "desc" },
    }),
    // Check if checked in today
    memberIds.length > 0
      ? prisma.attendance.findFirst({
          where: { memberId: { in: memberIds }, checkInTime: { gte: todayStart, lte: todayEnd } },
        })
      : null,
  ])

  const checkedInToday = !!todayCheckin

  // Days until expiry
  let daysUntilExpiry: number | null = null
  if (activeMembership?.endDate) {
    const diff = activeMembership.endDate.getTime() - now.getTime()
    daysUntilExpiry = Math.ceil(diff / 86400000)
  }

  return NextResponse.json({
    activeMembership,
    memberships,
    streak,
    checkedInToday,
    milestones,
    stats: {
      attendanceThisMonth,
      totalAttendance:     streak.total,
      workoutPlans,
      dietPlans,
      daysUntilExpiry,
      unreadNotifications,
    },
    recentAttendance,
  })
}


// // src/app/api/member/attendance/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"

// export async function GET(req: NextRequest) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//   const { searchParams } = new URL(req.url)
//   const page  = parseInt(searchParams.get("page") ?? "1")
//   const limit = 20

//   const memberships = await prisma.gymMember.findMany({
//     where: { profileId: session.user.id },
//     select: { id: true },
//   })
//   const memberIds = memberships.map(m => m.id)

//   const [records, total] = await Promise.all([
//     prisma.attendance.findMany({
//       where: { memberId: { in: memberIds } },
//       orderBy: { checkInTime: "desc" },
//       skip: (page - 1) * limit, take: limit,
//       include: { gym: { select: { name: true } } },
//     }),
//     prisma.attendance.count({ where: { memberId: { in: memberIds } } }),
//   ])

//   return NextResponse.json({ records, total, pages: Math.ceil(total / limit) })
// }

// export async function POST() {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//   // Find the member's active membership
//   const membership = await prisma.gymMember.findFirst({
//     where: { profileId: session.user.id, status: "ACTIVE" },
//     select: { id: true, gymId: true },
//   })
//   if (!membership) return NextResponse.json({ error: "No active gym membership found" }, { status: 404 })

//   // Only allow today's check-in — block if already checked in today
//   const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
//   const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

//   const existing = await prisma.attendance.findFirst({
//     where: { memberId: membership.id, checkInTime: { gte: todayStart, lte: todayEnd } },
//   })
//   if (existing) return NextResponse.json({ error: "Already checked in today" }, { status: 409 })

//   const record = await prisma.attendance.create({
//     data: { gymId: membership.gymId, memberId: membership.id, checkInTime: new Date(), method: "MANUAL" },
//   })
//   return NextResponse.json(record, { status: 201 })
// }


// src/app/api/member/attendance/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from "date-fns"
import { sendPushToProfile } from "@/lib/push"

const MILESTONES = [7, 14, 30, 60, 100, 180, 365]

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page  = parseInt(searchParams.get("page") ?? "1")
  const limit = 20
  const now   = new Date()

  const memberships = await prisma.gymMember.findMany({
    where:  { profileId: session.user.id },
    select: { id: true, currentStreak: true, longestStreak: true, totalCheckins: true },
  })
  const memberIds = memberships.map(m => m.id)

  const [records, total, thisMonth, milestones] = await Promise.all([
    prisma.attendance.findMany({
      where:   { memberId: { in: memberIds } },
      orderBy: { checkInTime: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
      include: { gym: { select: { name: true } } },
    }),
    prisma.attendance.count({ where: { memberId: { in: memberIds } } }),
    prisma.attendance.count({
      where: {
        memberId:    { in: memberIds },
        checkInTime: { gte: startOfMonth(now), lte: endOfMonth(now) },
      },
    }),
    prisma.attendanceMilestone.findMany({
      where:   { memberId: { in: memberIds } },
      orderBy: { achievedAt: "desc" },
    }),
  ])

  const streak = memberships.reduce(
    (best, m) => ({
      current: Math.max(best.current, m.currentStreak ?? 0),
      longest: Math.max(best.longest, m.longestStreak ?? 0),
      total:   best.total + (m.totalCheckins ?? 0),
    }),
    { current: 0, longest: 0, total: 0 }
  )

  const todayStart     = startOfDay(now)
  const checkedInToday = records.length > 0 && new Date(records[0].checkInTime) >= todayStart

  return NextResponse.json({
    records, total, pages: Math.ceil(total / limit),
    streak, checkedInToday, milestones, thisMonth,
  })
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()

  const membership = await prisma.gymMember.findFirst({
    where:   { profileId: session.user.id, status: "ACTIVE" },
    include: {
      gym:     { select: { id: true, name: true, ownerId: true } },
      profile: { select: { fullName: true } },
    },
  })
  if (!membership) return NextResponse.json({ error: "No active membership found" }, { status: 400 })

  const todayStart = startOfDay(now)
  const todayEnd   = endOfDay(now)

  // Prevent double check-in same day
  const already = await prisma.attendance.findFirst({
    where: { memberId: membership.id, checkInTime: { gte: todayStart, lte: todayEnd } },
  })
  if (already) return NextResponse.json({ error: "Already checked in today" }, { status: 409 })

  // ── Streak calculation ─────────────────────────────────────────────────
  const yesterday  = startOfDay(subDays(now, 1))
  const lastDate   = membership.lastCheckinDate

  let newStreak = 1
  if (lastDate) {
    const lastDay = startOfDay(new Date(lastDate))
    if (lastDay.getTime() === yesterday.getTime()) {
      newStreak = (membership.currentStreak ?? 0) + 1
    }
    // gap → reset to 1
  }

  const newLongest = Math.max(membership.longestStreak ?? 0, newStreak)
  const newTotal   = (membership.totalCheckins ?? 0) + 1

  // ── Atomic write: attendance + streak update ───────────────────────────
  const [record] = await prisma.$transaction([
    prisma.attendance.create({
      data:    { gymId: membership.gymId, memberId: membership.id, checkInTime: now, method: "SELF" },
      include: { gym: { select: { name: true } } },
    }),
    prisma.gymMember.update({
      where: { id: membership.id },
      data:  {
        currentStreak:   newStreak,
        longestStreak:   newLongest,
        totalCheckins:   newTotal,
        lastCheckinDate: todayStart,
      },
    }),
  ])

  // ── Check & award new milestones ───────────────────────────────────────
  const newMilestones: number[] = []
  for (const threshold of MILESTONES) {
    if (newStreak >= threshold) {
      try {
        const result = await prisma.attendanceMilestone.upsert({
          where:  { memberId_milestone: { memberId: membership.id, milestone: threshold } },
          update: {},
          create: { memberId: membership.id, gymId: membership.gymId, milestone: threshold },
        })
        // Only new if achievedAt is within 10 seconds of now
        const isNew = Date.now() - result.achievedAt.getTime() < 10000
        if (isNew) newMilestones.push(threshold)
      } catch {}
    }
  }

  // ── Send milestone notifications ───────────────────────────────────────
  if (newMilestones.length > 0) {
    const biggest = Math.max(...newMilestones)
    const milestoneLabels: Record<number, string> = {
      7: "7-Day Streak", 14: "2-Week Warrior", 30: "Consistency King",
      60: "60-Day Champion", 100: "100-Day Legend", 180: "180-Day Elite", 365: "1-Year Titan",
    }
    const label = milestoneLabels[biggest] ?? `${biggest}-Day Achievement`

    await Promise.allSettled([
      // Push to member
      sendPushToProfile(session.user.id, {
        title: `🏆 ${label}!`,
        body:  `You've hit ${biggest} consecutive days at ${membership.gym.name}! Check your dashboard for your badge.`,
        url:   "/member/dashboard",
        tag:   `milestone-${biggest}`,
      }),
      // Push to owner
      sendPushToProfile(membership.gym.ownerId, {
        title: `⭐ Member Milestone!`,
        body:  `${membership.profile.fullName} just hit ${biggest} days at ${membership.gym.name}!`,
        url:   "/owner/attendance",
      }),
      // In-app notification for member
      prisma.notification.create({
        data: {
          profileId: session.user.id,
          gymId:     membership.gymId,
          title:     `🏆 ${label}!`,
          message:   `${biggest} days of showing up at ${membership.gym.name}. You've earned a special badge — check your dashboard!`,
          type:      "SYSTEM",
        },
      }),
    ])
  }

  return NextResponse.json({
    record,
    streak:       { current: newStreak, longest: newLongest, total: newTotal },
    newMilestones,
    message:      `Checked in! 🔥 ${newStreak}-day streak!`,
  })
}
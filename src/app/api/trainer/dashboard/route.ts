// src/app/api/trainer/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth } from "date-fns"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const trainer = await prisma.gymTrainer.findUnique({
    where: { profileId: profileId },
    include: {
      gym: { select: { id: true, name: true, city: true, gymImages: true, contactNumber: true } },
      profile: { select: { fullName: true, avatarUrl: true, email: true, mobileNumber: true } },
      assignedMembers: {
        include: {
          profile: { select: { fullName: true, avatarUrl: true, email: true, mobileNumber: true } },
          membershipPlan: { select: { name: true, durationMonths: true } },
          attendance: { orderBy: { checkInTime: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!trainer) return NextResponse.json({ error: "Trainer not found" }, { status: 404 })

  const now = new Date()
  const memberIds = trainer.assignedMembers.map(m => m.id)

  const [attendanceThisMonth, totalAttendance, recentAttendance] = await Promise.all([
    prisma.attendance.count({
      where: {
        memberId: { in: memberIds },
        checkInTime: { gte: startOfMonth(now), lte: endOfMonth(now) },
      },
    }),
    prisma.attendance.count({ where: { memberId: { in: memberIds } } }),
    prisma.attendance.findMany({
      where: { memberId: { in: memberIds } },
      orderBy: { checkInTime: "desc" },
      take: 8,
      include: {
        member: { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
      },
    }),
  ])

  const activeMembers  = trainer.assignedMembers.filter(m => m.status === "ACTIVE").length
  const expiredMembers = trainer.assignedMembers.filter(m => m.status === "EXPIRED").length

  // Members expiring within next 7 days
  const expiringSoon = trainer.assignedMembers.filter(m => {
    if (!m.endDate || m.status !== "ACTIVE") return false
    const days = Math.ceil((new Date(m.endDate).getTime() - now.getTime()) / 86400000)
    return days >= 0 && days <= 7
  })

  return NextResponse.json({
    trainer,
    stats: { totalMembers: trainer.assignedMembers.length, activeMembers, expiredMembers, attendanceThisMonth, totalAttendance },
    recentAttendance,
    expiringSoon,
  })
}
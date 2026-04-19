// src/app/api/trainer/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth } from "date-fns"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const trainer = await prisma.gymTrainer.findUnique({
    where: { profileId },
    include: {
      gym:     { select: { id: true, name: true, city: true } },
      profile: { select: { fullName: true, avatarUrl: true, email: true, mobileNumber: true } },
      assignedMembers: {
        include: {
          profile:        { select: { fullName: true, avatarUrl: true, email: true } },
          membershipPlan: { select: { name: true } },
          workoutPlans:   { where: { isActive: true }, select: { id: true, title: true } },
          dietPlans:      { where: { isActive: true }, select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!trainer) return NextResponse.json({ hasNoGym: true, trainerName: null, gymName: null, trainer: null, stats: { totalMembers: 0, activeMembers: 0, workoutPlans: 0, dietPlans: 0, attendanceThisMonth: 0 }, membersNeedingAttention: [], recentAttendance: [], expiringSoon: [] })

  const now       = new Date()
  const memberIds = trainer.assignedMembers.map(m => m.id)

  const [workoutPlanCount, dietPlanCount, attendanceThisMonth, recentAttendance] = await Promise.all([
    prisma.workoutPlan.count({
      where: { createdBy: profileId, isActive: true },
    }),
    prisma.dietPlan.count({
      where: { createdBy: profileId, isActive: true },
    }),
    prisma.attendance.count({
      where: {
        memberId:    { in: memberIds },
        checkInTime: { gte: startOfMonth(now), lte: endOfMonth(now) },
      },
    }),
    prisma.attendance.findMany({
      where:   { memberId: { in: memberIds } },
      orderBy: { checkInTime: "desc" },
      take:    10,
      include: {
        member: { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
      },
    }),
  ])

  const activeMembers = trainer.assignedMembers.filter(m => m.status === "ACTIVE").length

  // Members needing attention: no workout plan or no diet plan
  const membersNeedingAttention = trainer.assignedMembers
    .filter(m => m.workoutPlans.length === 0 || m.dietPlans.length === 0)
    .slice(0, 5)
    .map(m => ({
      id:               m.id,
      profile:          m.profile,
      status:           m.status,
      membershipPlan:   m.membershipPlan,
      hasWorkoutPlan:   m.workoutPlans.length > 0,
      hasDietPlan:      m.dietPlans.length > 0,
    }))

  // Expiring in next 7 days (keep for dashboard warning)
  const expiringSoon = trainer.assignedMembers.filter(m => {
    if (!m.endDate || m.status !== "ACTIVE") return false
    const days = Math.ceil((new Date(m.endDate).getTime() - now.getTime()) / 86400000)
    return days >= 0 && days <= 7
  })

  return NextResponse.json({
    trainerName: trainer.profile.fullName,
    gymName:     trainer.gym.name,
    trainer,
    stats: {
      totalMembers:        trainer.assignedMembers.length,
      activeMembers,
      workoutPlans:        workoutPlanCount,
      dietPlans:           dietPlanCount,
      attendanceThisMonth,
    },
    membersNeedingAttention,
    recentAttendance,
    expiringSoon,
  })
}

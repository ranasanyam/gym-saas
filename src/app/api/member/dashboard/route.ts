// src/app/api/member/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()

  const profile = await prisma.profile.findUnique({
    where:  { id: profileId },
    select: { fullName: true },
  })

  const memberships = await prisma.gymMember.findMany({
    where: { profileId },
    include: {
      gym: {
        select: { id: true, name: true, city: true, address: true, contactNumber: true, logoUrl: true },
      },
      membershipPlan:  { select: { name: true, durationMonths: true, price: true } },
      assignedTrainer: { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  const activeMembership = memberships.find(m => m.status === "ACTIVE") ?? memberships[0] ?? null
  const memberIds        = memberships.map(m => m.id)

  const today = { gte: startOfDay(now), lte: endOfDay(now) }

  const [
    monthlyCheckIns,
    todayCheckin,
    workoutPlan,
    dietPlan,
    recentNotifications,
    unreadCount,
  ] = await Promise.all([
    prisma.attendance.count({
      where: { memberId: { in: memberIds }, checkInTime: { gte: startOfMonth(now), lte: endOfMonth(now) } },
    }),
    memberIds.length > 0
      ? prisma.attendance.findFirst({
          where: { memberId: { in: memberIds }, checkInTime: today },
        })
      : null,
    // Most recent assigned workout plan
    activeMembership
      ? prisma.workoutPlan.findFirst({
          where: { assignedToMemberId: activeMembership.id, isActive: true },
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, goal: true, difficulty: true, planData: true },
        })
      : null,
    // Most recent assigned diet plan
    activeMembership
      ? prisma.dietPlan.findFirst({
          where: { assignedToMemberId: activeMembership.id, isActive: true },
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, goal: true, caloriesTarget: true, planData: true },
        })
      : null,
    prisma.notification.findMany({
      where:   { profileId, isRead: false },
      orderBy: { createdAt: "desc" },
      take:    3,
      select:  { id: true, title: true, message: true, type: true, createdAt: true, isRead: true },
    }),
    prisma.notification.count({ where: { profileId, isRead: false } }),
  ])

  const hasCheckedInToday = !!todayCheckin

  // Streak from membership record
  const currentStreak = activeMembership
    ? ((activeMembership as any).currentStreak ?? 0)
    : 0

  // Days remaining
  let daysRemaining: number | null = null
  if (activeMembership?.endDate) {
    daysRemaining = Math.max(0, Math.ceil((activeMembership.endDate.getTime() - now.getTime()) / 86400000))
  }

  // Today's workout — exercises for today's day of week
  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
  const todayName = dayNames[now.getDay()]
  let todayWorkout: { exercises: any[]; day: string } | null = null
  if (workoutPlan?.planData) {
    const exercises = (workoutPlan.planData as any)[todayName] ?? []
    todayWorkout = { exercises, day: todayName }
  }

  // Today's diet summary
  let todayDiet: { mealCount: number; totalCalories: number } | null = null
  if (dietPlan?.planData) {
    const planData = dietPlan.planData as Record<string, any[]>
    const todaySlots = Object.keys(planData).filter(k => k.startsWith(`${todayName}__`))
    let mealCount = 0
    let totalCalories = 0
    for (const slot of todaySlots) {
      const items = planData[slot] ?? []
      mealCount++
      for (const item of items) {
        totalCalories += Number(item.calories) || 0
      }
    }
    // Also handle old format (day key directly)
    const oldKey = planData[todayName]
    if (oldKey && typeof oldKey === "object" && !Array.isArray(oldKey)) {
      for (const mealItems of Object.values(oldKey) as any[][]) {
        mealCount++
        for (const item of mealItems) {
          totalCalories += Number(item.calories) || 0
        }
      }
    }
    todayDiet = { mealCount, totalCalories }
  }

  return NextResponse.json({
    memberName:       profile?.fullName ?? "Member",
    gymName:          activeMembership?.gym?.name ?? null,
    membershipStatus: activeMembership?.status ?? null,
    membershipPlan:   activeMembership?.membershipPlan?.name ?? null,
    expiryDate:       activeMembership?.endDate ?? null,
    daysRemaining,
    hasCheckedInToday,
    currentStreak,
    monthlyCheckIns,
    todayWorkout,
    todayDiet,
    recentNotifications,
    unreadCount,
    activeMembership,
    memberships,
  })
}

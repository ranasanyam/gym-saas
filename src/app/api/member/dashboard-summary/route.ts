// src/app/api/member/dashboard-summary/route.ts
// Single endpoint that returns all tracker data needed by the member dashboard.
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, subDays, getISOWeek, getISOWeekYear } from "date-fns"

const DAY_NUMBER_TO_NAME: Record<number, string> = {
  1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday",
  5: "Friday",  6: "Saturday",  7: "Sunday",
}

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now     = new Date()
  const todayS  = startOfDay(now)
  const todayE  = endOfDay(now)
  const weekAgo = startOfDay(subDays(now, 6))

  const membership = await prisma.gymMember.findFirst({
    where:   { profileId, status: "ACTIVE" },
    select:  { id: true, gymId: true },
    orderBy: { createdAt: "desc" },
  })

  if (!membership) {
    return NextResponse.json({
      success: true,
      data: {
        assignedDietPlan:    null,
        assignedWorkoutPlan: null,
        todayMealLogs:       [],
        weekMealLogs:        [],
        recentWorkoutLogs:   [],
        todayMacroSummary:   { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      },
    })
  }

  const [dietPlan, workoutPlan, todayMealLogs, weekMealLogs, recentWorkoutLogs] = await Promise.all([
    prisma.dietPlan.findFirst({
      where:   { assignedToMemberId: membership.id, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workoutPlan.findFirst({
      where:   { assignedToMemberId: membership.id, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.mealLog.findMany({
      where:   { memberId: membership.id, logDate: { gte: todayS, lte: todayE } },
      orderBy: { takenAt: "asc" },
    }),
    prisma.mealLog.findMany({
      where:   { memberId: membership.id, logDate: { gte: weekAgo, lte: todayE } },
      orderBy: { takenAt: "asc" },
    }),
    prisma.workoutLog.findMany({
      where:   { memberId: membership.id, loggedAt: { gte: weekAgo } },
      include: { workoutPlan: { select: { id: true, title: true, goal: true, difficulty: true } } },
      orderBy: { loggedAt: "desc" },
    }),
  ])

  // Compute today's macro summary from meal logs
  let calories  = 0
  let protein_g = 0
  let carbs_g   = 0
  let fat_g     = 0

  if (todayMealLogs.length > 0 && dietPlan) {
    const planData = dietPlan.planData as Record<string, any[]>
    for (const log of todayMealLogs) {
      const items = planData[log.mealKey] ?? []
      for (const item of items) {
        calories  += Number(item.calories)  || 0
        protein_g += Number(item.protein_g) || 0
        carbs_g   += Number(item.carbs_g)   || 0
        fat_g     += Number(item.fat_g)     || 0
      }
    }
  }

  // Annotate recent workout logs with readable day name
  const annotatedWorkoutLogs = recentWorkoutLogs.map(log => ({
    ...log,
    scheduledDayName: log.dayNumber
      ? (DAY_NUMBER_TO_NAME[log.dayNumber] ?? log.notes ?? "Day")
      : (log.notes ?? "Day"),
  }))

  // Check if today's workout is already logged
  const todayDayNumber = [7,1,2,3,4,5,6][now.getDay()] // Sun=7, Mon=1..Sat=6
  const weekEncoded    = getISOWeekYear(now) * 100 + getISOWeek(now)
  const todayWorkoutLogged = workoutPlan
    ? recentWorkoutLogs.some(
        l => l.workoutPlanId === workoutPlan.id &&
             l.weekNumber   === weekEncoded     &&
             l.dayNumber    === todayDayNumber
      )
    : false

  return NextResponse.json({
    success: true,
    data: {
      assignedDietPlan:    dietPlan    ?? null,
      assignedWorkoutPlan: workoutPlan ?? null,
      todayMealLogs,
      weekMealLogs,
      recentWorkoutLogs:   annotatedWorkoutLogs,
      todayWorkoutLogged,
      todayMacroSummary: {
        calories:  Math.round(calories),
        protein_g: Math.round(protein_g * 10) / 10,
        carbs_g:   Math.round(carbs_g   * 10) / 10,
        fat_g:     Math.round(fat_g     * 10) / 10,
      },
    },
  })
}

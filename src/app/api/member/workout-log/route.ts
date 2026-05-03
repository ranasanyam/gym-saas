// src/app/api/member/workout-log/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { getISOWeek, getISOWeekYear } from "date-fns"

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
  friday: 5, saturday: 6, sunday: 7,
}

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { workoutPlanId?: string; scheduledDay?: string; completedAt?: string }
  try { body = await req.json() } catch { body = {} }

  const { workoutPlanId, scheduledDay, completedAt } = body
  if (!workoutPlanId || !scheduledDay) {
    return NextResponse.json({ error: "workoutPlanId and scheduledDay are required" }, { status: 400 })
  }

  const completedDate = completedAt ? new Date(completedAt) : new Date()
  if (isNaN(completedDate.getTime())) {
    return NextResponse.json({ error: "Invalid completedAt datetime" }, { status: 400 })
  }

  const dayNumber = DAY_NAME_TO_NUMBER[scheduledDay.toLowerCase()]
  if (!dayNumber) {
    return NextResponse.json({ error: "scheduledDay must be a weekday name (e.g. monday)" }, { status: 400 })
  }

  const membership = await prisma.gymMember.findFirst({
    where: { profileId },
    select: { id: true },
  })
  if (!membership) return NextResponse.json({ error: "No gym membership found" }, { status: 404 })

  // Verify plan is assigned to this member
  const plan = await prisma.workoutPlan.findFirst({
    where: { id: workoutPlanId, assignedToMemberId: membership.id, isActive: true },
    select: { id: true },
  })
  if (!plan) {
    return NextResponse.json({ error: "Workout plan not found or not assigned to you" }, { status: 404 })
  }

  const weekNumber = getISOWeek(completedDate)
  const year = getISOWeekYear(completedDate)
  // Encode year+week as a single int to scope dedup to a specific ISO week
  const weekEncoded = year * 100 + weekNumber

  // Prevent duplicate logs for same plan+day within the same ISO week
  const existing = await prisma.workoutLog.findFirst({
    where: {
      memberId:     membership.id,
      workoutPlanId,
      weekNumber:   weekEncoded,
      dayNumber,
    },
  })
  if (existing) {
    return NextResponse.json({ error: "Workout already logged for this day this week" }, { status: 409 })
  }

  const log = await prisma.workoutLog.create({
    data: {
      memberId:     membership.id,
      workoutPlanId,
      weekNumber:   weekEncoded,
      dayNumber,
      loggedAt:     completedDate,
      notes:        scheduledDay.toLowerCase(),
    },
  })

  return NextResponse.json({ success: true, data: log }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await prisma.gymMember.findFirst({
    where: { profileId },
    select: { id: true },
  })
  if (!membership) return NextResponse.json({ success: true, data: [] })

  const logs = await prisma.workoutLog.findMany({
    where:   { memberId: membership.id },
    include: { workoutPlan: { select: { id: true, title: true, goal: true } } },
    orderBy: { loggedAt: "desc" },
    take:    20,
  })

  return NextResponse.json({ success: true, data: logs })
}

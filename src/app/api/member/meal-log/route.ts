// src/app/api/member/meal-log/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, parseISO } from "date-fns"

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { dietPlanId?: string; mealKey?: string; takenAt?: string }
  try { body = await req.json() } catch { body = {} }

  const { dietPlanId, mealKey, takenAt } = body
  if (!dietPlanId || !mealKey || !takenAt) {
    return NextResponse.json({ error: "dietPlanId, mealKey, and takenAt are required" }, { status: 400 })
  }

  const takenDate = new Date(takenAt)
  if (isNaN(takenDate.getTime())) {
    return NextResponse.json({ error: "Invalid takenAt datetime" }, { status: 400 })
  }

  // Verify member owns this diet plan
  const membership = await prisma.gymMember.findFirst({
    where: { profileId },
    select: { id: true },
  })
  if (!membership) {
    return NextResponse.json({ error: "No gym membership found" }, { status: 404 })
  }

  const plan = await prisma.dietPlan.findFirst({
    where: { id: dietPlanId, assignedToMemberId: membership.id, isActive: true },
    select: { id: true },
  })
  if (!plan) {
    return NextResponse.json({ error: "Diet plan not found or not assigned to you" }, { status: 404 })
  }

  const logDate = startOfDay(takenDate)

  try {
    const log = await prisma.mealLog.create({
      data: {
        memberId:   membership.id,
        dietPlanId,
        mealKey,
        logDate,
        takenAt: takenDate,
      },
    })
    return NextResponse.json({ success: true, data: log }, { status: 201 })
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Meal already logged for today" }, { status: 409 })
    }
    throw err
  }
}

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dateParam = searchParams.get("date")

  const membership = await prisma.gymMember.findFirst({
    where: { profileId },
    select: { id: true },
  })
  if (!membership) return NextResponse.json({ success: true, data: [] })

  let where: any = { memberId: membership.id }

  if (dateParam) {
    const date = parseISO(dateParam)
    where.logDate = { gte: startOfDay(date), lte: endOfDay(date) }
  }

  const logs = await prisma.mealLog.findMany({
    where,
    orderBy: { takenAt: "asc" },
  })

  return NextResponse.json({ success: true, data: logs })
}

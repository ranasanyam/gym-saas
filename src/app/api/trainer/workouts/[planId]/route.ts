// src/app/api/trainer/workouts/[planId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { planId } = await params
  const plan = await prisma.workoutPlan.findFirst({
    where: { id: planId, createdBy: profileId, isActive: true },
    include: {
      assignedMember: { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
      creator: { select: { fullName: true } },
      gym:     { select: { name: true } },
    },
  })
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })
  return NextResponse.json(plan)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { planId } = await params
  const body = await req.json()
  const updated = await prisma.workoutPlan.updateMany({
    where: { id: planId, createdBy: session.user.id },
    data: {
      title: body.title, description: body.description, goal: body.goal,
      difficulty: body.difficulty, durationWeeks: body.durationWeeks,
      weekStartDate: body.weekStartDate ? new Date(body.weekStartDate) : null,
      isGlobal: body.isGlobal, planData: body.planData,
    },
  })
  if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { planId } = await params
  await prisma.workoutPlan.updateMany({
    where: { id: planId, createdBy: session.user.id },
    data: { isActive: false },
  })
  return NextResponse.json({ success: true })
}
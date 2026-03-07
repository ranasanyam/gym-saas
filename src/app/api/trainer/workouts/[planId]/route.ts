// src/app/api/trainer/workouts/[planId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

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
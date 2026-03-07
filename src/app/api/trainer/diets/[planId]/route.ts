// src/app/api/trainer/diets/[planId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { planId } = await params
  const body = await req.json()
  const updated = await prisma.dietPlan.updateMany({
    where: { id: planId, createdBy: session.user.id },
    data: {
      title: body.title, description: body.description, goal: body.goal,
      caloriesTarget: body.caloriesTarget ? parseInt(body.caloriesTarget) : null,
      proteinG: body.proteinG ? parseFloat(body.proteinG) : null,
      carbsG:   body.carbsG   ? parseFloat(body.carbsG)   : null,
      fatG:     body.fatG     ? parseFloat(body.fatG)     : null,
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
  await prisma.dietPlan.updateMany({
    where: { id: planId, createdBy: session.user.id },
    data: { isActive: false },
  })
  return NextResponse.json({ success: true })
}
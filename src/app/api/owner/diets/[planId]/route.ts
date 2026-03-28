// src/app/api/owner/diets/[planId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  // const session = await auth()
  // if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { planId } = await params
  const body = await req.json()

  const plan = await prisma.dietPlan.findFirst({
    where: { id: planId, gym: { ownerId: profileId } },
  })
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })

  const updated = await prisma.dietPlan.update({
    where: { id: planId },
    data: {
      title:              body.title              ?? plan.title,
      description:        body.description        ?? plan.description,
      goal:               body.goal               ?? plan.goal,
      caloriesTarget:     body.caloriesTarget     !== undefined ? (body.caloriesTarget ? parseInt(body.caloriesTarget) : null) : plan.caloriesTarget,
      proteinG:           body.proteinG           !== undefined ? (body.proteinG ? parseFloat(body.proteinG) : null) : plan.proteinG,
      carbsG:             body.carbsG             !== undefined ? (body.carbsG ? parseFloat(body.carbsG) : null) : plan.carbsG,
      fatG:               body.fatG               !== undefined ? (body.fatG ? parseFloat(body.fatG) : null) : plan.fatG,
      isGlobal:           body.isGlobal           !== undefined ? body.isGlobal : plan.isGlobal,
      isTemplate:         body.isTemplate         !== undefined ? body.isTemplate : plan.isTemplate,
      weekStartDate:      body.weekStartDate ? new Date(body.weekStartDate) : plan.weekStartDate,
      assignedToMemberId: body.assignedToMemberId !== undefined ? (body.assignedToMemberId || null) : plan.assignedToMemberId,
      planData:           body.planData           ?? plan.planData,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  // const session = await auth()
  // if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const profileId = await resolveProfileId(req)
    if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { planId } = await params
  const plan = await prisma.dietPlan.findFirst({ where: { id: planId, gym: { ownerId: profileId } } })
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })
  await prisma.dietPlan.update({ where: { id: planId }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}
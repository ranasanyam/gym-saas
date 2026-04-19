// src/app/api/owner/plans/[planId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { requireActivePlan } from "@/lib/requireActivePlan"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response

  const { planId } = await params
  const body = await req.json()

  // Verify the plan belongs to a gym owned by this user
  const plan = await prisma.membershipPlan.findFirst({
    where: { id: planId, gym: { ownerId: profileId } },
  })
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })

  const updated = await prisma.membershipPlan.update({
    where: { id: planId },
    data: {
      name:           body.name           ?? plan.name,
      description:    body.description    ?? plan.description,
      durationMonths: body.durationMonths  !== undefined ? parseInt(body.durationMonths) : plan.durationMonths,
      price:          body.price          !== undefined ? parseFloat(body.price)          : plan.price,
      features:       body.features       ?? plan.features,
      maxClasses:     body.maxClasses     !== undefined ? (body.maxClasses ? parseInt(body.maxClasses) : null) : plan.maxClasses,
      isActive:       body.isActive       !== undefined ? body.isActive : plan.isActive,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response

  const { planId } = await params

  const plan = await prisma.membershipPlan.findFirst({
    where: { id: planId, gym: { ownerId: profileId } },
  })
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })

  await prisma.membershipPlan.update({ where: { id: planId }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}
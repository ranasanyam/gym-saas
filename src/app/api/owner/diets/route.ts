// src/app/api/owner/diets/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { requireActivePlan } from "@/lib/requireActivePlan"
import { prisma } from "@/lib/prisma"
import { getOwnerSubscription, checkFeature } from "@/lib/subscription"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response

  const sub = await getOwnerSubscription(profileId)
  if (!sub || sub.isExpired) {
    return NextResponse.json({ error: "Your subscription has expired. Please renew to access diet plans.", upgradeRequired: true }, { status: 403 })
  }
  const featureCheck = checkFeature(sub.limits.hasDietPlans, "Diet Plans")
  if (!featureCheck.allowed) {
    return NextResponse.json({ error: featureCheck.reason, upgradeRequired: true }, { status: 403 })
  }

  const gymId = new URL(req.url).searchParams.get("gymId")
  const gyms = await prisma.gym.findMany({ where: { ownerId: profileId }, select: { id: true } })
  const gymIds = gymId ? [gymId] : gyms.map(g => g.id)
  const plans = await prisma.dietPlan.findMany({
    where: { gymId: { in: gymIds }, isActive: true },
    include: {
      assignedMember: { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
      creator: { select: { fullName: true } },
      gym: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(plans)
}

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response


  // ── Subscription check ────────────────────────────────────────────────────
  const sub = await getOwnerSubscription(profileId)
  if (!sub || sub.isExpired) {
    return NextResponse.json(
      { error: "Your subscription has expired. Please renew to create diet plans.", upgradeRequired: true },
      { status: 403 }
    )
  }
  const check = checkFeature(sub.limits.hasDietPlans, "Diet plan creation")
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason, upgradeRequired: true }, { status: 403 })
  }

  const body = await req.json()
  const {
    gymId, assignedToMemberId, title, description, goal,
    caloriesTarget, proteinG, carbsG, fatG,
    isGlobal, durationWeeks, planData,
  } = body
  if (!gymId) return NextResponse.json({ error: "gymId is required" }, { status: 400 })

  const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: profileId } })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  // when assigning to a specific member, deactivate their previous diet plans
  if (assignedToMemberId) {
    await prisma.dietPlan.updateMany({
      where: { assignedToMemberId, isActive: true },
      data: { isActive: false },
    })
  }

  const plan = await prisma.dietPlan.create({
    data: {
      gymId,
      createdBy: profileId,
      assignedToMemberId: assignedToMemberId || null,
      title: title || null,
      description: description || null,
      goal: goal || null,
      caloriesTarget: caloriesTarget ? parseInt(caloriesTarget) : null,
      proteinG: proteinG ? parseFloat(proteinG) : null,
      carbsG: carbsG ? parseFloat(carbsG) : null,
      fatG: fatG ? parseFloat(fatG) : null,
      isGlobal: isGlobal ?? false,
      durationWeeks: durationWeeks ?? 4,
      planData: planData ?? {},
      isActive: true
    },
  })
  return NextResponse.json(plan, { status: 201 })
}
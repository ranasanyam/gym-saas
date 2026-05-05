// src/app/api/member/workout-plan/[planId]/set-active/route.ts
// Sets the specified workout plan as the member's active plan.
// Deactivates all other workout plans assigned to this member.
// Returns the updated list of all assigned workout plans.
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { planId } = await params

  // Find the member's active membership
  const membership = await prisma.gymMember.findFirst({
    where:   { profileId, status: "ACTIVE" },
    select:  { id: true },
    orderBy: { createdAt: "desc" },
  })
  if (!membership) {
    return NextResponse.json({ error: "No active gym membership found" }, { status: 403 })
  }

  // Verify this plan is assigned to this member
  const plan = await prisma.workoutPlan.findFirst({
    where: { id: planId, assignedToMemberId: membership.id },
    select: { id: true },
  })
  if (!plan) {
    return NextResponse.json({ error: "Workout plan not found or not assigned to you" }, { status: 404 })
  }

  // Deactivate all other assigned workout plans for this member, then activate the chosen one
  await prisma.$transaction([
    prisma.workoutPlan.updateMany({
      where: { assignedToMemberId: membership.id, id: { not: planId } },
      data:  { isActive: false },
    }),
    prisma.workoutPlan.update({
      where: { id: planId },
      data:  { isActive: true },
    }),
  ])

  // Return the updated full list of assigned plans
  const plans = await prisma.workoutPlan.findMany({
    where:   { assignedToMemberId: membership.id },
    include: { creator: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ success: true, data: plans })
}

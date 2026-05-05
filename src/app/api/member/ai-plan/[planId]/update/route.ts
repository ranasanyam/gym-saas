// POST /api/member/ai-plan/[planId]/update — edit a generated AI plan
// 2-hour free window: edits within 2 hours of generatedAt cost no credits.
// After 2 hours: deducts 1 credit and resets generatedAt.
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { updateDietPlan, updateWorkoutPlan } from "@/services/aiPlanGenerator"

export const runtime    = "nodejs"
export const maxDuration = 60

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { planId } = await params

  let body: { changeRequest?: string }
  try { body = await req.json() } catch { body = {} }

  const { changeRequest } = body
  if (!changeRequest?.trim()) {
    return NextResponse.json({ error: "changeRequest is required" }, { status: 400 })
  }

  const generatedPlan = await prisma.generatedAIPlan.findUnique({
    where: { id: planId },
    include: { subscription: true },
  })

  if (!generatedPlan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })
  if (generatedPlan.profileId !== profileId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const now          = new Date()
  const withinWindow = now.getTime() - new Date(generatedPlan.generatedAt).getTime() <= TWO_HOURS_MS

  if (!withinWindow) {
    // Requires 1 credit
    const subscription = await prisma.memberAISubscription.findFirst({
      where: {
        profileId,
        isActive:   true,
        expiryDate: { gte: now },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!subscription || subscription.usedCredits >= subscription.totalCredits) {
      return NextResponse.json(
        { error: "No credits remaining. This edit requires 1 credit.", code: "NO_CREDITS" },
        { status: 402 }
      )
    }

    await prisma.memberAISubscription.update({
      where: { id: subscription.id },
      data:  { usedCredits: { increment: 1 } },
    })
  }

  try {
    const existing = generatedPlan.planContent as any
    let updatedContent: object
    let updatedPlanData: any

    if (generatedPlan.planType === "diet") {
      const updated = await updateDietPlan(existing, changeRequest)
      updatedContent  = updated
      updatedPlanData = updated.planData

      if (generatedPlan.linkedPlanId) {
        await prisma.dietPlan.update({
          where: { id: generatedPlan.linkedPlanId },
          data: {
            title:          updated.title,
            description:    updated.description,
            caloriesTarget: updated.caloriesTarget,
            proteinG:       updated.proteinG,
            carbsG:         updated.carbsG,
            fatG:           updated.fatG,
            planData:       updatedPlanData,
          },
        })
      }
    } else {
      const updated = await updateWorkoutPlan(existing, changeRequest)
      updatedContent  = updated
      updatedPlanData = updated.planData

      if (generatedPlan.linkedPlanId) {
        await prisma.workoutPlan.update({
          where: { id: generatedPlan.linkedPlanId },
          data: {
            title:        updated.title,
            description:  updated.description,
            goal:         updated.goal,
            difficulty:   updated.difficulty as any,
            durationWeeks: updated.durationWeeks,
            planData:     updatedPlanData,
          },
        })
      }
    }

    const updatedRecord = await prisma.generatedAIPlan.update({
      where: { id: planId },
      data: {
        planContent:       updatedContent as any,
        lastChangeRequest: changeRequest,
        // Only reset generatedAt when a credit was deducted (outside window)
        ...(withinWindow ? {} : { generatedAt: now }),
      },
    })

    return NextResponse.json({
      success:      true,
      withinWindow,
      creditCharged: !withinWindow,
      plan:          updatedRecord,
    })

  } catch (err: any) {
    console.error("[ai-plan/update] Update failed:", err)

    // Refund credit if one was charged
    if (!withinWindow) {
      const subscription = await prisma.memberAISubscription.findFirst({
        where: { profileId, isActive: true },
      })
      if (subscription) {
        await prisma.memberAISubscription.update({
          where: { id: subscription.id },
          data:  { usedCredits: { decrement: 1 } },
        })
      }
    }

    return NextResponse.json(
      { error: "Plan update failed. Please try again.", detail: err?.message },
      { status: 500 }
    )
  }
}

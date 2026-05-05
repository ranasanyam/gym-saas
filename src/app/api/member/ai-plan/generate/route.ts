// POST /api/member/ai-plan/generate — credit-based AI plan generation
// Deducts 1 credit from the member's active AI subscription, generates a plan,
// saves it to DietPlan/WorkoutPlan and records it in GeneratedAIPlan.
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import {
  generateDietPlan,
  generateWorkoutPlan,
  type DietPlanInputs,
  type WorkoutPlanInputs,
} from "@/services/aiPlanGenerator"
import { sendPushToProfile } from "@/lib/push"

export const runtime    = "nodejs"
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { planType?: string; inputs?: Record<string, any> }
  try { body = await req.json() } catch { body = {} }

  const { planType, inputs } = body
  if (!planType || !inputs) {
    return NextResponse.json({ error: "planType and inputs are required" }, { status: 400 })
  }
  if (planType !== "diet" && planType !== "workout") {
    return NextResponse.json({ error: "planType must be 'diet' or 'workout'" }, { status: 400 })
  }

  // Verify active subscription with remaining credits
  const subscription = await prisma.memberAISubscription.findFirst({
    where: {
      profileId,
      isActive:   true,
      expiryDate: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  })

  if (!subscription) {
    return NextResponse.json({ error: "No active AI subscription found", code: "NO_SUBSCRIPTION" }, { status: 402 })
  }

  if (subscription.usedCredits >= subscription.totalCredits) {
    return NextResponse.json({ error: "No credits remaining in your subscription", code: "NO_CREDITS" }, { status: 402 })
  }

  // Resolve gymMember — find the latest active membership to get gymId/memberId
  const gymMember = await prisma.gymMember.findFirst({
    where:   { profileId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  })

  if (!gymMember) {
    return NextResponse.json({ error: "You are not an active member of any gym" }, { status: 403 })
  }

  // Deduct credit immediately before generation to prevent double-spend
  await prisma.memberAISubscription.update({
    where: { id: subscription.id },
    data:  { usedCredits: { increment: 1 } },
  })

  try {
    let generatedPlanId: string
    let planContent: object

    if (planType === "diet") {
      const generated = await generateDietPlan(inputs as DietPlanInputs)
      planContent = generated

      // Only deactivate previously AI-generated diet plans, not trainer/owner plans
      const prevAILinks = await prisma.generatedAIPlan.findMany({
        where: { profileId, planType: "diet", linkedPlanId: { not: null } },
        select: { linkedPlanId: true },
      })
      const prevIds = prevAILinks.map(p => p.linkedPlanId).filter(Boolean) as string[]
      if (prevIds.length > 0) {
        await prisma.dietPlan.updateMany({
          where: { id: { in: prevIds } },
          data:  { isActive: false },
        })
      }

      const plan = await prisma.dietPlan.create({
        data: {
          gymId:              gymMember.gymId,
          createdBy:          profileId,
          assignedToMemberId: gymMember.id,
          title:              generated.title,
          description:        generated.description,
          goal:               (inputs as DietPlanInputs).goal,
          caloriesTarget:     generated.caloriesTarget,
          proteinG:           generated.proteinG,
          carbsG:             generated.carbsG,
          fatG:               generated.fatG,
          planData:           generated.planData as any,
          isActive:           true,
          isAIGenerated:      true,
        },
      })

      generatedPlanId = plan.id

      try {
        await prisma.notification.create({
          data: {
            gymId:     gymMember.gymId,
            profileId,
            title:   "🤖 AI Diet Plan Ready",
            message: `Your AI-generated diet plan "${generated.title}" has been created and is now active.`,
            type:    "PLAN_UPDATE",
          },
        })
      } catch {}

    } else {
      const generated = await generateWorkoutPlan(inputs as WorkoutPlanInputs)
      planContent = generated

      // Only deactivate previously AI-generated workout plans, not trainer/owner plans
      const prevAILinks = await prisma.generatedAIPlan.findMany({
        where: { profileId, planType: "workout", linkedPlanId: { not: null } },
        select: { linkedPlanId: true },
      })
      const prevIds = prevAILinks.map(p => p.linkedPlanId).filter(Boolean) as string[]
      if (prevIds.length > 0) {
        await prisma.workoutPlan.updateMany({
          where: { id: { in: prevIds } },
          data:  { isActive: false },
        })
      }

      const plan = await prisma.workoutPlan.create({
        data: {
          gymId:              gymMember.gymId,
          createdBy:          profileId,
          assignedToMemberId: gymMember.id,
          title:              generated.title,
          description:        generated.description,
          goal:               generated.goal,
          difficulty:         (generated.difficulty as any) ?? "BEGINNER",
          durationWeeks:      generated.durationWeeks ?? 4,
          planData:           generated.planData as any,
          isActive:           true,
          isAIGenerated:      true,
        },
      })

      generatedPlanId = plan.id

      try {
        await prisma.notification.create({
          data: {
            gymId:     gymMember.gymId,
            profileId,
            title:   "🤖 AI Workout Plan Ready",
            message: `Your AI-generated workout plan "${generated.title}" has been created and is now active.`,
            type:    "PLAN_UPDATE",
          },
        })
      } catch {}
    }

    // Record in GeneratedAIPlan for history and edit tracking
    const generatedRecord = await prisma.generatedAIPlan.create({
      data: {
        profileId,
        subscriptionId:  subscription.id,
        planType,
        planContent:     planContent as any,
        userPrompt:      JSON.stringify(inputs),
        generatedAt:     new Date(),
        creditDeducted:  true,
        linkedPlanId:    generatedPlanId,
      },
    })

    // Push: plan is ready
    sendPushToProfile(profileId, {
      title: planType === "diet" ? "🤖 AI Diet Plan Ready" : "🤖 AI Workout Plan Ready",
      body:  `Your AI-generated ${planType} plan is now active. Tap to view it.`,
      url:   planType === "diet" ? "/member/diet" : "/member/workouts",
      tag:   `ai-plan-${planType}`,
    }).catch(() => {})

    // Push: low credits warning (remaining = totalCredits - usedCredits before increment - 1)
    const remainingCredits = subscription.totalCredits - subscription.usedCredits - 1
    if (remainingCredits <= 2) {
      sendPushToProfile(profileId, {
        title: remainingCredits <= 0 ? "⚠️ No AI Credits Left"  : `⚠️ ${remainingCredits} AI Credit${remainingCredits === 1 ? "" : "s"} Remaining`,
        body:  remainingCredits <= 0
          ? "You've used all your AI plan credits. Subscribe to generate more plans."
          : `You have ${remainingCredits} AI credit${remainingCredits === 1 ? "" : "s"} left. Subscribe for more when you're ready.`,
        url:  "/member/ai-subscription",
        tag:  "ai-credits-low",
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, generatedPlanId: generatedRecord.id, linkedPlanId: generatedPlanId })

  } catch (err: any) {
    console.error("[ai-plan/generate] Generation failed:", err)

    // Refund the credit on failure
    await prisma.memberAISubscription.update({
      where: { id: subscription.id },
      data:  { usedCredits: { decrement: 1 } },
    })

    return NextResponse.json(
      { error: "Plan generation failed. Your credit has been refunded.", detail: err?.message },
      { status: 500 }
    )
  }
}

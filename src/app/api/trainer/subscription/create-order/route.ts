import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { getTrainerPlan } from "@/lib/trainerSubscriptionPlans"
import { prisma } from "@/lib/prisma"
import Razorpay from "razorpay"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { planSlug?: string }
  try { body = await req.json() } catch { body = {} }

  const { planSlug } = body
  if (!planSlug) return NextResponse.json({ error: "planSlug is required" }, { status: 400 })

  const plan = getTrainerPlan(planSlug)
  if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 })

  // Block downgrades; allow upgrades to longer-duration plans
  const PLAN_ORDER: Record<string, number> = { monthly: 1, quarterly: 2, yearly: 3 }
  const activeSub = await prisma.trainerSubscription.findFirst({
    where: { profileId, status: "ACTIVE", endDate: { gt: new Date() } },
  })
  if (activeSub) {
    const currentTier = PLAN_ORDER[activeSub.planSlug] ?? 0
    const newTier     = PLAN_ORDER[plan.slug] ?? 0
    if (newTier <= currentTier) {
      return NextResponse.json(
        { error: "Downgrades are not available. You can only upgrade to a longer plan.", code: "PLAN_CHANGE_BLOCKED" },
        { status: 409 }
      )
    }
    // Upgrade allowed — subscribe endpoint will cancel the old sub
  }

  let order
  try {
    order = await razorpay.orders.create({
      amount:   plan.price * 100,
      currency: "INR",
      receipt:  `tsub_${profileId.slice(0, 8)}_${Date.now()}`,
      notes: { profileId, planSlug: plan.slug, planName: plan.name },
    })
  } catch (err: any) {
    const razorpayError = err?.error ?? err
    console.error("Razorpay order creation failed:", razorpayError)
    return NextResponse.json(
      { error: razorpayError?.description ?? "Failed to create payment order" },
      { status: razorpayError?.statusCode ?? 502 }
    )
  }

  return NextResponse.json({
    orderId:  order.id,
    amount:   order.amount,
    currency: order.currency,
  })
}

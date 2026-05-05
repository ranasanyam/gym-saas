// src/app/api/payments/ai-plan/create-order/route.ts
// Creates a Razorpay order for an AI-generated plan purchase.
// Auth: member role only.
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { AI_PLAN_PRICES } from "@/lib/aiPlanPricing"
import Razorpay from "razorpay"

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { planType?: string }
  try { body = await req.json() } catch { body = {} }

  const { planType } = body
  if (planType !== "diet" && planType !== "workout") {
    return NextResponse.json({ error: "planType must be 'diet' or 'workout'" }, { status: 400 })
  }

  // Verify the user is a member with at least one active gym membership
  const membership = await prisma.gymMember.findFirst({
    where:  { profileId, status: "ACTIVE" },
    select: { id: true, gymId: true },
    orderBy: { createdAt: "desc" },
  })
  if (!membership) {
    return NextResponse.json({ error: "Active gym membership required to generate an AI plan" }, { status: 403 })
  }

  const amount    = AI_PLAN_PRICES[planType]
  const amountPaise = amount * 100  // convert to paise

  let order
  try {
    order = await razorpay.orders.create({
      amount:   amountPaise,
      currency: "INR",
      receipt:  `ai_${planType}_${profileId.slice(0, 8)}_${Date.now()}`,
      notes: {
        profileId,
        memberId: membership.id,
        planType,
        purpose: "ai_plan_generation",
      },
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
    planType,
    memberId: membership.id,
  })
}

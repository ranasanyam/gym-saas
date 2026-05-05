// src/app/api/payments/ai-plan/verify/route.ts
// Verifies the Razorpay payment for an AI plan purchase and creates a PendingAIPlanRequest.
// Auth: member role only.
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export const runtime = "nodejs"

function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const body     = `${orderId}|${paymentId}`
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex")
  return expected === signature
}

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: {
    planType?: string
    memberId?: string
    razorpay_order_id?: string
    razorpay_payment_id?: string
    razorpay_signature?: string
  }
  try { body = await req.json() } catch { body = {} }

  const { planType, memberId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

  if (planType !== "diet" && planType !== "workout") {
    return NextResponse.json({ error: "planType must be 'diet' or 'workout'" }, { status: 400 })
  }
  if (!memberId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "memberId, razorpay_order_id, razorpay_payment_id, and razorpay_signature are required" }, { status: 400 })
  }

  // Ensure the membership belongs to this profile
  const membership = await prisma.gymMember.findFirst({
    where:  { id: memberId, profileId, status: "ACTIVE" },
    select: { id: true },
  })
  if (!membership) {
    return NextResponse.json({ error: "Membership not found or not active" }, { status: 403 })
  }

  // Verify Razorpay signature
  const valid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
  if (!valid) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
  }

  // Prevent duplicate — if a request for this payment already exists, return it
  const existing = await prisma.pendingAIPlanRequest.findFirst({
    where: { paymentId: razorpay_payment_id },
  })
  if (existing) {
    return NextResponse.json({ success: true, requestId: existing.id })
  }

  const request = await prisma.pendingAIPlanRequest.create({
    data: {
      memberId:       memberId,
      planType:       planType,
      paymentId:      razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      status:         "payment_complete",
    },
  })

  return NextResponse.json({ success: true, requestId: request.id })
}

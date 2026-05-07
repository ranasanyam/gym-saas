// POST /api/member/ai-subscription/subscribe — activate member AI subscription after payment
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { getPlanBySlug } from "@/lib/memberAISubscriptionPlans"
import crypto from "crypto"
import { addMonths } from "date-fns"
import { sendPushToProfile } from "@/lib/push"
import { sendAdminSubscriptionNotification, sendSaasPaymentReceiptEmail } from "@/lib/email"

export const runtime = "nodejs"

function verifySignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex")
  return expected === signature
}

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: {
    planSlug?: string
    razorpayOrderId?: string
    razorpayPaymentId?: string
    razorpaySignature?: string
  }
  try { body = await req.json() } catch { body = {} }

  const { planSlug, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body

  if (!planSlug) return NextResponse.json({ error: "planSlug is required" }, { status: 400 })
  if (!razorpayOrderId || !razorpayPaymentId) {
    return NextResponse.json({ error: "Payment details missing" }, { status: 400 })
  }

  const plan = getPlanBySlug(planSlug)
  if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 })

  if (razorpaySignature) {
    const valid = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)
    if (!valid) return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
  }

  const now        = new Date()
  const expiryDate = addMonths(now, plan.durationMonths)

  // Deactivate any existing active subscription, then create new one
  const subscription = await prisma.$transaction(async (tx) => {
    await tx.memberAISubscription.updateMany({
      where: { profileId, isActive: true },
      data:  { isActive: false },
    })

    return tx.memberAISubscription.create({
      data: {
        profileId,
        planSlug:          plan.slug,
        startDate:         now,
        expiryDate,
        totalCredits:      plan.credits,
        usedCredits:       0,
        isActive:          true,
        razorpayOrderId,
        razorpayPaymentId,
      },
    })
  })

  // ── Receipt email + admin notification (fire-and-forget) ─────────────────
  prisma.profile.findUnique({ where: { id: profileId }, select: { fullName: true, email: true } })
    .then(profile => {
      if (!profile) return
      const receiptNumber = `AI-${now.getFullYear()}-${subscription.id.slice(0, 8).toUpperCase()}`
      return Promise.all([
        sendSaasPaymentReceiptEmail({
          to:                profile.email ?? "there",
          fullName:          profile.fullName,
          planName:          `${plan.name} AI Credits (${plan.credits} credits)`,
          amount:            plan.price,
          paidAt:            now,
          receiptNumber,
          razorpayPaymentId: razorpayPaymentId ?? null,
        }),
        sendAdminSubscriptionNotification({
          subscriberName:   profile.fullName,
          subscriberEmail:  profile.email ?? undefined,
          planName:         `${plan.name} AI Credits (${plan.credits} credits)`,
          planAmount:       String(plan.price),
          role:             "Member",
          subscriptionType: "AI Plan Subscription",
        }),
      ])
    })
    .catch(() => {})

  // Notify member about their new AI subscription
  await Promise.allSettled([
    prisma.notification.create({
      data: {
        profileId,
        title:   "🤖 AI Subscription Activated",
        message: `Your ${plan.name} AI plan with ${plan.credits} credits is now active. Start generating your personalized plans!`,
        type:    "BILLING",
      },
    }),
    sendPushToProfile(profileId, {
      title: "🤖 AI Credits Ready",
      body:  `${plan.credits} AI plan credits loaded. Generate your personalized workout and diet plans now!`,
      url:   "/member/ai-subscription",
      tag:   "ai-subscription-activated",
    }),
  ]).catch(() => {})

  return NextResponse.json({ success: true, subscription })
}

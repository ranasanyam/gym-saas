import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { getTrainerPlan } from "@/lib/trainerSubscriptionPlans"
import { sendPushToProfile } from "@/lib/push"
import { sendSaasPaymentReceiptEmail, sendAdminSubscriptionNotification } from "@/lib/email"
import crypto from "crypto"
import { addDays } from "date-fns"

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
    // Upgrade allowed — transaction below will cancel the old sub
  }

  if (razorpaySignature) {
    const valid = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)
    if (!valid) return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
  }

  const now     = new Date()
  const endDate = addDays(now, plan.durationDays)

  const subscription = await prisma.$transaction(async (tx) => {
    await tx.trainerSubscription.updateMany({
      where: { profileId, status: "ACTIVE" },
      data:  { status: "CANCELLED" },
    })

    const sub = await tx.trainerSubscription.create({
      data: {
        profileId,
        planSlug:          plan.slug,
        status:            "ACTIVE",
        startDate:         now,
        endDate,
        razorpayOrderId,
        razorpayPaymentId,
      },
    })

    await tx.trainerSubPayment.create({
      data: {
        profileId,
        subscriptionId:    sub.id,
        amount:            plan.price,
        currency:          "INR",
        status:            "COMPLETED",
        razorpayPaymentId,
        razorpayOrderId,
        paidAt:            now,
      },
    })

    return sub
  })

  await Promise.allSettled([
    prisma.notification.create({
      data: {
        profileId,
        title:   "Job Portal Access Activated",
        message: `Your ${plan.name} trainer subscription is now active. You can now view full job details and apply for positions.`,
        type:    "BILLING",
      },
    }),
    sendPushToProfile(profileId, {
      title: "Job Portal Unlocked",
      body:  `Your ${plan.name} plan is active. Start applying to gym jobs now!`,
      url:   "/trainer/jobs",
      tag:   "trainer-subscription-activated",
    }),
  ]).catch(() => {})

  // ── Receipt email + admin notification (fire-and-forget) ─────────────────
  prisma.profile.findUnique({ where: { id: profileId }, select: { fullName: true, email: true } })
    .then(profile => {
      if (!profile) return
      const receiptNumber = `TR-${now.getFullYear()}-${subscription.id.slice(0, 8).toUpperCase()}`
      return Promise.all([
        sendSaasPaymentReceiptEmail({
          to:                profile.email ?? "there",
          fullName:          profile.fullName,
          planName:          `${plan.name} Trainer Job Portal`,
          amount:            plan.price,
          paidAt:            now,
          receiptNumber,
          razorpayPaymentId: razorpayPaymentId ?? null,
        }),
        sendAdminSubscriptionNotification({
          subscriberName:   profile.fullName,
          subscriberEmail:  profile.email ?? undefined,
          planName:         plan.name,
          planAmount:       String(plan.price),
          role:             "Trainer",
          subscriptionType: "Job Portal Subscription",
        }),
      ])
    }).catch(() => {})

  return NextResponse.json({ success: true, subscription })
}

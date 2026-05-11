// src/app/api/subscriptions/subscribe/route.ts
// Activates a SaaS plan after payment is confirmed.
//
// Autopay (Razorpay Subscription):
//   POST { saasPlanId, razorpayPaymentId, razorpaySubscriptionId, razorpaySignature }
//   Signature = HMAC(paymentId|subscriptionId)
//
// One-time order (legacy / fallback):
//   POST { saasPlanId, razorpayPaymentId, razorpayOrderId, razorpaySignature }
//   Signature = HMAC(orderId|paymentId)
//
// Free plan:
//   POST { saasPlanId }

import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { addMonths } from "date-fns"
import { sendPushToProfile } from "@/lib/push"
import { sendSaasPaymentReceiptEmail, sendAdminSubscriptionNotification } from "@/lib/email"

// const REFERRAL_REWARD    = 100
// const CREDIT_EXPIRY_DAYS = 90
const INTERVAL_MONTHS: Record<string, number | null> = {
    MONTHLY:     1,
    QUARTERLY:   3,
    HALF_YEARLY: 6,
    YEARLY:      12,
    LIFETIME:    null,
}

export const runtime = "nodejs"

function getPlanTier(planName: string): number {
    const n = planName.toLowerCase()
    if (n.includes("enterprise")) return 3
    if (n.includes("pro"))        return 2
    if (n.includes("basic"))      return 1
    return 0
}

function hmac(a: string, b: string): string {
    return crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(`${a}|${b}`)
        .digest("hex")
}

export async function POST(req: NextRequest) {
    const profileId = await resolveProfileId(req)
    if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const {
        saasPlanId,
        razorpayPaymentId,
        razorpaySubscriptionId, // autopay flow
        razorpayOrderId,        // one-time order flow (legacy)
        razorpaySignature,
    } = await req.json()

    if (!saasPlanId) return NextResponse.json({ error: "saasPlanId is required" }, { status: 400 })

    const plan = await prisma.saasPlan.findUnique({ where: { id: saasPlanId } })
    if (!plan || !plan.isActive) {
        return NextResponse.json({ error: "Plan not found or inactive" }, { status: 404 })
    }

    // Block downgrades and LIFETIME changes; allow upgrades
    const activeSub = await prisma.saasSubscription.findFirst({
        where:   { profileId, status: { in: ["ACTIVE", "TRIALING", "LIFETIME"] } },
        include: { saasPlan: { select: { name: true } } },
    })
    if (activeSub) {
        if (activeSub.status === "LIFETIME") {
            return NextResponse.json(
                { error: "Lifetime plan changes are not available.", code: "PLAN_CHANGE_BLOCKED" },
                { status: 409 }
            )
        }
        const currentTier = getPlanTier(activeSub.saasPlan.name)
        const newTier     = getPlanTier(plan.name)
        if (newTier <= currentTier) {
            return NextResponse.json(
                { error: "Downgrades are not available. You can only upgrade to a higher plan.", code: "PLAN_CHANGE_BLOCKED" },
                { status: 409 }
            )
        }
        // Upgrade allowed — transaction below will cancel the old sub
    }

    const isPaid = Number(plan.price) > 0

    // ── Signature verification (mandatory for all paid plans) ────────────────
    if (isPaid) {
        if (!razorpayPaymentId) {
            return NextResponse.json({ error: "Payment details missing" }, { status: 400 })
        }
        if (!razorpaySignature) {
            return NextResponse.json({ error: "Payment signature required" }, { status: 400 })
        }
        let valid = false
        if (razorpaySubscriptionId) {
            // Subscription flow: HMAC(paymentId|subscriptionId)
            valid = hmac(razorpayPaymentId, razorpaySubscriptionId) === razorpaySignature
        } else if (razorpayOrderId) {
            // Order flow: HMAC(orderId|paymentId)
            valid = hmac(razorpayOrderId, razorpayPaymentId) === razorpaySignature
        }
        if (!valid) {
            return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
        }

        // ── Replay attack prevention: reject already-processed payment IDs ──
        const existingPayment = await prisma.saasPayment.findFirst({
            where: { razorpayPaymentId },
        })
        if (existingPayment) {
            return NextResponse.json({ error: "Payment already processed" }, { status: 409 })
        }
    }

    // ── Compute subscription period ───────────────────────────────────────────
    const now        = new Date()
    const months     = INTERVAL_MONTHS[plan.interval]
    const periodEnd  = months !== null ? addMonths(now, months) : null
    const isLifetime = plan.interval === "LIFETIME"
    const status     = isLifetime ? "LIFETIME" : "ACTIVE"

    // ── Run in transaction ────────────────────────────────────────────────────
    const { subscription, payment } = await prisma.$transaction(async (tx) => {
        await tx.saasSubscription.updateMany({
            where: { profileId, status: { in: ["ACTIVE", "TRIALING", "LIFETIME"] } },
            data:  { status: "CANCELLED" },
        })

        await tx.profile.update({
            where: { id: profileId },
            data:  { ownerPlanStatus: "ACTIVE" },
        })

        const subscription = await tx.saasSubscription.create({
            data: {
                profileId,
                saasPlanId:         plan.id,
                status,
                currentPeriodStart: now,
                currentPeriodEnd:   periodEnd,
                trialEndsAt:        null,
                // store Razorpay subscription ID for webhook-based auto-renewal
                razorpaySubId:      razorpaySubscriptionId ?? null,
            },
            include: { saasPlan: true },
        })

        const payment = await tx.saasPayment.create({
            data: {
                profileId,
                subscriptionId:    subscription.id,
                amount:            plan.price,
                discountAmount:    0,
                finalAmount:       plan.price,
                currency:          plan.currency,
                status:            "COMPLETED",
                razorpayPaymentId: razorpayPaymentId ?? null,
                razorpayOrderId:   razorpayOrderId   ?? null,
                paidAt:            now,
            },
        })

        return { subscription, payment }
    })

  // Notify the owner about their new plan
  const validUntil = periodEnd
    ? ` Valid until ${periodEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.`
    : ""
  await Promise.allSettled([
    prisma.notification.create({
      data: {
        profileId,
        title:   isLifetime ? "🎉 Lifetime Access Unlocked!" : `✅ ${plan.name} Plan Activated`,
        message: `Your ${plan.name} GymStack plan is now active.${isLifetime ? " Enjoy lifetime access!" : validUntil}`,
        type:    "BILLING",
      },
    }),
    sendPushToProfile(profileId, {
      title: isLifetime ? "🎉 Lifetime Access Unlocked!" : `✅ ${plan.name} Plan Active`,
      body:  `Your ${plan.name} GymStack plan is now active.${isLifetime ? " Enjoy lifetime access!" : validUntil}`,
      url:   "/owner/subscription",
      tag:   "saas-subscription-activated",
    }),
  ]).catch(() => {})
  
  // ── Receipt email + admin notification (fire-and-forget, paid plans only) ──
  if (isPaid) {
    const appUrl = process.env.NEXTAUTH_URL ?? "https://gymstack.co.in"
    const receiptNumber = `GS-${now.getFullYear()}-${payment.id.slice(0, 8).toUpperCase()}`
    prisma.profile.findUnique({ where: { id: profileId }, select: { fullName: true, email: true } })
      .then(profile => {
        if (!profile) return
        return Promise.all([
          sendSaasPaymentReceiptEmail({
            to:               profile.email ?? "there",
            fullName:         profile.fullName,
            planName:         plan.name,
            amount:           Number(plan.price),
            paidAt:           now,
            receiptNumber,
            razorpayPaymentId: razorpayPaymentId ?? null,
            downloadUrl:      `${appUrl}/api/saas/receipt/${payment.id}`,
          }),
          sendAdminSubscriptionNotification({
            subscriberName:   profile.fullName,
            subscriberEmail:  profile.email ?? undefined,
            planName:         plan.name,
            planAmount:       String(Number(plan.price)),
            role:             "Owner",
            subscriptionType: "Platform Subscription",
          }),
        ])
      }).catch(() => {})
  }
    // ── Referral conversion — disabled, referral feature removed for now ─────
    // if (isPaid) {
    //     ;(async () => {
    //         try {
    //             const referral = await prisma.referral.findFirst({
    //                 where:   { referredId: profileId, status: "PENDING" },
    //                 include: {
    //                     referrer: { select: { id: true, wallet: { select: { id: true, balance: true } } } },
    //                 },
    //             })
    //             if (!referral) return
    //             if (referral.expiresAt && referral.expiresAt < new Date()) {
    //                 await prisma.referral.update({ where: { id: referral.id }, data: { status: "EXPIRED" } })
    //                 return
    //             }
    //             const wallet = referral.referrer.wallet
    //             if (!wallet) return
    //             const newBalance   = Number(wallet.balance) + REFERRAL_REWARD
    //             const creditExpiry = new Date(Date.now() + CREDIT_EXPIRY_DAYS * 86_400_000)
    //             await prisma.$transaction([
    //                 prisma.referral.update({
    //                     where: { id: referral.id },
    //                     data:  { status: "CONVERTED", rewardAmount: REFERRAL_REWARD, rewardCreditedAt: new Date(), triggerPaymentId: payment.id },
    //                 }),
    //                 prisma.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } }),
    //                 prisma.walletTransaction.create({
    //                     data: {
    //                         walletId:    wallet.id,
    //                         type:        "CREDIT_REFERRAL",
    //                         amount:      REFERRAL_REWARD,
    //                         balanceAfter: newBalance,
    //                         description: "Referral reward — your referral subscribed to GymStack!",
    //                         referenceId: referral.id,
    //                         expiresAt:   creditExpiry,
    //                     },
    //                 }),
    //                 prisma.notification.create({
    //                     data: {
    //                         profileId: referral.referrerId,
    //                         title:     "🎉 Referral Reward Earned!",
    //                         message:   `Someone you referred just subscribed to GymStack! ₹${REFERRAL_REWARD} has been added to your wallet (valid 90 days).`,
    //                         type:      "REFERRAL",
    //                     },
    //                 }),
    //             ])
    //             sendPushToProfile(referral.referrerId, {
    //                 title: `🎉 You earned ₹${REFERRAL_REWARD}!`,
    //                 body:  "Someone you referred just subscribed to GymStack. Check your wallet!",
    //                 url:   "/member/referral",
    //                 tag:   "referral-reward",
    //             }).catch(() => {})
    //         } catch (err) {
    //             console.error("[subscribe] referral conversion failed:", err)
    //         }
    //     })()
    // }

    return NextResponse.json({ subscription, payment })
}

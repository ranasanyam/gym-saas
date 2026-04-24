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

const INTERVAL_MONTHS: Record<string, number | null> = {
    MONTHLY:     1,
    QUARTERLY:   3,
    HALF_YEARLY: 6,
    YEARLY:      12,
    LIFETIME:    null,
}

export const runtime = "nodejs"

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

    const isPaid = Number(plan.price) > 0

    // ── Signature verification ────────────────────────────────────────────────
    if (isPaid) {
        if (!razorpayPaymentId) {
            return NextResponse.json({ error: "Payment details missing" }, { status: 400 })
        }
        if (razorpaySignature) {
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

    return NextResponse.json({ subscription, payment })
}

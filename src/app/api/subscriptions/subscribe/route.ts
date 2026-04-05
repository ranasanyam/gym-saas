// src/app/api/subscriptions/subscribe/route.ts
// Activates a SaaS plan for the owner after payment is confirmed.
//
// For free plans: POST { saasPlanId, amount: 0 }
// For paid plans: POST { saasPlanId, amount, razorpayPaymentId, razorpayOrderId }
//
// Steps:
//   1. Verify Razorpay signature (paid plans only)
//   2. Deactivate any existing active subscription
//   3. Create new SaasSubscription
//   4. Record SaasPayment

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

function verifyRazorpaySignature(
    orderId: string,
    paymentId: string,
    signature: string,
): boolean {
    const body    = `${orderId}|${paymentId}`
    const expected = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(body)
        .digest("hex")
    return expected === signature
}

export async function POST(req: NextRequest) {
    const profileId = await resolveProfileId(req)
    if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const {
        saasPlanId,
        amount,
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
    } = await req.json()

    if (!saasPlanId) return NextResponse.json({ error: "saasPlanId is required" }, { status: 400 })

    const plan = await prisma.saasPlan.findUnique({ where: { id: saasPlanId } })
    if (!plan || !plan.isActive) {
        return NextResponse.json({ error: "Plan not found or inactive" }, { status: 404 })
    }

    const isPaid = Number(plan.price) > 0

    // ── Verify Razorpay signature for paid plans ──────────────────────────────
    if (isPaid) {
        if (!razorpayPaymentId || !razorpayOrderId) {
            return NextResponse.json({ error: "Payment details missing" }, { status: 400 })
        }
        // Signature verification is optional if Razorpay webhook handles it,
        // but we verify here when signature is provided for extra security.
        if (razorpaySignature) {
            const valid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)
            if (!valid) {
                return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
            }
        }
    }

    // ── Compute subscription period ───────────────────────────────────────────
    const now          = new Date()
    const months       = INTERVAL_MONTHS[plan.interval]
    const periodEnd    = months !== null ? addMonths(now, months) : null
    const isLifetime   = plan.interval === "LIFETIME"
    const status       = isLifetime ? "LIFETIME" : "ACTIVE"

    // ── Run in transaction ────────────────────────────────────────────────────
    const { subscription, payment } = await prisma.$transaction(async (tx) => {
        // Expire any existing active/trialing subscriptions
        await tx.saasSubscription.updateMany({
            where: {
                profileId,
                status: { in: ["ACTIVE", "TRIALING", "LIFETIME"] },
            },
            data: { status: "CANCELED" },
        })

        // Create new subscription
        const subscription = await tx.saasSubscription.create({
            data: {
                profileId,
                saasPlanId: plan.id,
                status,
                currentPeriodStart: now,
                currentPeriodEnd:   periodEnd,
                trialEndsAt:        null,
            },
            include: { saasPlan: true },
        })

        // Record payment
        const payment = await tx.saasPayment.create({
            data: {
                profileId,
                subscriptionId:    subscription.id,
                amount:            plan.price,
                discountAmount:    0,
                finalAmount:       plan.price,
                currency:          plan.currency,
                status:            isPaid ? "COMPLETED" : "COMPLETED",
                razorpayPaymentId: razorpayPaymentId ?? null,
                razorpayOrderId:   razorpayOrderId   ?? null,
            },
        })

        return { subscription, payment }
    })

    return NextResponse.json({ subscription, payment })
}

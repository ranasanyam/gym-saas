// src/app/api/subscriptions/webhook/route.ts
// Handles Razorpay webhook events for autopay subscription lifecycle.
//
// Register this URL in the Razorpay dashboard:
//   https://dashboard.razorpay.com/app/webhooks
//   URL: https://<your-domain>/api/subscriptions/webhook
//   Events to enable:
//     - subscription.charged   → auto-renew period in DB
//     - subscription.cancelled → mark CANCELLED
//     - subscription.halted    → mark PAST_DUE (payment retry failed)
//     - subscription.completed → mark EXPIRED (all cycles done)
//     - payment.failed         → record failed payment attempt
//
// Set RAZORPAY_WEBHOOK_SECRET in .env (from the webhook setup page).

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { addMonths } from "date-fns"

export const runtime = "nodejs"

const INTERVAL_MONTHS: Record<string, number> = {
    MONTHLY:     1,
    QUARTERLY:   3,
    HALF_YEARLY: 6,
    YEARLY:      12,
}

function verifyWebhookSignature(body: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!secret) return true // skip verification in dev if secret not set
    const expected = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex")
    return expected === signature
}

export async function POST(req: NextRequest) {
    const body      = await req.text()
    const signature = req.headers.get("x-razorpay-signature") ?? ""

    if (!verifyWebhookSignature(body, signature)) {
        console.warn("[webhook] Invalid Razorpay signature — rejected")
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    let event: any
    try {
        event = JSON.parse(body)
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const eventType: string  = event.event   ?? ""
    const payload            = event.payload  ?? {}

    console.log(`[webhook] Received: ${eventType}`)

    // ── subscription.charged — auto-renewal payment succeeded ────────────────
    if (eventType === "subscription.charged") {
        const razorpaySubId = payload.subscription?.entity?.id as string | undefined
        const paymentId     = payload.payment?.entity?.id      as string | undefined
        const amountPaise   = payload.payment?.entity?.amount  as number | undefined

        if (!razorpaySubId || !paymentId) {
            console.error("[webhook] subscription.charged missing ids")
            return NextResponse.json({ ok: true })
        }

        const sub = await prisma.saasSubscription.findFirst({
            where:   { razorpaySubId },
            include: { saasPlan: true },
        })

        if (!sub) {
            console.error(`[webhook] No subscription for razorpaySubId=${razorpaySubId}`)
            return NextResponse.json({ ok: true })
        }

        const now     = new Date()
        const months  = INTERVAL_MONTHS[sub.saasPlan.interval]
        const newEnd  = months
            ? addMonths(sub.currentPeriodEnd ?? now, months)
            : null

        await prisma.$transaction(async (tx) => {
            await tx.saasSubscription.update({
                where: { id: sub.id },
                data:  {
                    status:             "ACTIVE",
                    currentPeriodStart: now,
                    currentPeriodEnd:   newEnd,
                },
            })

            await tx.profile.update({
                where: { id: sub.profileId },
                data:  { ownerPlanStatus: "ACTIVE" },
            })

            await tx.saasPayment.create({
                data: {
                    profileId:         sub.profileId,
                    subscriptionId:    sub.id,
                    amount:            sub.saasPlan.price,
                    discountAmount:    0,
                    finalAmount:       amountPaise
                        ? String(amountPaise / 100)
                        : sub.saasPlan.price,
                    currency:          sub.saasPlan.currency,
                    status:            "COMPLETED",
                    razorpayPaymentId: paymentId,
                    paidAt:            now,
                },
            })
        })

        console.log(`[webhook] Auto-renewed sub=${sub.id} until ${newEnd?.toISOString()}`)
    }

    // ── subscription.cancelled — customer or merchant cancelled ─────────────
    if (eventType === "subscription.cancelled") {
        const razorpaySubId = payload.subscription?.entity?.id as string | undefined
        if (razorpaySubId) {
            await prisma.saasSubscription.updateMany({
                where: { razorpaySubId },
                data:  { status: "CANCELLED", cancelledAt: new Date() },
            })
            console.log(`[webhook] Cancelled sub for razorpaySubId=${razorpaySubId}`)
        }
    }

    // ── subscription.halted — all payment retries exhausted ─────────────────
    if (eventType === "subscription.halted") {
        const razorpaySubId = payload.subscription?.entity?.id as string | undefined
        if (razorpaySubId) {
            await prisma.saasSubscription.updateMany({
                where: { razorpaySubId },
                data:  { status: "PAST_DUE" },
            })
            console.log(`[webhook] Halted sub for razorpaySubId=${razorpaySubId}`)
        }
    }

    // ── subscription.completed — all billing cycles exhausted ───────────────
    if (eventType === "subscription.completed") {
        const razorpaySubId = payload.subscription?.entity?.id as string | undefined
        if (razorpaySubId) {
            await prisma.saasSubscription.updateMany({
                where: { razorpaySubId },
                data:  { status: "EXPIRED" },
            })
            console.log(`[webhook] Completed sub for razorpaySubId=${razorpaySubId}`)
        }
    }

    // ── payment.failed — record the failed attempt ───────────────────────────
    if (eventType === "payment.failed") {
        const razorpaySubId = payload.payment?.entity?.subscription_id as string | undefined
        const paymentId     = payload.payment?.entity?.id              as string | undefined
        const amountPaise   = payload.payment?.entity?.amount          as number | undefined

        if (razorpaySubId && paymentId) {
            const sub = await prisma.saasSubscription.findFirst({
                where:   { razorpaySubId },
                include: { saasPlan: true },
            })
            if (sub) {
                await prisma.saasPayment.create({
                    data: {
                        profileId:         sub.profileId,
                        subscriptionId:    sub.id,
                        amount:            amountPaise ? String(amountPaise / 100) : sub.saasPlan.price,
                        discountAmount:    0,
                        finalAmount:       amountPaise ? String(amountPaise / 100) : sub.saasPlan.price,
                        currency:          sub.saasPlan.currency,
                        status:            "FAILED",
                        razorpayPaymentId: paymentId,
                    },
                })
                console.log(`[webhook] Recorded failed payment ${paymentId} for sub=${sub.id}`)
            }
        }
    }

    return NextResponse.json({ ok: true })
}

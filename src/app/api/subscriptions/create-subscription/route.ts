// src/app/api/subscriptions/create-subscription/route.ts
// Creates a Razorpay Subscription (autopay / recurring) for a SaaS plan.
// Returns { subscriptionId, amount, currency } on success.
//
// Razorpay Subscriptions flow:
//   1. Create a Razorpay Plan  (defines price + billing cycle)
//   2. Create a Razorpay Subscription against that plan
//   3. Frontend opens checkout with subscription_id (NOT order_id)
//   4. Customer authorises UPI AutoPay / e-Mandate / card recurring
//   5. Razorpay auto-charges on every billing cycle → webhook handles renewal

import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

// Maps our plan intervals to Razorpay subscription periods
const INTERVAL_MAP: Record<string, { period: string; interval: number }> = {
    QUARTERLY:   { period: "quarterly", interval: 1 }, // every 3 months
    HALF_YEARLY: { period: "monthly",   interval: 6 }, // every 6 months
    YEARLY:      { period: "yearly",    interval: 1 }, // every 12 months
}

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
    const profileId = await resolveProfileId(req)
    if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error("[create-subscription] Razorpay keys not configured")
        return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 })
    }

    const { saasPlanId } = await req.json()
    if (!saasPlanId) return NextResponse.json({ error: "saasPlanId is required" }, { status: 400 })

    const plan = await prisma.saasPlan.findUnique({ where: { id: saasPlanId } })
    if (!plan || !plan.isActive) {
        return NextResponse.json({ error: "Plan not found or inactive" }, { status: 404 })
    }

    const mapping = INTERVAL_MAP[plan.interval]
    if (!mapping) {
        return NextResponse.json(
            { error: `Autopay not supported for interval: ${plan.interval}` },
            { status: 400 }
        )
    }

    const amountPaise = Math.round(Number(plan.price) * 100)

    try {
        const Razorpay = (await import("razorpay")).default
        const rzp = new Razorpay({
            key_id:     process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        })

        // Step 1: Create a Razorpay Plan (defines the billing amount + cycle)
        const rzpPlan = await (rzp.plans as any).create({
            period:   mapping.period,
            interval: mapping.interval,
            item: {
                name:     `${plan.name} — ${plan.interval}`,
                amount:   amountPaise,
                currency: plan.currency,
            },
            notes: {
                saasPlanId: plan.id,
                planName:   plan.name,
                interval:   plan.interval,
            },
        })

        // Step 2: Create a Razorpay Subscription against that plan
        // total_count: 100 = Razorpay maximum (25 yrs quarterly / 8 yrs yearly)
        const rzpSub = await (rzp.subscriptions as any).create({
            plan_id:         rzpPlan.id,
            total_count:     100,
            quantity:        1,
            customer_notify: 1,
            notes: {
                profileId,
                saasPlanId: plan.id,
                planName:   plan.name,
                interval:   plan.interval,
            },
        })

        console.log(
            `[create-subscription] plan=${rzpPlan.id} sub=${rzpSub.id}` +
            ` for profile=${profileId} plan=${plan.name}(${plan.interval})`
        )

        return NextResponse.json({
            subscriptionId: rzpSub.id,
            amount:         amountPaise,
            currency:       plan.currency,
        })
    } catch (err: any) {
        console.error("[create-subscription] Razorpay error:", err?.error ?? err?.message ?? err)
        return NextResponse.json(
            { error: err?.error?.description ?? err?.message ?? "Failed to create subscription" },
            { status: 500 }
        )
    }
}

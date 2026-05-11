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
import Razorpay from "razorpay"

// Maps our plan intervals to Razorpay subscription periods.
// maxCount caps autopay at 10 years per interval.
const INTERVAL_MAP: Record<string, { period: string; interval: number; maxCount: number }> = {
    QUARTERLY:   { period: "monthly",   interval: 3, maxCount: 40 }, // 4/yr × 10 yrs
    HALF_YEARLY: { period: "monthly",   interval: 6, maxCount: 20 }, // 2/yr × 10 yrs
    YEARLY:      { period: "yearly",    interval: 1, maxCount: 10 }, // 1/yr × 10 yrs
}

export const runtime = "nodejs"

function getPlanTier(planName: string): number {
    const n = planName.toLowerCase()
    if (n.includes("enterprise")) return 3
    if (n.includes("pro"))        return 2
    if (n.includes("basic"))      return 1
    return 0
}

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
        // Upgrade allowed — subscribe endpoint will cancel the old sub in its transaction
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

        // Step 2: Create a Razorpay Subscription against that plan (capped at 10 years)
        const rzpSub = await (rzp.subscriptions as any).create({
            plan_id:         rzpPlan.id,
            total_count:     mapping.maxCount,
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

// src/app/api/subscriptions/create-order/route.ts
// Creates a Razorpay order for a SaaS plan purchase.
// Returns { orderId, amount, currency } on success.

import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
    const profileId = await resolveProfileId(req)
    if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { saasPlanId } = await req.json()
    if (!saasPlanId) return NextResponse.json({ error: "saasPlanId is required" }, { status: 400 })

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error("[create-order] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set")
        return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 })
    }

    const plan = await prisma.saasPlan.findUnique({ where: { id: saasPlanId } })
    if (!plan || !plan.isActive) {
        return NextResponse.json({ error: "Plan not found or inactive" }, { status: 404 })
    }

    // amount is in paise (1 INR = 100 paise)
    const amountPaise = Math.round(Number(plan.price) * 100)

    try {
        const Razorpay = (await import("razorpay")).default
        const razorpay = new Razorpay({
            key_id:     process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        })

        const order = await razorpay.orders.create({
            amount:   amountPaise,
            currency: plan.currency,
            receipt:  `sub_${profileId.slice(0, 8)}_${Date.now()}`,
            notes: {
                profileId,
                saasPlanId: plan.id,
                planName:   plan.name,
                interval:   plan.interval,
            },
        })

        console.log(`[create-order] Created order ${order.id} for plan ${plan.name} (${plan.interval})`)

        return NextResponse.json({
            orderId:  order.id,
            amount:   order.amount,
            currency: order.currency,
        })
    } catch (err: any) {
        console.error("[create-order] Razorpay error:", err?.error ?? err?.message ?? err)
        return NextResponse.json(
            { error: err?.error?.description ?? err?.message ?? "Failed to create payment order" },
            { status: 500 }
        )
    }
}

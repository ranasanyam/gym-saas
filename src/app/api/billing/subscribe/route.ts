// src/app/api/billing/subscribe/route.ts
// Handles SaaS platform subscription purchase (owner buys a GymStack plan)
// When payment is confirmed → referral conversion is triggered for the buyer
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendAdminSubscriptionNotification, sendSaasPaymentReceiptEmail } from "@/lib/email"
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { saasPlanId, razorpayPaymentId, razorpayOrderId, amount } = await req.json()

  if (!saasPlanId || !amount) {
    return NextResponse.json({ error: "saasPlanId and amount are required" }, { status: 400 })
  }

  const plan = await prisma.saasPlan.findUnique({ where: { id: saasPlanId } })
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })

  // Calculate period end date based on plan interval
  const now = new Date()
  const end = new Date(now)
  if (plan.interval === "MONTHLY")  end.setMonth(end.getMonth() + 1)
  if (plan.interval === "YEARLY")   end.setFullYear(end.getFullYear() + 1)
  if (plan.interval === "LIFETIME") end.setFullYear(end.getFullYear() + 99)

  // Create or renew subscription + record payment atomically
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.saasSubscription.findFirst({
      where: { profileId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    let subscription
    if (existing) {
      subscription = await tx.saasSubscription.update({
        where: { id: existing.id },
        data: {
          saasPlanId,
          status:             "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd:   plan.interval === "LIFETIME" ? null : end,
          cancelledAt:        null,
        },
      })
    } else {
      subscription = await tx.saasSubscription.create({
        data: {
          profileId:          session.user.id,
          saasPlanId,
          status:             "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd:   plan.interval === "LIFETIME" ? null : end,
        },
      })
    }

    const payment = await tx.saasPayment.create({
      data: {
        profileId:         session.user.id,
        subscriptionId:    subscription.id,
        amount:            parseFloat(amount),
        discountAmount:    0,
        finalAmount:       parseFloat(amount),
        status:            "COMPLETED",
        razorpayPaymentId: razorpayPaymentId ?? null,
        razorpayOrderId:   razorpayOrderId   ?? null,
        paidAt:            now,
      },
    })

    return { subscription, payment }
  })
  // ── Receipt email + Admin notification (fire-and-forget) ─────────────────────────────────
  prisma.profile.findUnique({ where: { id: session.user.id }, select: { fullName: true, email: true } })
    .then(async profile => {
      const receiptNumber = `GS-${new Date(result.payment.paidAt ?? new Date()).getFullYear()}-${result.payment.id.slice(0, 8).toUpperCase()}`
      const appUrl        = process.env.NEXTAUTH_URL ?? "https://gymstack.co.in"

      await Promise.allSettled([
        // Receipt to subscriber
        profile?.email
          ? sendSaasPaymentReceiptEmail({
              to:                profile.email,
              fullName:          profile.fullName ?? "there",
              planName:          plan.name,
              amount:            Number(result.payment.finalAmount),
              paidAt:            result.payment.paidAt ?? new Date(),
              receiptNumber,
              razorpayPaymentId: result.payment.razorpayPaymentId,
              downloadUrl:       `${appUrl}/api/saas/receipt/${result.payment.id}`,
            })
          : Promise.resolve(),
        // Admin alert
        sendAdminSubscriptionNotification({
          subscriberName:   profile?.fullName ?? "Unknown",
          subscriberEmail:  profile?.email    ?? undefined,
          planName:         plan.name,
          planAmount:       String(result.payment.finalAmount),
          role:             "Gym Owner",
          subscriptionType: "Platform Plan",
        }),
      ])
    })
    .catch(() => {})
  // ── Referral conversion fires HERE — on SaaS subscription purchase ONLY ──
  try {
    await fetch(`${process.env.NEXTAUTH_URL}/api/referral/convert`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        profileId: session.user.id,       // the buyer — check if they were referred
        paymentId: result.payment.id,     // saas_payment.id stored on the referral record
      }),
    })
  } catch {
    // Non-critical — subscription succeeds even if referral credit fails
  }

  return NextResponse.json({
    subscription: result.subscription,
    payment:      result.payment,
  }, { status: 201 })
}
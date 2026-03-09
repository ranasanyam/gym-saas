// src/app/api/billing/create-order/route.ts
// Creates a Razorpay order for a SaaS plan purchase
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { saasPlanId } = await req.json()
  if (!saasPlanId) return NextResponse.json({ error: "saasPlanId required" }, { status: 400 })

  const plan = await prisma.saasPlan.findUnique({ where: { id: saasPlanId } })
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })

  // If Razorpay is not configured, return a mock order for development
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({
      orderId: `order_dev_${Date.now()}`,
      amount:  Number(plan.price) * 100,
      currency: "INR",
      dev: true,
    })
  }

  try {
    const Razorpay = (await import("razorpay")).default
    const rzp = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    const order = await rzp.orders.create({
      amount:   Number(plan.price) * 100, // paise
      currency: "INR",
      notes:    { profileId: session.user.id, saasPlanId },
    })

    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to create order" }, { status: 500 })
  }
}
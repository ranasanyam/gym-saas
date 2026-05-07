// src/app/api/saas/receipt/[id]/route.ts
// Generates and returns a PDF receipt for a GymStack platform subscription payment.
// Accessible by the profile who made the payment (gym owner, trainer, or member).
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId } from "@/lib/mobileAuth"
import { generateSaasReceipt, type SaasReceiptData } from "@/lib/pdf"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const payment = await prisma.saasPayment.findFirst({
    where: { id, profileId },
    include: {
      profile:      { select: { fullName: true, email: true } },
      subscription: { include: { saasPlan: { select: { name: true } } } },
    },
  })

  if (!payment) return NextResponse.json({ error: "Receipt not found" }, { status: 404 })
  if (payment.status !== "COMPLETED") {
    return NextResponse.json({ error: "Receipt only available for completed payments" }, { status: 400 })
  }

  const data: SaasReceiptData = {
    receiptNumber:    `GS-${new Date(payment.paidAt ?? payment.createdAt).getFullYear()}-${payment.id.slice(0, 8).toUpperCase()}`,
    paidAt:           payment.paidAt ?? payment.createdAt,
    planName:         payment.subscription?.saasPlan?.name ?? "GymStack Plan",
    amount:           Number(payment.finalAmount),
    // razorpayPaymentId: payment.razorpayPaymentId,
    // razorpayOrderId:   payment.razorpayOrderId,
    buyerName:        payment.profile.fullName,
    buyerEmail:       String(payment.profile.email ?? ""),
    subscriptionId:   String(payment.subscriptionId ?? ""),
  }

  const filename = `GymStack_Platform_Receipt_${payment.id.slice(0, 8).toUpperCase()}.pdf`
  const buffer   = await generateSaasReceipt(data)

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length":      String(buffer.length),
    },
  })
}

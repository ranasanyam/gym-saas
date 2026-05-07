// src/app/api/member/payments/[id]/invoice/route.ts
// Generates and returns a PDF invoice/receipt for a specific member payment.
// If the gym has a GST number → full GST tax invoice.
// Otherwise → simple payment receipt branded with gym name + "Powered by GymStack".
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId } from "@/lib/mobileAuth"
import { generateGymGstInvoice, generateGymSimpleReceipt, GymPaymentData } from "@/lib/pdf"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  // Find all GymMember records for this profile to verify ownership
  const memberships = await prisma.gymMember.findMany({
    where: { profileId },
    select: { id: true },
  })
  const memberIds = memberships.map(m => m.id)

  const payment = await prisma.payment.findFirst({
    where: { id, memberId: { in: memberIds } },
    include: {
      gym: {
        select: {
          name: true, address: true, city: true, state: true,
          pincode: true, contactNumber: true,
          gstNumber: true, gstRegisteredName: true,
        },
      },
      member: {
        include: {
          profile: {
            select: { fullName: true, email: true, mobileNumber: true },
          },
        },
      },
      membershipPlan: { select: { name: true } },
    },
  })

  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 })
  if (payment.status !== "COMPLETED") {
    return NextResponse.json({ error: "Invoice only available for completed payments" }, { status: 400 })
  }

  const gym = payment.gym
  const profile = payment.member.profile

  const planName: string = payment.planNameSnapshot ?? payment.membershipPlan?.name ?? "Membership"

  const data: GymPaymentData = {
    paymentId:        payment.id,
    paymentDate:      payment.paymentDate ?? payment.createdAt,
    paymentMethod:    payment.paymentMethod ?? "CASH",
    planName,
    amount:           Number(payment.amount),
    memberName:       profile.fullName,
    memberEmail:      profile.email ?? "",
    memberPhone:      profile.mobileNumber,
    gymName:          gym.name,
    gymAddress:       gym.address,
    gymCity:          gym.city,
    gymState:         gym.state,
    gymPincode:       gym.pincode,
    gymContact:       gym.contactNumber,
    gstNumber:        gym.gstNumber,
    gstRegisteredName: gym.gstRegisteredName,
  }

  const isGst      = !!gym.gstNumber?.trim()
  const fileLabel  = isGst ? "GST_Invoice" : "Receipt"
  const filename   = `GymStack_${fileLabel}_${payment.id.slice(0, 8).toUpperCase()}.pdf`

  const buffer = isGst
    ? await generateGymGstInvoice(data)
    : await generateGymSimpleReceipt(data)

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length":      String(buffer.length),
    },
  })
}

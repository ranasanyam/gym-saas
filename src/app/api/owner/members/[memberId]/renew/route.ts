// src/app/api/owner/members/[memberId]/renew/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  const day = d.getDate()
  d.setMonth(d.getMonth() + months)
  if (d.getDate() !== day) d.setDate(0)
  return d
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { memberId } = await params

  // Verify ownership
  const member = await prisma.gymMember.findFirst({
    where: { id: memberId, gym: { ownerId: profileId } },
    include: {
      membershipPlan: true,
      gym: { select: { id: true, name: true } },
      profile: { select: { fullName: true } },
    },
  })
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  const body = await req.json()
  const { membershipPlanId, paymentAmount, paymentMethod, notes } = body

  // Resolve the plan to use
  const planId = membershipPlanId || member.membershipPlanId
  if (!planId) return NextResponse.json({ error: "No membership plan selected" }, { status: 400 })

  const plan = await prisma.membershipPlan.findFirst({
    where: { id: planId, gymId: member.gymId },
  })
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })

  // Calculate new end date — extend from today or from current endDate if still in future
  const now = new Date()
  const baseDate = (member.endDate && member.endDate > now) ? member.endDate : now
  const newEndDate = addMonths(baseDate, plan.durationMonths)

  const [updatedMember] = await prisma.$transaction([
    // 1. Update member status + dates + plan
    prisma.gymMember.update({
      where: { id: memberId },
      data: {
        status: "ACTIVE",
        isActive: true,
        membershipPlanId: planId,
        startDate: member.status !== "ACTIVE" ? now : member.startDate, // reset start only if was expired
        endDate: newEndDate,
        expiredAt: null, // clear the expiry marker
      },
    }),
    // 2. Record payment if amount provided
    ...(paymentAmount
      ? [prisma.payment.create({
          data: {
            gymId:    member.gymId,
            memberId: member.id,
            membershipPlanId: planId,
            amount:   parseFloat(String(paymentAmount)),
            currency: "INR",
            paymentMethod: paymentMethod || "CASH",
            status: "COMPLETED",
            paymentDate: now,
            planNameSnapshot: plan.name,
          },
        })]
      : []),
    // 3. Notify member
    prisma.notification.create({
      data: {
        gymId:     member.gymId,
        profileId: member.profileId,
        title:     "✅ Membership Renewed",
        message:   `Your ${plan.name} membership at ${member.gym.name} has been renewed until ${newEndDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.${notes ? ` Note: ${notes}` : ""}`,
        type:      "BILLING",
      },
    }),
  ])

  return NextResponse.json({
    success: true,
    newEndDate: newEndDate.toISOString(),
    member: updatedMember,
  })
}
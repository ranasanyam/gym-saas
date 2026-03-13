// // src/app/api/owner/members/[memberId]/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"

// async function ownsGym(ownerId: string, memberId: string) {
//   const member = await prisma.gymMember.findFirst({
//     where: { id: memberId, gym: { ownerId } },
//     select: { id: true, gymId: true },
//   })
//   return member
// }

// export async function GET(_: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   const { memberId } = await params
//   const member = await prisma.gymMember.findFirst({
//     where: { id: memberId, gym: { ownerId: session.user.id } },
//     include: {
//       profile: { select: { fullName: true, email: true, mobileNumber: true, avatarUrl: true, city: true, gender: true, dateOfBirth: true } },
//       gym: { select: { name: true, id: true } },
//       membershipPlan: true,
//       assignedTrainer: { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
//       attendance: { orderBy: { checkInTime: "desc" }, take: 10 },
//       payments: { orderBy: { createdAt: "desc" }, take: 5 },
//     },
//   })
//   if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

//   // Fetch trainers in the same gym for the assign-trainer dropdown
//   const gymTrainers = await prisma.gymTrainer.findMany({
//     where:   { gymId: member.gymId },
//     select:  { id: true, profile: { select: { fullName: true, avatarUrl: true } } },
//     orderBy: { createdAt: "desc" },
//   })

//   return NextResponse.json({ ...member, gymTrainers })
// }

// export async function PATCH(req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   const { memberId } = await params
//   const member = await ownsGym(session.user.id, memberId)
//   if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })
//   const body = await req.json()
//   const updated = await prisma.gymMember.update({
//     where: { id: memberId },
//     data: {
//       status: body.status,
//       membershipPlanId: body.membershipPlanId,
//       assignedTrainerId: body.assignedTrainerId,
//       heightCm: body.heightCm ? parseFloat(body.heightCm) : undefined,
//       weightKg: body.weightKg ? parseFloat(body.weightKg) : undefined,
//       medicalNotes: body.medicalNotes,
//       emergencyContactName: body.emergencyContactName,
//       emergencyContactPhone: body.emergencyContactPhone,
//       endDate: body.endDate ? new Date(body.endDate) : undefined,
//     },
//   })
//   return NextResponse.json(updated)
// }

// export async function DELETE(_: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   const { memberId } = await params
//   const member = await ownsGym(session.user.id, memberId)
//   if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })
//   await prisma.gymMember.update({ where: { id: memberId }, data: { status: "SUSPENDED", isActive: false } })
//   return NextResponse.json({ success: true })
// }

// src/app/api/owner/members/[memberId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendPushToProfile } from "@/lib/push"

async function ownsGym(ownerId: string, memberId: string) {
  return prisma.gymMember.findFirst({
    where:  { id: memberId, gym: { ownerId } },
    select: { id: true, gymId: true, profileId: true, membershipPlanId: true, endDate: true },
  })
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { memberId } = await params

  const member = await prisma.gymMember.findFirst({
    where: { id: memberId, gym: { ownerId: session.user.id } },
    include: {
      profile: {
        select: {
          fullName: true, email: true, mobileNumber: true,
          avatarUrl: true, city: true, gender: true, dateOfBirth: true,
        },
      },
      gym:             { select: { name: true, id: true } },
      membershipPlan:  true,
      assignedTrainer: { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
      attendance:      { orderBy: { checkInTime: "desc" }, take: 10 },
      payments:        { orderBy: { createdAt: "desc" }, take: 5 },
    },
  })
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  const gymTrainers = await prisma.gymTrainer.findMany({
    where:   { gymId: member.gymId },
    select:  { id: true, profile: { select: { fullName: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ ...member, gymTrainers })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { memberId } = await params
  const existing = await ownsGym(session.user.id, memberId)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()

  // If a new plan is being assigned, calculate new end date
  let endDate = body.endDate ? new Date(body.endDate) : undefined
  const newPlanId = body.membershipPlanId

  if (newPlanId && newPlanId !== existing.membershipPlanId) {
    const plan = await prisma.membershipPlan.findUnique({
      where:  { id: newPlanId },
      select: { name: true, durationMonths: true },
    })
    if (plan && !body.endDate) {
      const base = existing.endDate && existing.endDate > new Date() ? existing.endDate : new Date()
      const d = new Date(base)
      d.setMonth(d.getMonth() + plan.durationMonths)
      endDate = d
    }

    // Notify member of plan assignment
    const gym = await prisma.gym.findUnique({ where: { id: existing.gymId }, select: { name: true } })
    if (plan && gym) {
      await Promise.allSettled([
        prisma.notification.create({
          data: {
            profileId: existing.profileId,
            gymId:     existing.gymId,
            title:     `📋 Membership Plan Updated`,
            message:   `Your membership plan at ${gym.name} has been updated to ${plan.name}${endDate ? `. Valid until ${endDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}.`,
            type:      "BILLING",
          },
        }),
        sendPushToProfile(existing.profileId, {
          title: "📋 Plan Updated",
          body:  `Your membership at ${gym.name} is now on the ${plan.name} plan.`,
          url:   "/member/payments",
          tag:   "plan-updated",
        }).catch(() => {}),
      ])
    }
  }

  const updated = await prisma.gymMember.update({
    where: { id: memberId },
    data: {
      status:               body.status,
      membershipPlanId:     newPlanId || undefined,
      assignedTrainerId:    body.assignedTrainerId,
      heightCm:             body.heightCm ? parseFloat(body.heightCm) : undefined,
      weightKg:             body.weightKg ? parseFloat(body.weightKg) : undefined,
      medicalNotes:         body.medicalNotes,
      emergencyContactName:  body.emergencyContactName,
      emergencyContactPhone: body.emergencyContactPhone,
      endDate,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { memberId } = await params
  const member = await ownsGym(session.user.id, memberId)
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.gymMember.update({
    where: { id: memberId },
    data:  { status: "SUSPENDED", isActive: false },
  })
  return NextResponse.json({ success: true })
}
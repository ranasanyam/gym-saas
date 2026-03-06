// src/app/api/owner/members/[memberId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

async function ownsGym(ownerId: string, memberId: string) {
  const member = await prisma.gymMember.findFirst({
    where: { id: memberId, gym: { ownerId } },
    select: { id: true, gymId: true },
  })
  return member
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { memberId } = await params
  const member = await prisma.gymMember.findFirst({
    where: { id: memberId, gym: { ownerId: session.user.id } },
    include: {
      profile: { select: { fullName: true, email: true, mobileNumber: true, avatarUrl: true, city: true, gender: true, dateOfBirth: true } },
      gym: { select: { name: true, id: true } },
      membershipPlan: true,
      assignedTrainer: { include: { profile: { select: { fullName: true } } } },
      attendance: { orderBy: { checkInTime: "desc" }, take: 10 },
      payments: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  })
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })
  return NextResponse.json(member)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { memberId } = await params
  const member = await ownsGym(session.user.id, memberId)
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const body = await req.json()
  const updated = await prisma.gymMember.update({
    where: { id: memberId },
    data: {
      status: body.status,
      membershipPlanId: body.membershipPlanId,
      assignedTrainerId: body.assignedTrainerId,
      heightCm: body.heightCm ? parseFloat(body.heightCm) : undefined,
      weightKg: body.weightKg ? parseFloat(body.weightKg) : undefined,
      medicalNotes: body.medicalNotes,
      emergencyContactName: body.emergencyContactName,
      emergencyContactPhone: body.emergencyContactPhone,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
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
  await prisma.gymMember.update({ where: { id: memberId }, data: { status: "SUSPENDED", isActive: false } })
  return NextResponse.json({ success: true })
}
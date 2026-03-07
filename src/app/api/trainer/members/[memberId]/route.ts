// src/app/api/trainer/members/[memberId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

async function trainerOwns(profileId: string, memberId: string) {
  const trainer = await prisma.gymTrainer.findUnique({
    where: { profileId },
    select: { id: true },
  })
  if (!trainer) return null
  const member = await prisma.gymMember.findFirst({
    where: { id: memberId, assignedTrainerId: trainer.id },
    select: { id: true },
  })
  return member ? trainer : null
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { memberId } = await params

  const trainer = await prisma.gymTrainer.findUnique({
    where: { profileId: session.user.id },
    select: { id: true },
  })
  if (!trainer) return NextResponse.json({ error: "Trainer not found" }, { status: 404 })

  const member = await prisma.gymMember.findFirst({
    where: { id: memberId, assignedTrainerId: trainer.id },
    include: {
      profile: {
        select: {
          fullName: true, avatarUrl: true, email: true, mobileNumber: true,
          gender: true, dateOfBirth: true, city: true,
        },
      },
      gym: { select: { id: true, name: true } },
      membershipPlan: { select: { name: true, durationMonths: true, price: true, features: true } },
      attendance: { orderBy: { checkInTime: "desc" }, take: 20 },
      bodyMetrics: { orderBy: { recordedAt: "desc" }, take: 10 },
      workoutPlans: {
        where: { isActive: true },
        select: { id: true, title: true, goal: true, difficulty: true, planData: true, weekStartDate: true },
      },
      dietPlans: {
        where: { isActive: true },
        select: { id: true, title: true, goal: true, caloriesTarget: true, planData: true },
      },
    },
  })

  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })
  return NextResponse.json(member)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { memberId } = await params
  const trainer = await trainerOwns(session.user.id, memberId)
  if (!trainer) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const updated = await prisma.gymMember.update({
    where: { id: memberId },
    data: {
      heightCm:              body.heightCm     ? parseFloat(body.heightCm)  : undefined,
      weightKg:              body.weightKg     ? parseFloat(body.weightKg)  : undefined,
      medicalNotes:          body.medicalNotes ?? undefined,
      emergencyContactName:  body.emergencyContactName  ?? undefined,
      emergencyContactPhone: body.emergencyContactPhone ?? undefined,
    },
  })
  return NextResponse.json(updated)
}
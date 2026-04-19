// src/app/api/trainer/members/[memberId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { memberId } = await params

  const trainer = await prisma.gymTrainer.findUnique({
    where: { profileId },
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
      gym:            { select: { id: true, name: true } },
      membershipPlan: { select: { name: true, durationMonths: true, price: true, features: true } },
      attendance:     { orderBy: { checkInTime: "desc" }, take: 30 },
      bodyMetrics:    { orderBy: { recordedAt: "desc" }, take: 20 },
      workoutPlans: {
        where:  { isActive: true, createdBy: profileId },
        select: { id: true, title: true, goal: true, difficulty: true, planData: true, weekStartDate: true, createdAt: true },
      },
      dietPlans: {
        where:  { isActive: true, createdBy: profileId },
        select: { id: true, title: true, goal: true, caloriesTarget: true, proteinG: true, carbsG: true, fatG: true, planData: true, createdAt: true },
      },
    },
  })

  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })
  return NextResponse.json(member)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { memberId } = await params
  const trainer = await trainerOwns(profileId, memberId)
  if (!trainer) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const updated = await prisma.gymMember.update({
    where: { id: memberId },
    data: {
      heightCm:              body.heightCm              != null ? parseFloat(body.heightCm)  : undefined,
      weightKg:              body.weightKg              != null ? parseFloat(body.weightKg)  : undefined,
      medicalNotes:          body.medicalNotes          ?? undefined,
      emergencyContactName:  body.emergencyContactName  ?? undefined,
      emergencyContactPhone: body.emergencyContactPhone ?? undefined,
    },
  })
  return NextResponse.json(updated)
}

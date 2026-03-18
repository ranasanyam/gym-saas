// src/app/api/trainer/diets/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const trainer = await prisma.gymTrainer.findUnique({
    where: { profileId: profileId },
    select: { id: true, gymId: true },
  })
  if (!trainer) return NextResponse.json({ error: "Trainer not found" }, { status: 404 })

  const myMemberIds = (await prisma.gymMember.findMany({
    where: { assignedTrainerId: trainer.id },
    select: { id: true },
  })).map(m => m.id)

  const plans = await prisma.dietPlan.findMany({
    where: {
      gymId: trainer.gymId,
      isActive: true,
      OR: [
        { createdBy: profileId },
        { assignedToMemberId: { in: myMemberIds } },
      ],
    },
    include: {
      assignedMember: { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
      creator: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(plans)
}

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const trainer = await prisma.gymTrainer.findUnique({
    where: { profileId: profileId },
    select: { id: true, gymId: true },
  })
  if (!trainer) return NextResponse.json({ error: "Trainer not found" }, { status: 404 })

  const { title, description, goal, caloriesTarget, proteinG, carbsG, fatG,
          isGlobal, assignedToMemberId, weekStartDate, planData } = await req.json()

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 })

  if (assignedToMemberId) {
    const member = await prisma.gymMember.findFirst({
      where: { id: assignedToMemberId, assignedTrainerId: trainer.id },
    })
    if (!member) return NextResponse.json({ error: "Member not assigned to you" }, { status: 403 })
  }

  const plan = await prisma.dietPlan.create({
    data: {
      gymId: trainer.gymId,
      createdBy: profileId,
      title, description, goal,
      caloriesTarget: caloriesTarget ? parseInt(caloriesTarget) : null,
      proteinG:       proteinG ? parseFloat(proteinG) : null,
      carbsG:         carbsG   ? parseFloat(carbsG)   : null,
      fatG:           fatG     ? parseFloat(fatG)     : null,
      isTemplate: false,
      isGlobal:   isGlobal ?? false,
      weekStartDate: weekStartDate ? new Date(weekStartDate) : null,
      assignedToMemberId: assignedToMemberId || null,
      planData: planData ?? {},
    },
  })

  if (assignedToMemberId) {
    const member = await prisma.gymMember.findUnique({
      where: { id: assignedToMemberId },
      select: { profileId: true },
    })
    if (member) {
      await prisma.notification.create({
        data: {
          gymId: trainer.gymId,
          profileId: member.profileId,
          title: "🥗 New Diet Plan",
          message: `Your trainer assigned you a new diet plan: "${title}"`,
          type: "PLAN_UPDATE",
        },
      })
    }
  }

  return NextResponse.json(plan, { status: 201 })
}
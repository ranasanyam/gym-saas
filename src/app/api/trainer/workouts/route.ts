// src/app/api/trainer/workouts/route.ts
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

  const plans = await prisma.workoutPlan.findMany({
    where: {
      gymId: trainer.gymId,
      isActive: true,
      createdBy: profileId,
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

  const { title, description, goal, difficulty, durationWeeks, weekStartDate,
          isGlobal, assignedToMemberId, planData } = await req.json()

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 })

  // If assigning to a member, verify trainer owns that member
  if (assignedToMemberId) {
    const member = await prisma.gymMember.findFirst({
      where: { id: assignedToMemberId, assignedTrainerId: trainer.id },
    })
    if (!member) return NextResponse.json({ error: "Member not found or not assigned to you" }, { status: 403 })
  }

  const plan = await prisma.workoutPlan.create({
    data: {
      gymId:   trainer.gymId,
      createdBy: profileId,
      title, description, goal,
      difficulty:    difficulty    ?? "BEGINNER",
      durationWeeks: durationWeeks ?? 4,
      weekStartDate: weekStartDate ? new Date(weekStartDate) : null,
      isTemplate: false,
      isGlobal:   isGlobal ?? false,
      assignedToMemberId: assignedToMemberId || null,
      planData: planData ?? {},
    },
  })

  // Notify member if assigned
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
          title: "💪 New Workout Plan",
          message: `Your trainer assigned you a new workout plan: "${title}"`,
          type: "PLAN_UPDATE",
        },
      })
    }
  }

  return NextResponse.json(plan, { status: 201 })
}
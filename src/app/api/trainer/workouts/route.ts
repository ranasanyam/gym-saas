// src/app/api/trainer/workouts/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { sendPushToProfile } from "@/lib/push"
export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const trainer = await prisma.gymTrainer.findFirst({
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

  const trainer = await prisma.gymTrainer.findFirst({
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

  // when assigning to a specific member, deactivate their previous workout plans
  if (assignedToMemberId) {
    await prisma.workoutPlan.updateMany({
      where: { assignedToMemberId, isActive: true },
      data: { isActive: false },
    })
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
      isActive: true,
    },
  })

  if (assignedToMemberId) {
    // Single member — in-app + push
    const member = await prisma.gymMember.findUnique({
      where:  { id: assignedToMemberId },
      select: { profileId: true },
    })
    if (member) {
      await Promise.allSettled([
        prisma.notification.create({
          data: {
            gymId:     trainer.gymId,
            profileId: member.profileId,
            title:   "💪 New Workout Plan",
            message: `Your trainer assigned you a new workout plan: "${title}"`,
            type:    "PLAN_UPDATE",
          },
        }),
        sendPushToProfile(member.profileId, {
          title: "💪 New Workout Plan",
          body:  `Your trainer assigned you a new workout plan: "${title}"`,
          url:   "/member/workouts",
          tag:   "workout-plan-assigned",
        }),
      ]).catch(() => {})
    }
  } else if (isGlobal) {
    // All active members of trainer's gym
    const members = await prisma.gymMember.findMany({
      where:  { gymId: trainer.gymId, status: "ACTIVE" },
      select: { profileId: true },
    })
    if (members.length) {
      await Promise.allSettled([
        prisma.notification.createMany({
          data: members.map(m => ({
            gymId:     trainer.gymId,
            profileId: m.profileId,
            title:   "💪 New Workout Plan",
            message: `Your trainer shared a new workout plan with all members: "${title}"`,
            type:    "PLAN_UPDATE",
          })),
          skipDuplicates: true,
        }),
        ...members.map(m =>
          sendPushToProfile(m.profileId, {
            title: "💪 New Workout Plan",
            body:  `Your trainer shared a new workout plan with all members: "${title}"`,
            url:   "/member/workouts",
            tag:   "workout-plan-global",
          })
        ),
      ]).catch(() => {})
    }
  }

  return NextResponse.json(plan, { status: 201 })
}
// src/app/api/owner/diets/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const gymId = new URL(req.url).searchParams.get("gymId")
  const gyms = await prisma.gym.findMany({ where: { ownerId: session.user.id }, select: { id: true } })
  const gymIds = gymId ? [gymId] : gyms.map(g => g.id)
  const plans = await prisma.dietPlan.findMany({
    where: { gymId: { in: gymIds }, isActive: true },
    include: {
      assignedMember: { include: { profile: { select: { fullName: true } } } },
      creator: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(plans)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { gymId, title, description, goal, caloriesTarget, proteinG, carbsG, fatG,
          isTemplate, isGlobal, assignedToMemberId, weekStartDate, planData } = await req.json()

  if (!gymId || !title) return NextResponse.json({ error: "gymId and title are required" }, { status: 400 })

  const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: session.user.id } })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  const plan = await prisma.dietPlan.create({
    data: {
      gymId, createdBy: session.user.id,
      title, description, goal,
      caloriesTarget: caloriesTarget ? parseInt(caloriesTarget) : null,
      proteinG:       proteinG       ? parseFloat(proteinG)     : null,
      carbsG:         carbsG         ? parseFloat(carbsG)       : null,
      fatG:           fatG           ? parseFloat(fatG)         : null,
      isTemplate:     isTemplate     ?? false,
      isGlobal:       isGlobal       ?? false,
      weekStartDate:  weekStartDate ? new Date(weekStartDate) : null,
      assignedToMemberId: assignedToMemberId || null,
      planData: planData ?? {},
    },
  })

  // ── Send notifications ────────────────────────────────────────────────────
  await sendPlanNotifications({
    gymId,
    gymName:   gym.name,
    planId:    plan.id,
    planTitle: title,
    planType:  "diet",
    isGlobal:  isGlobal ?? false,
    assignedToMemberId: assignedToMemberId || null,
  })

  return NextResponse.json(plan, { status: 201 })
}

// ── Shared notification helper ────────────────────────────────────────────────
async function sendPlanNotifications({
  gymId, gymName, planTitle, planType, isGlobal, assignedToMemberId,
}: {
  gymId: string
  gymName: string
  planId: string
  planTitle: string
  planType: "workout" | "diet"
  isGlobal: boolean
  assignedToMemberId: string | null
}) {
  const label   = planType === "workout" ? "Workout Plan" : "Diet Plan"
  const emoji   = planType === "workout" ? "💪" : "🥗"
  const title   = `${emoji} New ${label} Available`
  const message = `A new ${label.toLowerCase()} "${planTitle}" has been assigned to you by ${gymName}.`

  if (isGlobal) {
    // Notify ALL active members of this gym
    const members = await prisma.gymMember.findMany({
      where: { gymId, status: "ACTIVE" },
      select: { profileId: true },
    })

    if (members.length === 0) return

    await prisma.notification.createMany({
      data: members.map(m => ({
        profileId: m.profileId,
        gymId,
        title,
        message,
        type: "PLAN_UPDATE" as const,
      })),
      skipDuplicates: true,
    })

  } else if (assignedToMemberId) {
    // Notify only the specific assigned member
    const member = await prisma.gymMember.findUnique({
      where: { id: assignedToMemberId },
      select: { profileId: true },
    })
    if (!member) return

    await prisma.notification.create({
      data: {
        profileId: member.profileId,
        gymId,
        title,
        message,
        type: "PLAN_UPDATE",
      },
    })
  }
}
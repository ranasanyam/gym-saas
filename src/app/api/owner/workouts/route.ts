// src/app/api/owner/workouts/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const gymId = new URL(req.url).searchParams.get("gymId")
  const gyms = await prisma.gym.findMany({ where: { ownerId: session.user.id }, select: { id: true } })
  const gymIds = gymId ? [gymId] : gyms.map(g => g.id)
  const plans = await prisma.workoutPlan.findMany({
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
  const { gymId, title, description, goal, difficulty, durationWeeks, isTemplate, isGlobal, assignedToMemberId, planData } = await req.json()
  if (!gymId || !title) return NextResponse.json({ error: "gymId and title are required" }, { status: 400 })
  const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: session.user.id } })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  const plan = await prisma.workoutPlan.create({
    data: {
      gymId, createdBy: session.user.id,
      title, description, goal,
      difficulty: difficulty ?? "BEGINNER",
      durationWeeks: durationWeeks ?? 4,
      isTemplate: isTemplate ?? false,
      isGlobal: isGlobal ?? false,
      assignedToMemberId: assignedToMemberId || null,
      planData: planData ?? {},
    },
  })
  return NextResponse.json(plan, { status: 201 })
}
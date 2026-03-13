// src/app/api/owner/plan-templates/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type  = searchParams.get("type") ?? "WORKOUT"
  const gymId = searchParams.get("gymId")

  const gyms   = await prisma.gym.findMany({ where: { ownerId: session.user.id }, select: { id: true } })
  const gymIds = gyms.map(g => g.id)

  const templates = await prisma.planTemplate.findMany({
    where: {
      type,
      OR: [
        { isGlobal: true },
        { ownerGymId: { in: gymIds } },
        { createdById: session.user.id },
      ],
    },
    include: { createdBy: { select: { fullName: true } }, gym: { select: { name: true } } },
    orderBy: [{ isGlobal: "desc" }, { usageCount: "desc" }, { createdAt: "desc" }],
  })

  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { gymId, type, title, description, goal, difficulty, planData, isGlobal } = await req.json()
  if (!type || !title || !planData)
    return NextResponse.json({ error: "type, title and planData required" }, { status: 400 })

  if (gymId) {
    const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: session.user.id } })
    if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  }

  const template = await prisma.planTemplate.create({
    data: {
      ownerGymId:  gymId ?? null,
      createdById: session.user.id,
      type,
      title,
      description: description ?? null,
      goal:        goal ?? null,
      difficulty:  difficulty ?? null,
      planData,
      isGlobal:    isGlobal ?? false,
    },
  })

  return NextResponse.json(template, { status: 201 })
}
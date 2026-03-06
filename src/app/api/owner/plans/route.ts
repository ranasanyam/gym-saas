// src/app/api/owner/plans/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const gymId = new URL(req.url).searchParams.get("gymId")
  if (!gymId) return NextResponse.json({ error: "gymId required" }, { status: 400 })
  const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: session.user.id } })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  const plans = await prisma.membershipPlan.findMany({ where: { gymId }, orderBy: { createdAt: "desc" } })
  return NextResponse.json(plans)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { gymId, name, description, durationMonths, price, features, maxClasses } = await req.json()
  if (!gymId || !name || !durationMonths || price == null) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: session.user.id } })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  const plan = await prisma.membershipPlan.create({
    data: { gymId, name, description, durationMonths, price, features: features ?? [], maxClasses: maxClasses ?? null },
  })
  return NextResponse.json(plan, { status: 201 })
}
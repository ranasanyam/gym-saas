// src/app/api/owner/trainers/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const gymId = searchParams.get("gymId")

  const gyms = await prisma.gym.findMany({ where: { ownerId: session.user.id }, select: { id: true } })
  const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

  const trainers = await prisma.gymTrainer.findMany({
    where: { gymId: { in: gymIds } },
    include: {
      profile: { select: { fullName: true, email: true, mobileNumber: true, avatarUrl: true } },
      gym: { select: { name: true } },
      _count: { select: { assignedMembers: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(trainers)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const { gymId, profileId, specializations, certifications, bio, experienceYears } = body
  if (!gymId || !profileId) return NextResponse.json({ error: "gymId and profileId are required" }, { status: 400 })

  const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: session.user.id } })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  const trainer = await prisma.$transaction(async (tx) => {
    const t = await tx.gymTrainer.create({
      data: {
        gymId, profileId,
        specializations: specializations ?? [],
        certifications: certifications ?? [],
        bio: bio || null,
        experienceYears: experienceYears ?? 0,
      },
    })
    await tx.profile.update({ where: { id: profileId }, data: { role: "trainer" } })
    return t
  })
  return NextResponse.json(trainer, { status: 201 })
}
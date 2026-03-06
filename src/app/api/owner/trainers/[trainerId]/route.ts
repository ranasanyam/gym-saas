// src/app/api/owner/trainers/[trainerId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_: NextRequest, { params }: { params: Promise<{ trainerId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { trainerId } = await params
  const trainer = await prisma.gymTrainer.findFirst({
    where: { id: trainerId, gym: { ownerId: session.user.id } },
    include: {
      profile: { select: { fullName: true, email: true, mobileNumber: true, avatarUrl: true } },
      gym: { select: { name: true } },
      assignedMembers: {
        include: { profile: { select: { fullName: true, avatarUrl: true } } },
        take: 10,
      },
    },
  })
  if (!trainer) return NextResponse.json({ error: "Trainer not found" }, { status: 404 })
  return NextResponse.json(trainer)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ trainerId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { trainerId } = await params
  const body = await req.json()
  const updated = await prisma.gymTrainer.updateMany({
    where: { id: trainerId, gym: { ownerId: session.user.id } },
    data: {
      specializations: body.specializations,
      certifications: body.certifications,
      bio: body.bio,
      experienceYears: body.experienceYears,
      isAvailable: body.isAvailable,
    },
  })
  if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}
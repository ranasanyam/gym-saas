// src/app/api/trainer/discover/[gymId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string }> }
) {
  const { gymId } = await params
  const profileId = await resolveProfileId(req)

  const [gym, trainerRecord] = await Promise.all([
    prisma.gym.findFirst({
      where: { id: gymId, isActive: true },
      include: {
        owner: { select: { fullName: true, avatarUrl: true, mobileNumber: true } },
        membershipPlans: {
          where: { isActive: true },
          orderBy: { price: "asc" },
        },
        _count: { select: { members: true, trainers: true } },
      },
    }),
    profileId
      ? prisma.gymTrainer.findFirst({
          where: { gymId, profileId },
          select: { id: true },
        })
      : null,
  ])

  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  return NextResponse.json({
    ...gym,
    isJoined: !!trainerRecord,
  })
}

// src/app/api/trainer/members/route.ts
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

  const search = new URL(req.url).searchParams.get("search") ?? ""

  const members = await prisma.gymMember.findMany({
    where: {
      assignedTrainerId: trainer.id,
      ...(search ? { profile: { fullName: { contains: search, mode: "insensitive" } } } : {}),
    },
    include: {
      profile: { select: { fullName: true, avatarUrl: true, email: true, mobileNumber: true, gender: true, dateOfBirth: true } },
      membershipPlan: { select: { name: true, durationMonths: true, price: true } },
      attendance: { orderBy: { checkInTime: "desc" }, take: 3 },
      bodyMetrics: { orderBy: { recordedAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(members)
}
// src/app/api/trainer/gyms/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const trainerRecord = await prisma.gymTrainer.findUnique({
    where: { profileId },
    include: {
      gym: {
        include: {
          owner:          { select: { fullName: true, avatarUrl: true, mobileNumber: true } },
          membershipPlans: {
            where: { isActive: true },
            select: { id: true, name: true, price: true, durationMonths: true },
            orderBy: { price: "asc" },
          },
          _count: { select: { members: true, trainers: true } },
        },
      },
    },
  })

  const gyms = trainerRecord ? [{ ...trainerRecord.gym, joinedAt: trainerRecord.createdAt, specializations: trainerRecord.specializations }] : []

  return NextResponse.json(gyms)
}

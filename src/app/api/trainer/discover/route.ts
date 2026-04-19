// src/app/api/trainer/discover/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const city   = searchParams.get("city")   ?? ""
  const search = searchParams.get("search") ?? ""

  // Find current gym(s) the trainer has joined
  const trainerRecord = await prisma.gymTrainer.findUnique({
    where: { profileId },
    select: { gymId: true },
  })
  const joinedGymIds = new Set(trainerRecord ? [trainerRecord.gymId] : [])

  const gyms = await prisma.gym.findMany({
    where: {
      isActive: true,
      ...(city && { city: { contains: city, mode: "insensitive" } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      owner:          { select: { fullName: true, avatarUrl: true, mobileNumber: true } },
      membershipPlans: {
        where: { isActive: true },
        select: { id: true, name: true, price: true, durationMonths: true },
        orderBy: { price: "asc" },
      },
      _count: { select: { trainers: true, members: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { city: true },
  })

  const result = gyms.map(g => ({
    ...g,
    isJoined: joinedGymIds.has(g.id),
  }))

  return NextResponse.json({ gyms: result, trainerCity: profile?.city ?? null })
}

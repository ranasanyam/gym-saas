
// src/app/api/member/discover/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const city   = searchParams.get("city") ?? ""
  const search = searchParams.get("search") ?? ""

  // Get member's already-enrolled gym IDs to exclude or mark them
  const memberships = await prisma.gymMember.findMany({
    where: { profileId: session.user.id },
    select: { gymId: true, status: true },
  })
  const enrolledGymIds = new Set(memberships.map(m => m.gymId))

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
      membershipPlans: {
        where: { isActive: true },
        select: { id: true, name: true, price: true, durationMonths: true, features: true },
        orderBy: { price: "asc" },
      },
      owner: { select: { fullName: true, avatarUrl: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const result = gyms.map(g => ({
    ...g,
    isEnrolled: enrolledGymIds.has(g.id),
    isActive: memberships.find(m => m.gymId === g.id)?.status === "ACTIVE",
  }))

  // Get member's city for default filter
  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: { city: true },
  })

  return NextResponse.json({ gyms: result, memberCity: profile?.city ?? null })
}
// src/app/api/member/diet/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const memberships = await prisma.gymMember.findMany({
    where: { profileId: profileId },
    select: { id: true, gymId: true, status: true },
  })
  const memberIds = memberships.map(m => m.id)
  const activeGymIds = memberships.filter(m => m.status === "ACTIVE").map(m => m.gymId)

  const plans = await prisma.dietPlan.findMany({
    where: {
      OR: [
        { assignedToMemberId: { in: memberIds } },
        { gymId: { in: activeGymIds }, isGlobal: true },
      ],
      isActive: true,
    },
    include: {
      creator: { select: { fullName: true } },
      gym: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(plans)
}
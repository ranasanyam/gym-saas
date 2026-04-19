// src/app/api/member/diet/[planId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { planId } = await params

  const memberships = await prisma.gymMember.findMany({
    where: { profileId },
    select: { id: true, gymId: true, status: true },
  })
  const memberIds    = memberships.map(m => m.id)
  const activeGymIds = memberships.filter(m => m.status === "ACTIVE").map(m => m.gymId)

  const plan = await prisma.dietPlan.findFirst({
    where: {
      id: planId,
      isActive: true,
      OR: [
        { assignedToMemberId: { in: memberIds } },
        { gymId: { in: activeGymIds }, isGlobal: true },
      ],
    },
    include: {
      creator: { select: { fullName: true } },
      gym:     { select: { name: true } },
    },
  })
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })
  return NextResponse.json(plan)
}

// src/app/api/member/body-metrics/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Find all of this member's GymMember records
  const memberships = await prisma.gymMember.findMany({
    where:  { profileId },
    select: { id: true },
  })

  if (memberships.length === 0) return NextResponse.json([])

  const memberIds = memberships.map(m => m.id)

  const metrics = await prisma.bodyMetric.findMany({
    where:   { memberId: { in: memberIds } },
    orderBy: { recordedAt: "desc" },
  })

  return NextResponse.json(metrics)
}

// src/app/api/member/diet/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const memberships = await prisma.gymMember.findMany({
    where: { profileId: session.user.id },
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
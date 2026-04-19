// src/app/api/owner/search-profiles/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireActivePlan } from "@/lib/requireActivePlan"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(session.user.id)
  if (!planCheck.ok) return planCheck.response
  const q = new URL(req.url).searchParams.get("q") ?? ""
  if (q.length < 2) return NextResponse.json([])

  const profiles = await prisma.profile.findMany({
    where: {
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { mobileNumber: { contains: q } },
      ],
    },
    select: { id: true, fullName: true, email: true, mobileNumber: true, avatarUrl: true },
    take: 10,
  })
  return NextResponse.json(profiles)
}
// src/app/api/member/has-gym/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const count = await prisma.gymMember.count({ where: { profileId } })
  return NextResponse.json({ hasGym: count > 0 })
}


// src/app/api/profile/set-role/route.ts
// Moved OUT of /api/auth/ because NextAuth v5 handlers intercept ALL POST
// requests to /api/auth/* before custom route handlers can run.
// Role is set here; plan selection happens separately on /owner/choose-plan.
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const VALID_ROLES = ["owner", "trainer", "member"] as const
type Role = (typeof VALID_ROLES)[number]

export async function POST(req: NextRequest) {
  try {
    const profileId = await resolveProfileId(req)
    if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { role } = await req.json()
    if (!VALID_ROLES.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 })

    const profile = await prisma.profile.findUnique({
      where:  { id: profileId },
      select: { role: true },
    })

    if (profile?.role !== null && profile?.role !== undefined) {
      return NextResponse.json(
        { error: "Role has already been set and cannot be changed." },
        { status: 403 }
      )
    }

    await prisma.profile.update({
      where: { id: profileId },
      data:  {
        role: role as Role,
        ownerPlanStatus: role === "owner" ? "PENDING_SELECTION" : null,
      },
    })

    return NextResponse.json({ success: true, role })
  } catch (error) {
    console.error("Set role error:", error)
    return NextResponse.json({ error: "Failed to set role. Please try again." }, { status: 500 })
  }
}

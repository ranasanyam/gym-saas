// src/app/api/auth/validate-token/route.ts
// GET /api/auth/validate-token?token=xxx
// Returns info about an invite token so the complete-profile page can
// prefill the form without requiring the user to log in.

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim()
  if (!token) return NextResponse.json({ valid: false, error: "Token required" }, { status: 400 })

  const invite = await prisma.inviteToken.findUnique({
    where:   { token },
    include: { profile: { select: { id: true, fullName: true, mobileNumber: true, role: true, status: true, email: true } } },
  })

  if (!invite) return NextResponse.json({ valid: false, error: "Invalid token" })
  if (invite.usedAt) return NextResponse.json({ valid: false, error: "This invite link has already been used" })
  if (invite.expiresAt < new Date()) return NextResponse.json({ valid: false, error: "This invite link has expired" })
  if (invite.profile.status !== "INVITED") return NextResponse.json({ valid: false, error: "Profile already activated" })

  return NextResponse.json({
    valid:      true,
    profileId:  invite.profile.id,
    name:       invite.profile.fullName,
    mobile:     invite.profile.mobileNumber,
    role:       invite.profile.role,
    gymName:    invite.gymName,
  })
}

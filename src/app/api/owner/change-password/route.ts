// src/app/api/profile/change-password/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { currentPassword, newPassword } = await req.json()
  if (!currentPassword || !newPassword) return NextResponse.json({ error: "Both fields required" }, { status: 400 })
  if (newPassword.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })

  const profile = await prisma.profile.findUnique({ where: { id: profileId }, select: { passwordHash: true } })
  if (!profile?.passwordHash) return NextResponse.json({ error: "No password set (OAuth account)" }, { status: 400 })

  const valid = await bcrypt.compare(currentPassword, profile.passwordHash)
  if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })

  const hash = await bcrypt.hash(newPassword, 12)
  await prisma.profile.update({ where: { id: profileId }, data: { passwordHash: hash } })
  return NextResponse.json({ success: true })
}
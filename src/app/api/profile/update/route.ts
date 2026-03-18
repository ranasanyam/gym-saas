// src/app/api/profile/update/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { fullName, mobileNumber, city, gender, dateOfBirth, avatarUrl } = await req.json()
  const updated = await prisma.profile.update({
    where: { id: profileId },
    data: {
      fullName:     fullName?.trim()     || undefined,
      mobileNumber: mobileNumber?.trim() || null,
      city:         city?.trim()         || null,
      gender:       gender               || null,
      dateOfBirth:  dateOfBirth ? new Date(dateOfBirth) : undefined,
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
  })
  return NextResponse.json({ success: true, fullName: updated.fullName })
}
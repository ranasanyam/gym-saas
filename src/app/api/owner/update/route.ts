// src/app/api/profile/update/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { fullName, mobileNumber, city, gender } = await req.json()
  const updated = await prisma.profile.update({
    where: { id: session.user.id },
    data: {
      fullName: fullName?.trim() || undefined,
      mobileNumber: mobileNumber?.trim() || null,
      city: city?.trim() || null,
      gender: gender || null,
    },
  })
  return NextResponse.json({ success: true, fullName: updated.fullName })
}
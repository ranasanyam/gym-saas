// src/app/api/notifications/unread-count/route.ts
// Returns the unread notification count for the logged-in user.
// Called by the bell icon in web layout (polls every 60s) and mobile nav badge.
// Intentionally lightweight — single COUNT query only.
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId }          from "@/lib/mobileAuth"
import { prisma }                     from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ count: 0 })   // no auth = zero, not 401

  const count = await prisma.notification.count({
    where: { profileId, isRead: false },
  })

  return NextResponse.json({ count })
}
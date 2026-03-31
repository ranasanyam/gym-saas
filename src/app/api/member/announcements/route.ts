// src/app/api/member/announcements/route.ts
// Returns gym announcements for the member's active gyms.
// Announcements are created by gym owners via /api/owner/notifications.
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId }          from "@/lib/mobileAuth"
import { prisma }                    from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page  = parseInt(searchParams.get("page") ?? "1")
  const limit = 20

  // Get all gyms the member belongs to (any status — show history too)
  const memberships = await prisma.gymMember.findMany({
    where:  { profileId },
    select: { gymId: true },
  })

  if (!memberships.length) {
    return NextResponse.json({ announcements: [], total: 0, pages: 0 })
  }

  const gymIds = memberships.map(m => m.gymId)
  const now    = new Date()

  const where = {
    gymId:       { in: gymIds },
    publishedAt: { lte: now },
    OR: [
      { expiresAt: null },
      { expiresAt: { gt: now } },
    ],
  }

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      include: {
        gym:    { select: { name: true, logoUrl: true } },
        author: { select: { fullName: true, avatarUrl: true } },
      },
      orderBy: { publishedAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.announcement.count({ where }),
  ])

  return NextResponse.json({
    announcements,
    total,
    pages: Math.ceil(total / limit),
  })
}
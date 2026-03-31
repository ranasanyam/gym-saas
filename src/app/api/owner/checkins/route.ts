// src/app/api/owner/checkins/route.ts
// Lightweight endpoint polled by TodayCheckinsClient every 30 s.

import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma }           from "@/lib/prisma"
import { startOfDay, addDays } from "date-fns"

export async function GET(req: NextRequest) {
  try {
    const profileId = await resolveProfileId(req)
    if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const gymIdParams = searchParams.getAll("gymId")

    // Validate that requested gymIds belong to this owner
    const ownerGyms = await prisma.gym.findMany({
      where:  { ownerId: profileId, isActive: true },
      select: { id: true },
    })
    const validIds = ownerGyms.map(g => g.id)
    const gymIds   = gymIdParams.length
      ? gymIdParams.filter(id => validIds.includes(id))
      : validIds

    if (!gymIds.length) return NextResponse.json({ checkins: [], count: 0 })

    const todayStart = startOfDay(new Date())
    const todayEnd   = addDays(todayStart, 1)

    const [checkins, count] = await Promise.all([
      prisma.attendance.findMany({
        where:   { gymId: { in: gymIds }, checkInTime: { gte: todayStart, lt: todayEnd } },
        orderBy: { checkInTime: "desc" },
        take:    8,
        select: {
          id: true, checkInTime: true, checkOutTime: true,
          member: { select: { profile: { select: { fullName: true, avatarUrl: true } } } },
        },
      }),
      prisma.attendance.count({
        where: { gymId: { in: gymIds }, checkInTime: { gte: todayStart, lt: todayEnd } },
      }),
    ])

    return NextResponse.json({
      checkins: checkins.map(c => ({
        id:           c.id,
        checkInTime:  c.checkInTime.toISOString(),
        checkOutTime: c.checkOutTime?.toISOString() ?? null,
        member:       c.member,
      })),
      count,
    })
  } catch (err: any) {
    console.error("[checkins]", err?.message)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// src/app/api/member/meal-log/week/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, addDays, parseISO } from "date-fns"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const startDateParam = searchParams.get("startDate")

  const startDate = startDateParam ? parseISO(startDateParam) : new Date()
  const from = startOfDay(startDate)
  const to   = endOfDay(addDays(startDate, 6))

  const membership = await prisma.gymMember.findFirst({
    where: { profileId },
    select: { id: true },
  })
  if (!membership) return NextResponse.json({ success: true, data: [] })

  const logs = await prisma.mealLog.findMany({
    where: {
      memberId: membership.id,
      logDate:  { gte: from, lte: to },
    },
    orderBy: { takenAt: "asc" },
  })

  return NextResponse.json({ success: true, data: logs })
}

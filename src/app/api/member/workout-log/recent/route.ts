// src/app/api/member/workout-log/recent/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { subDays, startOfDay } from "date-fns"

const DAY_NUMBER_TO_NAME: Record<number, string> = {
  1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday",
  5: "Friday", 6: "Saturday", 7: "Sunday",
}

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const days = Math.min(parseInt(searchParams.get("days") ?? "7"), 90)

  const membership = await prisma.gymMember.findFirst({
    where: { profileId },
    select: { id: true },
  })
  if (!membership) return NextResponse.json({ success: true, data: [] })

  const since = startOfDay(subDays(new Date(), days - 1))

  const logs = await prisma.workoutLog.findMany({
    where: {
      memberId: membership.id,
      loggedAt: { gte: since },
    },
    include: {
      workoutPlan: { select: { id: true, title: true, goal: true, difficulty: true } },
    },
    orderBy: { loggedAt: "desc" },
  })

  const data = logs.map(log => ({
    ...log,
    scheduledDayName: log.dayNumber ? (DAY_NUMBER_TO_NAME[log.dayNumber] ?? log.notes ?? "Day") : (log.notes ?? "Day"),
  }))

  return NextResponse.json({ success: true, data })
}

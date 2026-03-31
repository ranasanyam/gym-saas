// src/app/owner/dashboard/_components/TodayCheckins.tsx
// Server wrapper: fetches initial data server-side, then hands off to client poller.

import { prisma } from "@/lib/prisma"
import { startOfDay, addDays } from "date-fns"
import { TodayCheckinsClient } from "./TodayCheckinsClient"

export async function TodayCheckins({ gymIds }: { gymIds: string[] }) {
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

  // Serialize dates so they can be passed to a client component
  const serialized = checkins.map(c => ({
    id:           c.id,
    checkInTime:  c.checkInTime.toISOString(),
    checkOutTime: c.checkOutTime?.toISOString() ?? null,
    member:       c.member,
  }))

  return (
    <TodayCheckinsClient
      initialCheckins={serialized}
      initialCount={count}
      gymIds={gymIds}
    />
  )
}

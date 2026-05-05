// src/app/api/push/inactive-members/route.ts
// Cron: run at 8:00 AM IST daily (02:30 UTC) → "30 2 * * *"
// Notifies trainers about assigned members who haven't checked in for 3+ days.

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPushToProfile } from "@/lib/push"
import { subDays, startOfDay } from "date-fns"

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (secret !== process.env.CRON_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now         = new Date()
  const threeDaysAgo = startOfDay(subDays(now, 3))

  // All active trainers who have at least one assigned member
  const trainers = await prisma.gymTrainer.findMany({
    where: { assignedMembers: { some: { status: "ACTIVE" } } },
    select: {
      profileId: true,
      gymId:     true,
      gym:       { select: { name: true } },
      assignedMembers: {
        where: { status: "ACTIVE" },
        select: {
          profile:         { select: { fullName: true } },
          lastCheckinDate: true,
        },
      },
    },
  })

  let notified = 0

  await Promise.allSettled(trainers.map(async trainer => {
    const inactive = trainer.assignedMembers.filter(m =>
      !m.lastCheckinDate || new Date(m.lastCheckinDate) < threeDaysAgo
    )
    if (inactive.length === 0) return

    const names = inactive.slice(0, 3).map(m => m.profile.fullName.split(" ")[0]).join(", ")
    const extra = inactive.length > 3 ? ` & ${inactive.length - 3} more` : ""
    const count = inactive.length

    await Promise.allSettled([
      sendPushToProfile(trainer.profileId, {
        title: `⚠️ ${count} Member${count > 1 ? "s" : ""} Inactive`,
        body:  `${names}${extra} haven't checked in for 3+ days at ${trainer.gym.name}. Time to reach out!`,
        url:   "/trainer/members",
        tag:   "inactive-members",
      }),
      prisma.notification.create({
        data: {
          profileId: trainer.profileId,
          gymId:     trainer.gymId,
          title:     `⚠️ ${count} Member${count > 1 ? "s" : ""} Inactive`,
          message:   `${names}${extra} haven't checked in for 3+ days at ${trainer.gym.name}.`,
          type:      "SYSTEM",
        },
      }),
    ])

    notified++
  }))

  return NextResponse.json({ notified, timestamp: now.toISOString() })
}

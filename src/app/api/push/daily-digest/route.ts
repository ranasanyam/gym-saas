// src/app/api/push/daily-digest/route.ts
// Called by a cron job at 22:00 IST (16:30 UTC) every day
// Sends each gym owner a daily summary push notification
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPushToProfile } from "@/lib/push"
import { startOfDay, endOfDay } from "date-fns"

export async function POST(req: NextRequest) {
  // Validate cron secret so random people can't trigger this
  const secret = req.headers.get("x-cron-secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now       = new Date()
  const dayStart  = startOfDay(now)
  const dayEnd    = endOfDay(now)

  // Get all active gym owners
  const owners = await prisma.profile.findMany({
    where: { role: "owner", ownedGyms: { some: { isActive: true } } },
    select: { id: true, fullName: true, ownedGyms: { where: { isActive: true }, select: { id: true, name: true } } },
  })

  let sent = 0
  await Promise.allSettled(
    owners.map(async owner => {
      const gymIds = owner.ownedGyms.map(g => g.id)
      if (!gymIds.length) return

      const [todayRevenue, todaySupplementRevenue, todayAttendance, todayNewMembers, expiringMembers] =
        await Promise.all([
          prisma.payment.aggregate({
            where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: dayStart, lte: dayEnd } },
            _sum: { amount: true },
          }),
          prisma.supplementSale.aggregate({
            where: { gymId: { in: gymIds }, soldAt: { gte: dayStart, lte: dayEnd } },
            _sum: { totalAmount: true },
          }),
          prisma.attendance.count({
            where: { gymId: { in: gymIds }, checkInTime: { gte: dayStart, lte: dayEnd } },
          }),
          prisma.gymMember.count({
            where: { gymId: { in: gymIds }, createdAt: { gte: dayStart, lte: dayEnd } },
          }),
          prisma.gymMember.count({
            where: {
              gymId: { in: gymIds }, status: "ACTIVE",
              endDate: { gte: now, lte: new Date(now.getTime() + 7 * 86400000) },
            },
          }),
        ])

      const membershipRev = Number(todayRevenue._sum?.amount ?? 0)
      const suppRev       = Number(todaySupplementRevenue._sum?.totalAmount ?? 0)
      const totalRev      = membershipRev + suppRev
      const gymName       = owner.ownedGyms.length === 1 ? owner.ownedGyms[0].name : "your gyms"

      const lines = [
        `💰 Revenue: ₹${totalRev.toLocaleString("en-IN")}`,
        `👥 Attendance: ${todayAttendance} members`,
        todayNewMembers > 0 ? `🎉 New members: ${todayNewMembers}` : null,
        expiringMembers > 0 ? `⚠️ Expiring soon: ${expiringMembers}` : null,
      ].filter(Boolean).join("\n")

      await sendPushToProfile(owner.id, {
        title: `📊 Daily Summary — ${gymName}`,
        body:  lines,
        url:   "/owner/dashboard",
        tag:   "daily-digest",
      })
      sent++
    })
  )

  return NextResponse.json({ sent })
}
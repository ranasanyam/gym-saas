// src/app/api/push/expiry-alerts/route.ts
// Cron: run at 9:00 AM IST daily (03:30 UTC)  →  "0 3 * * *" in vercel.json
// Sends tiered expiry alerts: same-day, 3-day, 7-day

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPushToProfile } from "@/lib/push"
import { startOfDay, endOfDay, addDays } from "date-fns"

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (secret !== process.env.CRON_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now        = new Date()
  const todayStart = startOfDay(now)
  const todayEnd   = endOfDay(now)
  const in3Days    = endOfDay(addDays(now, 3))
  const in7Days    = endOfDay(addDays(now, 7))

  // Fetch all owners with active gyms
  const owners = await prisma.profile.findMany({
    where: { role: "owner", ownedGyms: { some: { isActive: true } } },
    select: {
      id:       true,
      fullName: true,
      ownedGyms: { where: { isActive: true }, select: { id: true, name: true } },
    },
  })

  let notified = 0

  await Promise.allSettled(owners.map(async owner => {
    const gymIds  = owner.ownedGyms.map(g => g.id)
    const gymName = owner.ownedGyms.length === 1 ? owner.ownedGyms[0].name : "your gyms"
    if (!gymIds.length) return

    // ── Same-day expiries ─────────────────────────────────────────────────
    const expiringToday = await prisma.gymMember.findMany({
      where:  { gymId: { in: gymIds }, status: "ACTIVE", endDate: { gte: todayStart, lte: todayEnd } },
      select: { id: true, profile: { select: { fullName: true, id: true } } },
      take:   10,
    })

    if (expiringToday.length > 0) {
      const names = expiringToday.map(m => m.profile.fullName.split(" ")[0]).slice(0, 3).join(", ")
      const extra = expiringToday.length > 3 ? ` & ${expiringToday.length - 3} more` : ""

      // Push to owner
      await sendPushToProfile(owner.id, {
        title: `⚠️ Memberships Expiring Today!`,
        body:  `Today is the last day for ${names}${extra} at ${gymName}. Collect dues now!`,
        url:   "/owner/members?filter=expiring",
        tag:   "expiry-today",
      }).catch(() => {})

      // In-app notification
      await prisma.notification.create({
        data: {
          profileId: owner.id,
          title:     `⚠️ Memberships Expiring Today`,
          message:   `Today is the last day for ${names}${extra} at ${gymName}. Check their payment status now.`,
          type:      "BILLING",
        },
      }).catch(() => {})

      // Also notify the members themselves
      await Promise.allSettled(expiringToday.map(m =>
        sendPushToProfile(m.profile.id, {
          title: "⏰ Membership Expires Today!",
          body:  `Your membership at ${gymName} expires today. Contact your gym to renew.`,
          url:   "/member/dashboard",
          tag:   "membership-expiry",
        })
      ))

      notified++
    }

    // ── 3-day expiries (skip if already handled today) ────────────────────
    const expiring3 = await prisma.gymMember.findMany({
      where: {
        gymId:   { in: gymIds },
        status:  "ACTIVE",
        endDate: { gt: todayEnd, lte: in3Days },
      },
      select: { id: true, profile: { select: { fullName: true } } },
      take:   10,
    })

    if (expiring3.length > 0) {
      await sendPushToProfile(owner.id, {
        title: `📋 ${expiring3.length} Membership${expiring3.length > 1 ? "s" : ""} Expiring in 3 Days`,
        body:  `${expiring3.length} membership${expiring3.length > 1 ? "s" : ""} expiring soon at ${gymName}. Prepare for collections.`,
        url:   "/owner/members?filter=expiring",
        tag:   "expiry-3day",
      }).catch(() => {})

      await prisma.notification.create({
        data: {
          profileId: owner.id,
          title:     `📋 ${expiring3.length} Memberships Expiring in 3 Days`,
          message:   `${expiring3.map(m => m.profile.fullName).join(", ")} — prepare for collections at ${gymName}.`,
          type:      "BILLING",
        },
      }).catch(() => {})

      notified++
    }

    // ── 7-day expiries (send if no 3-day trigger) ─────────────────────────
    if (expiring3.length === 0) {
      const expiring7 = await prisma.gymMember.findMany({
        where: {
          gymId:   { in: gymIds },
          status:  "ACTIVE",
          endDate: { gt: in3Days, lte: in7Days },
        },
        select: { profile: { select: { fullName: true } } },
        take:   10,
      })

      if (expiring7.length > 0) {
        await sendPushToProfile(owner.id, {
          title: `🔔 ${expiring7.length} Membership${expiring7.length > 1 ? "s" : ""} Expiring This Week`,
          body:  `${expiring7.length} member${expiring7.length > 1 ? "s" : ""} expiring within 7 days at ${gymName}.`,
          url:   "/owner/members?filter=expiring",
          tag:   "expiry-7day",
        }).catch(() => {})

        notified++
      }
    }
  }))

  return NextResponse.json({ notified, timestamp: now.toISOString() })
}
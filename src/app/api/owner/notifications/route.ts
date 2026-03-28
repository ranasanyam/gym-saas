
// src/app/api/owner/notifications/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { getOwnerSubscription, getOwnerUsage, checkLimit } from "@/lib/subscription"
import { sendPushToProfiles } from "@/lib/push";

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const gymId = new URL(req.url).searchParams.get("gymId")
  const gyms = await prisma.gym.findMany({ where: { ownerId: profileId }, select: { id: true } })
  const gymIds = gymId ? [gymId] : gyms.map(g => g.id)
  const announcements = await prisma.announcement.findMany({
    where: { gymId: { in: gymIds } },
    include: { author: { select: { fullName: true } }, gym: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(announcements)
}

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { gymId, title, body, targetRole, expiresAt } = await req.json()

    if (!gymId || !title?.trim() || !body?.trim())
      return NextResponse.json({ error: "gymId, title and body are required" }, { status: 400 })

    const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: profileId } })
    if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

    // ── Subscription check ────────────────────────────────────────────────
    const [sub, usage] = await Promise.all([
      getOwnerSubscription(profileId),
      getOwnerUsage(profileId),
    ])

    if (!sub || sub.isExpired) {
      return NextResponse.json(
        { error: "Your subscription has expired. Please renew to send notifications.", upgradeRequired: true },
        { status: 403 }
      )
    }

    const check = checkLimit(usage.notificationsThisMonth, sub.limits.maxNotificationsPerMonth, "notifications this month")
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason, upgradeRequired: true }, { status: 403 })
    }

    // ── 1. Create announcement record ─────────────────────────────────────
    const announcement = await prisma.announcement.create({
      data: {
        gymId,
        authorId: profileId,
        title: title.trim(),
        body: body.trim(),
        targetRole: targetRole || null,
        publishedAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    // ── 2. Collect recipient profileIds ───────────────────────────────────
    const recipientIds: string[] = []
    const sendToMembers = !targetRole || targetRole === "MEMBER"
    const sendToTrainers = !targetRole || targetRole === "TRAINER"

    if (sendToMembers) {
      const members = await prisma.gymMember.findMany({
        where: { gymId, status: "ACTIVE" }, select: { profileId: true },
      })
      members.forEach(m => { if (!recipientIds.includes(m.profileId)) recipientIds.push(m.profileId) })
    }
    if (sendToTrainers) {
      const trainers = await prisma.gymTrainer.findMany({
        where: { gymId }, select: { profileId: true },
      })
      trainers.forEach(t => { if (!recipientIds.includes(t.profileId)) recipientIds.push(t.profileId) })
    }

    // ── 3. Create one Notification row per recipient ──────────────────────
    let notifCount = 0
    if (recipientIds.length > 0) {
      await prisma.$transaction(
        recipientIds.map(profileId =>
          prisma.notification.create({
            data: { profileId, gymId, title: title.trim(), message: body.trim(), type: "ANNOUNCEMENT" },
          })
        )
      )
      notifCount = recipientIds.length
    }

    // ── 4. Send push notification to all recipients ──────────────────────
    if (recipientIds.length > 0) {
      // Fire-and-forget — don't block the response
      sendPushToProfiles([...new Set(recipientIds)], {
        title:     title.trim(),
        body:      body.trim(),
        url:       "/member/notifications",
        tag:       `announcement-${announcement.id}`,
        channelId: "default",
      }).catch(err => console.warn("[Push] Announcement push failed:", err))
    }

    return NextResponse.json({ ...announcement, recipientCount: notifCount }, { status: 201 })
  } catch (error) {
    console.error("Notification send error:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await prisma.announcement.deleteMany({ where: { id, gym: { ownerId: profileId } } })
  return NextResponse.json({ success: true })
}
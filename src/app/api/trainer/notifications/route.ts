// src/app/api/trainer/notifications/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { sendPushToProfiles } from "@/lib/push"

// GET — inbox (received) + sent announcements
export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const type = new URL(req.url).searchParams.get("type") // "inbox" | "sent"

  if (type === "inbox") {
    const page  = parseInt(new URL(req.url).searchParams.get("page") ?? "1")
    const limit = 20
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { profileId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: { profileId } }),
    ])
    return NextResponse.json({ notifications, total, pages: Math.ceil(total / limit) })
  }

  // Default: sent announcements
  const announcements = await prisma.announcement.findMany({
    where: { authorId: profileId },
    include: { author: { select: { fullName: true } }, gym: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(announcements)
}

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { title, body, expiresAt } = await req.json()

    if (!title?.trim() || !body?.trim())
      return NextResponse.json({ error: "Title and body are required" }, { status: 400 })

    // Find trainer's gym
    const gymTrainer = await prisma.gymTrainer.findFirst({
      where: { profileId },
      select: { gymId: true },
    })
    if (!gymTrainer) return NextResponse.json({ error: "Trainer gym not found" }, { status: 404 })

    const gymId = gymTrainer.gymId

    // Create announcement
    const announcement = await prisma.announcement.create({
      data: {
        gymId,
        authorId: profileId,
        title: title.trim(),
        body: body.trim(),
        targetRole: "MEMBER",
        publishedAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    // Collect assigned members only
    const assignedMembers = await prisma.gymMember.findMany({
      where: { gymId, assignedTrainerId: profileId, status: "ACTIVE" },
      select: { profileId: true },
    })
    const recipientIds = [...new Set(assignedMembers.map(m => m.profileId))]

    if (recipientIds.length > 0) {
      await prisma.$transaction(
        recipientIds.map(rpId =>
          prisma.notification.create({
            data: { profileId: rpId, gymId, title: title.trim(), message: body.trim(), type: "ANNOUNCEMENT" },
          })
        )
      )

      sendPushToProfiles(recipientIds, {
        title:     title.trim(),
        body:      body.trim(),
        url:       "/member/notifications",
        tag:       `announcement-${announcement.id}`,
        channelId: "default",
      }).catch(err => console.warn("[Push] Trainer announcement push failed:", err))
    }

    return NextResponse.json({ ...announcement, recipientCount: recipientIds.length }, { status: 201 })
  } catch (error) {
    console.error("Trainer notification send error:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { markAllRead, notificationId } = await req.json()
  if (markAllRead) {
    await prisma.notification.updateMany({ where: { profileId }, data: { isRead: true } })
  } else if (notificationId) {
    await prisma.notification.updateMany({ where: { id: notificationId, profileId }, data: { isRead: true } })
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await prisma.announcement.deleteMany({ where: { id, authorId: profileId } })
  return NextResponse.json({ success: true })
}

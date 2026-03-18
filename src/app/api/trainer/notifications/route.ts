
// src/app/api/trainer/notifications/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const page  = parseInt(new URL(req.url).searchParams.get("page") ?? "1")
  const limit = 20
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { profileId: profileId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where: { profileId: profileId } }),
  ])
  return NextResponse.json({ notifications, total, pages: Math.ceil(total / limit) })
}

export async function PATCH(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { markAllRead, notificationId } = await req.json()
  if (markAllRead) {
    await prisma.notification.updateMany({ where: { profileId: profileId }, data: { isRead: true } })
  } else if (notificationId) {
    await prisma.notification.updateMany({ where: { id: notificationId, profileId: profileId }, data: { isRead: true } })
  }
  return NextResponse.json({ success: true })
}
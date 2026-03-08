// src/app/api/member/notifications/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get("unreadOnly") === "true"
  const page  = parseInt(searchParams.get("page") ?? "1")
  const limit = 20

  const where = {
    profileId: session.user.id,
    ...(unreadOnly ? { isRead: false } : {}),
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        createdAt: true,
        gym: { select: { name: true } },
      },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { profileId: session.user.id, isRead: false } }),
  ])

  return NextResponse.json({ notifications, total, pages: Math.ceil(total / limit), unreadCount })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  await prisma.notification.updateMany({
    where: {
      profileId: session.user.id,
      ...(body.id ? { id: body.id } : {}),
    },
    data: { isRead: true },
  })

  return NextResponse.json({ success: true })
}
// src/app/api/owner/attendance/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const gymId = searchParams.get("gymId")
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0]
  const page = parseInt(searchParams.get("page") ?? "1")

  const gyms = await prisma.gym.findMany({ where: { ownerId: session.user.id }, select: { id: true } })
  const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

  const dayStart = new Date(date + "T00:00:00.000Z")
  const dayEnd   = new Date(date + "T23:59:59.999Z")

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where: { gymId: { in: gymIds }, checkInTime: { gte: dayStart, lte: dayEnd } },
      orderBy: { checkInTime: "desc" },
      skip: (page - 1) * 20, take: 20,
      include: {
        member: { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
        gym: { select: { name: true } },
      },
    }),
    prisma.attendance.count({ where: { gymId: { in: gymIds }, checkInTime: { gte: dayStart, lte: dayEnd } } }),
  ])
  return NextResponse.json({ records, total })
}
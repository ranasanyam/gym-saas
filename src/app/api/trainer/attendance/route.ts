// src/app/api/trainer/attendance/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const trainer = await prisma.gymTrainer.findUnique({
    where: { profileId: profileId },
    select: { id: true, gymId: true },
  })
  if (!trainer) return NextResponse.json({ error: "Trainer not found" }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get("date") ?? new Date().toISOString().split("T")[0]
  const date = new Date(dateStr)
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0)
  const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999)

  const memberIds = (await prisma.gymMember.findMany({
    where: { assignedTrainerId: trainer.id },
    select: { id: true },
  })).map(m => m.id)

  const [records, members] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        gymId: trainer.gymId,
        memberId: { in: memberIds },
        checkInTime: { gte: dayStart, lte: dayEnd },
      },
      include: {
        member: { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
      },
      orderBy: { checkInTime: "desc" },
    }),
    prisma.gymMember.findMany({
      where: { assignedTrainerId: trainer.id, status: "ACTIVE" },
      include: { profile: { select: { fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ])

  return NextResponse.json({ records, members })
}

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const trainer = await prisma.gymTrainer.findUnique({
    where: { profileId: profileId },
    select: { id: true, gymId: true },
  })
  if (!trainer) return NextResponse.json({ error: "Trainer not found" }, { status: 404 })

  const { memberId, checkInTime, checkOutTime } = await req.json()
  if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 })

  // Verify this member is assigned to this trainer
  const member = await prisma.gymMember.findFirst({
    where: { id: memberId, assignedTrainerId: trainer.id },
  })
  if (!member) return NextResponse.json({ error: "Member not assigned to you" }, { status: 403 })

  const record = await prisma.attendance.create({
    data: {
      gymId:       trainer.gymId,
      memberId,
      checkInTime:  checkInTime  ? new Date(checkInTime)  : new Date(),
      checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
      method: "MANUAL",
    },
  })
  return NextResponse.json(record, { status: 201 })
}
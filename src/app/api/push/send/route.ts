// src/app/api/push/send/route.ts  — manual push send (owner can send to members)
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendPushToProfiles } from "@/lib/push"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { gymId, title, body, targetRole, url } = await req.json()
  if (!gymId || !title || !body)
    return NextResponse.json({ error: "gymId, title, body required" }, { status: 400 })

  const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: session.user.id } })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  const profileIds: string[] = []
  if (!targetRole || targetRole === "MEMBER") {
    const members = await prisma.gymMember.findMany({ where: { gymId, status: "ACTIVE" }, select: { profileId: true } })
    members.forEach(m => profileIds.push(m.profileId))
  }
  if (!targetRole || targetRole === "TRAINER") {
    const trainers = await prisma.gymTrainer.findMany({ where: { gymId }, select: { profileId: true } })
    trainers.forEach(t => { if (!profileIds.includes(t.profileId)) profileIds.push(t.profileId) })
  }

  await sendPushToProfiles([...new Set(profileIds)], { title, body, url: url ?? "/member/notifications" })

  return NextResponse.json({ sent: profileIds.length })
}
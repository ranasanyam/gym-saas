// src/app/api/push/send/route.ts  — manual push send (owner can send to members)
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { sendPushToProfiles } from "@/lib/push"

export async function POST(req: NextRequest) {
  // const session = await auth()
  // if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const profileId = await resolveProfileId(req);
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gymId, title, body, targetRole, url } = await req.json()
  if (!gymId || !title?.trim() || !body?.trim())
    return NextResponse.json({ error: "gymId, title, body required" }, { status: 400 })


  // verify caller owns this gym
  const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: profileId } })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })


  // collect recipient profileIds
  const profileIds: string[] = []
  if (!targetRole || targetRole === "MEMBER") {
    const members = await prisma.gymMember.findMany({ where: { gymId, status: "ACTIVE" }, select: { profileId: true } })
    // members.forEach(m => profileIds.push(m.profileId))
    members.forEach(m => { if (!profileIds.includes(m.profileId)) profileIds.push(m.profileId) })
  }
  if (!targetRole || targetRole === "TRAINER") {
    const trainers = await prisma.gymTrainer.findMany({ where: { gymId }, select: { profileId: true } })
    trainers.forEach(t => { if (!profileIds.includes(t.profileId)) profileIds.push(t.profileId) })
  }

  const unique = [...new Set(profileIds)]
  if (!unique.length) return NextResponse.json({ sent: 0 });


  // save an in app notification row for every recipient

  await prisma.$transaction(
    unique.map(pid => 
      prisma.notification.create({
        data: {
          profileId: pid,
          gymId,
          title: title.trim(),
          message: body.trim(),
          type: "ANNOUNCEMENT"
        }
      })
    )
  )

  // send push notification (fire-and-forget - don't block response)

  sendPushToProfiles(unique, {
    title,
    body,
    url: url ?? '/member/notifications',
    channelId:'default'
  }).catch(err => console.warn('[Push/Send] Push delivery error:', err)); 



  return NextResponse.json({ sent: unique.length })
}
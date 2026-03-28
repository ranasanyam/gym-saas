// src/app/api/debug/push/route.ts
// TEMPORARY debug endpoint — DELETE this file after testing is done.
// Usage: GET /api/debug/push?gymId=YOUR_GYM_ID
// Shows exactly what the push send code sees — members, tokens, and a test send.

import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId }          from "@/lib/mobileAuth"
import { prisma }                     from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const gymId = new URL(req.url).searchParams.get("gymId")
  if (!gymId) return NextResponse.json({ error: "gymId required" }, { status: 400 })

  // 1. Verify gym ownership
  const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: profileId } })
  if (!gym) return NextResponse.json({ error: "Gym not found or not yours" }, { status: 404 })

  // 2. Active members in this gym
  const activeMembers = await prisma.gymMember.findMany({
    where:  { gymId, status: "ACTIVE" },
    select: { profileId: true, profile: { select: { fullName: true, email: true } } },
  })

  // 3. All push subscriptions for those member profileIds
  const memberProfileIds = activeMembers.map(m => m.profileId)
  const pushSubs = memberProfileIds.length > 0
    ? await prisma.pushSubscription.findMany({
        where:  { profileId: { in: memberProfileIds } },
        select: { profileId: true, endpoint: true, createdAt: true },
      })
    : []

  // 4. Build per-member report
  const report = activeMembers.map(m => {
    const subs = pushSubs.filter(s => s.profileId === m.profileId)
    return {
      profileId:    m.profileId,
      name:         m.profile.fullName,
      email:        m.profile.email,
      hasPushToken: subs.length > 0,
      pushTokens:   subs.map(s => ({
        type:      s.endpoint.startsWith("expo:") ? "expo"
                 : s.endpoint.startsWith("fcm:")  ? "fcm-legacy"
                 : "web-push",
        endpoint:  s.endpoint.slice(0, 60) + "...",
        createdAt: s.createdAt,
      })),
    }
  })

  const withToken    = report.filter(r => r.hasPushToken).length
  const withoutToken = report.filter(r => !r.hasPushToken).length

  return NextResponse.json({
    gym:           { id: gym.id, name: gym.name },
    totalMembers:  activeMembers.length,
    withPushToken: withToken,
    withoutToken,
    warning: withoutToken > 0
      ? `${withoutToken} member(s) have no push token — they will NOT receive notifications`
      : "All members have push tokens ✅",
    members: report,
  })
}

// POST — send a real test push to yourself (the owner) to verify end-to-end delivery
export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { sendPushToProfile } = await import("@/lib/push")

  const subs = await prisma.pushSubscription.findMany({
    where:  { profileId },
    select: { endpoint: true },
  })

  if (!subs.length) {
    return NextResponse.json({
      error: "No push token found for your account. Log in on the mobile app first so the token gets registered.",
    }, { status: 404 })
  }

  await sendPushToProfile(profileId, {
    title:     "✅ Test Push",
    body:      "Push notifications are working correctly!",
    url:       "/owner/notifications",
    channelId: "default",
  })

  return NextResponse.json({
    success: true,
    message: `Test push sent to ${subs.length} subscription(s)`,
    tokens:  subs.map(s => s.endpoint.slice(0, 60) + "..."),
  })
}
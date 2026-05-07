// src/app/api/member/supplements/request/route.ts
// Member taps "Request to Buy" on a supplement → sends push + in-app notification to the gym owner.
import { NextRequest, NextResponse }  from "next/server"
import { resolveProfileId }           from "@/lib/mobileAuth"
import { prisma }                     from "@/lib/prisma"
import { sendPushToProfile }          from "@/lib/push"

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { supplementId?: string }
  try { body = await req.json() } catch { body = {} }

  const { supplementId } = body
  if (!supplementId) return NextResponse.json({ error: "supplementId is required" }, { status: 400 })

  // Fetch supplement + gym owner in one query
  const supplement = await prisma.supplement.findUnique({
    where:  { id: supplementId },
    select: {
      id:   true,
      name: true,
      gym:  { select: { id: true, name: true, ownerId: true } },
    },
  })
  if (!supplement) return NextResponse.json({ error: "Supplement not found" }, { status: 404 })

  // Verify the member actually belongs to this gym
  const membership = await prisma.gymMember.findFirst({
    where:  { profileId, gymId: supplement.gym.id, status: "ACTIVE" },
    select: { id: true },
  })
  if (!membership) return NextResponse.json({ error: "Not a member of this gym" }, { status: 403 })

  // Fetch member profile details for the notification
  const profile = await prisma.profile.findUnique({
    where:  { id: profileId },
    select: { fullName: true, mobileNumber: true, avatarUrl: true },
  })
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const memberName   = profile.fullName   ?? "A member"
  const mobileNumber = profile.mobileNumber ?? "N/A"
  const ownerId      = supplement.gym.ownerId

  await Promise.allSettled([
    // In-app notification for owner
    prisma.notification.create({
      data: {
        profileId: ownerId,
        gymId:     supplement.gym.id,
        title:     "Supplement Purchase Request",
        message:   `${memberName} (${mobileNumber}) wants to buy ${supplement.name}.`,
        type:      "BILLING",
      },
    }),
    // Push notification to owner
    sendPushToProfile(ownerId, {
      title: "Supplement Purchase Request",
      body:  `${memberName} (${mobileNumber}) wants to buy ${supplement.name}.`,
      url:   "/owner/supplements",
      tag:   `supp-request-${supplementId}-${profileId}`,
      icon:  profile.avatarUrl ?? undefined,
    }),
  ])

  return NextResponse.json({ success: true })
}

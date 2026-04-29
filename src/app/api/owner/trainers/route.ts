// src/app/api/owner/trainers/route.ts
import { NextRequest, NextResponse }   from "next/server"
import { resolveProfileId }            from "@/lib/mobileAuth"
import { requireActivePlan } from "@/lib/requireActivePlan"
import { prisma }                      from "@/lib/prisma"
import { getOwnerSubscription, getOwnerUsage, checkLimit } from "@/lib/subscription"
import { resolveInvitedProfile, findExistingGymTrainer, notifyLinkedProfile } from "@/lib/inviteHelpers"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response

  const { searchParams } = new URL(req.url)
  const gymId = searchParams.get("gymId")

  const gyms = await prisma.gym.findMany({ where: { ownerId: profileId }, select: { id: true } })
  const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

  const trainers = await prisma.gymTrainer.findMany({
    where: { gymId: { in: gymIds } },
    include: {
      profile: { select: { fullName: true, email: true, mobileNumber: true, avatarUrl: true, status: true } },
      gym:     { select: { name: true } },
      _count:  { select: { assignedMembers: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(trainers)
}

// ── POST ──────────────────────────────────────────────────────────────────────
// Accepts: { gymId, fullName, mobileNumber, bio?, experienceYears?, specializations?, certifications? }
// Email / password collected via /complete-profile after SMS invite.
export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response


  // ── Subscription check ────────────────────────────────────────────────────
  const [sub, usage] = await Promise.all([
    getOwnerSubscription(profileId),
    getOwnerUsage(profileId),
  ])

  if (!sub || sub.isExpired) {
    return NextResponse.json(
      { error: "Your subscription has expired. Please renew to add trainers.", upgradeRequired: true },
      { status: 403 }
    )
  }

  const check = checkLimit(usage.trainers, sub.limits.maxTrainers, "trainers")
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason, upgradeRequired: true }, { status: 403 })
  }

  const body = await req.json()
  const { gymId, fullName, mobileNumber, bio, experienceYears, specializations, certifications, email, gender, dateOfBirth, address, avatarUrl } = body

  if (!gymId)              return NextResponse.json({ error: "Gym is required" },              { status: 400 })
  if (!fullName?.trim())   return NextResponse.json({ error: "Full name is required" },        { status: 400 })
  if (!mobileNumber?.trim()) return NextResponse.json({ error: "Mobile number is required" }, { status: 400 })

  const gym = await prisma.gym.findFirst({
    where:  { id: gymId, ownerId: profileId },
    select: { id: true, name: true },
  })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  // ── Resolve profile ───────────────────────────────────────────────────────
  let result: Awaited<ReturnType<typeof resolveInvitedProfile>>
  try {
    result = await resolveInvitedProfile("trainer", gymId, gym.name, fullName.trim(), mobileNumber.trim())
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  const { outcome, profileId: trainerProfileId } = result

  // Check if already a trainer at THIS gym
  const existing = await findExistingGymTrainer(trainerProfileId, gymId)
  if (existing) {
    return NextResponse.json({ error: "This person is already a trainer at this gym" }, { status: 409 })
  }

  // ── Create GymTrainer record ──────────────────────────────────────────────
  const trainer = await prisma.gymTrainer.create({
    data: {
      gymId,
      profileId:       trainerProfileId,
      specializations: specializations ?? [],
      certifications:  certifications  ?? [],
      bio:             bio || null,
      experienceYears: experienceYears ?? 0,
    },
  })

  // For newly created profiles, store any optional profile fields provided by the owner
  if (outcome === "created" && (email || gender || dateOfBirth || address || avatarUrl)) {
    await prisma.profile.update({
      where: { id: trainerProfileId },
      data: {
        email:       email?.toLowerCase().trim() || null,
        gender:      gender || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address:     address?.trim() || null,
        avatarUrl:   avatarUrl || null,
      },
    }).catch(() => {})
  }

  if (outcome === "linked") {
    await notifyLinkedProfile(trainerProfileId, gymId, gym.name, "trainer")
  }

  return NextResponse.json({ outcome, id: trainer.id, profileId: trainerProfileId }, { status: 201 })
}
// src/lib/inviteHelpers.ts
// Shared logic for owner adding a member or trainer (name + mobile only).
// Handles all 4 cases:
//   1. New to GymStack           → create INVITED profile + send SMS
//   2. Existing INVITED profile  → attach to gym + resend SMS
//   3. Existing ACTIVE profile, not in this gym → attach silently + in-app notification
//   4. Existing ACTIVE profile, already in this gym → skip (no-op)

import crypto      from "crypto"
import { prisma }  from "@/lib/prisma"
import { inviteProfile, createInviteToken, sendInviteSms } from "@/lib/invite"

export type InviteResult =
  | { outcome: "created";         profileId: string }
  | { outcome: "reinvited";       profileId: string }
  | { outcome: "linked";          profileId: string }
  | { outcome: "already_member";  profileId: string }

function normaliseMobile(raw: string): string {
  return raw.replace(/\D/g, "").slice(-10)
}

function generateReferralCode(name: string): string {
  const base   = name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) || "GYM"
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${base}${suffix}`
}

/**
 * Resolves which profile to attach, creates one if needed, and handles SMS.
 * Does NOT create the GymMember / GymTrainer record — caller does that.
 *
 * @param role   "member" | "trainer"
 * @param gymId  Target gym
 * @param gymName  For SMS message
 * @param fullName
 * @param mobileNumber  Raw mobile string (digits extracted inside)
 */
export async function resolveInvitedProfile(
  role: "member" | "trainer",
  gymId: string,
  gymName: string,
  fullName: string,
  mobileNumber: string,
): Promise<InviteResult> {
  const mobile = normaliseMobile(mobileNumber)
  if (mobile.length !== 10) throw new Error("Invalid mobile number — must be 10 digits")

  // Check for existing profile by mobile
  const existing = await prisma.profile.findFirst({
    where:  { mobileNumber: { endsWith: mobile } },
    select: { id: true, status: true, fullName: true, mobileNumber: true },
  })

  if (!existing) {
    // ── Case 1: Brand-new user ──────────────────────────────────────────────
    const profileId = await prisma.$transaction(async (tx) => {
      const p = await tx.profile.create({
        data: {
          userId:       crypto.randomUUID(),
          fullName:     fullName.trim(),
          mobileNumber: mobile,
          email:        null,
          passwordHash: null,
          status:       "INVITED",
          role,
        },
      })
      // Wallet + referral created when profile is activated (complete-profile)
      return p.id
    })
    await inviteProfile(profileId, mobile, fullName.trim(), gymId, gymName)
    return { outcome: "created", profileId }
  }

  if (existing.status === "INVITED") {
    // ── Case 2: Already INVITED (maybe by another gym) ─────────────────────
    // Resend SMS with a fresh token
    const token = await createInviteToken(existing.id, gymId, gymName)
    const mob   = existing.mobileNumber ?? mobile
    await sendInviteSms(mob, existing.fullName, gymName, token)
    return { outcome: "reinvited", profileId: existing.id }
  }

  // ACTIVE profile below this point ─────────────────────────────────────────
  return { outcome: "linked", profileId: existing.id }
}

/**
 * After resolveInvitedProfile, check if member already exists in this gym.
 * Returns the existing GymMember id if found, null otherwise.
 */
export async function findExistingGymMember(profileId: string, gymId: string): Promise<string | null> {
  const m = await prisma.gymMember.findFirst({
    where:  { profileId, gymId },
    select: { id: true },
  })
  return m?.id ?? null
}

export async function findExistingGymTrainer(profileId: string, gymId: string): Promise<string | null> {
  const t = await prisma.gymTrainer.findFirst({
    where:  { profileId, gymId },
    select: { id: true },
  })
  return t?.id ?? null
}

/**
 * Sends an in-app notification to an ACTIVE profile being silently linked.
 */
export async function notifyLinkedProfile(profileId: string, gymId: string, gymName: string, role: string): Promise<void> {
  await prisma.notification.create({
    data: {
      gymId,
      profileId,
      title:   `You've been added to ${gymName}`,
      message: `${gymName} has added you as a ${role}. Visit your dashboard to see your gym.`,
      type:    "ANNOUNCEMENT",
    },
  }).catch(() => {})
}

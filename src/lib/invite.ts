// src/lib/invite.ts
// Helpers for creating InviteTokens and sending the SMS invite.

import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { sendSms } from "@/lib/sms"

const APP_URL = process.env.NEXTAUTH_URL ?? "https://gymstack.app"
const INVITE_TTL_DAYS = 30

export function generateToken(): string {
  return crypto.randomBytes(24).toString("hex")  // 48-char hex string
}

/**
 * Creates a fresh InviteToken for the given profile (invalidates old ones).
 * Returns the raw token string.
 */
export async function createInviteToken(profileId: string, gymId?: string, gymName?: string): Promise<string> {
  // Soft-expire any existing tokens for this profile
  await prisma.inviteToken.updateMany({
    where:  { profileId, usedAt: null },
    data:   { expiresAt: new Date() },
  })

  const token     = generateToken()
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000)

  await prisma.inviteToken.create({
    data: { profileId, gymId: gymId ?? null, gymName: gymName ?? null, token, expiresAt },
  })

  return token
}

/**
 * Sends the SMS invite to the given mobile number.
 */
export async function sendInviteSms(mobile: string, name: string, gymName: string, token: string): Promise<void> {
  const link = `${APP_URL}/complete-profile?token=${token}`
  const message = `Hi ${name.split(" ")[0]}, ${gymName} has added you to GymStack. Complete your profile to get started: ${link}`
  await sendSms({ to: mobile, message })
}

/**
 * Full flow: create token + send SMS.
 */
export async function inviteProfile(profileId: string, mobile: string, name: string, gymId: string, gymName: string): Promise<void> {
  const token = await createInviteToken(profileId, gymId, gymName)
  await sendInviteSms(mobile, name, gymName, token)
}

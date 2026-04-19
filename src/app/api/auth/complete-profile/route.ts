// src/app/api/auth/complete-profile/route.ts
// POST — activates an INVITED profile by setting email + password.
//
// Two verification paths:
//  A) Token path: { token, email, password, city?, gender? }
//  B) Email OTP path: { mobile, email, otp, password, city?, gender? }
//
// In both cases the existing INVITED Profile is UPDATED — never a new one created.

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import crypto from "crypto"

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex")
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token, mobile, email, otp, password, city, gender } = body

  if (!email?.trim() || !password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  const normalEmail = email.trim().toLowerCase()

  // ── Check email not already taken by an ACTIVE profile ───────────────────
  const emailConflict = await prisma.profile.findFirst({
    where:  { email: normalEmail, NOT: { status: "INVITED" } },
    select: { id: true },
  })
  if (emailConflict) {
    return NextResponse.json({ error: "This email is already registered. Please use a different email or log in." }, { status: 409 })
  }

  let profileId: string

  if (token) {
    // ── PATH A: Invite token ─────────────────────────────────────────────────
    const invite = await prisma.inviteToken.findUnique({
      where:   { token },
      include: { profile: { select: { id: true, status: true } } },
    })
    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired invite link. Request a new one from your gym." }, { status: 400 })
    }
    if (invite.profile.status !== "INVITED") {
      return NextResponse.json({ error: "This profile is already activated. Please log in." }, { status: 409 })
    }
    profileId = invite.profile.id

    // Mark token as used
    await prisma.inviteToken.update({ where: { token }, data: { usedAt: new Date() } })

  } else if (mobile && otp) {
    // ── PATH B: Email OTP ────────────────────────────────────────────────────
    const normalMobile = mobile.replace(/\D/g, "").slice(-10)

    const profile = await prisma.profile.findFirst({
      where:  { mobileNumber: { endsWith: normalMobile }, status: "INVITED" },
      select: { id: true },
    })
    if (!profile) {
      return NextResponse.json({ error: "No invited account found for this mobile number" }, { status: 404 })
    }
    profileId = profile.id

    // Verify OTP
    const otpRecord = await prisma.emailOtp.findFirst({
      where:    { email: normalEmail },
      orderBy:  { createdAt: "desc" },
    })
    if (!otpRecord || otpRecord.verified || otpRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 })
    }
    if (otpRecord.otpHash !== hashOtp(otp.toString())) {
      await prisma.emailOtp.update({ where: { id: otpRecord.id }, data: { attempts: { increment: 1 } } })
      return NextResponse.json({ error: "Incorrect verification code" }, { status: 400 })
    }
    await prisma.emailOtp.update({ where: { id: otpRecord.id }, data: { verified: true } })

  } else {
    return NextResponse.json({ error: "Either token or (mobile + otp) is required" }, { status: 400 })
  }

  // ── Activate the profile ──────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(password, 12)

  const updated = await prisma.profile.update({
    where: { id: profileId },
    data: {
      email:        normalEmail,
      passwordHash,
      status:       "ACTIVE",
      city:         city?.trim()   || undefined,
      gender:       gender         || undefined,
    },
    select: { id: true, role: true, fullName: true },
  })

  // Create wallet + referral code if not yet created
  const [wallet, referral] = await Promise.all([
    prisma.wallet.findUnique({ where: { profileId }, select: { id: true } }),
    prisma.referralCode.findUnique({ where: { profileId }, select: { id: true } }),
  ])
  await Promise.all([
    !wallet  ? prisma.wallet.create({ data: { profileId } }) : null,
    !referral ? prisma.referralCode.create({
      data: { profileId, code: generateCode(updated.fullName) },
    }) : null,
  ])

  return NextResponse.json({ success: true, role: updated.role })
}

function generateCode(name: string): string {
  const base   = name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) || "GYM"
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${base}${suffix}`
}

// src/app/api/auth/request-completion-otp/route.ts
// POST — sends an email OTP to an INVITED user so they can verify email
//         during the complete-profile flow (alternative to token link).
//
// Body: { mobile: string, email: string }
// The mobile is used to find the INVITED profile, then we send OTP to email.

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { sendOtpEmail } from "@/lib/email"

async function hashOtp(otp: string): Promise<string> {
  return crypto.createHash("sha256").update(otp).digest("hex")
}

export async function POST(req: NextRequest) {
  const { mobile, email } = await req.json()

  if (!mobile || !email) {
    return NextResponse.json({ error: "mobile and email are required" }, { status: 400 })
  }

  const normalMobile = mobile.replace(/\D/g, "").slice(-10)

  // Find the INVITED profile by mobile
  const profile = await prisma.profile.findFirst({
    where:  { mobileNumber: { endsWith: normalMobile }, status: "INVITED" },
    select: { id: true, fullName: true, email: true },
  })

  if (!profile) {
    return NextResponse.json({ error: "No invited account found for this mobile number" }, { status: 404 })
  }

  // Check the email isn't already used by an ACTIVE profile
  const emailConflict = await prisma.profile.findFirst({
    where:  { email: email.toLowerCase().trim(), status: "ACTIVE" },
    select: { id: true },
  })
  if (emailConflict) {
    return NextResponse.json({ error: "This email is already registered. Please use a different email or log in." }, { status: 409 })
  }

  // Generate 6-digit OTP
  const otp     = Math.floor(100000 + Math.random() * 900000).toString()
  const otpHash = await hashOtp(otp)
  const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Upsert into EmailOtp table (reuse existing model)
  await prisma.emailOtp.deleteMany({ where: { email: email.toLowerCase().trim() } })
  await prisma.emailOtp.create({
    data: {
      email:    email.toLowerCase().trim(),
      otpHash,
      expiresAt: expires,
    },
  })

  await sendOtpEmail({ to: email.trim(), fullName: profile.fullName, otp })

  return NextResponse.json({ success: true, profileId: profile.id })
}

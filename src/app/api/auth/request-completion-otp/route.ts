// src/app/api/auth/request-completion-otp/route.ts
// POST — sends an email OTP to an INVITED user so they can verify email
//         during the complete-profile flow (alternative to token link).
//
// Body: { mobile: string, email: string }
// The mobile is used to find the INVITED profile, then we send OTP to email.

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

async function hashOtp(otp: string): Promise<string> {
  return crypto.createHash("sha256").update(otp).digest("hex")
}

async function sendOtpEmail(email: string, otp: string, name: string): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n📧 Profile-completion OTP for ${name} (${email}): ${otp}\n`)
    return
  }
  // Reuse the same email infra as send-otp
  try {
    const { Resend } = await import("resend")
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from:    process.env.EMAIL_FROM ?? "GymStack <noreply@gymstack.app>",
      to:      email,
      subject: "Your GymStack verification code",
      html:    `<p>Hi ${name.split(" ")[0]},</p><p>Your verification code is: <strong style="font-size:24px">${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
    })
  } catch (err) {
    console.error("[OTP email] Failed:", err)
    throw new Error("Failed to send email")
  }
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

  await sendOtpEmail(email.trim(), otp, profile.fullName)

  return NextResponse.json({ success: true, profileId: profile.id })
}

// src/app/api/auth/send-otp/route.ts
// Step 1 of OTP email verification flow.
// Generates a 6-digit OTP, stores its hash in DB, and emails it.
//
// Called BEFORE account creation — just needs email + fullName.
// The OTP must be verified via /api/auth/verify-otp before /api/auth/register
// will accept the request.

import { NextRequest, NextResponse } from "next/server"
import crypto                        from "crypto"
import { prisma }                    from "@/lib/prisma"
import { sendOtpEmail }              from "@/lib/email"
import {
  checkOtpSendRateLimit,
  checkRegisterRateLimit,
  getClientIp,
} from "@/lib/rateLimit"

const OTP_EXPIRY_MINUTES = 10

function generateOtp(): string {
  // Cryptographically random 6-digit code
  const bytes = crypto.randomBytes(3)
  const num   = (bytes.readUIntBE(0, 3) % 900_000) + 100_000
  return String(num)
}

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex")
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)

    // ── IP rate limit ─────────────────────────────────────────────────────
    const ipLimit = checkRegisterRateLimit(ip)
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${ipLimit.retryAfter}s.` },
        { status: 429 }
      )
    }

    const { email, fullName } = await req.json()

    if (!email?.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }
    if (!fullName?.trim()) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 })
    }

    const normalEmail = email.trim().toLowerCase()

    // ── Email rate limit ──────────────────────────────────────────────────
    const emailLimit = checkOtpSendRateLimit(normalEmail)
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: `Too many OTP requests. Try again in ${emailLimit.retryAfter}s.` },
        { status: 429 }
      )
    }

    // ── Check email not already registered ────────────────────────────────
    const existing = await prisma.profile.findUnique({
      where:  { email: normalEmail },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    // ── Delete any existing OTPs for this email ───────────────────────────
    await prisma.emailOtp.deleteMany({ where: { email: normalEmail } })

    // ── Generate + store OTP ──────────────────────────────────────────────
    const otp       = generateOtp()
    const otpHash   = hashOtp(otp)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000)

    await prisma.emailOtp.create({
      data: { email: normalEmail, otpHash, expiresAt },
    })

    // ── Send email ────────────────────────────────────────────────────────
    const sent = await sendOtpEmail({
      to:       normalEmail,
      fullName: fullName.trim(),
      otp,
    })

    if (!sent) {
      // Clean up if email failed
      await prisma.emailOtp.deleteMany({ where: { email: normalEmail } })
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success:   true,
      message:   `Verification code sent to ${normalEmail}`,
      expiresIn: OTP_EXPIRY_MINUTES * 60, // seconds
    })
  } catch (err) {
    console.error("[send-otp]", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
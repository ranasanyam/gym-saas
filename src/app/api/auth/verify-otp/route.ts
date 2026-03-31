// src/app/api/auth/verify-otp/route.ts
// Step 2 of OTP email verification flow.
// Validates the submitted OTP and marks it verified in DB.
// After this returns success, /api/auth/register checks for a verified OTP
// before creating the account.

import { NextRequest, NextResponse } from "next/server"
import crypto                        from "crypto"
import { prisma }                    from "@/lib/prisma"
import { checkOtpVerifyRateLimit }   from "@/lib/rateLimit"

const MAX_ATTEMPTS = 5

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex")
}

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json()

    if (!email?.trim() || !otp?.trim()) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      )
    }

    const normalEmail = email.trim().toLowerCase()
    const submitted   = otp.trim()

    // ── Rate limit: 5 attempts per 10 minutes per email ───────────────────
    const limit = checkOtpVerifyRateLimit(normalEmail)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${limit.retryAfter}s.` },
        { status: 429 }
      )
    }

    // ── Find OTP record ───────────────────────────────────────────────────
    const record = await prisma.emailOtp.findFirst({
      where: {
        email:    normalEmail,
        verified: false,
      },
      orderBy: { createdAt: "desc" },
    })

    if (!record) {
      return NextResponse.json(
        { error: "No pending verification found. Please request a new code." },
        { status: 400 }
      )
    }

    // ── Check expiry ──────────────────────────────────────────────────────
    if (record.expiresAt < new Date()) {
      await prisma.emailOtp.delete({ where: { id: record.id } })
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // ── Check attempt count ───────────────────────────────────────────────
    if (record.attempts >= MAX_ATTEMPTS) {
      await prisma.emailOtp.delete({ where: { id: record.id } })
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new code." },
        { status: 400 }
      )
    }

    // ── Verify OTP hash ───────────────────────────────────────────────────
    const submittedHash = hashOtp(submitted)

    if (submittedHash !== record.otpHash) {
      // Increment attempt counter
      await prisma.emailOtp.update({
        where: { id: record.id },
        data:  { attempts: { increment: 1 } },
      })
      const remaining = MAX_ATTEMPTS - record.attempts - 1
      return NextResponse.json(
        {
          error:     remaining > 0
            ? `Incorrect code. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining.`
            : "Incorrect code. No attempts remaining — request a new code.",
          remaining,
        },
        { status: 400 }
      )
    }

    // ── Mark as verified ──────────────────────────────────────────────────
    await prisma.emailOtp.update({
      where: { id: record.id },
      data:  { verified: true },
    })

    return NextResponse.json({ success: true, verified: true })
  } catch (err) {
    console.error("[verify-otp]", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
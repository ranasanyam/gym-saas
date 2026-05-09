import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendOtpEmail } from "@/lib/email"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const profile = await prisma.profile.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        fullName: true,
        email: true,
        passwordHash: true,
        oauthAccounts: { select: { provider: true } },
      },
    })

    if (!profile || !profile.email) {
      return NextResponse.json({ error: "no_account" }, { status: 404 })
    }

    const isGoogleOnly = !profile.passwordHash && profile.oauthAccounts.length > 0
    if (isGoogleOnly) {
      return NextResponse.json({ error: "oauth_account" }, { status: 400 })
    }

    // Rate limit: block if a valid OTP was sent in the last 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
    const recentOtp = await prisma.emailOtp.findFirst({
      where: {
        email: normalizedEmail,
        verified: false,
        expiresAt: { gt: new Date() },
        createdAt: { gt: oneMinuteAgo },
      },
    })
    if (recentOtp) {
      return NextResponse.json(
        { error: "Please wait a minute before requesting a new code." },
        { status: 429 },
      )
    }

    // Clean up any existing OTPs for this email before creating a fresh one
    await prisma.emailOtp.deleteMany({ where: { email: normalizedEmail } })

    const otp = String(crypto.randomInt(100000, 1000000))
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex")
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await prisma.emailOtp.create({
      data: { email: normalizedEmail, otpHash, expiresAt, verified: false },
    })

    await sendOtpEmail({
      to:       profile.email,
      fullName: profile.fullName ?? profile.email.split("@")[0],
      otp,
    })

    return NextResponse.json({})
  } catch (error) {
    console.error("Forgot password OTP error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    )
  }
}

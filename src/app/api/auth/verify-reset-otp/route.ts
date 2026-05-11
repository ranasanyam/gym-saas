import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json()

    if (!email?.trim() || !otp?.trim()) {
      return NextResponse.json({ error: "invalid_otp" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const profile = await prisma.profile.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })
    if (!profile) {
      return NextResponse.json({ error: "invalid_otp" }, { status: 400 })
    }

    // Find the most recent unused, unexpired OTP for this email
    const record = await prisma.emailOtp.findFirst({
      where: {
        email: normalizedEmail,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!record) {
      return NextResponse.json({ error: "invalid_otp" }, { status: 400 })
    }

    const providedHash = crypto.createHash("sha256").update(otp.trim()).digest("hex")
    if (providedHash !== record.otpHash) {
      return NextResponse.json({ error: "invalid_otp" }, { status: 400 })
    }

    // Mark OTP as used
    await prisma.emailOtp.update({
      where: { id: record.id },
      data: { verified: true },
    })

    // Issue a short-lived reset token (15 minutes), stored as a RefreshToken entry
    const rawToken = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.refreshToken.create({
      data: {
        profileId: profile.id,
        tokenHash: `otp_reset_${hashedToken}`,
        expiresAt,
      },
    })

    return NextResponse.json({ resetToken: rawToken })
  } catch (error) {
    console.error("Verify reset OTP error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    )
  }
}

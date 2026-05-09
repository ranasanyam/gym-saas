import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { resetToken, newPassword } = await req.json()

    if (!resetToken || !newPassword) {
      return NextResponse.json({ error: "invalid_token" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "weak_password" }, { status: 400 })
    }

    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    const resetRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash: `otp_reset_${hashedToken}` },
    })

    if (!resetRecord || resetRecord.revoked) {
      return NextResponse.json({ error: "invalid_token" }, { status: 400 })
    }

    if (resetRecord.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: resetRecord.id } })
      return NextResponse.json({ error: "invalid_token" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    // Update password, invalidate the reset token, and revoke all session tokens
    await prisma.$transaction([
      prisma.profile.update({
        where: { id: resetRecord.profileId },
        data: { passwordHash },
      }),
      prisma.refreshToken.updateMany({
        where: { profileId: resetRecord.profileId },
        data: { revoked: true },
      }),
    ])

    return NextResponse.json({})
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    )
  }
}

// // src/app/api/auth/forgot-password/route.ts

// import { NextRequest, NextResponse } from "next/server"
// import { prisma } from "@/lib/prisma"
// import crypto from "crypto"

// export async function POST(req: NextRequest) {
//   try {
//     const { email } = await req.json()

//     if (!email) {
//       return NextResponse.json({ error: "Email is required" }, { status: 400 })
//     }

//     const profile = await prisma.profile.findUnique({ where: { email } })

//     // Always return success even if email doesn't exist (security best practice)
//     if (!profile) {
//       return NextResponse.json({ success: true })
//     }

//     // Generate a secure reset token
//     const token = crypto.randomBytes(32).toString("hex")
//     const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
//     const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

//     // Store hashed token in refresh_tokens table (reusing for password reset)
//     await prisma.refreshToken.create({
//       data: {
//         profileId: profile.id,
//         tokenHash: `pwd_reset_${hashedToken}`,
//         expiresAt,
//       },
//     })

//     // TODO: Send email with reset link
//     // The reset link will be: /reset-password?token=<raw_token>
//     // For now log it — replace with Resend/Nodemailer in production
//     const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
//     console.log("Password reset link:", resetLink)

//     // When you add Resend:
//     // await resend.emails.send({
//     //   from: "noreply@yourdomain.com",
//     //   to: email,
//     //   subject: "Reset your GymStack password",
//     //   html: `<a href="${resetLink}">Reset password</a>`
//     // })

//     return NextResponse.json({ success: true })
//   } catch (error) {
//     console.error("Forgot password error:", error)
//     return NextResponse.json(
//       { error: "Something went wrong" },
//       { status: 500 }
//     )
//   }
// }


import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const profile = await prisma.profile.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, fullName: true, email: true, passwordHash: true },
    })

    // Always return success — never reveal if email exists (security)
    if (!profile) {
      return NextResponse.json({ success: true })
    }

    // Credentials-only users can reset password
    // OAuth-only users (no passwordHash) don't need password reset
    if (!profile.passwordHash) {
      // Still return success silently
      return NextResponse.json({ success: true })
    }

    // Clean up any existing unused reset tokens for this profile
    await prisma.refreshToken.deleteMany({
      where: {
        profileId: profile.id,
        tokenHash: { startsWith: "pwd_reset_" },
        revoked: false,
      },
    })

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.refreshToken.create({
      data: {
        profileId: profile.id,
        tokenHash: `pwd_reset_${hashedToken}`,
        expiresAt,
      },
    })

    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`

    // ── Send email ─────────────────────────────────────────────────────────
    // In development: log the link to terminal
    // In production: integrate Resend (recommended) or Nodemailer
    if (process.env.NODE_ENV === "development") {
      console.log("\n──────────────────────────────────────────")
      console.log("🔑 PASSWORD RESET LINK (dev only):")
      console.log(resetLink)
      console.log("──────────────────────────────────────────\n")
    } else {
      // TODO: Replace with your email provider
      // Example with Resend:
      //
      // import { Resend } from "resend"
      // const resend = new Resend(process.env.RESEND_API_KEY)
      // await resend.emails.send({
      //   from: "FitHub <noreply@yourdomain.com>",
      //   to: profile.email,
      //   subject: "Reset your FitHub password",
      //   html: `
      //     <h2>Hi ${profile.fullName},</h2>
      //     <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      //     <a href="${resetLink}" style="...">Reset Password</a>
      //     <p>If you didn't request this, ignore this email.</p>
      //   `,
      // })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
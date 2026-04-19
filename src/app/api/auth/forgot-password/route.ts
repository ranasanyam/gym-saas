

// // src/app/api/auth/forgot-password/route.ts
// // src/app/api/auth/forgot-password/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { prisma } from "@/lib/prisma"
// import crypto from "crypto"

// export async function POST(req: NextRequest) {
//   try {
//     const { email } = await req.json()

//     if (!email?.trim()) {
//       return NextResponse.json({ error: "Email is required" }, { status: 400 })
//     }

//     const profile = await prisma.profile.findUnique({
//       where: { email: email.toLowerCase().trim() },
//       select: {
//         id: true,
//         fullName: true,
//         email: true,
//         passwordHash: true,
//         oauthAccounts: { select: { provider: true } },
//       },
//     })

//     // No account found — tell user to sign up
//     if (!profile) {
//       return NextResponse.json({ error: "no_account" }, { status: 404 })
//     }

//     // Account exists but is Google-only (signed up via Google, never set a password)
//     const isGoogleOnly = !profile.passwordHash && profile.oauthAccounts.length > 0
//     if (isGoogleOnly) {
//       return NextResponse.json({ error: "oauth_account" }, { status: 400 })
//     }

//     // ── Generate reset token ──────────────────────────────────────────────────
//     // Clean up any existing unused reset tokens for this profile
//     await prisma.refreshToken.deleteMany({
//       where: {
//         profileId: profile.id,
//         tokenHash: { startsWith: "pwd_reset_" },
//         revoked: false,
//       },
//     })

//     const rawToken = crypto.randomBytes(32).toString("hex")
//     const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")
//     const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

//     await prisma.refreshToken.create({
//       data: {
//         profileId: profile.id,
//         tokenHash: `pwd_reset_${hashedToken}`,
//         expiresAt,
//       },
//     })

//     const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`

//     // ── Send email ────────────────────────────────────────────────────────────
//     if (process.env.NODE_ENV === "development") {
//       console.log("\n──────────────────────────────────────────")
//       console.log("🔑 PASSWORD RESET LINK (dev only):")
//       console.log(resetLink)
//       console.log("──────────────────────────────────────────\n")
//     } else {
//       // TODO: plug in your email provider here
//       // await sendPasswordResetEmail({ to: profile.email, fullName: profile.fullName, resetLink })
//     }

//     return NextResponse.json({ success: true })
//   } catch (error) {
//     console.error("Forgot password error:", error)
//     return NextResponse.json(
//       { error: "Something went wrong. Please try again." },
//       { status: 500 }
//     )
//   }
// }

// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/email"
import { checkForgotPasswordRateLimit } from "@/lib/rateLimit"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // ── Rate limiting: 3 requests per hour per email ──────────────────────
    const limit = checkForgotPasswordRateLimit(email)
    if (!limit.allowed) {
      // Return 200 to avoid leaking whether the email exists, but don't send
      return NextResponse.json({ success: true })
    }

    const profile = await prisma.profile.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        fullName: true,
        email: true,
        passwordHash: true,
        oauthAccounts: { select: { provider: true } },
      },
    })

    // No account found — tell user to sign up
    if (!profile) {
      return NextResponse.json({ error: "no_account" }, { status: 404 })
    }
    if (!profile.email) {
      return NextResponse.json({ error: "no_account" }, { status: 404 })
    }

    // Account exists but is Google-only (signed up via Google, never set a password)
    const isGoogleOnly = !profile.passwordHash && profile.oauthAccounts.length > 0
    if (isGoogleOnly) {
      return NextResponse.json({ error: "oauth_account" }, { status: 400 })
    }

    // ── Generate reset token ──────────────────────────────────────────────────
    // Clean up any existing unused reset tokens for this profile
    await prisma.refreshToken.deleteMany({
      where: {
        profileId: profile.id,
        tokenHash: { startsWith: "pwd_reset_" },
        revoked: false,
      },
    })

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

    // ── Send email ────────────────────────────────────────────────────────────
    await sendPasswordResetEmail({
      to:        profile.email,
      fullName:  profile.fullName,
      resetLink,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}

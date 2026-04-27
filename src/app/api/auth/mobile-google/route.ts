// src/app/api/auth/mobile-google/route.ts
// Verifies a Google ID token from the mobile app and issues JWT tokens.
// Same token issuance as mobile-login; same profile creation as handleOAuthSignIn in auth.ts.

import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

const ACCESS_TOKEN_SECRET  = process.env.JWT_SECRET!
const ACCESS_EXPIRY_SECONDS  = 15 * 60
const REFRESH_EXPIRY_DAYS    = 90
const REFRESH_EXPIRY_SECONDS = REFRESH_EXPIRY_DAYS * 24 * 60 * 60

function issueAccessToken(profileId: string, role: string | null): string {
  return jwt.sign(
    { profileId, role, type: "access" },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_EXPIRY_SECONDS }
  )
}

async function issueRefreshToken(profileId: string): Promise<string> {
  const rawToken    = crypto.randomBytes(48).toString("hex")
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")
  const expiresAt   = new Date(Date.now() + REFRESH_EXPIRY_SECONDS * 1000)
  await prisma.refreshToken.create({
    data: { profileId, tokenHash: `mobile_rt_${hashedToken}`, expiresAt },
  })
  return rawToken
}

function generateReferralCode(name: string): string {
  const base   = name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6)
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${base}${suffix}`
}

const PROFILE_SELECT = {
  id: true, fullName: true, email: true, role: true, status: true,
  avatarUrl: true, mobileNumber: true, city: true, gender: true,
  wallet: { select: { balance: true } },
  referralCode: { select: { code: true } },
} as const

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json()
    if (!idToken) {
      return NextResponse.json({ error: "ID token is required" }, { status: 400 })
    }

    // Verify the Google ID token
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    )
    if (!tokenInfoRes.ok) {
      return NextResponse.json({ error: "Invalid Google token" }, { status: 401 })
    }
    const tokenInfo = await tokenInfoRes.json()

    // Validate token audience against known client IDs
    const allowedAuds = [
      process.env.AUTH_GOOGLE_ID,
      process.env.GOOGLE_IOS_CLIENT_ID,
    ].filter(Boolean)
    if (allowedAuds.length > 0 && !allowedAuds.includes(tokenInfo.aud)) {
      return NextResponse.json({ error: "Token audience mismatch" }, { status: 401 })
    }

    const email: string      = tokenInfo.email
    const name: string       = tokenInfo.name
    const picture: string    = tokenInfo.picture ?? null
    const providerUid: string = tokenInfo.sub

    if (!email || !name) {
      return NextResponse.json({ error: "Incomplete Google profile" }, { status: 400 })
    }

    const emailLower = email.toLowerCase()

    // Find or create profile (mirrors handleOAuthSignIn in auth.ts)
    let profile = await prisma.profile.findUnique({
      where:  { email: emailLower },
      select: PROFILE_SELECT,
    })

    if (!profile) {
      const created = await prisma.$transaction(async (tx) => {
        const p = await tx.profile.create({
          data: { userId: providerUid, email: emailLower, fullName: name, avatarUrl: picture },
        })
        await tx.wallet.create({ data: { profileId: p.id } })
        const code = generateReferralCode(name)
        await tx.referralCode.create({ data: { profileId: p.id, code } })
        await tx.oAuthAccount.create({
          data: { profileId: p.id, provider: "GOOGLE", providerUid },
        })
        return p
      })

      profile = await prisma.profile.findUnique({
        where:  { id: created.id },
        select: PROFILE_SELECT,
      })
    } else {
      // Link OAuth account for existing email/password users signing in with Google
      const linked = await prisma.oAuthAccount.findFirst({
        where: { profileId: profile.id, provider: "GOOGLE" },
      })
      if (!linked) {
        await prisma.oAuthAccount.create({
          data: { profileId: profile.id, provider: "GOOGLE", providerUid },
        })
      }
    }

    if (!profile) {
      return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
    }

    const [accessToken, refreshToken] = await Promise.all([
      issueAccessToken(profile.id, profile.role),
      issueRefreshToken(profile.id),
    ])

    return NextResponse.json({
      accessToken,
      refreshToken,
      expiresIn:        ACCESS_EXPIRY_SECONDS,
      refreshExpiresIn: REFRESH_EXPIRY_SECONDS,
      profile: {
        id:           profile.id,
        fullName:     profile.fullName,
        email:        profile.email,
        role:         profile.role,
        status:       profile.status,
        avatarUrl:    profile.avatarUrl,
        mobileNumber: profile.mobileNumber,
        city:         profile.city,
        gender:       profile.gender,
        wallet:       profile.wallet ? { balance: Number(profile.wallet.balance) } : null,
        referralCode: profile.referralCode?.code ?? null,
      },
    })
  } catch (err) {
    console.error("[mobile-google]", err)
    return NextResponse.json({ error: "Google sign-in failed" }, { status: 500 })
  }
}

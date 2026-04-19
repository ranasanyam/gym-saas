// // src/app/api/auth/mobile-login/route.ts
// // Issues short-lived access tokens + long-lived refresh tokens for mobile clients.
// // Access token:  15 min  — stateless JWT, sent on every request
// // Refresh token: 90 days — hashed in DB (RefreshToken table), single-use + rotated

// import { NextRequest, NextResponse } from "next/server"
// import bcrypt from "bcryptjs"
// import jwt from "jsonwebtoken"
// import crypto from "crypto"
// import { prisma } from "@/lib/prisma"

// const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET!
// const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET!

// const ACCESS_EXPIRY_SECONDS = 15 * 60            // 15 minutes
// const REFRESH_EXPIRY_DAYS = 90
// const REFRESH_EXPIRY_SECONDS = REFRESH_EXPIRY_DAYS * 24 * 60 * 60

// function issueAccessToken(profileId: string, role: string | null): string {
//     return jwt.sign(
//         { profileId, role, type: "access" },
//         ACCESS_TOKEN_SECRET,
//         { expiresIn: ACCESS_EXPIRY_SECONDS }
//     )
// }

// async function issueRefreshToken(profileId: string): Promise<string> {
//     const rawToken = crypto.randomBytes(48).toString("hex")
//     const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")
//     const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_SECONDS * 1000)

//     await prisma.refreshToken.create({
//         data: {
//             profileId,
//             tokenHash: `mobile_rt_${hashedToken}`,
//             expiresAt,
//         },
//     })

//     // Return raw token — client stores this, we never store the raw value
//     return rawToken
// }

// export async function POST(req: NextRequest) {
//     try {
//         const { email, password } = await req.json()

//         if (!email?.trim() || !password) {
//             return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
//         }

//         const profile = await prisma.profile.findUnique({
//             where: { email: email.toLowerCase().trim() },
//             select: {
//                 id: true, fullName: true, email: true, role: true,
//                 avatarUrl: true, mobileNumber: true, city: true, gender: true,
//                 passwordHash: true,
//                 wallet: { select: { balance: true } },
//                 referralCode: { select: { code: true } },
//             },
//         })

//         if (!profile || !profile.passwordHash) {
//             return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
//         }

//         const valid = await bcrypt.compare(password, profile.passwordHash)
//         if (!valid) {
//             return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
//         }

//         const [accessToken, refreshToken] = await Promise.all([
//             issueAccessToken(profile.id, profile.role),
//             issueRefreshToken(profile.id),
//         ])

//         // Strip passwordHash before returning
//         const { passwordHash: _, ...safeProfile } = profile

//         return NextResponse.json({
//             accessToken,
//             refreshToken,
//             expiresIn: ACCESS_EXPIRY_SECONDS,
//             refreshExpiresIn: REFRESH_EXPIRY_SECONDS,
//             profile: {
//                 ...safeProfile,
//                 wallet: safeProfile.wallet ? { balance: Number(safeProfile.wallet.balance) } : null,
//                 referralCode: safeProfile.referralCode?.code ?? null,
//             },
//         })
//     } catch (err) {
//         console.error("[mobile-login]", err)
//         return NextResponse.json({ error: "Login failed" }, { status: 500 })
//     }
// }

// src/app/api/auth/mobile-login/route.ts
// Issues short-lived access tokens + long-lived refresh tokens for mobile clients.
// Access token:  15 min  — stateless JWT, sent on every request
// Refresh token: 90 days — hashed in DB (RefreshToken table), single-use + rotated

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { checkLoginRateLimit, getClientIp } from "@/lib/rateLimit"

const ACCESS_TOKEN_SECRET  = process.env.JWT_SECRET!
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET!

const ACCESS_EXPIRY_SECONDS  = 15 * 60            // 15 minutes
const REFRESH_EXPIRY_DAYS    = 90
const REFRESH_EXPIRY_SECONDS = REFRESH_EXPIRY_DAYS * 24 * 60 * 60

// Detect whether an identifier looks like a mobile number (10 digits, optionally +91)
function isMobile(identifier: string): boolean {
  return /^(\+91)?[6-9]\d{9}$/.test(identifier.replace(/[\s-]/g, ""))
}

function normaliseMobile(raw: string): string {
  return raw.replace(/[\s\-+]/g, "").slice(-10)
}

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
    data: {
      profileId,
      tokenHash: `mobile_rt_${hashedToken}`,
      expiresAt,
    },
  })

  // Return raw token — client stores this, we never store the raw value
  return rawToken
}

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting: 5 attempts per 15 min per IP ───────────────────────
    const ip    = getClientIp(req)
    const limit = checkLoginRateLimit(ip)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${limit.retryAfter} seconds.` },
        {
          status: 429,
          headers: {
            "Retry-After":       String(limit.retryAfter),
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
          },
        }
      )
    }

    const { email, password } = await req.json()

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    let profile: any = null

    if (isMobile(email)) {
      // Mobile login — look up by normalised mobile number
      const mobile = normaliseMobile(email)
      profile = await prisma.profile.findFirst({
        where: { mobileNumber: { endsWith: mobile } },
        select: {
          id: true, fullName: true, email: true, role: true,
          avatarUrl: true, mobileNumber: true, city: true, gender: true,
          passwordHash: true,
          wallet: { select: { balance: true } },
          referralCode: { select: { code: true } },
        },
      })
    } else {
      // Email login
      const emailLower = email.toLowerCase().trim()
      profile = await prisma.profile.findUnique({
        where: { email: emailLower },
        select: {
          id: true, fullName: true, email: true, role: true,
          avatarUrl: true, mobileNumber: true, city: true, gender: true,
          passwordHash: true,
          wallet: { select: { balance: true } },
          referralCode: { select: { code: true } },
        },
      })
    }

    if (!profile) {
      return NextResponse.json({ error: "No account found with this email or mobile number" }, { status: 404 })
    }

    if (!profile.passwordHash) {
      return NextResponse.json({ error: "Account exists but no password set (OAuth account)" }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, profile.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    const [accessToken, refreshToken] = await Promise.all([
      issueAccessToken(profile.id, profile.role),
      issueRefreshToken(profile.id),
    ])

    // Strip passwordHash before returning
    const { passwordHash: _, ...safeProfile } = profile

    return NextResponse.json({
      accessToken,
      refreshToken,
      expiresIn:    ACCESS_EXPIRY_SECONDS,
      refreshExpiresIn: REFRESH_EXPIRY_SECONDS,
      profile: {
        ...safeProfile,
        wallet: safeProfile.wallet ? { balance: Number(safeProfile.wallet.balance) } : null,
        referralCode: safeProfile.referralCode?.code ?? null,
      },
    })
  } catch (err) {
    console.error("[mobile-login]", err)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
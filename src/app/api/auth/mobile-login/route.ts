// src/app/api/auth/mobile-login/route.ts
// Issues short-lived access tokens + long-lived refresh tokens for mobile clients.
// Access token:  15 min  — stateless JWT, sent on every request
// Refresh token: 90 days — hashed in DB (RefreshToken table), single-use + rotated

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET!
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET!

const ACCESS_EXPIRY_SECONDS = 15 * 60            // 15 minutes
const REFRESH_EXPIRY_DAYS = 90
const REFRESH_EXPIRY_SECONDS = REFRESH_EXPIRY_DAYS * 24 * 60 * 60

function issueAccessToken(profileId: string, role: string | null): string {
    return jwt.sign(
        { profileId, role, type: "access" },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_EXPIRY_SECONDS }
    )
}

async function issueRefreshToken(profileId: string): Promise<string> {
    const rawToken = crypto.randomBytes(48).toString("hex")
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_SECONDS * 1000)

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
        const { email, password } = await req.json()

        if (!email?.trim() || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
        }

        const profile = await prisma.profile.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: {
                id: true, fullName: true, email: true, role: true,
                avatarUrl: true, mobileNumber: true, city: true, gender: true,
                passwordHash: true,
                wallet: { select: { balance: true } },
                referralCode: { select: { code: true } },
            },
        })

        if (!profile || !profile.passwordHash) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
        }

        const valid = await bcrypt.compare(password, profile.passwordHash)
        if (!valid) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
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
            expiresIn: ACCESS_EXPIRY_SECONDS,
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
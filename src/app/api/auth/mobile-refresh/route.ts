// src/app/api/auth/mobile-refresh/route.ts
// Accepts a refresh token, validates it, rotates it, returns a new access + refresh token pair.
// Refresh tokens are single-use — old token is revoked after each refresh.

import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET!
const ACCESS_EXPIRY_SECONDS = 15 * 60
const REFRESH_EXPIRY_DAYS = 90
const REFRESH_EXPIRY_SECONDS = REFRESH_EXPIRY_DAYS * 24 * 60 * 60

export async function POST(req: NextRequest) {
    try {
        const { refreshToken } = await req.json()
        if (!refreshToken) {
            return NextResponse.json({ error: "Refresh token required" }, { status: 400 })
        }

        const hashedToken = `mobile_rt_${crypto.createHash("sha256").update(refreshToken).digest("hex")}`

        const stored = await prisma.refreshToken.findUnique({
            where: { tokenHash: hashedToken },
            include: { profile: { select: { id: true, role: true, fullName: true, avatarUrl: true } } },
        })

        if (!stored || stored.revoked || stored.expiresAt < new Date()) {
            return NextResponse.json({ error: "Refresh token invalid or expired" }, { status: 401 })
        }

        // ── Rotate: revoke old token + issue new pair atomically ────────────────
        const newRawToken = crypto.randomBytes(48).toString("hex")
        const newHashedToken = `mobile_rt_${crypto.createHash("sha256").update(newRawToken).digest("hex")}`
        const newExpiresAt = new Date(Date.now() + REFRESH_EXPIRY_SECONDS * 1000)

        await prisma.$transaction([
            prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } }),
            prisma.refreshToken.create({
                data: {
                    profileId: stored.profileId,
                    tokenHash: newHashedToken,
                    expiresAt: newExpiresAt,
                },
            }),
        ])

        const accessToken = jwt.sign(
            { profileId: stored.profileId, role: stored.profile.role, type: "access" },
            ACCESS_TOKEN_SECRET,
            { expiresIn: ACCESS_EXPIRY_SECONDS }
        )

        return NextResponse.json({
            accessToken,
            refreshToken: newRawToken,
            expiresIn: ACCESS_EXPIRY_SECONDS,
            refreshExpiresIn: REFRESH_EXPIRY_SECONDS,
        })
    } catch (err) {
        console.error("[mobile-refresh]", err)
        return NextResponse.json({ error: "Token refresh failed" }, { status: 500 })
    }
}
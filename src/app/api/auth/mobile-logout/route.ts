// src/app/api/auth/mobile-logout/route.ts
// Revokes the refresh token so it can't be used again.
// Access tokens self-expire in 15 min — nothing to do server-side for those.

import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
    try {
        const { refreshToken } = await req.json()
        if (!refreshToken) return NextResponse.json({ success: true }) // idempotent

        const hashedToken = `mobile_rt_${crypto.createHash("sha256").update(refreshToken).digest("hex")}`
        await prisma.refreshToken.updateMany({
            where: { tokenHash: hashedToken },
            data: { revoked: true },
        })

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ success: true }) // never fail a logout
    }
}
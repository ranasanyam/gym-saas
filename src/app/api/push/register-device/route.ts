// src/app/api/push/register-device/route.ts
// Stores an FCM (Firebase Cloud Messaging) token for a mobile device.
// Called by the mobile app on login and whenever the token refreshes.
// Token is used by the backend to send push notifications to mobile devices
// (in addition to the existing Web Push for browser PWA users).

import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
    const profileId = await resolveProfileId(req)
    if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { fcmToken } = await req.json()
    if (!fcmToken?.trim()) return NextResponse.json({ error: "fcmToken required" }, { status: 400 })

    const userAgent = req.headers.get("user-agent") ?? undefined

    // We reuse the PushSubscription model — store FCM token in endpoint field,
    // leave p256dh and auth empty. The send layer checks for FCM vs Web Push.
    await prisma.pushSubscription.upsert({
        where: { endpoint: `fcm:${fcmToken}` },
        update: { profileId, userAgent },
        create: {
            profileId,
            endpoint: `fcm:${fcmToken}`,
            p256dh: "fcm",
            auth: "fcm",
            userAgent,
        },
    })

    return NextResponse.json({ success: true })
}
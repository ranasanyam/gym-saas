// // src/app/api/push/register-device/route.ts
// // Stores an FCM (Firebase Cloud Messaging) token for a mobile device.
// // Called by the mobile app on login and whenever the token refreshes.
// // Token is used by the backend to send push notifications to mobile devices
// // (in addition to the existing Web Push for browser PWA users).

// import { NextRequest, NextResponse } from "next/server"
// import { resolveProfileId } from "@/lib/mobileAuth"
// import { prisma } from "@/lib/prisma"

// export async function POST(req: NextRequest) {
//     const profileId = await resolveProfileId(req)
//     if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//     const { fcmToken } = await req.json()
//     if (!fcmToken?.trim()) return NextResponse.json({ error: "fcmToken required" }, { status: 400 })

//     const userAgent = req.headers.get("user-agent") ?? undefined

//     // We reuse the PushSubscription model — store FCM token in endpoint field,
//     // leave p256dh and auth empty. The send layer checks for FCM vs Web Push.
//     await prisma.pushSubscription.upsert({
//         where: { endpoint: `fcm:${fcmToken}` },
//         update: { profileId, userAgent },
//         create: {
//             profileId,
//             endpoint: `fcm:${fcmToken}`,
//             p256dh: "fcm",
//             auth: "fcm",
//             userAgent,
//         },
//     })

//     return NextResponse.json({ success: true })
// }



// src/app/api/push/register-device/route.ts
// Stores an Expo Push Token for a mobile device.
// Called by the Expo app after it obtains a token from expo-notifications.
//
// Token format: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
// Stored in DB as: "expo:ExponentPushToken[xxx]"  (prefix for dispatch routing)
//
// The same push_subscriptions table is reused for both Web Push (browser)
// and Expo Push (mobile) — the endpoint prefix determines which sender to use.

import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId }          from "@/lib/mobileAuth"
import { prisma }                     from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  // Accept both field names for backwards compatibility:
  //   { expoPushToken: "ExponentPushToken[...]" }   ← preferred
  //   { fcmToken: "ExponentPushToken[...]" }         ← old field name (still works)
  const rawToken: string | undefined =
    body.expoPushToken?.trim() || body.fcmToken?.trim()

  if (!rawToken) {
    return NextResponse.json({ error: "expoPushToken is required" }, { status: 400 })
  }

  // Validate it's actually an Expo token
  if (!rawToken.startsWith("ExponentPushToken[")) {
    return NextResponse.json(
      { error: "Invalid token format — expected ExponentPushToken[...]" },
      { status: 400 }
    )
  }

  const endpoint  = `expo:${rawToken}`
  const userAgent = req.headers.get("user-agent") ?? undefined

  await prisma.pushSubscription.upsert({
    where:  { endpoint },
    update: { profileId, userAgent },
    create: {
      profileId,
      endpoint,
      p256dh:    "expo",  // sentinel value — not used for Expo push
      auth:      "expo",  // sentinel value — not used for Expo push
      userAgent,
    },
  })

  console.log(`[Push] Registered Expo token for profile ${profileId}`)
  return NextResponse.json({ success: true })
}

// DELETE — unregister a token when user logs out
export async function DELETE(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const rawToken: string | undefined =
    body.expoPushToken?.trim() || body.fcmToken?.trim()

  if (rawToken) {
    await prisma.pushSubscription
      .deleteMany({ where: { endpoint: `expo:${rawToken}`, profileId } })
      .catch(() => {})
  } else {
    // No token provided → delete ALL mobile subs for this profile (logout)
    await prisma.pushSubscription
      .deleteMany({
        where: {
          profileId,
          endpoint: { startsWith: "expo:" },
        },
      })
      .catch(() => {})
  }

  return NextResponse.json({ success: true })
}
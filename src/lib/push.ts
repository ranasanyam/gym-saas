

// // src/lib/push.ts  —  server-side helper to send Web Push notifications
// // Uses web-push library (npm install web-push)
// import { prisma } from "@/lib/prisma"

// interface PushPayload {
//   title:  string
//   body:   string
//   icon?:  string
//   badge?: string
//   url?:   string
//   tag?:   string
// }

// export async function sendPushToProfile(profileId: string, payload: PushPayload) {
//   const subs = await prisma.pushSubscription.findMany({ where: { profileId } })
//   if (!subs.length) return

//   // Lazy-import web-push so it doesn't break edge runtime imports
//   const webpush = (await import("web-push")).default
//   webpush.setVapidDetails(
//     `mailto:${process.env.VAPID_EMAIL ?? "admin@gymstack.app"}`,
//     process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
//     process.env.VAPID_PRIVATE_KEY!,
//   )

//   const body = JSON.stringify({ ...payload, icon: payload.icon ?? "/icons/icon-192x192.png", badge: "/icons/icon-72x72.png" })

//   await Promise.allSettled(
//     subs.map(async sub => {
//       try {
//         await webpush.sendNotification(
//           { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
//           body,
//         )
//       } catch (err: any) {
//         // 410 Gone = subscription expired, remove it
//         if (err?.statusCode === 410 || err?.statusCode === 404) {
//           await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } }).catch(() => {})
//         }
//       }
//     })
//   )
// }

// export async function sendPushToProfiles(profileIds: string[], payload: PushPayload) {
//   await Promise.allSettled(profileIds.map(id => sendPushToProfile(id, payload)))
// }

// export async function sendPushToGymOwner(gymId: string, payload: PushPayload) {
//   const gym = await prisma.gym.findUnique({ where: { id: gymId }, select: { ownerId: true } })
//   if (!gym) return
//   await sendPushToProfile(gym.ownerId, payload)
// }


// src/lib/push.ts — server-side helper to send push notifications
// Supports BOTH:
//   - Web Push (browser/PWA) via web-push library
//   - FCM (mobile/React Native) via Firebase Admin SDK
// import { prisma } from "@/lib/prisma"

// interface PushPayload {
//   title: string
//   body: string
//   icon?: string
//   badge?: string
//   url?: string
//   tag?: string
//   channelId?: string
// }

// let firebaseAdmin: any = null

// async function getFirebaseAdmin() {
//   if (firebaseAdmin) return firebaseAdmin
//   try {
//     const admin = await import("firebase-admin")
//     if (!admin.apps.length) {
//       admin.initializeApp({
//         credential: admin.credential.cert({
//           projectId: process.env.FIREBASE_PROJECT_ID,
//           clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//           privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
//         }),
//       })
//     }
//     firebaseAdmin = admin
//     return admin
//   } catch {
//     console.warn("[Push] firebase-admin not installed — FCM push disabled")
//     return null
//   }
// }

// async function sendWebPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: PushPayload) {
//   const webpush = (await import("web-push")).default
//   webpush.setVapidDetails(
//     `mailto:${process.env.VAPID_EMAIL ?? "admin@gymstack.app"}`,
//     process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
//     process.env.VAPID_PRIVATE_KEY!,
//   )
//   const body = JSON.stringify({
//     ...payload,
//     icon: payload.icon ?? "/icons/icon-192x192.png",
//     badge: "/icons/icon-72x72.png",
//   })
//   try {
//     await webpush.sendNotification(
//       { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
//       body,
//     )
//   } catch (err: any) {
//     if (err?.statusCode === 410 || err?.statusCode === 404) {
//       await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } }).catch(() => { })
//     }
//   }
// }

// async function sendFcmPush(fcmToken: string, payload: PushPayload): Promise<boolean> {
//   const admin = await getFirebaseAdmin()
//   if (!admin) return false
//   try {
//     await admin.messaging().send({
//       token: fcmToken,
//       notification: { title: payload.title, body: payload.body },
//       android: {
//         notification: { channelId: payload.channelId ?? "default", color: "#f97316" },
//         data: { url: payload.url ?? "/" },
//       },
//       apns: {
//         payload: { aps: { sound: "default", badge: 1 } },
//       },
//       data: {
//         url: payload.url ?? "/",
//         tag: payload.tag ?? "",
//         title: payload.title,
//         body: payload.body,
//       },
//     })
//     return true
//   } catch (err: any) {
//     const invalid = ["messaging/invalid-registration-token", "messaging/registration-token-not-registered"]
//     if (invalid.includes(err?.errorInfo?.code)) {
//       await prisma.pushSubscription.deleteMany({ where: { endpoint: `fcm:${fcmToken}` } }).catch(() => { })
//     }
//     return false
//   }
// }

// export async function sendPushToProfile(profileId: string, payload: PushPayload) {
//   const subs = await prisma.pushSubscription.findMany({ where: { profileId } })
//   if (!subs.length) return
//   await Promise.allSettled(
//     subs.map(sub => {
//       if (sub.endpoint.startsWith("fcm:")) return sendFcmPush(sub.endpoint.slice(4), payload)
//       return sendWebPush(sub, payload)
//     })
//   )
// }

// export async function sendPushToProfiles(profileIds: string[], payload: PushPayload) {
//   await Promise.allSettled(profileIds.map(id => sendPushToProfile(id, payload)))
// }

// export async function sendPushToGymOwner(gymId: string, payload: PushPayload) {
//   const gym = await prisma.gym.findUnique({ where: { id: gymId }, select: { ownerId: true } })
//   if (!gym) return
//   await sendPushToProfile(gym.ownerId, payload)
// }





// src/lib/push.ts — server-side push notification sender
//
// Supports two delivery methods:
//   1. Expo Push API  (mobile — Expo apps)
//      Token stored as:  expo:ExponentPushToken[xxxx]
//      Sent via:         https://exp.host/--/api/v2/push/send
//      Expo forwards to: FCM (Android) or APNs (iOS) automatically
//
//   2. Web Push / VAPID  (browser PWA)
//      Token stored as:  the subscription endpoint URL (e.g. https://fcm.googleapis.com/...)
//      Sent via:         web-push npm package
//
// The routing logic is simple: if endpoint starts with "expo:" → Expo Push API,
// otherwise → Web Push.
//
// No firebase-admin needed. Expo handles FCM/APNs credentials on their side.

import { prisma } from "@/lib/prisma"

// ── Payload shape ─────────────────────────────────────────────────────────────
interface PushPayload {
  title:      string
  body:       string
  url?:       string    // deep-link URL sent in notification data
  tag?:       string    // deduplication tag
  channelId?: string    // Android channel id (default: "default")
  icon?:      string    // Web Push icon URL
  badge?:     string    // Web Push badge URL
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. EXPO PUSH API
// ─────────────────────────────────────────────────────────────────────────────

interface ExpoPushMessage {
  to:          string
  title:       string
  body:        string
  data?:       Record<string, string>
  sound?:      "default" | null
  badge?:      number
  channelId?:  string
  ttl?:        number
  priority?:   "default" | "normal" | "high"
}

interface ExpoPushTicket {
  status:  "ok" | "error"
  id?:     string
  message?: string
  details?: { error?: string }
}

async function sendExpoPush(
  expoToken: string,
  payload: PushPayload,
): Promise<void> {
  const message: ExpoPushMessage = {
    to:        expoToken,
    title:     payload.title,
    body:      payload.body,
    sound:     "default",
    badge:     1,
    priority:  "high",
    channelId: payload.channelId ?? "default",
    data: {
      url:   payload.url ?? "",
      tag:   payload.tag ?? "",
      title: payload.title,
      body:  payload.body,
    },
  }

  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Accept":        "application/json",
        // Optional: add your Expo access token for higher rate limits
        // "Authorization": `Bearer ${process.env.EXPO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(message),
    })

    if (!res.ok) {
      console.warn("[Push/Expo] HTTP error:", res.status, await res.text())
      return
    }

    const json = await res.json() as { data: ExpoPushTicket }
    const ticket = json.data

    if (ticket.status === "error") {
      const errCode = ticket.details?.error

      // DeviceNotRegistered means the token is no longer valid → clean it up
      if (errCode === "DeviceNotRegistered") {
        await prisma.pushSubscription
          .deleteMany({ where: { endpoint: `expo:${expoToken}` } })
          .catch(() => {})
        console.log("[Push/Expo] Removed invalid token:", expoToken.slice(0, 30) + "...")
      } else {
        console.warn("[Push/Expo] Error ticket:", ticket.message, errCode)
      }
    }
  } catch (err) {
    console.warn("[Push/Expo] Fetch failed:", err)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. WEB PUSH (PWA / browser)
// ─────────────────────────────────────────────────────────────────────────────

async function sendWebPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload,
): Promise<void> {
  try {
    const webpush = (await import("web-push")).default

    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL ?? "admin@gymstack.app"}`,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    )

    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({
        title: payload.title,
        body:  payload.body,
        icon:  payload.icon  ?? "/icons/icon-192x192.png",
        badge: payload.badge ?? "/icons/icon-72x72.png",
        url:   payload.url   ?? "/",
        tag:   payload.tag,
      }),
    )
  } catch (err: any) {
    // 410 Gone or 404 Not Found → subscription expired, remove it
    if (err?.statusCode === 410 || err?.statusCode === 404) {
      await prisma.pushSubscription
        .deleteMany({ where: { endpoint: sub.endpoint } })
        .catch(() => {})
    } else {
      console.warn("[Push/Web] Send failed:", err?.message ?? err)
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

export async function sendPushToProfile(
  profileId: string,
  payload: PushPayload,
): Promise<void> {
  const subs = await prisma.pushSubscription.findMany({ where: { profileId } })
  if (!subs.length) return

  await Promise.allSettled(
    subs.map(sub => {
      // Expo push token — use Expo Push API
      if (sub.endpoint.startsWith("expo:")) {
        return sendExpoPush(sub.endpoint.slice(5), payload)  // slice off "expo:"
      }
      // Web Push subscription — use VAPID / web-push
      return sendWebPush(sub, payload)
    })
  )
}

export async function sendPushToProfiles(
  profileIds: string[],
  payload: PushPayload,
): Promise<void> {
  await Promise.allSettled(
    profileIds.map(id => sendPushToProfile(id, payload))
  )
}

export async function sendPushToGymOwner(
  gymId: string,
  payload: PushPayload,
): Promise<void> {
  const gym = await prisma.gym.findUnique({
    where:  { id: gymId },
    select: { ownerId: true },
  })
  if (!gym) return
  await sendPushToProfile(gym.ownerId, payload)
}
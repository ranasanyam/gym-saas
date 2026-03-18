

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
import { prisma } from "@/lib/prisma"

interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
  channelId?: string
}

let firebaseAdmin: any = null

async function getFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin
  try {
    const admin = await import("firebase-admin")
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      })
    }
    firebaseAdmin = admin
    return admin
  } catch {
    console.warn("[Push] firebase-admin not installed — FCM push disabled")
    return null
  }
}

async function sendWebPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: PushPayload) {
  const webpush = (await import("web-push")).default
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? "admin@gymstack.app"}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )
  const body = JSON.stringify({
    ...payload,
    icon: payload.icon ?? "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
  })
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      body,
    )
  } catch (err: any) {
    if (err?.statusCode === 410 || err?.statusCode === 404) {
      await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } }).catch(() => { })
    }
  }
}

async function sendFcmPush(fcmToken: string, payload: PushPayload): Promise<boolean> {
  const admin = await getFirebaseAdmin()
  if (!admin) return false
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title: payload.title, body: payload.body },
      android: {
        notification: { channelId: payload.channelId ?? "default", color: "#f97316" },
        data: { url: payload.url ?? "/" },
      },
      apns: {
        payload: { aps: { sound: "default", badge: 1 } },
      },
      data: {
        url: payload.url ?? "/",
        tag: payload.tag ?? "",
        title: payload.title,
        body: payload.body,
      },
    })
    return true
  } catch (err: any) {
    const invalid = ["messaging/invalid-registration-token", "messaging/registration-token-not-registered"]
    if (invalid.includes(err?.errorInfo?.code)) {
      await prisma.pushSubscription.deleteMany({ where: { endpoint: `fcm:${fcmToken}` } }).catch(() => { })
    }
    return false
  }
}

export async function sendPushToProfile(profileId: string, payload: PushPayload) {
  const subs = await prisma.pushSubscription.findMany({ where: { profileId } })
  if (!subs.length) return
  await Promise.allSettled(
    subs.map(sub => {
      if (sub.endpoint.startsWith("fcm:")) return sendFcmPush(sub.endpoint.slice(4), payload)
      return sendWebPush(sub, payload)
    })
  )
}

export async function sendPushToProfiles(profileIds: string[], payload: PushPayload) {
  await Promise.allSettled(profileIds.map(id => sendPushToProfile(id, payload)))
}

export async function sendPushToGymOwner(gymId: string, payload: PushPayload) {
  const gym = await prisma.gym.findUnique({ where: { id: gymId }, select: { ownerId: true } })
  if (!gym) return
  await sendPushToProfile(gym.ownerId, payload)
}
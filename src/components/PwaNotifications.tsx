// // src/components/PwaNotifications.tsx
// // Handles requesting notification permission + registering Web Push subscription
// "use client"

// import { useEffect, useState } from "react"
// import { Bell, BellOff, X } from "lucide-react"

// const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""

// function urlBase64ToUint8Array(base64String: string) {
//   const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
//   const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
//   const raw     = window.atob(base64)
//   const output  = new Uint8Array(raw.length)
//   for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i)
//   return output
// }

// export function PwaNotifications() {
//   const [permission, setPermission] = useState<NotificationPermission>("default")
//   const [banner,     setBanner]     = useState(false)
//   const [registering, setRegistering] = useState(false)

//   useEffect(() => {
//     if (typeof window === "undefined" || !("Notification" in window)) return
//     setPermission(Notification.permission)

//     // Show prompt if not yet decided, after 5s
//     if (Notification.permission === "default") {
//       const shown = localStorage.getItem("notif-banner-shown")
//       if (!shown) setTimeout(() => setBanner(true), 5000)
//     } else if (Notification.permission === "granted") {
//       registerSubscription().catch(() => {})
//     }
//   }, [])

//   async function registerSubscription() {
//     if (!("serviceWorker" in navigator) || !VAPID_PUBLIC_KEY) return
//     const reg = await navigator.serviceWorker.ready
//     const existing = await reg.pushManager.getSubscription()
//     if (existing) return // already registered

//     const sub = await reg.pushManager.subscribe({
//       userVisibleOnly:      true,
//       applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
//     })

//     const key  = sub.getKey("p256dh")
//     const auth = sub.getKey("auth")
//     if (!key || !auth) return

//     await fetch("/api/push/subscribe", {
//       method:  "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         endpoint: sub.endpoint,
//         p256dh:   btoa(String.fromCharCode(...new Uint8Array(key))),
//         auth:     btoa(String.fromCharCode(...new Uint8Array(auth))),
//       }),
//     })
//   }

//   const requestPermission = async () => {
//     setRegistering(true)
//     try {
//       const result = await Notification.requestPermission()
//       setPermission(result)
//       if (result === "granted") {
//         await registerSubscription()
//         localStorage.setItem("notif-banner-shown", "1")
//       }
//     } finally {
//       setRegistering(false)
//       setBanner(false)
//     }
//   }

//   const dismiss = () => {
//     localStorage.setItem("notif-banner-shown", "1")
//     setBanner(false)
//   }

//   if (!banner || permission !== "default") return null

//   return (
//     <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 z-9998 sm:left-auto sm:right-4 sm:w-80 animate-in slide-in-from-bottom-4 duration-300">
//       <div className="bg-[hsl(220_25%_10%)] border border-white/12 rounded-2xl p-4 shadow-2xl shadow-black/50">
//         <div className="flex items-start gap-3">
//           <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
//             <Bell className="w-5 h-5 text-primary" />
//           </div>
//           <div className="flex-1 min-w-0">
//             <p className="text-white font-semibold text-sm">Stay in the loop</p>
//             <p className="text-white/40 text-xs mt-0.5 leading-relaxed">
//               Get instant alerts for check-ins, payments, and daily gym summaries.
//             </p>
//             <div className="flex gap-2 mt-3">
//               <button onClick={requestPermission} disabled={registering}
//                 className="flex-1 flex items-center justify-center gap-1.5 bg-linear-to-r from-primary to-orange-400 text-white text-xs font-semibold py-2 rounded-lg">
//                 <Bell className="w-3 h-3" /> {registering ? "Enabling..." : "Enable"}
//               </button>
//               <button onClick={dismiss}
//                 className="text-white/30 hover:text-white/60 text-xs px-3 py-2 rounded-lg transition-all">
//                 Later
//               </button>
//             </div>
//           </div>
//           <button onClick={dismiss} className="text-white/20 hover:text-white/50 shrink-0">
//             <X className="w-4 h-4" />
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }
// src/components/PwaNotifications.tsx
// Shows a push-notification permission banner after 3 seconds
// Subscribes to Web Push and registers the subscription server-side

"use client"

import { useEffect, useState } from "react"
import { Bell, X, BellOff } from "lucide-react"

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw     = atob(base64)
  return Uint8Array.from(Array.from(raw).map(c => c.charCodeAt(0)))
}

async function subscribeToPush(): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) return false // not configured

    const reg      = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()

    if (existing) {
      // Ensure server still has this subscription
      await fetch("/api/push/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(existing.toJSON()),
      }).catch(() => {})
      return true
    }

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })

    const res = await fetch("/api/push/subscribe", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(subscription.toJSON()),
    })

    return res.ok
  } catch (err) {
    console.warn("[Push] Subscription failed:", err)
    return false
  }
}

export function PwaNotifications() {
  const [show,    setShow]    = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("Notification" in window)) return
    if (!("serviceWorker" in navigator)) return

    // Don't show if VAPID key not configured
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return

    const permission = Notification.permission

    if (permission === "granted") {
      // Silently re-subscribe in background (handles session restarts)
      navigator.serviceWorker.ready
        .then(() => subscribeToPush())
        .catch(() => {})
      return
    }

    if (permission === "denied") return // user already declined, respect it

    // Check if user dismissed recently (7-day cooldown)
    try {
      const dismissed = localStorage.getItem("push-banner-dismissed")
      if (dismissed) {
        const age = Date.now() - parseInt(dismissed, 10)
        if (age < 7 * 86400000) return
      }
    } catch {}

    // Show banner after 3-second delay
    const timer = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleAllow = async () => {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        await subscribeToPush()
      }
    } catch (err) {
      console.warn("[Push] Permission error:", err)
    } finally {
      setLoading(false)
      setShow(false)
    }
  }

  const handleDismiss = () => {
    try { localStorage.setItem("push-banner-dismissed", String(Date.now())) } catch {}
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 left-0 right-0 mx-auto max-w-sm px-4 z-50 pointer-events-none">
      <div className="bg-[hsl(220_25%_12%)] border border-white/12 rounded-2xl p-4 shadow-2xl pointer-events-auto">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">Stay in the loop</p>
            <p className="text-white/50 text-xs mt-0.5 leading-relaxed">
              Get expiry alerts, payment confirmations and daily summaries on your device.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAllow}
                disabled={loading}
                className="flex-1 bg-primary text-white text-xs font-semibold rounded-lg py-2 hover:opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? "Enabling…" : "Enable Notifications"}
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 rounded-lg bg-white/8 text-white/50 hover:text-white text-xs transition-all"
              >
                <BellOff className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-white/20 hover:text-white transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
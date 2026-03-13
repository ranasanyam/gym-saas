// // src/components/PwaRegister.tsx
// // Registers the service worker on mount — client component
// "use client"

// import { useEffect } from "react"

// export function PwaRegister() {
//   useEffect(() => {
//     if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

//     window.addEventListener("load", () => {
//       navigator.serviceWorker
//         .register("/sw.js", { scope: "/" })
//         .then(reg => {
//           console.log("[GymStack SW] registered:", reg.scope)

//           // Check for updates every 60 seconds
//           setInterval(() => reg.update(), 60_000)

//           reg.addEventListener("updatefound", () => {
//             const newWorker = reg.installing
//             if (!newWorker) return
//             newWorker.addEventListener("statechange", () => {
//               if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
//                 // New content available — notify user
//                 if (window.confirm("GymStack has been updated. Reload to get the latest version?")) {
//                   newWorker.postMessage({ type: "SKIP_WAITING" })
//                   window.location.reload()
//                 }
//               }
//             })
//           })
//         })
//         .catch(err => console.warn("[GymStack SW] registration failed:", err))
//     })
//   }, [])

//   return null
// }

// src/components/PwaRegister.tsx
// Registers the service worker and handles "The object is in an invalid state" error
// Root cause: occurs when a SW with scope "/" already exists from a different script URL
// Fix: unregister stale registrations, then re-register fresh

"use client"

import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return

    const SW_URL = "/sw.js"

    const register = async () => {
      try {
        // Check for any existing registration with scope "/"
        const existing = await navigator.serviceWorker.getRegistration("/")

        if (existing) {
          // If the active SW's script URL differs from ours, it will cause "invalid state"
          // Safest fix: unregister it and start fresh
          const activeUrl = existing.active?.scriptURL ?? ""
          const isSameScript = activeUrl.endsWith(SW_URL) || activeUrl.includes(SW_URL)

          if (!isSameScript && activeUrl !== "") {
            console.log("[PWA] Unregistering stale service worker:", activeUrl)
            await existing.unregister()
          } else {
            // Same script — just trigger an update check for new SW version
            try {
              await existing.update()
            } catch {
              // update() can throw on some browsers — safe to ignore
            }
          }
        }

        // Register (or re-register) our service worker
        const registration = await navigator.serviceWorker.register(SW_URL, {
          scope:          "/",
          updateViaCache: "none", // Always fetch latest sw.js, never serve from browser cache
        })

        // When a new SW version is found, activate it immediately
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing
          if (!worker) return

          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              // Tell the new worker to skip waiting and take over
              worker.postMessage({ type: "SKIP_WAITING" })
            }
          })
        })

        // When a new SW takes control (after SKIP_WAITING), update is live
        // We don't auto-reload so we don't interrupt the user
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          console.log("[PWA] New service worker activated")
        })

      } catch (err: any) {
        // "The object is in an invalid state" and other registration errors handled here
        const msg = err?.message ?? String(err)

        if (msg.includes("invalid state")) {
          // Nuclear option: unregister ALL service workers and reload
          const regs = await navigator.serviceWorker.getRegistrations()
          await Promise.allSettled(regs.map(r => r.unregister()))
          // Don't reload automatically — user can refresh if needed
          console.warn("[PWA] Service worker was in invalid state — unregistered all. Please refresh.")
        } else if (process.env.NODE_ENV !== "production") {
          console.log("[PWA] SW registration note:", msg)
        }
      }
    }

    // Defer until page is fully loaded — SW registration is low priority
    if (document.readyState === "complete") {
      register()
    } else {
      window.addEventListener("load", register, { once: true })
    }
  }, [])

  return null
}
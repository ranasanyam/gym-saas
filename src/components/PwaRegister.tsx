// src/components/PwaRegister.tsx
// Registers the service worker on mount — client component
"use client"

import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then(reg => {
          console.log("[GymStack SW] registered:", reg.scope)

          // Check for updates every 60 seconds
          setInterval(() => reg.update(), 60_000)

          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing
            if (!newWorker) return
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New content available — notify user
                if (window.confirm("GymStack has been updated. Reload to get the latest version?")) {
                  newWorker.postMessage({ type: "SKIP_WAITING" })
                  window.location.reload()
                }
              }
            })
          })
        })
        .catch(err => console.warn("[GymStack SW] registration failed:", err))
    })
  }, [])

  return null
}
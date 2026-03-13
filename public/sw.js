// // public/sw.js  —  GymStack Service Worker
// const CACHE_NAME    = "GymStack-v1"
// const OFFLINE_URL   = "/offline"

// // Static assets to pre-cache on install
// const PRE_CACHE = [
//   "/",
//   "/offline",
//   "/manifest.json",
//   "/icons/icon-192x192.png",
//   "/icons/icon-512x512.png",
// ]

// // ── Install: pre-cache shell ──────────────────────────────────────────────────
// self.addEventListener("install", event => {
//   event.waitUntil(
//     caches.open(CACHE_NAME).then(cache => cache.addAll(PRE_CACHE))
//   )
//   self.skipWaiting()
// })

// // ── Activate: clean up old caches ─────────────────────────────────────────────
// self.addEventListener("activate", event => {
//   event.waitUntil(
//     caches.keys().then(keys =>
//       Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
//     )
//   )
//   self.clients.claim()
// })

// // ── Fetch: network-first for API/auth, cache-first for static assets ──────────
// self.addEventListener("fetch", event => {
//   const { request } = event
//   const url = new URL(request.url)

//   // Skip non-GET and cross-origin requests
//   if (request.method !== "GET" || url.origin !== location.origin) return

//   // ── API calls — network only, no caching ─────────────────────────────────
//   if (url.pathname.startsWith("/api/")) {
//     event.respondWith(
//       fetch(request).catch(() =>
//         new Response(JSON.stringify({ error: "You are offline" }), {
//           status: 503,
//           headers: { "Content-Type": "application/json" },
//         })
//       )
//     )
//     return
//   }

//   // ── NextAuth session — network only ──────────────────────────────────────
//   if (url.pathname.startsWith("/_next/") && url.pathname.includes("__nextauth")) return

//   // ── Static _next/static assets — cache first ─────────────────────────────
//   if (url.pathname.startsWith("/_next/static/")) {
//     event.respondWith(
//       caches.match(request).then(cached => {
//         if (cached) return cached
//         return fetch(request).then(response => {
//           if (response.ok) {
//             const clone = response.clone()
//             caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
//           }
//           return response
//         })
//       })
//     )
//     return
//   }

//   // ── Page navigations — network first, fall back to offline page ──────────
//   if (request.mode === "navigate") {
//     event.respondWith(
//       fetch(request).catch(() => caches.match(OFFLINE_URL))
//     )
//     return
//   }

//   // ── Everything else — stale-while-revalidate ─────────────────────────────
//   event.respondWith(
//     caches.match(request).then(cached => {
//       const networkFetch = fetch(request).then(response => {
//         if (response.ok) {
//           const clone = response.clone()
//           caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
//         }
//         return response
//       })
//       return cached ?? networkFetch
//     })
//   )
// })

// // ── Push notifications ────────────────────────────────────────────────────────
// self.addEventListener("push", event => {
//   if (!event.data) return
//   let data = {}
//   try { data = event.data.json() } catch { data = { title: "GymStack", body: event.data.text() } }

//   event.waitUntil(
//     self.registration.showNotification(data.title ?? "GymStack", {
//       body:    data.body    ?? "",
//       icon:    data.icon    ?? "/icons/icon-192x192.png",
//       badge:   data.badge   ?? "/icons/icon-72x72.png",
//       tag:     data.tag     ?? "GymStack-notification",
//       data:    data.url     ? { url: data.url } : {},
//       actions: data.actions ?? [],
//       vibrate: [100, 50, 100],
//     })
//   )
// })

// // ── Notification click — open or focus the relevant page ─────────────────────
// self.addEventListener("notificationclick", event => {
//   event.notification.close()
//   const url = event.notification.data?.url ?? "/"
//   event.waitUntil(
//     clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
//       for (const client of clientList) {
//         if (client.url === url && "focus" in client) return client.focus()
//       }
//       if (clients.openWindow) return clients.openWindow(url)
//     })
//   )
// })


// // public/sw.js — GymStack Service Worker v2
// const CACHE_NAME = "gymstack-v2"
// const STATIC_ASSETS = ["/offline", "/icons/icon-192x192.png"]

// // ── Install ────────────────────────────────────────────────
// self.addEventListener("install", e => {
//   e.waitUntil(
//     caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
//   )
// })

// // ── Activate ───────────────────────────────────────────────
// self.addEventListener("activate", e => {
//   e.waitUntil(
//     caches.keys()
//       .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
//       .then(() => self.clients.claim())
//   )
// })

// // ── Fetch ──────────────────────────────────────────────────
// self.addEventListener("fetch", e => {
//   const { request } = e
//   const url = new URL(request.url)

//   // API: always network, never cache
//   if (url.pathname.startsWith("/api/")) return

//   // Static assets: cache-first
//   if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
//     e.respondWith(
//       caches.match(request).then(cached => cached ?? fetch(request).then(res => {
//         const clone = res.clone()
//         caches.open(CACHE_NAME).then(c => c.put(request, clone))
//         return res
//       }))
//     )
//     return
//   }

//   // Navigation: network-first → offline fallback
//   if (request.mode === "navigate") {
//     e.respondWith(
//       fetch(request).catch(() => caches.match("/offline"))
//     )
//     return
//   }

//   // Everything else: stale-while-revalidate
//   e.respondWith(
//     caches.open(CACHE_NAME).then(cache =>
//       cache.match(request).then(cached => {
//         const fetchPromise = fetch(request).then(res => {
//           cache.put(request, res.clone())
//           return res
//         }).catch(() => cached)
//         return cached ?? fetchPromise
//       })
//     )
//   )
// })

// // ── Push Notifications ─────────────────────────────────────
// self.addEventListener("push", e => {
//   let data = { title: "GymStack", body: "You have a new notification", url: "/" }
//   try { data = { ...data, ...JSON.parse(e.data?.text() ?? "{}") } } catch {}

//   e.waitUntil(
//     self.registration.showNotification(data.title, {
//       body:    data.body,
//       icon:    data.icon  ?? "/icons/icon-192x192.png",
//       badge:   data.badge ?? "/icons/icon-72x72.png",
//       tag:     data.tag   ?? "gymstack-notification",
//       data:    { url: data.url ?? "/" },
//       vibrate: [200, 100, 200],
//       actions: [
//         { action: "open",    title: "Open App" },
//         { action: "dismiss", title: "Dismiss"  },
//       ],
//     })
//   )
// })

// // ── Notification click ─────────────────────────────────────
// self.addEventListener("notificationclick", e => {
//   e.notification.close()
//   if (e.action === "dismiss") return

//   const url = e.notification.data?.url ?? "/"
//   e.waitUntil(
//     self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
//       const existing = clients.find(c => c.url.includes(self.location.origin))
//       if (existing) { existing.focus(); existing.navigate(url) }
//       else self.clients.openWindow(url)
//     })
//   )
// })

// // ── Background Sync (future use) ──────────────────────────
// self.addEventListener("message", e => {
//   if (e.data?.type === "SKIP_WAITING") self.skipWaiting()
// })

// public/sw.js — GymStack Service Worker v4
// Fix: "The object is in an invalid state" — caused by duplicate SW registrations
// Solution: skipWaiting() immediately on install + clients.claim() on activate

const CACHE_NAME    = "gymstack-v4"
const STATIC_ASSETS = ["/offline"]

// ── Install ────────────────────────────────────────────────────────────────
self.addEventListener("install", e => {
  // Take control immediately, don't wait for old SW to be dismissed
  self.skipWaiting()

  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(STATIC_ASSETS.map(url =>
        cache.add(url).catch(() => null) // don't fail install if offline page missing
      ))
    )
  )
})

// ── Activate ───────────────────────────────────────────────────────────────
self.addEventListener("activate", e => {
  e.waitUntil(
    Promise.all([
      // Immediately control all clients (tabs/windows)
      self.clients.claim(),
      // Purge old caches
      caches.keys().then(keys =>
        Promise.all(
          keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
        )
      ),
    ])
  )
})

// ── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener("fetch", e => {
  const { request } = e
  const url = new URL(request.url)

  // Only intercept same-origin requests
  if (url.origin !== self.location.origin) return

  // API requests: always go straight to network, never cache
  if (url.pathname.startsWith("/api/")) return

  // Static assets: cache-first with network fallback
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")        ||
    /\.(png|ico|svg|woff2?|jpg|webp)$/.test(url.pathname)
  ) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE_NAME)
              .then(c => c.put(request, clone))
              .catch(() => {})
          }
          return res
        }).catch(() => cached ?? new Response("", { status: 503 }))
      })
    )
    return
  }

  // Navigation (page loads): network-first with offline fallback
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline").then(c => c ?? new Response("Offline", { status: 503 }))
      )
    )
    return
  }
})

// ── Push Notifications ─────────────────────────────────────────────────────
self.addEventListener("push", e => {
  // Default payload in case parsing fails
  let payload = {
    title: "GymStack",
    body:  "You have a new notification",
    icon:  "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    url:   "/",
    tag:   "gymstack-notification",
  }

  try {
    if (e.data) {
      const parsed = e.data.json()
      payload = {
        ...payload,
        ...parsed,
        // Ensure icon/badge always exist
        icon:  parsed.icon  ?? "/icons/icon-192x192.png",
        badge: parsed.badge ?? "/icons/icon-72x72.png",
      }
    }
  } catch {
    try {
      const text = e.data?.text()
      if (text) payload.body = text
    } catch {}
  }

  const options = {
    body:               payload.body,
    icon:               payload.icon,
    badge:              payload.badge,
    tag:                payload.tag,
    data:               { url: payload.url },
    vibrate:            [200, 100, 200],
    requireInteraction: false,
    actions: [
      { action: "open",    title: "Open App" },
      { action: "dismiss", title: "Dismiss"  },
    ],
  }

  e.waitUntil(
    self.registration
      .showNotification(payload.title, options)
      .catch(err => {
        // Silently swallow — showNotification can throw if permission revoked mid-session
        console.warn("[SW] showNotification failed:", err?.message ?? err)
      })
  )
})

// ── Notification Click ─────────────────────────────────────────────────────
self.addEventListener("notificationclick", e => {
  e.notification.close()

  if (e.action === "dismiss") return

  const targetUrl = e.notification.data?.url ?? "/"

  e.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(clients => {
        // Focus an existing open window if possible
        const existing = clients.find(c =>
          c.url.startsWith(self.location.origin) && "focus" in c
        )
        if (existing) {
          existing.focus()
          if ("navigate" in existing) existing.navigate(targetUrl)
          return
        }
        // Otherwise open a new tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
      })
      .catch(err => console.warn("[SW] notificationclick error:", err))
  )
})

// ── Message Handler ────────────────────────────────────────────────────────
// Allows app to send { type: "SKIP_WAITING" } to force-activate new SW
self.addEventListener("message", e => {
  if (e.data?.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
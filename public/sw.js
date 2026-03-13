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


// public/sw.js — GymStack Service Worker v2
const CACHE_NAME = "gymstack-v2"
const STATIC_ASSETS = ["/offline", "/icons/icon-192x192.png"]

// ── Install ────────────────────────────────────────────────
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  )
})

// ── Activate ───────────────────────────────────────────────
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// ── Fetch ──────────────────────────────────────────────────
self.addEventListener("fetch", e => {
  const { request } = e
  const url = new URL(request.url)

  // API: always network, never cache
  if (url.pathname.startsWith("/api/")) return

  // Static assets: cache-first
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(
      caches.match(request).then(cached => cached ?? fetch(request).then(res => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then(c => c.put(request, clone))
        return res
      }))
    )
    return
  }

  // Navigation: network-first → offline fallback
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(() => caches.match("/offline"))
    )
    return
  }

  // Everything else: stale-while-revalidate
  e.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(request).then(cached => {
        const fetchPromise = fetch(request).then(res => {
          cache.put(request, res.clone())
          return res
        }).catch(() => cached)
        return cached ?? fetchPromise
      })
    )
  )
})

// ── Push Notifications ─────────────────────────────────────
self.addEventListener("push", e => {
  let data = { title: "GymStack", body: "You have a new notification", url: "/" }
  try { data = { ...data, ...JSON.parse(e.data?.text() ?? "{}") } } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    data.icon  ?? "/icons/icon-192x192.png",
      badge:   data.badge ?? "/icons/icon-72x72.png",
      tag:     data.tag   ?? "gymstack-notification",
      data:    { url: data.url ?? "/" },
      vibrate: [200, 100, 200],
      actions: [
        { action: "open",    title: "Open App" },
        { action: "dismiss", title: "Dismiss"  },
      ],
    })
  )
})

// ── Notification click ─────────────────────────────────────
self.addEventListener("notificationclick", e => {
  e.notification.close()
  if (e.action === "dismiss") return

  const url = e.notification.data?.url ?? "/"
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin))
      if (existing) { existing.focus(); existing.navigate(url) }
      else self.clients.openWindow(url)
    })
  )
})

// ── Background Sync (future use) ──────────────────────────
self.addEventListener("message", e => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting()
})
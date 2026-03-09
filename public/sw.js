// public/sw.js  —  GymStack Service Worker
const CACHE_NAME    = "GymStack-v1"
const OFFLINE_URL   = "/offline"

// Static assets to pre-cache on install
const PRE_CACHE = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
]

// ── Install: pre-cache shell ──────────────────────────────────────────────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRE_CACHE))
  )
  self.skipWaiting()
})

// ── Activate: clean up old caches ─────────────────────────────────────────────
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch: network-first for API/auth, cache-first for static assets ──────────
self.addEventListener("fetch", event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and cross-origin requests
  if (request.method !== "GET" || url.origin !== location.origin) return

  // ── API calls — network only, no caching ─────────────────────────────────
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: "You are offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    )
    return
  }

  // ── NextAuth session — network only ──────────────────────────────────────
  if (url.pathname.startsWith("/_next/") && url.pathname.includes("__nextauth")) return

  // ── Static _next/static assets — cache first ─────────────────────────────
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // ── Page navigations — network first, fall back to offline page ──────────
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    )
    return
  }

  // ── Everything else — stale-while-revalidate ─────────────────────────────
  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      })
      return cached ?? networkFetch
    })
  )
})

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener("push", event => {
  if (!event.data) return
  let data = {}
  try { data = event.data.json() } catch { data = { title: "GymStack", body: event.data.text() } }

  event.waitUntil(
    self.registration.showNotification(data.title ?? "GymStack", {
      body:    data.body    ?? "",
      icon:    data.icon    ?? "/icons/icon-192x192.png",
      badge:   data.badge   ?? "/icons/icon-72x72.png",
      tag:     data.tag     ?? "GymStack-notification",
      data:    data.url     ? { url: data.url } : {},
      actions: data.actions ?? [],
      vibrate: [100, 50, 100],
    })
  )
})

// ── Notification click — open or focus the relevant page ─────────────────────
self.addEventListener("notificationclick", event => {
  event.notification.close()
  const url = event.notification.data?.url ?? "/"
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
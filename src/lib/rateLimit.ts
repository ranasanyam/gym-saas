// // src/lib/rateLimit.ts
// // Simple in-memory rate limiter — no Redis needed.
// // Uses a sliding window counter per key (IP address or email).
// //
// // For production at scale, swap the Map for Upstash Redis:
// //   npm install @upstash/ratelimit @upstash/redis
// //   https://github.com/upstash/ratelimit
// //
// // Current limits:
// //   Login:          5 attempts per 15 minutes per IP
// //   Forgot password: 3 attempts per 60 minutes per email

// interface RateLimitEntry {
//   count:     number
//   windowStart: number
// }

// const store = new Map<string, RateLimitEntry>()

// // Clean up stale entries every 10 minutes to prevent memory leaks
// setInterval(() => {
//   const now = Date.now()
//   for (const [key, entry] of store.entries()) {
//     if (now - entry.windowStart > 60 * 60 * 1000) {
//       store.delete(key)
//     }
//   }
// }, 10 * 60 * 1000)

// export interface RateLimitResult {
//   allowed:     boolean
//   remaining:   number
//   retryAfter:  number   // seconds until window resets
// }

// export function checkRateLimit(
//   key:           string,
//   maxRequests:   number,
//   windowSeconds: number,
// ): RateLimitResult {
//   const now        = Date.now()
//   const windowMs   = windowSeconds * 1000
//   const entry      = store.get(key)

//   if (!entry || now - entry.windowStart >= windowMs) {
//     // New window
//     store.set(key, { count: 1, windowStart: now })
//     return { allowed: true, remaining: maxRequests - 1, retryAfter: 0 }
//   }

//   if (entry.count >= maxRequests) {
//     const retryAfter = Math.ceil((windowMs - (now - entry.windowStart)) / 1000)
//     return { allowed: false, remaining: 0, retryAfter }
//   }

//   entry.count++
//   return {
//     allowed:    true,
//     remaining:  maxRequests - entry.count,
//     retryAfter: 0,
//   }
// }

// // ── Helpers to extract IP from Next.js requests ───────────────────────────────

// export function getClientIp(req: Request): string {
//   // Vercel sets x-forwarded-for
//   const forwarded = (req.headers as any).get?.("x-forwarded-for")
//     ?? (req.headers as any)["x-forwarded-for"]
//   if (forwarded) return forwarded.split(",")[0].trim()

//   const realIp = (req.headers as any).get?.("x-real-ip")
//     ?? (req.headers as any)["x-real-ip"]
//   if (realIp) return realIp

//   return "unknown"
// }

// // ── Pre-built limiters ────────────────────────────────────────────────────────

// // 5 login attempts per 15 minutes per IP
// export function checkLoginRateLimit(ip: string): RateLimitResult {
//   return checkRateLimit(`login:${ip}`, 5, 15 * 60)
// }

// // 3 password reset requests per hour per email
// export function checkForgotPasswordRateLimit(email: string): RateLimitResult {
//   return checkRateLimit(`forgot:${email.toLowerCase()}`, 3, 60 * 60)
// }

// // 10 registrations per hour per IP (prevent mass account creation)
// export function checkRegisterRateLimit(ip: string): RateLimitResult {
//   return checkRateLimit(`register:${ip}`, 10, 60 * 60)
// }


// src/lib/rateLimit.ts
// Simple in-memory rate limiter — no Redis needed.
// Uses a sliding window counter per key (IP address or email).
//
// For production at scale, swap the Map for Upstash Redis:
//   npm install @upstash/ratelimit @upstash/redis
//   https://github.com/upstash/ratelimit
//
// Current limits:
//   Login:          5 attempts per 15 minutes per IP
//   Forgot password: 3 attempts per 60 minutes per email

interface RateLimitEntry {
  count:     number
  windowStart: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up stale entries every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > 60 * 60 * 1000) {
      store.delete(key)
    }
  }
}, 10 * 60 * 1000)

export interface RateLimitResult {
  allowed:     boolean
  remaining:   number
  retryAfter:  number   // seconds until window resets
}

export function checkRateLimit(
  key:           string,
  maxRequests:   number,
  windowSeconds: number,
): RateLimitResult {
  const now        = Date.now()
  const windowMs   = windowSeconds * 1000
  const entry      = store.get(key)

  if (!entry || now - entry.windowStart >= windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: maxRequests - 1, retryAfter: 0 }
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((windowMs - (now - entry.windowStart)) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  entry.count++
  return {
    allowed:    true,
    remaining:  maxRequests - entry.count,
    retryAfter: 0,
  }
}

// ── Helpers to extract IP from Next.js requests ───────────────────────────────

export function getClientIp(req: Request): string {
  // Vercel sets x-forwarded-for
  const forwarded = (req.headers as any).get?.("x-forwarded-for")
    ?? (req.headers as any)["x-forwarded-for"]
  if (forwarded) return forwarded.split(",")[0].trim()

  const realIp = (req.headers as any).get?.("x-real-ip")
    ?? (req.headers as any)["x-real-ip"]
  if (realIp) return realIp

  return "unknown"
}

// ── Pre-built limiters ────────────────────────────────────────────────────────

// 5 login attempts per 15 minutes per IP
export function checkLoginRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(`login:${ip}`, 5, 15 * 60)
}

// 3 password reset requests per hour per email
export function checkForgotPasswordRateLimit(email: string): RateLimitResult {
  return checkRateLimit(`forgot:${email.toLowerCase()}`, 3, 60 * 60)
}

// 10 registrations per hour per IP (prevent mass account creation)
export function checkRegisterRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(`register:${ip}`, 10, 60 * 60)
}

// 3 OTP sends per 10 minutes per email (prevent OTP spam)
export function checkOtpSendRateLimit(email: string): RateLimitResult {
  return checkRateLimit(`otp_send:${email.toLowerCase()}`, 3, 10 * 60)
}

// 5 OTP verify attempts per 10 minutes per email (prevent brute force)
export function checkOtpVerifyRateLimit(email: string): RateLimitResult {
  return checkRateLimit(`otp_verify:${email.toLowerCase()}`, 5, 10 * 60)
}
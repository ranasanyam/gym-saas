// // src/lib/mobileAuth.ts
// // Drop-in helper for API routes to accept EITHER NextAuth sessions (web) OR
// // Bearer JWT tokens (mobile). No changes needed to existing routes — just swap
// // the auth pattern.
// //
// // USAGE IN API ROUTES:
// //   import { resolveProfileId } from "@/lib/mobileAuth"
// //   const profileId = await resolveProfileId(req)
// //   if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

// import { NextRequest } from "next/server"
// import jwt from "jsonwebtoken"
// import { auth } from "@/auth"

// const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET!

// interface JwtPayload {
//     profileId: string
//     role: string | null
//     type: string
// }

// /**
//  * Resolves the profileId from either:
//  *  1. A NextAuth session cookie (web)
//  *  2. An Authorization: Bearer <access_token> header (mobile)
//  *
//  * Returns null if neither is present or if the token is invalid.
//  */
// export async function resolveProfileId(req?: NextRequest): Promise<string | null> {
//     // Try Bearer token first (faster — no DB lookup)
//     if (req) {
//         const authHeader = req.headers.get("authorization")
//         if (authHeader?.startsWith("Bearer ")) {
//             try {
//                 const token = authHeader.slice(7)
//                 const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload
//                 if (payload.type === "access" && payload.profileId) {
//                     return payload.profileId
//                 }
//             } catch {
//                 // Invalid/expired — fall through to session check
//             }
//         }
//     }

//     // Fall back to NextAuth session (web)
//     try {
//         const session = await auth()
//         return session?.user?.id ?? null
//     } catch {
//         return null
//     }
// }

// /**
//  * Same as resolveProfileId but also returns the role.
//  * Useful for routes that need role-based access control.
//  */
// export async function resolveAuth(req?: NextRequest): Promise<{ profileId: string; role: string | null } | null> {
//     if (req) {
//         const authHeader = req.headers.get("authorization")
//         if (authHeader?.startsWith("Bearer ")) {
//             try {
//                 const token = authHeader.slice(7)
//                 const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload
//                 if (payload.type === "access" && payload.profileId) {
//                     return { profileId: payload.profileId, role: payload.role ?? null }
//                 }
//             } catch { }
//         }
//     }

//     try {
//         const session = await auth()
//         if (session?.user?.id) {
//             return { profileId: session.user.id, role: (session.user as any).role ?? null }
//         }
//     } catch { }

//     return null
// }
// src/lib/mobileAuth.ts
// Accepts EITHER NextAuth session cookies (web) OR Bearer JWT tokens (mobile).

import { NextRequest } from "next/server"
import jwt             from "jsonwebtoken"
import { auth }        from "@/auth"

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET

interface JwtPayload {
  profileId: string
  role:      string | null
  type:      string
}

export async function resolveProfileId(req?: NextRequest): Promise<string | null> {
  // 1. Try Bearer token (mobile)
  if (req) {
    const authHeader = req.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7)

      if (!ACCESS_TOKEN_SECRET) {
        console.error("[mobileAuth] JWT_SECRET is not set in environment variables!")
        // Don't return here — fall through to session check
      } else {
        try {
          const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload
          if (payload.type === "access" && payload.profileId) {
            return payload.profileId
          }
          console.warn("[mobileAuth] JWT payload invalid — missing type or profileId", payload)
        } catch (err: any) {
          console.warn("[mobileAuth] JWT verify failed:", err.message)
          // Expired or tampered — fall through to session check
        }
      }
    }
  }

  // 2. Fall back to NextAuth session (web)
  try {
    const session = await auth()
    return session?.user?.id ?? null
  } catch {
    return null
  }
}

export async function resolveAuth(req?: NextRequest): Promise<{ profileId: string; role: string | null } | null> {
  if (req) {
    const authHeader = req.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7)
      if (ACCESS_TOKEN_SECRET) {
        try {
          const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload
          if (payload.type === "access" && payload.profileId) {
            return { profileId: payload.profileId, role: payload.role ?? null }
          }
        } catch {}
      }
    }
  }

  try {
    const session = await auth()
    if (session?.user?.id) {
      return { profileId: session.user.id, role: (session.user as any).role ?? null }
    }
  } catch {}

  return null
}
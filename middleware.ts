// middleware.ts
// Route-level access control. Runs on every request before page/API rendering.
//
// Protection rules:
//   /owner/*  → requires authenticated session with role === "owner"
//   /trainer/* → requires authenticated session with role === "trainer"
//   /member/*  → requires authenticated session with role === "member"
//   /api/owner/* → requires owner role (blocks trainer/member from owner APIs)
//   /api/trainer/* → requires trainer role
//   /api/member/* → requires member role
//   Public routes → always pass through

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// ── Route permission map ──────────────────────────────────────────────────────
// Maps route prefix → allowed role(s).
// Order matters: more specific prefixes first.
const ROUTE_PERMISSIONS: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/owner",         roles: ["owner"] },
  { prefix: "/trainer",       roles: ["trainer"] },
  { prefix: "/member",        roles: ["member"] },
  { prefix: "/api/owner",     roles: ["owner"] },
  { prefix: "/api/trainer",   roles: ["trainer"] },
  { prefix: "/api/member",    roles: ["member"] },
]

// Routes that are always public (no auth check)
const PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/health",
  "/api/subscriptions/plans",
  "/api/billing/plans",
  "/api/push",
  "/(auth)",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/complete-profile",
  "/select-role",
  "/offline",
  "/_next",
  "/favicon",
  "/manifest",
  "/icons",
  "/sw.js",
]

// Role → default redirect when unauthorized
const ROLE_REDIRECT: Record<string, string> = {
  owner:   "/owner/dashboard",
  trainer: "/trainer/dashboard",
  member:  "/member/dashboard",
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  })

  // Always allow public routes
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Root "/" is the landing page — public
  if (pathname === "/") return NextResponse.next()

  // /dashboard → redirect to role-specific dashboard
  if (pathname === "/dashboard") {
    const role = token?.role as string | undefined
    const redirect = role ? ROLE_REDIRECT[role] ?? "/login" : "/login"
    return NextResponse.redirect(new URL(redirect, req.url))
  }

  // Find the most specific matching rule
  const rule = ROUTE_PERMISSIONS.find(r => pathname.startsWith(r.prefix))

  if (!rule) {
    // No rule → pass through (e.g. /api/profile/me is shared)
    return NextResponse.next()
  }

  // Must be authenticated
  if (!token?.sub && !token?.profileId) {
    const isApi = pathname.startsWith("/api/")
    if (isApi) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 })
    }
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const userRole = token.role as string | undefined

  // Must have the right role
  if (!userRole || !rule.roles.includes(userRole)) {
    const isApi = pathname.startsWith("/api/")
    if (isApi) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: `This route requires role: ${rule.roles.join(" or ")}` } },
        { status: 403 }
      )
    }
    // Redirect to their own dashboard
    const home = userRole ? ROLE_REDIRECT[userRole] ?? "/login" : "/login"
    return NextResponse.redirect(new URL(home, req.url))
  }

  return NextResponse.next()
}

export const config = {
  // Run middleware on all routes except static assets
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js|offline).*)",
  ],
}

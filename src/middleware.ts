// src/middleware.ts
// Route-level plan wall for gym owners.
// Runs at the Edge — reads the NextAuth JWT directly from the cookie.
// Any owner accessing /owner/* (except /owner/choose-plan) is redirected to
// /owner/choose-plan if they have not yet explicitly confirmed a plan.

import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// Routes inside /owner/* that are allowed without an active plan.
const PLAN_EXEMPT_OWNER_PATHS = [
  "/owner/choose-plan",
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only enforce for /owner/* page routes (not API routes — those are guarded by requireActivePlan).
  if (!pathname.startsWith("/owner/")) {
    return NextResponse.next()
  }

  // Allow exempt paths unconditionally.
  if (PLAN_EXEMPT_OWNER_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow static assets / Next internals.
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next()
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  })

  // Not authenticated → let auth handle it (NextAuth will redirect to /login).
  if (!token) return NextResponse.next()

  // Only apply the plan wall to owners.
  if (token.role !== "owner") return NextResponse.next()

  // hasActivePlan is stored in the JWT by auth.ts.
  // false + planExpired=false → never selected a plan → PENDING_SELECTION.
  // false + planExpired=true  → had a plan that expired.
  if (token.ownerPlanStatus !== "ACTIVE" || !token.hasActivePlan) {
    const choosePlanUrl = req.nextUrl.clone()
    choosePlanUrl.pathname = "/owner/choose-plan"
    choosePlanUrl.search   = token.planExpired ? "?expired=true" : ""
    return NextResponse.redirect(choosePlanUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/owner/:path*"],
}




// // updated code
// // proxy.ts
// import { NextResponse } from "next/server"
// import type { NextRequest } from "next/server"
// import { jwtVerify } from "jose"

// const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password"]

// async function getSessionFromRequest(req: NextRequest) {
//   try {
//     // NextAuth v5 stores session in this cookie
//     const cookieName =
//       process.env.NODE_ENV === "production"
//         ? "__Secure-authjs.session-token"
//         : "authjs.session-token"

//     const token = req.cookies.get(cookieName)?.value
//     if (!token) return null

//     const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
//     const { payload } = await jwtVerify(token, secret)
//     return payload
//   } catch {
//     return null
//   }
// }

// export async function proxy(req: NextRequest) {
//   const { nextUrl } = req
//   const pathname = nextUrl.pathname

//   const session = await getSessionFromRequest(req)
//   const isLoggedIn = !!session
//   const role = session?.role as string | undefined

//   // Always allow public routes
//   const isPublic = PUBLIC_ROUTES.some(
//     (r) => pathname === r || pathname.startsWith(r + "/")
//   )

//   if (isPublic) {
//     // Redirect logged-in users away from login/signup
//     if (isLoggedIn && ["/login", "/signup"].includes(pathname)) {
//       const dest =
//         role === "owner" ? "/owner/dashboard"
//         : role === "trainer" ? "/trainer/dashboard"
//         : role === "member" ? "/member/dashboard"
//         : "/select-role"
//       return NextResponse.redirect(new URL(dest, nextUrl))
//     }
//     return NextResponse.next()
//   }

//   // Not logged in → redirect to login
//   if (!isLoggedIn) {
//     const loginUrl = new URL("/login", nextUrl)
//     loginUrl.searchParams.set("callbackUrl", pathname)
//     return NextResponse.redirect(loginUrl)
//   }

//   // select-role — only for users who have NOT set a role yet
//   if (pathname.startsWith("/select-role")) {
//     if (role) {
//       // Already has a role — redirect to their dashboard
//       const dest =
//         role === "owner"   ? "/owner/dashboard"
//         : role === "trainer" ? "/trainer/dashboard"
//         : "/member/dashboard"
//       return NextResponse.redirect(new URL(dest, nextUrl))
//     }
//     return NextResponse.next()
//   }

//   // Any protected route — if no role yet, send to select-role first
//   if (!role && !pathname.startsWith("/api")) {
//     return NextResponse.redirect(new URL("/select-role", nextUrl))
//   }

//   // API routes — handle their own auth
//   if (pathname.startsWith("/api")) return NextResponse.next()

//   return NextResponse.next()
// }

// export const config = {
//   matcher: [
//     "/((?!_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js)).*)",
//   ],
// }


// proxy.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password"]

// Routes that handle their own auth/redirect logic.
// Middleware must NEVER intercept these — they read from DB directly and
// are responsible for routing the user to the correct destination.
// Intercepting them causes the "SelectRole flash" bug:
//   If the JWT cookie doesn't yet contain the role (e.g. milliseconds after
//   the OAuth callback sets it), middleware would redirect to /select-role,
//   which then quickly re-redirects once the session loads — the flash.
const SELF_ROUTING = [
  "/auth-redirect",   // post-OAuth landing — reads DB directly, handles all cases
]

async function getSessionFromRequest(req: NextRequest) {
  try {
    return await getToken({
      req,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    })
  } catch {
    return null
  }
}

function roleToDashboard(
  role: string | undefined,
  ownerPlanStatus?: string | null,
  hasActivePlan?: boolean,
): string {
  if (role === "owner") {
    return ownerPlanStatus === "ACTIVE" && hasActivePlan !== false
      ? "/owner/dashboard"
      : "/owner/choose-plan"
  }
  if (role === "trainer") return "/trainer/dashboard"
  if (role === "member")  return "/member/dashboard"
  return "/select-role"
}

// Owner routes always accessible regardless of plan status
const OWNER_PLAN_EXEMPT = [
  "/owner/choose-plan",
  "/owner/billing",
  "/owner/subscriptions",
]

export async function proxy(req: NextRequest) {
  const { nextUrl } = req
  const pathname = nextUrl.pathname

  // ── Self-routing pages: always pass through ─────────────────────────────
  // These pages read directly from the DB and handle their own redirects.
  // Middleware must not touch them — doing so causes race-condition flashes.
  if (SELF_ROUTING.some(r => pathname === r || pathname.startsWith(r + "/"))) {
    return NextResponse.next()
  }

  const session    = await getSessionFromRequest(req)
  const isLoggedIn = !!session
  const role       = session?.role as string | undefined
  const ownerPlanStatus = session?.ownerPlanStatus as string | null | undefined
  const hasActivePlan = session?.hasActivePlan as boolean | undefined

  // ── Public routes ────────────────────────────────────────────────────────
  const isPublic = PUBLIC_ROUTES.some(
    r => pathname === r || pathname.startsWith(r + "/")
  )

  if (isPublic) {
    // Redirect already-logged-in users away from login/signup
    if (isLoggedIn && ["/login", "/signup"].includes(pathname)) {
      return NextResponse.redirect(new URL(roleToDashboard(role, ownerPlanStatus, hasActivePlan), nextUrl))
    }
    return NextResponse.next()
  }

  // ── Not logged in → login ────────────────────────────────────────────────
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── /select-role: only for users without a role ──────────────────────────
  if (pathname.startsWith("/select-role")) {
    if (role) {
      // Already has a role → skip the page entirely
      return NextResponse.redirect(new URL(roleToDashboard(role, ownerPlanStatus, hasActivePlan), nextUrl))
    }
    return NextResponse.next()
  }

  // ── Protected routes: must have a role ───────────────────────────────────
  // If no role in JWT yet, send to select-role.
  // Note: this should rarely fire for OAuth users because auth-redirect
  // (which is in SELF_ROUTING) handles the post-OAuth flow before the user
  // can reach any protected route. This is a safety net for edge cases only.
  if (!role && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/select-role", nextUrl))
  }

  // ── API routes handle their own auth ─────────────────────────────────────
  if (pathname.startsWith("/api")) return NextResponse.next()

  // ── Owner plan gate ───────────────────────────────────────────────────────
  // hasActivePlan === false (strictly, not undefined) means the owner has no
  // active subscription or their plan has fully expired past the grace period.
  // undefined = old token without the field — pass through to avoid breaking
  // existing sessions on deploy.
  if (role === "owner" && (ownerPlanStatus !== "ACTIVE" || hasActivePlan === false)) {
    const isExempt = OWNER_PLAN_EXEMPT.some(
      p => pathname === p || pathname.startsWith(p + "/")
    )
    if (!isExempt) {
      const dest = new URL("/owner/choose-plan", nextUrl)
      if (session?.planExpired) dest.searchParams.set("expired", "true")
      return NextResponse.redirect(dest)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js)).*)",
  ],
}

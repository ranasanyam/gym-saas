// import NextAuth from "next-auth"
// import { authConfig } from "./src/auth.config"

// export default NextAuth(authConfig).auth

// export const config = {
//   matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
// }


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

//   // select-role — any logged-in user
//   if (pathname.startsWith("/select-role")) return NextResponse.next()

//   // API routes — handle their own auth
//   if (pathname.startsWith("/api")) return NextResponse.next()

//   return NextResponse.next()
// }

// export const config = {
//   matcher: [
//     "/((?!_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js)).*)",
//   ],
// }


// updated code
// proxy.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password"]

async function getSessionFromRequest(req: NextRequest) {
  try {
    // NextAuth v5 stores session in this cookie
    const cookieName =
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token"

    const token = req.cookies.get(cookieName)?.value
    if (!token) return null

    const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

export async function proxy(req: NextRequest) {
  const { nextUrl } = req
  const pathname = nextUrl.pathname

  const session = await getSessionFromRequest(req)
  const isLoggedIn = !!session
  const role = session?.role as string | undefined

  // Always allow public routes
  const isPublic = PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  )

  if (isPublic) {
    // Redirect logged-in users away from login/signup
    if (isLoggedIn && ["/login", "/signup"].includes(pathname)) {
      const dest =
        role === "owner" ? "/owner/dashboard"
        : role === "trainer" ? "/trainer/dashboard"
        : role === "member" ? "/member/dashboard"
        : "/select-role"
      return NextResponse.redirect(new URL(dest, nextUrl))
    }
    return NextResponse.next()
  }

  // Not logged in → redirect to login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // select-role — only for users who have NOT set a role yet
  if (pathname.startsWith("/select-role")) {
    if (role) {
      // Already has a role — redirect to their dashboard
      const dest =
        role === "owner"   ? "/owner/dashboard"
        : role === "trainer" ? "/trainer/dashboard"
        : "/member/dashboard"
      return NextResponse.redirect(new URL(dest, nextUrl))
    }
    return NextResponse.next()
  }

  // Any protected route — if no role yet, send to select-role first
  if (!role && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/select-role", nextUrl))
  }

  // API routes — handle their own auth
  if (pathname.startsWith("/api")) return NextResponse.next()

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js)).*)",
  ],
}
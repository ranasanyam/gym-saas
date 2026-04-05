// // src/app/auth-redirect/page.tsx
// // Server-side post-OAuth landing page.
// // Reads the role directly from the DB (not the JWT cache) and redirects:
// //   • existing user with role  → /{role}/dashboard
// //   • new user (role = null)   → /select-role
// //   • not signed in            → /login
// import { redirect } from "next/navigation"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"

// export default async function AuthRedirectPage() {
//   const session = await auth()

//   if (!session?.user?.id) {
//     redirect("/login")
//   }

//   const profile = await prisma.profile.findUnique({
//     where:  { id: session.user.id },
//     select: { role: true },
//   })

//   if (!profile) {
//     redirect("/login")
//   }

//   if (profile.role === "owner")   redirect("/owner/dashboard")
//   if (profile.role === "trainer") redirect("/trainer/dashboard")
//   if (profile.role === "member")  redirect("/member/dashboard")

//   // New user — no role yet
//   redirect("/select-role")
// }

// src/app/auth-redirect/page.tsx
//
// Post-OAuth landing page (server component).
// callbackUrl used by: signIn("google", { callbackUrl: "/auth-redirect" })
//
// WHY THIS EXISTS:
// After Google OAuth, the JWT cookie is set with the session. But the JWT's
// role field might not be populated yet if the jwt() callback DB query was
// slow, or if there was a timing gap between cookie-set and the redirect.
//
// Instead of relying on the JWT (which could be stale for milliseconds),
// this page reads role DIRECTLY from the database — the single authoritative
// source of truth for post-auth routing.
//
// It is intentionally excluded from middleware route-protection
// (see SELF_ROUTING in proxy.ts) so middleware never intercepts it.
//
// ROUTING DECISION:
//   profile.role is set  → /{role}/dashboard  (returning user — no flash possible)
//   profile.role is null → /select-role       (new OAuth user)
//   no session           → /login

import { redirect } from "next/navigation"
import { auth }     from "@/auth"
import { prisma }   from "@/lib/prisma"

export default async function AuthRedirectPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Read role directly from DB — never trust the JWT cache here.
  // The JWT may lag by milliseconds after the OAuth callback.
  const profile = await prisma.profile.findUnique({
    where:  { id: session.user.id },
    select: { role: true },
  })

  if (!profile) {
    redirect("/login")
  }

  if (profile.role === "owner")   redirect("/owner/dashboard")
  if (profile.role === "trainer") redirect("/trainer/dashboard")
  if (profile.role === "member")  redirect("/member/dashboard")

  // No role — new OAuth user
  redirect("/select-role")
}
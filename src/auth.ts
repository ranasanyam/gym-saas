// import NextAuth from "next-auth"
// import Google from "next-auth/providers/google"
// import Credentials from "next-auth/providers/credentials"
// import bcrypt from "bcryptjs"
// import { prisma } from "@/lib/prisma"
// import { authConfig } from "./auth.config"

// export const { handlers, auth, signIn, signOut } = NextAuth({
//   ...authConfig,
//   providers: [
//     Google,
//     Credentials({
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) return null

//         const profile = await prisma.profile.findUnique({
//           where: { email: credentials.email as string },
//         })

//         if (!profile || !profile.userId) return null

//         // fetch the hashed password from your auth store
//         // we store it on the profile via userId reference
//         const isValid = await bcrypt.compare(
//           credentials.password as string,
//           profile.userId // temporary — we'll add passwordHash to profile next
//         )

//         if (!isValid) return null

//         return {
//           id: profile.id,
//           email: profile.email,
//           name: profile.fullName,
//           image: profile.avatarUrl,
//         }
//       },
//     }),
//   ],
//   callbacks: {
//     async jwt({ token, user, account }) {
//       // On first sign in
//       if (user) {
//         token.profileId = user.id
//       }
//       // Handle OAuth — create profile if first time
//       if (account?.provider === "google" && token.email) {
//         const existing = await prisma.profile.findUnique({
//           where: { email: token.email },
//         })
//         if (existing) {
//           token.profileId = existing.id
//         }
//       }
//       return token
//     },
//     async session({ session, token }) {
//       if (token.profileId) {
//         session.user.id = token.profileId as string
//       }
//       return session
//     },
//     async signIn({ user, account }) {
//       if (account?.provider === "google") {
//         await handleOAuthSignIn({
//           email: user.email!,
//           name: user.name!,
//           image: user.image,
//           provider: "GOOGLE",
//           providerUid: account.providerAccountId,
//         })
//       }
//       return true
//     },
//   },
//   session: { strategy: "jwt" },
// })

// // ── Helper: create Profile + Wallet + ReferralCode on first OAuth login ──
// async function handleOAuthSignIn({
//   email,
//   name,
//   image,
//   provider,
//   providerUid,
// }: {
//   email: string
//   name: string
//   image?: string | null
//   provider: "GOOGLE"
//   providerUid: string
// }) {
//   const existing = await prisma.profile.findUnique({ where: { email } })

//   if (!existing) {
//     // New user — create everything in one transaction
//     await prisma.$transaction(async (tx) => {
//       const profile = await tx.profile.create({
//         data: {
//           userId: providerUid,
//           email,
//           fullName: name,
//           avatarUrl: image,
//         },
//       })

//       // Create wallet
//       await tx.wallet.create({
//         data: { profileId: profile.id },
//       })

//       // Create referral code
//       const code = generateReferralCode(name)
//       await tx.referralCode.create({
//         data: { profileId: profile.id, code },
//       })

//       // Link OAuth account
//       await tx.oAuthAccount.create({
//         data: {
//           profileId: profile.id,
//           provider,
//           providerUid,
//         },
//       })
//     })
//   }
// }

// function generateReferralCode(name: string): string {
//   const base = name.split(" ")[0].toUpperCase().slice(0, 6)
//   const suffix = Math.floor(1000 + Math.random() * 9000)
//   return `${base}${suffix}`
// }



// import NextAuth from "next-auth"
// import Google from "next-auth/providers/google"
// import Credentials from "next-auth/providers/credentials"
// import bcrypt from "bcryptjs"
// import { prisma } from "@/lib/prisma"

// export const { handlers, auth, signIn, signOut } = NextAuth({
//   pages: {
//     signIn: "/login",
//     error: "/login",
//   },

//   providers: [
//     Google,

//     Credentials({
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) return null

//         const profile = await prisma.profile.findUnique({
//           where: { email: credentials.email as string },
//           select: {
//             id: true,
//             email: true,
//             fullName: true,
//             avatarUrl: true,
//             passwordHash: true,
//             role: true,
//           },
//         })

//         if (!profile || !profile.passwordHash) return null

//         const isValid = await bcrypt.compare(
//           credentials.password as string,
//           profile.passwordHash
//         )

//         if (!isValid) return null

//         return {
//           id: profile.id,
//           email: profile.email,
//           name: profile.fullName,
//           image: profile.avatarUrl,
//           role: profile.role,
//         }
//       },
//     }),
//   ],

//   callbacks: {
//     async signIn({ user, account }) {
//       if (account?.provider === "google") {
//         try {
//           await handleOAuthSignIn({
//             email: user.email!,
//             name: user.name!,
//             image: user.image,
//             providerUid: account.providerAccountId,
//           })
//         } catch (err) {
//           console.error("OAuth sign-in error:", err)
//           return false
//         }
//       }
//       return true
//     },

//     async jwt({ token, user, account, trigger }) {
//       if (user) {
//         token.profileId = user.id
//         token.role = (user as any).role ?? null
//       }

//       if (account?.provider === "google" && token.email && !token.profileId) {
//         const profile = await prisma.profile.findUnique({
//           where: { email: token.email },
//           select: { id: true, role: true },
//         })
//         if (profile) {
//           token.profileId = profile.id
//           token.role = profile.role
//         }
//       }

//       // Re-fetch role when session.update() is called
//       if (trigger === "update" && token.profileId) {
//         const profile = await prisma.profile.findUnique({
//           where: { id: token.profileId as string },
//           select: { role: true },
//         })
//         if (profile) token.role = profile.role
//       }

//       return token
//     },

//     async session({ session, token }) {
//       if (token.profileId) session.user.id = token.profileId as string
//       if (token.role) session.user.role = token.role as string
//       return session
//     },
//   },

//   session: { strategy: "jwt" },
// })

// async function handleOAuthSignIn({
//   email, name, image, providerUid,
// }: {
//   email: string; name: string; image?: string | null; providerUid: string
// }) {
//   const existing = await prisma.profile.findUnique({
//     where: { email },
//     select: { id: true },
//   })

//   if (!existing) {
//     await prisma.$transaction(async (tx) => {
//       const profile = await tx.profile.create({
//         data: { userId: providerUid, email, fullName: name, avatarUrl: image },
//       })
//       await tx.wallet.create({ data: { profileId: profile.id } })
//       const code = generateReferralCode(name)
//       await tx.referralCode.create({ data: { profileId: profile.id, code } })
//       await tx.oAuthAccount.create({
//         data: { profileId: profile.id, provider: "GOOGLE", providerUid },
//       })
//     })
//   }
// }

// function generateReferralCode(name: string): string {
//   const base = name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6)
//   const suffix = Math.floor(1000 + Math.random() * 9000)
//   return `${base}${suffix}`
// }


// src/auth.ts
import NextAuth, { CredentialsSignin } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

// ── Subscription check ────────────────────────────────────────────────────────
// Called on sign-in and on trigger="update" to store plan status in the JWT.
// Grace period: 7 days after currentPeriodEnd before hasActivePlan flips false.
const GRACE_DAYS = 7
const INACTIVE_PLAN_STATUS = { hasActivePlan: false, planExpired: false }

async function checkHasActivePlan(profileId: string): Promise<{
  hasActivePlan: boolean
  planExpired:   boolean
}> {
  const now         = new Date()
  const graceCutoff = new Date(now.getTime() - GRACE_DAYS * 24 * 60 * 60 * 1000)

  const sub = await prisma.saasSubscription.findFirst({
    where:   { profileId },
    orderBy: { createdAt: "desc" },
    select:  { status: true, currentPeriodEnd: true },
  })

  if (!sub) return { hasActivePlan: false, planExpired: false }

  // Lifetime plans never expire
  if (sub.status === "LIFETIME") return { hasActivePlan: true, planExpired: false }

  const validStatuses = ["ACTIVE", "TRIALING"]
  if (!validStatuses.includes(sub.status)) return { hasActivePlan: false, planExpired: true }

  // Null currentPeriodEnd = unlimited duration (shouldn't happen for non-LIFETIME but handle it)
  if (sub.currentPeriodEnd === null) return { hasActivePlan: true, planExpired: false }

  // Within grace window: currentPeriodEnd > graceCutoff → still considered active
  if (sub.currentPeriodEnd > graceCutoff) return { hasActivePlan: true, planExpired: false }

  // Past grace period — fully expired
  return { hasActivePlan: false, planExpired: true }
}

async function getPlanStatusForRole(
  profileId: string,
  role: string | null | undefined,
  ownerPlanStatus: string | null | undefined,
) {
  if (role !== "owner") return INACTIVE_PLAN_STATUS
  if (ownerPlanStatus !== "ACTIVE") return INACTIVE_PLAN_STATUS

  try {
    return await checkHasActivePlan(profileId)
  } catch (error) {
    console.error("Failed to read SaaS plan status during auth:", error)
    return INACTIVE_PLAN_STATUS
  }
}

async function getOwnerPlanStatusForRole(profileId: string, role: string | null | undefined) {
  if (role !== "owner") return null

  try {
    const profile = await prisma.profile.findUnique({
      where:  { id: profileId },
      select: { ownerPlanStatus: true },
    })
    return profile?.ownerPlanStatus ?? null
  } catch (error) {
    console.error("Failed to read owner plan status during auth:", error)
    return null
  }
}

// ── Custom typed errors — code is passed through to signIn()'s res.error on the client
class OAuthAccountError extends CredentialsSignin {
  code = "oauth_account"   // account exists but was created via Google — no password
}
class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials"
}
class AccountNotFoundError extends CredentialsSignin {
  code = "account_not_found"
}
class ProfileInvitedError extends CredentialsSignin {
  code = "profile_invited" // owner-added user who hasn't completed their profile yet
}

// Detect whether an identifier looks like a mobile number (10 digits, optionally +91)
function isMobile(identifier: string): boolean {
  return /^(\+91)?[6-9]\d{9}$/.test(identifier.replace(/[\s-]/g, ""))
}

function normaliseMobile(raw: string): string {
  return raw.replace(/[\s\-+]/g, "").slice(-10)
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    Google,

    Credentials({
      credentials: {
        // "email" field doubles as mobile-number input — detected at runtime
        email:    { label: "Email or Mobile", type: "text"     },
        password: { label: "Password",        type: "password" },
      },
      async authorize(credentials) {
        const identifier = (credentials?.email    as string | undefined)?.trim() ?? ""
        const password   = (credentials?.password as string | undefined) ?? ""

        if (!identifier || !password) return null

        let profile: { id: string; passwordHash: string | null; role: string | null; status: string } | null = null

        if (isMobile(identifier)) {
          // Mobile login — look up by normalised mobile number
          const mobile = normaliseMobile(identifier)
          profile = await prisma.profile.findFirst({
            where:  { mobileNumber: { endsWith: mobile } },
            select: { id: true, passwordHash: true, role: true, status: true },
          })
        } else {
          // Email login
          const email = identifier.toLowerCase()
          profile = await prisma.profile.findUnique({
            where:  { email },
            select: { id: true, passwordHash: true, role: true, status: true },
          })
        }

        if (!profile) throw new AccountNotFoundError()

        // INVITED = owner added by mobile only; profile not yet completed
        if (profile.status === "INVITED") throw new ProfileInvitedError()

        // OAuth-only account — no password set
        if (!profile.passwordHash) throw new OAuthAccountError()

        const isValid = await bcrypt.compare(password, profile.passwordHash)
        if (!isValid) throw new InvalidCredentialsError()

        // Return only what we need — NOT email/name/image
        // Those are fetched fresh from /api/profile/me on every page load
        return { id: profile.id, role: profile.role } as any
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await handleOAuthSignIn({
            email:       user.email!,
            name:        user.name!,
            image:       user.image,
            providerUid: account.providerAccountId,
          })
        } catch (err) {
          console.error("OAuth sign-in error:", err)
          return false
        }
      }
      return true
    },

    async jwt({ token, user, account, trigger }) {
      // ── First sign-in: credentials ────────────────────────────────────────
      // user.id is profile.id (returned directly from authorize above)
      if (user && account?.provider === "credentials") {
        const profileId = user.id as string
        const role = (user as any).role ?? null
        const ownerPlanStatus = await getOwnerPlanStatusForRole(profileId, role)
        const planStatus = await getPlanStatusForRole(profileId, role, ownerPlanStatus)

        return {
          sub:             profileId,
          profileId,
          role,
          hasActivePlan:   planStatus.hasActivePlan,
          planExpired:     planStatus.planExpired,
          ownerPlanStatus,
        }
      }

      // ── First sign-in: Google OAuth ───────────────────────────────────────
      // token.email is available here; look up our DB profile id by email
      if (account?.provider === "google" && token.email) {
        const profile = await prisma.profile.findUnique({
          where:  { email: token.email },
          select: { id: true, role: true },
        })
        if (profile) {
          const ownerPlanStatus = await getOwnerPlanStatusForRole(profile.id, profile.role)
          const planStatus = await getPlanStatusForRole(profile.id, profile.role, ownerPlanStatus)
          return {
            sub:             token.sub,
            profileId:       profile.id,
            role:            profile.role,
            hasActivePlan:   planStatus.hasActivePlan,
            planExpired:     planStatus.planExpired,
            ownerPlanStatus,
          }
        }
        return token
      }

      // ── Subsequent requests ───────────────────────────────────────────────
      // user + account are undefined here — work from existing token fields

      // Safety: recover profileId from sub if somehow missing
      if (!token.profileId && token.sub) {
        token.profileId = token.sub
      }

      // Re-fetch role and plan status when:
      //   • session.update() is called (e.g. after role/plan is assigned)
      //   • role key is absent from the token (first request after deploy with old JWT)
      //   • hasActivePlan is absent (old token before this feature was added)
      // NOTE: do NOT use !token.role — that would hit DB on every request for
      // null-role users (fresh signups) and risks picking up a stale role mid-flow.
      if (
        (trigger === "update" || token.role === undefined || token.hasActivePlan === undefined) &&
        token.profileId
      ) {
        const profile = await prisma.profile.findUnique({
          where:  { id: token.profileId as string },
          select: { role: true, ownerPlanStatus: true },
        })
        const role = profile?.role ?? token.role
        const ownerPlanStatus = profile?.ownerPlanStatus ?? await getOwnerPlanStatusForRole(token.profileId as string, role)
        const planStatus = await getPlanStatusForRole(token.profileId as string, role, ownerPlanStatus)

        if (profile) {
          token.role            = profile.role
          token.ownerPlanStatus = ownerPlanStatus
        }
        token.hasActivePlan = planStatus.hasActivePlan
        token.planExpired   = planStatus.planExpired
      }

      return token
    },

    async session({ session, token }) {
      const profileId = (token.profileId ?? token.sub) as string | undefined
      if (profileId) session.user.id = profileId
      if (token.role) session.user.role = token.role as string
      if (token.hasActivePlan !== undefined) session.user.hasActivePlan = token.hasActivePlan as boolean
      if (token.ownerPlanStatus !== undefined) (session.user as any).ownerPlanStatus = token.ownerPlanStatus
      return session
    },
  },

  session: { strategy: "jwt" },
})

// ── OAuth helper ──────────────────────────────────────────────────────────────

async function handleOAuthSignIn({
  email, name, image, providerUid,
}: {
  email: string; name: string; image?: string | null; providerUid: string
}) {
  const existing = await prisma.profile.findUnique({
    where:  { email },
    select: { id: true },
  })

  if (!existing) {
    await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.create({
        data: { userId: providerUid, email, fullName: name, avatarUrl: image },
      })
      await tx.wallet.create({ data: { profileId: profile.id } })
      const code = generateReferralCode(name)
      await tx.referralCode.create({ data: { profileId: profile.id, code } })
      await tx.oAuthAccount.create({
        data: { profileId: profile.id, provider: "GOOGLE", providerUid },
      })
    })
  }
}

function generateReferralCode(name: string): string {
  const base   = name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6)
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${base}${suffix}`
}

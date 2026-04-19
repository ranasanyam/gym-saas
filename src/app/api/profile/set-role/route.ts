

// // src/app/api/auth/set-role/route.ts
// // When a new user picks "owner", we automatically assign the Free Trial plan.
// import { NextRequest, NextResponse } from "next/server"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"

// const VALID_ROLES = ["owner", "trainer", "member"] as const
// type Role = (typeof VALID_ROLES)[number]

// // Stable ID for Free Trial plan — matches seed-saas-plans.ts
// const FREE_TRIAL_PLAN_NAME = "free trial"

// async function assignFreeTrial(profileId: string) {
//   try {
//     // Find the Free Trial plan (by name, case-insensitive)
//     const plan = await prisma.saasPlan.findFirst({
//       where: { name: { equals: "Free Trial", mode: "insensitive" }, isActive: true },
//     })
//     if (!plan) {
//       console.warn("[set-role] Free Trial SaaS plan not found in DB — run seed script")
//       return
//     }

//     // Only assign if no subscription exists yet
//     const existing = await prisma.saasSubscription.findFirst({ where: { profileId } })
//     if (existing) return

//     const now = new Date()
//     const trialEnd = new Date(now)
//     trialEnd.setMonth(trialEnd.getMonth() + 1) // 1 month trial

//     await prisma.saasSubscription.create({
//       data: {
//         profileId,
//         saasPlanId: plan.id,
//         status: "TRIALING",
//         currentPeriodStart: now,
//         currentPeriodEnd: trialEnd,
//         trialEndsAt: trialEnd,
//       },
//     })
//   } catch (err) {
//     // Non-fatal — don't block role assignment if trial creation fails
//     console.error("[set-role] Failed to assign Free Trial:", err)
//   }
// }

// export async function POST(req: NextRequest) {
//   try {
//     const session = await auth()
//     if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//     const { role } = await req.json()
//     if (!VALID_ROLES.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 })

//     const profile = await prisma.profile.findUnique({
//       where: { id: session.user.id },
//       select: { role: true },
//     })

//     if (profile?.role !== null && profile?.role !== undefined) {
//       return NextResponse.json(
//         { error: "Role has already been set and cannot be changed." },
//         { status: 403 }
//       )
//     }

//     await prisma.profile.update({
//       where: { id: session.user.id },
//       data: { role: role as Role },
//     })

//     // Auto-assign Free Trial plan for new gym owners
//     if (role === "owner") {
//       await assignFreeTrial(session.user.id)
//     }

//     return NextResponse.json({ success: true, role })
//   } catch (error) {
//     console.error("Set role error:", error)
//     return NextResponse.json({ error: "Failed to set role. Please try again." }, { status: 500 })
//   }
// }


// src/app/api/profile/set-role/route.ts
// Moved OUT of /api/auth/ because NextAuth v5 handlers intercept ALL POST
// requests to /api/auth/* before custom route handlers can run.
// Role is set here; plan selection happens separately on /owner/choose-plan.
import { NextRequest, NextResponse } from "next/server"
import { resolveWebProfileId } from "@/lib/serverAuth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const VALID_ROLES = ["owner", "trainer", "member"] as const
type Role = (typeof VALID_ROLES)[number]

export async function POST(req: NextRequest) {
  try {
    const profileId = await resolveWebProfileId(req)
    if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { role } = await req.json()
    if (!VALID_ROLES.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 })

    const profile = await prisma.profile.findUnique({
      where:  { id: profileId },
      select: { role: true },
    })

    if (profile?.role !== null && profile?.role !== undefined) {
      return NextResponse.json(
        { error: "Role has already been set and cannot be changed." },
        { status: 403 }
      )
    }

    await prisma.profile.update({
      where: { id: profileId },
      data:  {
        role: role as Role,
        ownerPlanStatus: role === "owner" ? "PENDING_SELECTION" : null,
      },
    })

    return NextResponse.json({ success: true, role })
  } catch (error) {
    console.error("Set role error:", error)
    return NextResponse.json({ error: "Failed to set role. Please try again." }, { status: 500 })
  }
}

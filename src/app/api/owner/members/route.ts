
import { requireActivePlan } from "@/lib/requireActivePlan"

// src/app/api/owner/members/route.ts
import { NextRequest, NextResponse }   from "next/server"
import { resolveProfileId }            from "@/lib/mobileAuth"
import { prisma }                      from "@/lib/prisma"
import { sendPushToProfile }           from "@/lib/push"
import { getOwnerSubscription, getOwnerUsage, checkLimit, checkFeature } from "@/lib/subscription"
import { resolveInvitedProfile, findExistingGymMember, notifyLinkedProfile } from "@/lib/inviteHelpers"
import { sendMemberWelcomeEmail } from "@/lib/email"

function addMonths(date: Date, months: number): Date {
  const d   = new Date(date)
  const day = d.getDate()
  d.setMonth(d.getMonth() + months)
  if (d.getDate() !== day) d.setDate(0)
  return d
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response


  const { searchParams } = new URL(req.url)
  const gymId  = searchParams.get("gymId")
  const search = searchParams.get("search") ?? ""
  const status = searchParams.get("status") ?? ""
  const page   = parseInt(searchParams.get("page") ?? "1")
  const limit  = 20

  const gyms   = await prisma.gym.findMany({ where: { ownerId: profileId }, select: { id: true } })
  const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

  const where: any = {
    gymId: { in: gymIds },
    ...(status ? { status } : {}),
    ...(search ? {
      profile: {
        OR: [
          { fullName:     { contains: search, mode: "insensitive" } },
          { email:        { contains: search, mode: "insensitive" } },
          { mobileNumber: { contains: search, mode: "insensitive" } },
        ],
      },
    } : {}),
  }

  const [members, total] = await Promise.all([
    prisma.gymMember.findMany({
      where,
      include: {
        profile:        { select: { fullName: true, email: true, mobileNumber: true, avatarUrl: true, status: true } },
        membershipPlan: { select: { name: true, price: true } },
        gym:            { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.gymMember.count({ where }),
  ])

  return NextResponse.json({ members, total, pages: Math.ceil(total / limit) })
}

// ── POST ──────────────────────────────────────────────────────────────────────
// Accepts: { gymId, fullName, mobileNumber, membershipPlanId?, startDate? }
// Email, password, gender etc. are collected by the member via /complete-profile.
export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response


  // ── Subscription check ────────────────────────────────────────────────────
  const [sub, usage] = await Promise.all([
    getOwnerSubscription(profileId),
    getOwnerUsage(profileId),
  ])

  if (!sub || sub.isExpired) {
    return NextResponse.json(
      { error: "Your subscription has expired. Please renew to add members.", upgradeRequired: true },
      { status: 403 }
    )
  }

  const memberCheck = checkLimit(usage.members, sub.limits.maxMembers, "members")
  if (!memberCheck.allowed) {
    return NextResponse.json({ error: memberCheck.reason, upgradeRequired: true }, { status: 403 })
  }

  const crudCheck = checkFeature(sub.limits.hasMemberCrud, "Member management")
  if (!crudCheck.allowed) {
    return NextResponse.json({ error: crudCheck.reason, upgradeRequired: true }, { status: 403 })
  }

  const body = await req.json()
  const {
    gymId, fullName, mobileNumber, membershipPlanId, startDate, endDate, paymentReceived,
    email, gender, dateOfBirth, address, goals, avatarUrl,
  } = body

  if (!gymId)                return NextResponse.json({ error: "Gym is required" },              { status: 400 })
  if (!fullName?.trim())     return NextResponse.json({ error: "Full name is required" },        { status: 400 })
  if (!mobileNumber?.trim()) return NextResponse.json({ error: "Mobile number is required" },   { status: 400 })
  if (!membershipPlanId)     return NextResponse.json({ error: "Membership plan is required" }, { status: 400 })
  if (typeof paymentReceived !== "boolean") {
    return NextResponse.json(
      { error: "paymentReceived must be explicitly true or false.", code: "PAYMENT_RECEIVED_REQUIRED" },
      { status: 400 }
    )
  }

  const gym = await prisma.gym.findFirst({
    where:  { id: gymId, ownerId: profileId },
    select: { id: true, name: true },
  })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  // ── Resolve profile (create / reinvite / link) ────────────────────────────
  let result: Awaited<ReturnType<typeof resolveInvitedProfile>>
  try {
    result = await resolveInvitedProfile("member", gymId, gym.name, fullName.trim(), mobileNumber.trim())
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  const { outcome, profileId: memberProfileId } = result

  // Persist optional profile fields for brand-new profiles only (don't overwrite existing user data)
  if (outcome === "created") {
    const optionalData: Record<string, any> = {}
    if (email?.trim())    optionalData.email       = email.trim().toLowerCase()
    if (gender)           optionalData.gender      = gender
    if (dateOfBirth)      optionalData.dateOfBirth = new Date(dateOfBirth)
    if (address?.trim())  optionalData.address     = address.trim()
    if (Array.isArray(goals) && goals.length) optionalData.goals = goals
    if (avatarUrl?.trim()) optionalData.avatarUrl  = avatarUrl.trim()

    if (Object.keys(optionalData).length > 0) {
      await prisma.profile.update({ where: { id: memberProfileId }, data: optionalData }).catch(() => {})
    }
  }

  // Check if already a member of THIS gym
  const existing = await findExistingGymMember(memberProfileId, gymId)
  if (existing) {
    return NextResponse.json({ error: "This member is already enrolled in this gym" }, { status: 409 })
  }

  // ── Create GymMember record ───────────────────────────────────────────────
  const effectiveStart = startDate ? new Date(startDate) : new Date()
  let plan: { name: string; price: any; durationMonths: number } | null = null
  let effectiveEnd: Date | null = null

  if (membershipPlanId) {
    plan = await prisma.membershipPlan.findUnique({ where: { id: membershipPlanId } })
    if (plan) {
      // Use explicit end date from client if provided, otherwise auto-calculate
      effectiveEnd = endDate ? new Date(endDate) : addMonths(effectiveStart, plan.durationMonths)
    }
  }

  const member = await prisma.gymMember.create({
    data: {
      gymId,
      profileId:        memberProfileId,
      membershipPlanId: membershipPlanId || null,
      startDate:        effectiveStart,
      endDate:          effectiveEnd,
      status:           "ACTIVE",
      gymNameSnapshot:  gym.name,
    },
  })

  // ── Record payment if owner received cash ────────────────────────────────
  if (paymentReceived && membershipPlanId && plan) {
    await prisma.payment.create({
      data: {
        gymId,
        memberId:        member.id,
        membershipPlanId,
        amount:          plan.price,
        status:          "COMPLETED",
        paymentMethod:   "CASH",
        paymentDate:     new Date(),
        planNameSnapshot: plan.name,
      },
    }).catch(() => {}) // non-fatal
  }

  // ── Welcome email (fire-and-forget) — only for brand-new profiles with email ─
  if (outcome === "created" && email?.trim()) {
    const loginUrl = `${process.env.NEXTAUTH_URL ?? "https://gymstack.app"}/login`
    prisma.profile.findUnique({ where: { id: profileId }, select: { fullName: true } })
      .then(owner => sendMemberWelcomeEmail({
        to:         email.trim().toLowerCase(),
        memberName: fullName.trim(),
        gymName:    gym.name,
        ownerName:  owner?.fullName ?? gym.name,
        setupLink:  loginUrl,
      }))
      .catch(() => {})
  }

  // ── Post-create side-effects ──────────────────────────────────────────────
  if (outcome === "linked") {
    // ACTIVE profile silently added — send in-app notification only
    await notifyLinkedProfile(memberProfileId, gymId, gym.name, "member")
  }

  if (membershipPlanId && outcome !== "created" && outcome !== "reinvited") {
    // Enrolled ACTIVE member into a plan — notify them
    const enrolledPlan = await prisma.membershipPlan.findUnique({ where: { id: membershipPlanId }, select: { name: true } })
    const plan = enrolledPlan
    if (plan) {
      const title = `Welcome to ${gym.name}!`
      const msg   = `You've been enrolled in the ${plan.name} membership plan.`
      await Promise.allSettled([
        prisma.notification.create({
          data: { gymId, profileId: memberProfileId, title, message: msg, type: "BILLING" },
        }),
        sendPushToProfile(memberProfileId, {
          title, body: msg, url: "/member/payments", tag: "membership-enrolled",
        }).catch(() => {}),
      ])
    }
  }

  return NextResponse.json(
    { outcome, id: member.id, gymMemberId: member.id },
    { status: 201 }
  )
}
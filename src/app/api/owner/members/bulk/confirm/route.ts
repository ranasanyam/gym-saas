// src/app/api/owner/members/bulk/confirm/route.ts
// POST — commit bulk add after owner reviews the preview.
// All DB writes are wrapped in a single transaction (all-or-nothing).
// Body: { gymId, rows: [{ name, mobile, startDate?, endDate?, membershipPlanId, paymentReceived: boolean }] }

import { NextRequest, NextResponse }  from "next/server"
import { resolveProfileId }           from "@/lib/mobileAuth"
import { prisma }                     from "@/lib/prisma"
import { requireActivePlan }          from "@/lib/requireActivePlan"
import {
  getOwnerSubscription,
  getOwnerUsage,
  checkLimit,
  hasAccess,
} from "@/lib/subscription"
import {
  resolveInvitedProfile,
  findExistingGymMember,
  notifyLinkedProfile,
} from "@/lib/inviteHelpers"

interface BodyRow {
  name:             string
  mobile:           string
  startDate?:       string
  endDate?:         string
  membershipPlanId: string
  paymentReceived:  boolean
}

function addMonths(date: Date, months: number): Date {
  const d   = new Date(date)
  const day = d.getDate()
  d.setMonth(d.getMonth() + months)
  if (d.getDate() !== day) d.setDate(0)
  return d
}

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response

  // ── Plan gate ──────────────────────────────────────────────────────────────
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
  if (!hasAccess(sub.planSlug, "basic")) {
    return NextResponse.json(
      { error: "Bulk add requires the Basic plan or higher. Please upgrade.", upgradeRequired: true },
      { status: 403 }
    )
  }

  // ── Parse + validate body ──────────────────────────────────────────────────
  const body: { gymId: string; rows: BodyRow[] } = await req.json()
  const { gymId, rows } = body

  if (!gymId) return NextResponse.json({ error: "gymId is required" }, { status: 400 })
  if (!Array.isArray(rows) || rows.length === 0)
    return NextResponse.json({ error: "rows array is required" }, { status: 400 })
  if (rows.length > 500)
    return NextResponse.json({ error: "Max 500 rows per confirm" }, { status: 400 })

  // Validate every row has required fields
  const fieldErrors: { row: number; mobile: string; reason: string }[] = []
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    if (!r.membershipPlanId) {
      fieldErrors.push({ row: i, mobile: r.mobile ?? "", reason: "membershipPlanId is required" })
    }
    if (typeof r.paymentReceived !== "boolean") {
      fieldErrors.push({ row: i, mobile: r.mobile ?? "", reason: "paymentReceived must be true or false" })
    }
  }
  if (fieldErrors.length > 0) {
    return NextResponse.json({ error: "Validation failed", conflicts: fieldErrors }, { status: 400 })
  }

  // Check for duplicate mobiles within this batch
  const normMobile = (m: string) => m.replace(/\D/g, "").slice(-10)
  const seen       = new Map<string, number>()
  const batchDups: { row: number; mobile: string; reason: string }[] = []
  for (let i = 0; i < rows.length; i++) {
    const n = normMobile(rows[i].mobile ?? "")
    if (seen.has(n)) {
      batchDups.push({ row: i, mobile: rows[i].mobile, reason: "Duplicate mobile number in this batch" })
    } else {
      seen.set(n, i)
    }
  }
  if (batchDups.length > 0) {
    return NextResponse.json({ error: "Duplicate mobile numbers in batch", conflicts: batchDups }, { status: 409 })
  }

  // Verify gym ownership
  const gym = await prisma.gym.findFirst({
    where:  { id: gymId, ownerId: profileId },
    select: { id: true, name: true },
  })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  // Member limit check (approximate)
  const limitCheck = checkLimit(usage.members, sub.limits.maxMembers, "members")
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: limitCheck.reason, upgradeRequired: true }, { status: 403 })
  }

  // Pre-fetch all plans referenced
  const planIds  = new Set(rows.map(r => r.membershipPlanId).filter(Boolean))
  const plans    = await prisma.membershipPlan.findMany({
    where:  { id: { in: [...planIds] } },
    select: { id: true, name: true, price: true, durationMonths: true },
  })
  const planCache = new Map(plans.map(p => [p.id, p]))

  // ── Phase 1: resolve profiles (side effects — can't be rolled back) ────────
  type Resolved = {
    row:            BodyRow
    memberProfileId: string
    outcome:        string
    skip:           boolean
  }

  const resolutions = await Promise.all(
    rows.map(async (row): Promise<Resolved> => {
      try {
        const name   = (row.name   ?? "").trim()
        const mobile = (row.mobile ?? "").trim()
        if (!name || !mobile) return { row, memberProfileId: "", outcome: "skip", skip: true }

        const { outcome, profileId: memberProfileId } = await resolveInvitedProfile(
          "member", gymId, gym.name, name, mobile
        )
        const existingId = await findExistingGymMember(memberProfileId, gymId)
        if (existingId) return { row, memberProfileId, outcome: "already_here", skip: true }

        return { row, memberProfileId, outcome, skip: false }
      } catch {
        return { row, memberProfileId: "", outcome: "error", skip: true }
      }
    })
  )

  const actionable = resolutions.filter(r => !r.skip)
  const skipped    = resolutions.filter(r => r.skip).length

  if (actionable.length === 0) {
    return NextResponse.json({ added: 0, skipped, failed: [], total: rows.length })
  }

  // ── Phase 2: all DB writes in a single transaction ─────────────────────────
  try {
    const createdMembers = await prisma.$transaction(
      actionable.map(({ row, memberProfileId }) => {
        const plan       = planCache.get(row.membershipPlanId)
        const startDate  = row.startDate ? new Date(row.startDate) : new Date()
        let   endDate: Date | null = null
        if (row.endDate) {
          endDate = new Date(row.endDate)
        } else if (plan) {
          endDate = addMonths(startDate, plan.durationMonths)
        }

        return prisma.gymMember.create({
          data: {
            gymId,
            profileId:        memberProfileId,
            membershipPlanId: row.membershipPlanId || null,
            startDate,
            endDate,
            status:           "ACTIVE",
            gymNameSnapshot:  gym.name,
          },
          select: { id: true, profileId: true },
        })
      })
    )

    // Create payments + notifications outside transaction (non-fatal)
    await Promise.allSettled(
      actionable.map(async ({ row, memberProfileId, outcome }, i) => {
        const member = createdMembers[i]
        const plan   = planCache.get(row.membershipPlanId)

        if (row.paymentReceived && plan) {
          await prisma.payment.create({
            data: {
              gymId,
              memberId:         member.id,
              membershipPlanId: row.membershipPlanId,
              amount:           plan.price,
              status:           "COMPLETED",
              paymentMethod:    "CASH",
              paymentDate:      new Date(),
              planNameSnapshot: plan.name,
            },
          })
        }

        if (outcome === "linked") {
          await notifyLinkedProfile(memberProfileId, gymId, gym.name, "member")
        }
      })
    )

    return NextResponse.json({
      added:   actionable.length,
      skipped,
      failed:  [],
      total:   rows.length,
    })

  } catch (err: any) {
    console.error("[bulk/confirm] transaction failed:", err?.message ?? err)
    return NextResponse.json(
      { error: "Failed to add members. No members were added. Please try again.", detail: err?.message },
      { status: 500 }
    )
  }
}

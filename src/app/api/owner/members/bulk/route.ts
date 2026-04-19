import { requireActivePlan } from "@/lib/requireActivePlan"
// src/app/api/owner/members/bulk/route.ts
// POST — preview bulk add (no DB writes).
// Body: { gymId, rows: [{ name, mobile }] }
// Returns categorized preview that the client shows before committing.

import { NextRequest, NextResponse }      from "next/server"
import { resolveProfileId }               from "@/lib/mobileAuth"
import { prisma }                         from "@/lib/prisma"
import { getOwnerSubscription }           from "@/lib/subscription"
import { hasAccess }                      from "@/lib/subscription"

export interface BulkRow {
  name:   string
  mobile: string
}

export interface PreviewRow extends BulkRow {
  normMobile: string
}

export interface BulkPreview {
  newUsers:     PreviewRow[]   // not on GymStack → will create INVITED + SMS
  invited:      PreviewRow[]   // already INVITED (by another gym) → will reinvite
  onGymStack:   PreviewRow[]   // ACTIVE profile, not in this gym → will link silently
  alreadyHere:  PreviewRow[]   // already in this gym → skip
  invalid:      (BulkRow & { reason: string })[]  // bad mobile or empty name → skip
}

function normaliseMobile(raw: string): string {
  return raw.replace(/\D/g, "").slice(-10)
}

function isValidMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(mobile)
}

// ── POST — produce preview ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response

  // ── Plan gate: Basic+ can use bulk add ───────────────────────────────────────
  const sub = await getOwnerSubscription(profileId)
  if (!sub || sub.isExpired) {
    return NextResponse.json(
      { error: "Your subscription has expired. Please renew to use bulk add.", upgradeRequired: true },
      { status: 403 }
    )
  }
  if (!hasAccess(sub.planSlug, "basic")) {
    return NextResponse.json(
      { error: "Bulk add requires the Basic plan or higher. Please upgrade.", upgradeRequired: true },
      { status: 403 }
    )
  }

  const body = await req.json()
  const { gymId, rows }: { gymId: string; rows: BulkRow[] } = body

  if (!gymId) return NextResponse.json({ error: "gymId is required" }, { status: 400 })
  if (!Array.isArray(rows) || rows.length === 0)
    return NextResponse.json({ error: "rows array is required" }, { status: 400 })
  if (rows.length > 500)
    return NextResponse.json({ error: "Max 500 rows per bulk add" }, { status: 400 })

  // Verify gym belongs to this owner
  const gym = await prisma.gym.findFirst({
    where:  { id: gymId, ownerId: profileId },
    select: { id: true },
  })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  // ── Categorise rows ───────────────────────────────────────────────────────────
  const preview: BulkPreview = {
    newUsers: [], invited: [], onGymStack: [], alreadyHere: [], invalid: [],
  }

  // Collect valid mobiles for a single DB query
  const validRows: (BulkRow & { normMobile: string })[] = []

  for (const row of rows) {
    const name   = (row.name ?? "").trim()
    const mobile = normaliseMobile(row.mobile ?? "")

    if (!name) {
      preview.invalid.push({ name: row.name ?? "", mobile: row.mobile ?? "", reason: "Name is empty" })
      continue
    }
    if (!isValidMobile(mobile)) {
      preview.invalid.push({ name, mobile: row.mobile ?? "", reason: "Invalid mobile number" })
      continue
    }
    validRows.push({ name, mobile: row.mobile, normMobile: mobile })
  }

  if (validRows.length === 0) {
    return NextResponse.json({ preview })
  }

  // Batch lookup: all profiles matching any of the valid mobiles
  const profiles = await prisma.profile.findMany({
    where:  { mobileNumber: { in: validRows.map(r => r.normMobile) } },
    select: { id: true, mobileNumber: true, status: true },
  })
  const profileByMobile = new Map(profiles.map(p => [p.mobileNumber, p]))

  // Batch lookup: existing gym members for this gym whose profileId is in the found profiles
  const existingMembers = profiles.length
    ? await prisma.gymMember.findMany({
        where:  { gymId, profileId: { in: profiles.map(p => p.id) } },
        select: { profileId: true },
      })
    : []
  const memberProfileIds = new Set(existingMembers.map(m => m.profileId))

  for (const row of validRows) {
    const profile = profileByMobile.get(row.normMobile)

    if (!profile) {
      preview.newUsers.push({ name: row.name, mobile: row.mobile, normMobile: row.normMobile })
      continue
    }

    if (memberProfileIds.has(profile.id)) {
      preview.alreadyHere.push({ name: row.name, mobile: row.mobile, normMobile: row.normMobile })
      continue
    }

    if (profile.status === "INVITED") {
      preview.invited.push({ name: row.name, mobile: row.mobile, normMobile: row.normMobile })
    } else {
      preview.onGymStack.push({ name: row.name, mobile: row.mobile, normMobile: row.normMobile })
    }
  }

  return NextResponse.json({ preview })
}

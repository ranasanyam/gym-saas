import { requireActivePlan } from "@/lib/requireActivePlan"
// src/app/api/owner/members/upload-excel/route.ts
// POST multipart/form-data — parse Excel/CSV and return a preview (no DB writes).
// Fields: file (xlsx/csv), gymId
// Returns same BulkPreview shape as /bulk so the UI can reuse the same confirm flow.
// Columns supported: Name, Mobile, Membership Plan, Start Date, End Date, Payment Received

import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId }          from "@/lib/mobileAuth"
import { prisma }                    from "@/lib/prisma"
import { getOwnerSubscription, hasAccess } from "@/lib/subscription"
import * as XLSX                     from "xlsx"

const MAX_ROWS = 2000

function normaliseMobile(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "").slice(-10)
}

function isValidMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(mobile)
}

/** Parse a date string (YYYY-MM-DD, DD/MM/YYYY, or JS parseable) → ISO date string or null */
function parseDate(raw: string): string | null {
  if (!raw) return null
  const s = String(raw).trim()
  if (!s) return null

  // Already ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : s
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (dmy) {
    const iso = `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`
    const d   = new Date(iso)
    return isNaN(d.getTime()) ? null : iso
  }

  // Fallback: let JS parse it
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0]
}

/** Parse common boolean strings (Yes/No/True/False/1/0/Y/N) */
function parseBool(raw: string): boolean {
  const s = String(raw ?? "").trim().toLowerCase()
  return ["yes", "y", "true", "1"].includes(s)
}

interface ColMap {
  nameCol:            number
  mobileCol:          number
  planCol:            number | null
  startDateCol:       number | null
  endDateCol:         number | null
  paymentReceivedCol: number | null
}

function detectColumns(headers: string[]): ColMap | null {
  const lower = headers.map(h => String(h ?? "").toLowerCase().trim())

  const nameCol   = lower.findIndex(h => h.includes("name"))
  const mobileCol = lower.findIndex(h =>
    h.includes("mobile") || h.includes("phone") || h.includes("number") || h.includes("contact")
  )
  if (nameCol === -1 || mobileCol === -1) return null

  const planCol   = lower.findIndex(h => h.includes("plan") || h.includes("membership"))
  const startCol  = lower.findIndex(h => h.includes("start"))
  const endCol    = lower.findIndex(h => h.includes("end"))
  const paidCol   = lower.findIndex(h =>
    h.includes("payment") || h.includes("paid") || h.includes("received")
  )

  return {
    nameCol,
    mobileCol,
    planCol:            planCol !== -1 ? planCol : null,
    startDateCol:       startCol !== -1 ? startCol : null,
    endDateCol:         endCol !== -1 ? endCol : null,
    paymentReceivedCol: paidCol !== -1 ? paidCol : null,
  }
}

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response

  // ── Plan gate: Pro+ can upload Excel ─────────────────────────────────────────
  const sub = await getOwnerSubscription(profileId)
  if (!sub || sub.isExpired) {
    return NextResponse.json(
      { error: "Your subscription has expired.", upgradeRequired: true },
      { status: 403 }
    )
  }
  if (!hasAccess(sub.planSlug, "pro")) {
    return NextResponse.json(
      { error: "Excel/CSV upload requires the Pro plan or higher. Please upgrade.", upgradeRequired: true },
      { status: 403 }
    )
  }

  // ── Parse multipart form ──────────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 })
  }

  const gymId = formData.get("gymId") as string | null
  const file  = formData.get("file") as File | null

  if (!gymId) return NextResponse.json({ error: "gymId is required" }, { status: 400 })
  if (!file)  return NextResponse.json({ error: "file is required" },  { status: 400 })

  const ext = file.name.split(".").pop()?.toLowerCase()
  if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
    return NextResponse.json({ error: "Only .xlsx, .xls, or .csv files are accepted" }, { status: 400 })
  }

  // Verify gym
  const gym = await prisma.gym.findFirst({
    where:  { id: gymId, ownerId: profileId },
    select: { id: true },
  })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  // Fetch gym's membership plans for name → id matching
  const gymPlans = await prisma.membershipPlan.findMany({
    where:  { gymId },
    select: { id: true, name: true },
  })
  const planByName = new Map(gymPlans.map(p => [p.name.toLowerCase().trim(), p.id]))

  // ── Parse file with xlsx ──────────────────────────────────────────────────────
  const arrayBuffer = await file.arrayBuffer()
  const workbook    = XLSX.read(arrayBuffer, { type: "array", cellDates: true })
  const sheet       = workbook.Sheets[workbook.SheetNames[0]]
  const rawData     = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "", raw: false })

  if (rawData.length < 2) {
    return NextResponse.json({ error: "File is empty or has no data rows" }, { status: 400 })
  }

  const headers = rawData[0].map(String)
  const cols    = detectColumns(headers)

  if (!cols) {
    return NextResponse.json({
      error: `Could not find "Name" and "Mobile/Phone" columns. ` +
             `Found headers: ${headers.join(", ")}. ` +
             `Please ensure your file has columns named "Name" and "Mobile" (or "Phone").`,
    }, { status: 400 })
  }

  const dataRows = rawData.slice(1).slice(0, MAX_ROWS)

  // ── Categorise rows ───────────────────────────────────────────────────────────
  const preview = {
    newUsers:    [] as { name: string; mobile: string; normMobile: string; membershipPlanId?: string; startDate?: string; endDate?: string; paymentReceived?: boolean }[],
    invited:     [] as { name: string; mobile: string; normMobile: string; membershipPlanId?: string; startDate?: string; endDate?: string; paymentReceived?: boolean }[],
    onGymStack:  [] as { name: string; mobile: string; normMobile: string; membershipPlanId?: string; startDate?: string; endDate?: string; paymentReceived?: boolean }[],
    alreadyHere: [] as { name: string; mobile: string; normMobile: string }[],
    invalid:     [] as { name: string; mobile: string; reason: string }[],
  }

  const validRows: {
    name: string; mobile: string; normMobile: string
    membershipPlanId?: string; startDate?: string; endDate?: string; paymentReceived?: boolean
  }[] = []

  for (const row of dataRows) {
    const name       = String(row[cols.nameCol]   ?? "").trim()
    const mobileRaw  = String(row[cols.mobileCol] ?? "").trim()
    const normMobile = normaliseMobile(mobileRaw)

    if (!name) {
      preview.invalid.push({ name: "", mobile: mobileRaw, reason: "Name is empty" })
      continue
    }
    if (!isValidMobile(normMobile)) {
      preview.invalid.push({ name, mobile: mobileRaw, reason: "Invalid mobile number" })
      continue
    }

    // Optional extra columns
    const planName = cols.planCol !== null ? String(row[cols.planCol] ?? "").trim() : ""
    const membershipPlanId = planName
      ? (planByName.get(planName.toLowerCase()) ?? undefined)
      : undefined

    const startDate = cols.startDateCol !== null
      ? parseDate(String(row[cols.startDateCol] ?? "")) ?? undefined
      : undefined

    const endDate = cols.endDateCol !== null
      ? parseDate(String(row[cols.endDateCol] ?? "")) ?? undefined
      : undefined

    const paymentReceived = cols.paymentReceivedCol !== null
      ? parseBool(String(row[cols.paymentReceivedCol] ?? ""))
      : undefined

    validRows.push({ name, mobile: mobileRaw, normMobile, membershipPlanId, startDate, endDate, paymentReceived })
  }

  if (validRows.length > 0) {
    // Batch DB lookup
    const profiles = await prisma.profile.findMany({
      where:  { mobileNumber: { in: validRows.map(r => r.normMobile) } },
      select: { id: true, mobileNumber: true, status: true },
    })
    const profileByMobile = new Map(profiles.map(p => [p.mobileNumber, p]))

    const existingMembers = profiles.length
      ? await prisma.gymMember.findMany({
          where:  { gymId, profileId: { in: profiles.map(p => p.id) } },
          select: { profileId: true },
        })
      : []
    const memberProfileIds = new Set(existingMembers.map(m => m.profileId))

    for (const row of validRows) {
      const extra = {
        membershipPlanId: row.membershipPlanId,
        startDate:        row.startDate,
        endDate:          row.endDate,
        paymentReceived:  row.paymentReceived,
      }
      const profile = profileByMobile.get(row.normMobile)

      if (!profile) {
        preview.newUsers.push({ name: row.name, mobile: row.mobile, normMobile: row.normMobile, ...extra })
      } else if (memberProfileIds.has(profile.id)) {
        preview.alreadyHere.push({ name: row.name, mobile: row.mobile, normMobile: row.normMobile })
      } else if (profile.status === "INVITED") {
        preview.invited.push({ name: row.name, mobile: row.mobile, normMobile: row.normMobile, ...extra })
      } else {
        preview.onGymStack.push({ name: row.name, mobile: row.mobile, normMobile: row.normMobile, ...extra })
      }
    }
  }

  return NextResponse.json({ preview, totalParsed: rawData.length - 1 })
}

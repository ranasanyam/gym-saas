// src/app/api/owner/expenses/route.ts
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { resolveProfileId } from "@/lib/mobileAuth"
import { requireActivePlan } from "@/lib/requireActivePlan"
import { prisma } from "@/lib/prisma"
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, subMonths, subWeeks,
  startOfQuarter, endOfQuarter, subQuarters,
  startOfYear, endOfYear, subYears, format,
  eachDayOfInterval, eachMonthOfInterval,
} from "date-fns"

// ── Validate owner has access to this gym ────────────────────────────────────
async function ownerGyms(profileId: string): Promise<string[]> {
  const gyms = await prisma.gym.findMany({
    where:  { ownerId: profileId, isActive: true },
    select: { id: true },
  })
  return gyms.map(g => g.id)
}

function getDateRange(range: string, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const now = new Date()
  switch (range) {
    case "today":          return { start: startOfDay(now), end: endOfDay(now) }
    case "last_7_days":    return { start: startOfDay(new Date(now.getTime() - 6 * 86400000)), end: endOfDay(now) }
    case "last_30_days":   return { start: startOfDay(new Date(now.getTime() - 29 * 86400000)), end: endOfDay(now) }
    case "last_90_days": {
      // This Quarter — last 90 days rolling
      return { start: startOfDay(new Date(now.getTime() - 89 * 86400000)), end: endOfDay(now) }
    }
    case "financial_year": {
      // Indian financial year: Apr 1 – Mar 31
      const april = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
      return {
        start: startOfDay(new Date(april, 3, 1)),        // Apr 1
        end:   endOfDay(new Date(april + 1, 2, 31)),     // Mar 31 next year
      }
    }
    case "custom": {
      if (customStart && customEnd) {
        return {
          start: startOfDay(new Date(customStart)),
          end:   endOfDay(new Date(customEnd)),
        }
      }
      return { start: startOfDay(new Date(now.getTime() - 29 * 86400000)), end: endOfDay(now) }
    }
    default: return { start: startOfDay(new Date(now.getTime() - 29 * 86400000)), end: endOfDay(now) }
  }
}

// ── GET — list expenses with filters + aggregates ────────────────────────────
export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response


  const { searchParams } = new URL(req.url)
  const gymId      = searchParams.get("gymId")      ?? ""
  const range      = searchParams.get("range")      ?? "last_30_days"
  const customStart = searchParams.get("customStart") ?? undefined
  const customEnd   = searchParams.get("customEnd")   ?? undefined
  const category   = searchParams.get("category")   ?? ""
  const page       = parseInt(searchParams.get("page") ?? "1")
  const limit      = 20

  const allGymIds = await ownerGyms(profileId)
  if (!allGymIds.length) {
    return NextResponse.json({ expenses: [], total: 0, pages: 0, totalAmount: 0, byCategory: [], dailyExpenses: [] })
  }

  const gymIds    = gymId && allGymIds.includes(gymId) ? [gymId] : allGymIds
  const { start, end } = getDateRange(range, customStart, customEnd)

  const where: any = {
    gymId:       { in: gymIds },
    expenseDate: { gte: start, lte: end },
    ...(category ? { category } : {}),
  }

  const [expenses, total, totalAgg, categoryBreakdown] = await Promise.all([
    // Paginated expense list
    prisma.gymExpense.findMany({
      where,
      orderBy: { expenseDate: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        gym:     { select: { name: true } },
        addedBy: { select: { fullName: true } },
      },
    }),

    // Total count
    prisma.gymExpense.count({ where }),

    // Total amount
    prisma.gymExpense.aggregate({ where, _sum: { amount: true } }),

    // Breakdown by category
    prisma.gymExpense.groupBy({
      by:     ["category"],
      where,
      _sum:   { amount: true },
      _count: { id: true },
      orderBy:{ _sum: { amount: "desc" } },
    }),
  ])

  // Time-series (daily or monthly) for chart
  const isShortRange = ["today", "last_7_days", "last_30_days"].includes(range)
  const allInRange   = await prisma.gymExpense.findMany({
    where,
    select: { expenseDate: true, amount: true },
  })

  const buckets = new Map<string, number>()
  const keyFn   = (d: Date) => isShortRange ? format(d, "dd MMM") : format(d, "MMM yy")

  if (isShortRange) {
    eachDayOfInterval({ start, end }).forEach(d => { buckets.set(keyFn(d), 0) })
  } else {
    eachMonthOfInterval({ start, end }).forEach(d => { buckets.set(keyFn(d), 0) })
  }
  for (const e of allInRange) {
    const k = keyFn(new Date(e.expenseDate))
    buckets.set(k, (buckets.get(k) ?? 0) + Number(e.amount))
  }

  return NextResponse.json({
    expenses,
    total,
    pages:       Math.ceil(total / limit),
    totalAmount: Number(totalAgg._sum?.amount ?? 0),
    byCategory:  categoryBreakdown.map(c => ({
      category: c.category,
      total:    Number(c._sum?.amount ?? 0),
      count:    c._count.id,
    })),
    timeSeries: Array.from(buckets.entries()).map(([date, amount]) => ({ date, amount })),
    dateRange:  { start: start.toISOString(), end: end.toISOString() },
  })
}

// ── POST — create expense ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response


  const body = await req.json()
  const { gymId, title, amount, category, description, expenseDate, receiptUrl } = body

  if (!gymId)            return NextResponse.json({ error: "gymId is required" },      { status: 400 })
  if (!title?.trim())    return NextResponse.json({ error: "Title is required" },       { status: 400 })
  if (!amount || isNaN(parseFloat(amount))) return NextResponse.json({ error: "Valid amount is required" }, { status: 400 })
  if (!expenseDate)      return NextResponse.json({ error: "Expense date is required" }, { status: 400 })

  // Verify gym ownership
  const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: profileId } })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  const expense = await prisma.gymExpense.create({
    data: {
      gymId,
      addedById:   profileId,
      title:       title.trim(),
      amount:      parseFloat(amount),
      category:    category ?? "MISCELLANEOUS",
      description: description?.trim() || null,
      expenseDate: new Date(expenseDate),
      receiptUrl:  receiptUrl || null,
    },
    include: {
      gym:     { select: { name: true } },
      addedBy: { select: { fullName: true } },
    },
  })

  revalidatePath("/owner/dashboard")
  return NextResponse.json(expense, { status: 201 })
}
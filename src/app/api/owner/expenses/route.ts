// src/app/api/owner/expenses/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
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

function getDateRange(range: string): { start: Date; end: Date } {
  const now = new Date()
  switch (range) {
    case "today":         return { start: startOfDay(now),  end: endOfDay(now) }
    case "this_week":     return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
    case "last_week":     { const lw = subWeeks(now, 1); return { start: startOfWeek(lw, { weekStartsOn: 1 }), end: endOfWeek(lw, { weekStartsOn: 1 }) } }
    case "this_month":    return { start: startOfMonth(now), end: endOfMonth(now) }
    case "last_month":    { const lm = subMonths(now, 1); return { start: startOfMonth(lm), end: endOfMonth(lm) } }
    case "last_quarter":  { const lq = subQuarters(now, 1); return { start: startOfQuarter(lq), end: endOfQuarter(lq) } }
    case "last_6_months": return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) }
    case "last_year":     { const ly = subYears(now, 1); return { start: startOfYear(ly), end: endOfYear(ly) } }
    case "all":           return { start: new Date("2020-01-01"), end: endOfDay(now) }
    default:              return { start: startOfMonth(now), end: endOfMonth(now) }
  }
}

// ── GET — list expenses with filters + aggregates ────────────────────────────
export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const gymId    = searchParams.get("gymId") ?? ""
  const range    = searchParams.get("range") ?? "this_month"
  const category = searchParams.get("category") ?? ""
  const page     = parseInt(searchParams.get("page") ?? "1")
  const limit    = 20

  const allGymIds = await ownerGyms(profileId)
  if (!allGymIds.length) {
    return NextResponse.json({ expenses: [], total: 0, pages: 0, totalAmount: 0, byCategory: [], dailyExpenses: [] })
  }

  const gymIds    = gymId && allGymIds.includes(gymId) ? [gymId] : allGymIds
  const { start, end } = getDateRange(range)

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
  const isShortRange = ["today", "this_week", "last_week", "this_month", "last_month"].includes(range)
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

  return NextResponse.json(expense, { status: 201 })
}
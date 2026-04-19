// src/lib/dashboard-queries.ts
// Shared query helpers for the owner dashboard.
// Used by both the API route (mobile) and Server Components (web).

import { prisma } from "@/lib/prisma"
import {
  startOfDay, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, startOfHour, addHours,
  addDays, addWeeks, addMonths,
  subDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval,
  format,
} from "date-fns"

// ── Type ──────────────────────────────────────────────────────────────────────
export type DashRange =
  | "today"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "financial_year"
  | "custom"

// ── Range windows ─────────────────────────────────────────────────────────────
export function getRangeWindow(
  range: DashRange,
  customStart?: string | null,
  customEnd?:   string | null,
): { start: Date; end: Date } {
  const now = new Date()

  switch (range) {
    case "today":
      return { start: startOfDay(now), end: addDays(startOfDay(now), 1) }

    case "last_7_days":
      return { start: startOfDay(subDays(now, 6)), end: addDays(startOfDay(now), 1) }

    case "last_30_days":
      return { start: startOfDay(subDays(now, 29)), end: addDays(startOfDay(now), 1) }

    case "last_90_days":
      return { start: startOfDay(subDays(now, 89)), end: addDays(startOfDay(now), 1) }

    case "financial_year": {
      const fyYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
      return {
        start: new Date(fyYear,     3, 1, 0, 0, 0),
        end:   new Date(fyYear + 1, 3, 1, 0, 0, 0),
      }
    }

    case "custom":
      if (customStart && customEnd) {
        return {
          start: startOfDay(new Date(customStart)),
          end:   addDays(startOfDay(new Date(customEnd)), 1),
        }
      }
      return { start: startOfDay(subDays(now, 29)), end: addDays(startOfDay(now), 1) }

    default:
      return { start: startOfDay(subDays(now, 29)), end: addDays(startOfDay(now), 1) }
  }
}

export function getPreviousWindow(
  _range:     DashRange,
  rangeStart: Date,
  rangeEnd:   Date,
): { start: Date; end: Date } {
  const durationDays = Math.ceil(
    (rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000
  )
  return {
    start: startOfDay(subDays(rangeStart, durationDays)),
    end:   startOfDay(rangeStart),
  }
}

// ── Chart buckets ─────────────────────────────────────────────────────────────
export type Bucket = { label: string; start: Date; end: Date }

export function buildBuckets(range: DashRange, rangeStart: Date, rangeEnd: Date): Bucket[] {
  if (range === "today") {
    return Array.from({ length: 24 }, (_, h) => {
      const s = startOfHour(addHours(rangeStart, h))
      return { label: format(s, "HH:mm"), start: s, end: addHours(s, 1) }
    })
  }

  if (range === "last_7_days" || range === "last_30_days") {
    return eachDayOfInterval({ start: rangeStart, end: subDays(rangeEnd, 1) }).map(d => ({
      label: format(d, "d MMM"),
      start: startOfDay(d),
      end:   addDays(startOfDay(d), 1),
    }))
  }

  if (range === "last_90_days") {
    const weeks = eachWeekOfInterval({ start: rangeStart, end: rangeEnd }, { weekStartsOn: 1 })
    return weeks.map(w => {
      const s = startOfWeek(w, { weekStartsOn: 1 })
      return { label: format(s, "d MMM"), start: s, end: addWeeks(s, 1) }
    })
  }

  if (range === "financial_year") {
    return eachMonthOfInterval({ start: rangeStart, end: rangeEnd }).map(m => ({
      label: format(m, "MMM yy"),
      start: startOfMonth(m),
      end:   addMonths(startOfMonth(m), 1),
    }))
  }

  // custom — auto-detect granularity
  const durationDays = Math.round(
    (rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000
  )
  if (durationDays <= 14) {
    return eachDayOfInterval({ start: rangeStart, end: subDays(rangeEnd, 1) }).map(d => ({
      label: format(d, "d MMM"),
      start: startOfDay(d),
      end:   addDays(startOfDay(d), 1),
    }))
  }
  if (durationDays <= 90) {
    const weeks = eachWeekOfInterval({ start: rangeStart, end: rangeEnd }, { weekStartsOn: 1 })
    return weeks.map(w => {
      const s = startOfWeek(w, { weekStartsOn: 1 })
      return { label: format(s, "d MMM"), start: s, end: addWeeks(s, 1) }
    })
  }
  return eachMonthOfInterval({ start: rangeStart, end: rangeEnd }).map(m => ({
    label: format(m, "MMM yy"),
    start: startOfMonth(m),
    end:   addMonths(startOfMonth(m), 1),
  }))
}

// ── Per-bucket aggregation ────────────────────────────────────────────────────
export async function fetchBuckets(gymIds: string[], buckets: Bucket[]) {
  return Promise.all(
    buckets.map(async ({ label, start, end }) => {
      const [memAgg, suppAgg, expAgg] = await Promise.all([
        prisma.payment.aggregate({
          where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: start, lt: end } },
          _sum:  { amount: true },
        }),
        prisma.supplementSale.aggregate({
          where: { gymId: { in: gymIds }, soldAt: { gte: start, lt: end } },
          _sum:  { totalAmount: true },
        }),
        prisma.gymExpense.aggregate({
          where: { gymId: { in: gymIds }, expenseDate: { gte: start, lt: end } },
          _sum:  { amount: true },
        }),
      ])
      return {
        label,
        membershipRevenue: Number(memAgg._sum?.amount      ?? 0),
        supplementRevenue: Number(suppAgg._sum?.totalAmount ?? 0),
        expense:           Number(expAgg._sum?.amount       ?? 0),
      }
    })
  )
}

// ── Full dashboard stats ──────────────────────────────────────────────────────
// Single function that runs all queries in parallel.
// Used by both the Server Components (web) and the API route (mobile).
export async function getDashboardStats(
  gymIds:      string[],
  range:       DashRange,
  customStart?: string | null,
  customEnd?:   string | null,
) {
  const now        = new Date()
  const todayStart = startOfDay(now)
  const todayEnd   = addDays(todayStart, 1)
  const in7Days    = new Date(now.getTime() + 7 * 86_400_000)
  const in3Days    = new Date(now.getTime() + 3 * 86_400_000)
  const today      = startOfDay(now)

  const { start: rangeStart, end: rangeEnd } = getRangeWindow(range, customStart, customEnd)
  const { start: prevStart,  end: prevEnd   } = getPreviousWindow(range, rangeStart, rangeEnd)
  const buckets = buildBuckets(range, rangeStart, rangeEnd)

  const [
    chartData,
    totalMembers,
    rangeRevAgg, rangeSuppRevAgg,
    prevRevAgg,  prevSuppRevAgg,
    todayRevAgg, todaySuppRevAgg,
    todayAttendance, todayNewMembers,
    expiringMembers7, expiringMembers3, expiringToday, expiredMembers,
    rangeAttendance, rangeNewMembers,
    prevAttendance,  prevNewMembers,
    recentMembers, todayCheckins, recentSupplementSales,
    rangeExpenseAgg, todayExpenseAgg, prevExpenseAgg, recentExpenses,
    lowStockRaw,
  ] = await Promise.all([

    fetchBuckets(gymIds, buckets),

    prisma.gymMember.count({ where: { gymId: { in: gymIds }, status: "ACTIVE" } }),

    // Current-period revenue
    prisma.payment.aggregate({
      where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: rangeStart, lt: rangeEnd } },
      _sum:  { amount: true },
    }),
    prisma.supplementSale.aggregate({
      where: { gymId: { in: gymIds }, soldAt: { gte: rangeStart, lt: rangeEnd } },
      _sum:  { totalAmount: true },
    }),

    // Previous-period revenue
    prisma.payment.aggregate({
      where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: prevStart, lt: prevEnd } },
      _sum:  { amount: true },
    }),
    prisma.supplementSale.aggregate({
      where: { gymId: { in: gymIds }, soldAt: { gte: prevStart, lt: prevEnd } },
      _sum:  { totalAmount: true },
    }),

    // Today revenue
    prisma.payment.aggregate({
      where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: todayStart, lt: todayEnd } },
      _sum:  { amount: true },
    }),
    prisma.supplementSale.aggregate({
      where: { gymId: { in: gymIds }, soldAt: { gte: todayStart, lt: todayEnd } },
      _sum:  { totalAmount: true },
    }),

    // Today counts
    prisma.attendance.count({ where: { gymId: { in: gymIds }, checkInTime: { gte: todayStart, lt: todayEnd } } }),
    prisma.gymMember.count({ where: { gymId: { in: gymIds }, createdAt: { gte: todayStart, lt: todayEnd } } }),

    // Expiry
    prisma.gymMember.count({ where: { gymId: { in: gymIds }, status: "ACTIVE", endDate: { gte: now, lte: in7Days } } }),
    prisma.gymMember.count({ where: { gymId: { in: gymIds }, status: "ACTIVE", endDate: { gte: now, lte: in3Days } } }),
    prisma.gymMember.findMany({
      where:  { gymId: { in: gymIds }, status: "ACTIVE", endDate: { gte: todayStart, lt: todayEnd } },
      select: { profile: { select: { fullName: true } } },
      take:   5,
    }),
    prisma.gymMember.count({ where: { gymId: { in: gymIds }, endDate: { lt: today } } }),

    // Range attendance / new members (current + previous)
    prisma.attendance.count({ where: { gymId: { in: gymIds }, checkInTime: { gte: rangeStart, lt: rangeEnd } } }),
    prisma.gymMember.count({ where: { gymId: { in: gymIds }, createdAt: { gte: rangeStart, lt: rangeEnd } } }),
    prisma.attendance.count({ where: { gymId: { in: gymIds }, checkInTime: { gte: prevStart, lt: prevEnd } } }),
    prisma.gymMember.count({ where: { gymId: { in: gymIds }, createdAt: { gte: prevStart, lt: prevEnd } } }),

    // Lists
    prisma.gymMember.findMany({
      where:   { gymId: { in: gymIds } },
      orderBy: { createdAt: "desc" },
      take:    6,
      select: {
        id: true, createdAt: true, status: true,
        profile: { select: { fullName: true, avatarUrl: true, email: true } },
        gym:     { select: { name: true } },
      },
    }),
    prisma.attendance.findMany({
      where:   { gymId: { in: gymIds }, checkInTime: { gte: todayStart, lt: todayEnd } },
      orderBy: { checkInTime: "desc" },
      take:    8,
      select: {
        id: true, checkInTime: true, checkOutTime: true,
        member: { select: { profile: { select: { fullName: true, avatarUrl: true } } } },
      },
    }),
    prisma.supplementSale.findMany({
      where:   { gymId: { in: gymIds } },
      orderBy: { soldAt: "desc" },
      take:    6,
      select: {
        id: true, qty: true, totalAmount: true, memberName: true, soldAt: true,
        supplement: { select: { name: true, unitSize: true } },
        member:     { select: { profile: { select: { fullName: true } } } },
      },
    }),

    // Expenses
    prisma.gymExpense.aggregate({
      where: { gymId: { in: gymIds }, expenseDate: { gte: rangeStart, lt: rangeEnd } },
      _sum:  { amount: true },
    }),
    prisma.gymExpense.aggregate({
      where: { gymId: { in: gymIds }, expenseDate: { gte: todayStart, lt: todayEnd } },
      _sum:  { amount: true },
    }),
    prisma.gymExpense.aggregate({
      where: { gymId: { in: gymIds }, expenseDate: { gte: prevStart, lt: prevEnd } },
      _sum:  { amount: true },
    }),
    prisma.gymExpense.findMany({
      where:   { gymId: { in: gymIds }, expenseDate: { gte: rangeStart, lt: rangeEnd } },
      orderBy: { expenseDate: "desc" },
      take:    5,
      select:  { id: true, title: true, amount: true, category: true, expenseDate: true, gym: { select: { name: true } } },
    }),

    // Low-stock alerts: supplements where stock_qty <= low_stock_at (column-to-column, needs raw SQL)
    prisma.$queryRaw<{
      id: string; name: string; brand: string | null; category: string | null;
      stockQty: number; lowStockAt: number; gymId: string; gymName: string | null;
    }[]>`
      SELECT s.id, s.name, s.brand, s.category,
             s.stock_qty    AS "stockQty",
             s.low_stock_at AS "lowStockAt",
             s.gym_id       AS "gymId",
             g.name         AS "gymName"
      FROM   supplements s
      JOIN   gyms g ON g.id = s.gym_id
      WHERE  s.gym_id::text = ANY(${gymIds})
        AND  s.is_active = true
        AND  s.stock_qty <= s.low_stock_at
      ORDER  BY s.stock_qty ASC
    `,
  ])

  const rangeRevenue     = Number(rangeRevAgg._sum?.amount         ?? 0)
  const rangeSuppRevenue = Number(rangeSuppRevAgg._sum?.totalAmount ?? 0)
  const prevRevenue      = Number(prevRevAgg._sum?.amount          ?? 0)
  const prevSuppRevenue  = Number(prevSuppRevAgg._sum?.totalAmount  ?? 0)
  const todayMemRev      = Number(todayRevAgg._sum?.amount         ?? 0)
  const todaySuppRev     = Number(todaySuppRevAgg._sum?.totalAmount ?? 0)
  const rangeExpenses    = Number(rangeExpenseAgg._sum?.amount      ?? 0)
  const todayExpenses    = Number(todayExpenseAgg._sum?.amount      ?? 0)
  const prevExpenses     = Number(prevExpenseAgg._sum?.amount       ?? 0)

  return {
    range, rangeStart, rangeEnd, prevStart, prevEnd,

    totalMembers,
    rangeAttendance,  prevAttendance,
    rangeNewMembers,  prevNewMembers,
    todayAttendance,  todayNewMembers,

    rangeRevenue,     prevRevenue,
    rangeSuppRevenue, prevSuppRevenue,
    totalRevenue:     rangeRevenue + rangeSuppRevenue,
    prevTotalRevenue: prevRevenue  + prevSuppRevenue,

    rangeExpenses,    prevExpenses,
    netRevenue:       (rangeRevenue + rangeSuppRevenue) - rangeExpenses,
    prevNetRevenue:   (prevRevenue  + prevSuppRevenue)  - prevExpenses,

    todayRevenue:     todayMemRev + todaySuppRev,
    todayExpenses,

    expiringMembers:  expiringMembers7,
    expiringMembers3,
    expiringToday:    expiringToday.map(m => m.profile.fullName),
    expiredMembers,

    dailyMembershipRevenue: chartData.map(d => ({ date: d.label, amount: d.membershipRevenue })),
    dailySupplementRevenue: chartData.map(d => ({ date: d.label, amount: d.supplementRevenue })),
    dailyExpenses:          chartData.map(d => ({ date: d.label, amount: d.expense })),

    recentMembers,
    todayCheckins,
    recentSupplementSales,
    recentExpenses,
    lowStockAlerts: lowStockRaw.map(r => ({
      id:         r.id,
      name:       r.name,
      brand:      r.brand       ?? null,
      category:   r.category    ?? null,
      stockQty:   Number(r.stockQty),
      lowStockAt: Number(r.lowStockAt),
      gymId:      r.gymId,
      gym:        r.gymName ? { name: r.gymName } : null,
    })),
  }
}

// Export the return type so page components can type their data
export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>

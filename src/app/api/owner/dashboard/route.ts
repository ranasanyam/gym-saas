// // src/app/api/owner/dashboard/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { resolveProfileId }          from "@/lib/mobileAuth"
// import { prisma }                    from "@/lib/prisma"
// import {
//   startOfDay, endOfDay, startOfMonth, endOfMonth,
//   startOfWeek, endOfWeek, startOfHour, addHours,
//   subDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval,
//   format,
// } from "date-fns"

// export type DashRange =
//   | "today"
//   | "last_7_days"
//   | "last_30_days"
//   | "last_90_days"
//   | "financial_year"
//   | "custom"

// // ── Current period window ─────────────────────────────────────────────────────
// function getRangeWindow(
//   range: DashRange,
//   customStart?: string | null,
//   customEnd?:   string | null,
// ): { start: Date; end: Date } {
//   const now = new Date()
//   switch (range) {
//     case "today":
//       return { start: startOfDay(now), end: endOfDay(now) }
//     case "last_7_days":
//       return { start: startOfDay(subDays(now, 6)),  end: endOfDay(now) }
//     case "last_30_days":
//       return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) }
//     case "last_90_days":
//       return { start: startOfDay(subDays(now, 89)), end: endOfDay(now) }
//     case "financial_year": {
//       // India FY: April 1 – March 31
//       const fyYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
//       return {
//         start: new Date(fyYear,     3, 1, 0, 0, 0),
//         end:   new Date(fyYear + 1, 2, 31, 23, 59, 59),
//       }
//     }
//     case "custom":
//       if (customStart && customEnd) {
//         return {
//           start: startOfDay(new Date(customStart)),
//           end:   endOfDay(new Date(customEnd)),
//         }
//       }
//       return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) }
//     default:
//       return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) }
//   }
// }

// // ── Previous comparison period (same length, immediately preceding) ───────────
// function getPreviousWindow(
//   range:      DashRange,
//   rangeStart: Date,
//   rangeEnd:   Date,
// ): { start: Date; end: Date } {
//   const now = new Date()
//   switch (range) {
//     case "today":
//       return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) }
//     case "last_7_days":
//       return { start: startOfDay(subDays(now, 13)), end: endOfDay(subDays(now, 7)) }
//     case "last_30_days":
//       return { start: startOfDay(subDays(now, 59)), end: endOfDay(subDays(now, 30)) }
//     case "last_90_days":
//       return { start: startOfDay(subDays(now, 179)), end: endOfDay(subDays(now, 90)) }
//     case "financial_year": {
//       const fyYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
//       return {
//         start: new Date(fyYear - 1, 3, 1, 0, 0, 0),
//         end:   new Date(fyYear,     2, 31, 23, 59, 59),
//       }
//     }
//     case "custom": {
//       const durationDays = Math.max(1, Math.round(
//         (rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000
//       ))
//       return {
//         start: startOfDay(subDays(rangeStart, durationDays)),
//         end:   endOfDay(subDays(rangeStart, 1)),
//       }
//     }
//     default: {
//       const durationDays = Math.max(1, Math.round(
//         (rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000
//       ))
//       return {
//         start: startOfDay(subDays(rangeStart, durationDays)),
//         end:   endOfDay(subDays(rangeStart, 1)),
//       }
//     }
//   }
// }

// // ── Chart bucket granularity ──────────────────────────────────────────────────
// type Bucket = { label: string; start: Date; end: Date }

// function buildBuckets(range: DashRange, rangeStart: Date, rangeEnd: Date): Bucket[] {
//   if (range === "today") {
//     return Array.from({ length: 24 }, (_, h) => {
//       const s = startOfHour(addHours(rangeStart, h))
//       const e = addHours(s, 1)
//       return { label: format(s, "HH:mm"), start: s, end: e }
//     })
//   }

//   if (range === "last_7_days") {
//     return eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map(d => ({
//       label: format(d, "d MMM"),
//       start: startOfDay(d),
//       end:   endOfDay(d),
//     }))
//   }

//   if (range === "last_30_days") {
//     return eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map(d => ({
//       label: format(d, "d MMM"),
//       start: startOfDay(d),
//       end:   endOfDay(d),
//     }))
//   }

//   if (range === "last_90_days") {
//     const weeks = eachWeekOfInterval({ start: rangeStart, end: rangeEnd }, { weekStartsOn: 1 })
//     return weeks.map(w => {
//       const s = startOfWeek(w, { weekStartsOn: 1 })
//       const e = endOfWeek(w,   { weekStartsOn: 1 })
//       return { label: format(s, "d MMM"), start: s, end: e }
//     })
//   }

//   if (range === "financial_year") {
//     return eachMonthOfInterval({ start: rangeStart, end: rangeEnd }).map(m => ({
//       label: format(m, "MMM yy"),
//       start: startOfMonth(m),
//       end:   endOfMonth(m),
//     }))
//   }

//   // custom — auto-detect granularity by duration
//   const durationDays = Math.round(
//     (rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000
//   )
//   if (durationDays <= 14) {
//     return eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map(d => ({
//       label: format(d, "d MMM"),
//       start: startOfDay(d),
//       end:   endOfDay(d),
//     }))
//   }
//   if (durationDays <= 90) {
//     const weeks = eachWeekOfInterval({ start: rangeStart, end: rangeEnd }, { weekStartsOn: 1 })
//     return weeks.map(w => {
//       const s = startOfWeek(w, { weekStartsOn: 1 })
//       const e = endOfWeek(w,   { weekStartsOn: 1 })
//       return { label: format(s, "d MMM"), start: s, end: e }
//     })
//   }
//   return eachMonthOfInterval({ start: rangeStart, end: rangeEnd }).map(m => ({
//     label: format(m, "MMM yy"),
//     start: startOfMonth(m),
//     end:   endOfMonth(m),
//   }))
// }

// // ── Per-bucket aggregation ────────────────────────────────────────────────────
// async function fetchBuckets(gymIds: string[], buckets: Bucket[]) {
//   return Promise.all(
//     buckets.map(async ({ label, start, end }) => {
//       const [memAgg, suppAgg, expAgg] = await Promise.all([
//         prisma.payment.aggregate({
//           where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: start, lte: end } },
//           _sum:  { amount: true },
//         }),
//         prisma.supplementSale.aggregate({
//           where: { gymId: { in: gymIds }, soldAt: { gte: start, lte: end } },
//           _sum:  { totalAmount: true },
//         }),
//         prisma.gymExpense.aggregate({
//           where: { gymId: { in: gymIds }, expenseDate: { gte: start, lte: end } },
//           _sum:  { amount: true },
//         }),
//       ])
//       return {
//         label,
//         membershipRevenue: Number(memAgg._sum?.amount      ?? 0),
//         supplementRevenue: Number(suppAgg._sum?.totalAmount ?? 0),
//         expense:           Number(expAgg._sum?.amount       ?? 0),
//       }
//     })
//   )
// }

// // ── Main handler ──────────────────────────────────────────────────────────────
// export async function GET(req: NextRequest) {
//   try {
//     const profileId = await resolveProfileId(req)
//     if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//     const { searchParams } = new URL(req.url)
//     const filterGymId = searchParams.get("gymId") ?? ""
//     const range       = (searchParams.get("range") ?? "last_30_days") as DashRange
//     const customStart = searchParams.get("customStart")
//     const customEnd   = searchParams.get("customEnd")
//     const now         = new Date()

//     // 1. Owner gyms
//     const gyms = await prisma.gym.findMany({
//       where:  { ownerId: profileId, isActive: true },
//       select: { id: true, name: true, city: true },
//     })
//     const allGymIds = gyms.map(g => g.id)
//     const gymIds    = filterGymId && allGymIds.includes(filterGymId)
//       ? [filterGymId]
//       : allGymIds

//     if (!allGymIds.length) {
//       return NextResponse.json({
//         gyms: [], totalMembers: 0, activeGyms: 0, range,
//         rangeStart: now.toISOString(), rangeEnd: now.toISOString(),
//         prevStart:  now.toISOString(), prevEnd:   now.toISOString(),
//         rangeRevenue: 0, rangeSupplementRevenue: 0, totalRevenue: 0,
//         prevRevenue: 0, prevSuppRevenue: 0, prevTotalRevenue: 0,
//         rangeExpenses: 0, prevExpenses: 0, netRevenue: 0, prevNetRevenue: 0,
//         todayExpenses: 0,
//         rangeAttendance: 0, prevAttendance: 0,
//         rangeNewMembers: 0, prevNewMembers: 0,
//         todayRevenue: 0, todayAttendance: 0, todayNewMembers: 0,
//         expiringMembers: 0, expiringMembers3: 0, expiringToday: [],
//         recentMembers: [], todayCheckins: [], recentExpenses: [],
//         recentSupplementSales: [],
//         dailyMembershipRevenue: [], dailySupplementRevenue: [], dailyExpenses: [],
//         filteredGymId: null,
//       })
//     }

//     const { start: rangeStart, end: rangeEnd } = getRangeWindow(range, customStart, customEnd)
//     const { start: prevStart,  end: prevEnd   } = getPreviousWindow(range, rangeStart, rangeEnd)
//     const todayStart = startOfDay(now)
//     const todayEnd   = endOfDay(now)
//     const in7Days    = new Date(now.getTime() + 7 * 86_400_000)
//     const in3Days    = new Date(now.getTime() + 3 * 86_400_000)

//     // 2. Build chart buckets
//     const buckets = buildBuckets(range, rangeStart, rangeEnd)

//     // 3. All queries in parallel
//     const [
//       chartData,
//       totalMembers,
//       rangeRevAgg,     rangeSuppRevAgg,
//       prevRevAgg,      prevSuppRevAgg,
//       todayRevAgg,     todaySuppRevAgg,
//       todayAttendance, todayNewMembers,
//       expiringMembers7, expiringMembers3, expiringToday,
//       rangeAttendance, rangeNewMembers,
//       prevAttendance,  prevNewMembers,
//       recentMembers,   todayCheckins,    recentSupplementSales,
//       rangeExpenseAgg, todayExpenseAgg,  prevExpenseAgg, recentExpenses,
//     ] = await Promise.all([
//       fetchBuckets(gymIds, buckets),

//       prisma.gymMember.count({ where: { gymId: { in: gymIds }, status: "ACTIVE" } }),

//       // Current-period revenue
//       prisma.payment.aggregate({
//         where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: rangeStart, lte: rangeEnd } },
//         _sum:  { amount: true },
//       }),
//       prisma.supplementSale.aggregate({
//         where: { gymId: { in: gymIds }, soldAt: { gte: rangeStart, lte: rangeEnd } },
//         _sum:  { totalAmount: true },
//       }),

//       // Previous-period revenue
//       prisma.payment.aggregate({
//         where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: prevStart, lte: prevEnd } },
//         _sum:  { amount: true },
//       }),
//       prisma.supplementSale.aggregate({
//         where: { gymId: { in: gymIds }, soldAt: { gte: prevStart, lte: prevEnd } },
//         _sum:  { totalAmount: true },
//       }),

//       // Today
//       prisma.payment.aggregate({
//         where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: todayStart, lte: todayEnd } },
//         _sum:  { amount: true },
//       }),
//       prisma.supplementSale.aggregate({
//         where: { gymId: { in: gymIds }, soldAt: { gte: todayStart, lte: todayEnd } },
//         _sum:  { totalAmount: true },
//       }),
//       prisma.attendance.count({ where: { gymId: { in: gymIds }, checkInTime: { gte: todayStart, lte: todayEnd } } }),
//       prisma.gymMember.count({ where: { gymId: { in: gymIds }, createdAt: { gte: todayStart, lte: todayEnd } } }),

//       // Expiry
//       prisma.gymMember.count({ where: { gymId: { in: gymIds }, status: "ACTIVE", endDate: { gte: now, lte: in7Days } } }),
//       prisma.gymMember.count({ where: { gymId: { in: gymIds }, status: "ACTIVE", endDate: { gte: now, lte: in3Days } } }),
//       prisma.gymMember.findMany({
//         where:  { gymId: { in: gymIds }, status: "ACTIVE", endDate: { gte: todayStart, lte: todayEnd } },
//         select: { profile: { select: { fullName: true } } },
//         take:   5,
//       }),

//       // Range attendance / new members (current + previous)
//       prisma.attendance.count({ where: { gymId: { in: gymIds }, checkInTime: { gte: rangeStart, lte: rangeEnd } } }),
//       prisma.gymMember.count({ where: { gymId: { in: gymIds }, createdAt: { gte: rangeStart, lte: rangeEnd } } }),
//       prisma.attendance.count({ where: { gymId: { in: gymIds }, checkInTime: { gte: prevStart, lte: prevEnd } } }),
//       prisma.gymMember.count({ where: { gymId: { in: gymIds }, createdAt: { gte: prevStart, lte: prevEnd } } }),

//       // Lists
//       prisma.gymMember.findMany({
//         where:   { gymId: { in: gymIds } },
//         orderBy: { createdAt: "desc" },
//         take:    6,
//         select: {
//           id: true, createdAt: true, status: true,
//           profile: { select: { fullName: true, avatarUrl: true, email: true } },
//           gym:     { select: { name: true } },
//         },
//       }),
//       prisma.attendance.findMany({
//         where:   { gymId: { in: gymIds }, checkInTime: { gte: todayStart, lte: todayEnd } },
//         orderBy: { checkInTime: "desc" },
//         take:    8,
//         select: {
//           id: true, checkInTime: true, checkOutTime: true,
//           member: { select: { profile: { select: { fullName: true, avatarUrl: true } } } },
//         },
//       }),
//       prisma.supplementSale.findMany({
//         where:   { gymId: { in: gymIds } },
//         orderBy: { soldAt: "desc" },
//         take:    6,
//         select: {
//           id: true, qty: true, totalAmount: true, memberName: true, soldAt: true,
//           supplement: { select: { name: true, unitSize: true } },
//           member:     { select: { profile: { select: { fullName: true } } } },
//         },
//       }),

//       // Expenses (current + today + previous)
//       prisma.gymExpense.aggregate({
//         where: { gymId: { in: gymIds }, expenseDate: { gte: rangeStart, lte: rangeEnd } },
//         _sum:  { amount: true },
//       }),
//       prisma.gymExpense.aggregate({
//         where: { gymId: { in: gymIds }, expenseDate: { gte: todayStart, lte: todayEnd } },
//         _sum:  { amount: true },
//       }),
//       prisma.gymExpense.aggregate({
//         where: { gymId: { in: gymIds }, expenseDate: { gte: prevStart, lte: prevEnd } },
//         _sum:  { amount: true },
//       }),
//       prisma.gymExpense.findMany({
//         where:   { gymId: { in: gymIds }, expenseDate: { gte: rangeStart, lte: rangeEnd } },
//         orderBy: { expenseDate: "desc" },
//         take:    5,
//         select:  { id: true, title: true, amount: true, category: true, expenseDate: true, gym: { select: { name: true } } },
//       }),
//     ])

//     // 4. Chart arrays
//     const dailyMembershipRevenue = chartData.map(d => ({ date: d.label, amount: d.membershipRevenue }))
//     const dailySupplementRevenue = chartData.map(d => ({ date: d.label, amount: d.supplementRevenue }))
//     const dailyExpenses          = chartData.map(d => ({ date: d.label, amount: d.expense }))

//     // 5. Totals
//     const rangeRevenue       = Number(rangeRevAgg._sum?.amount         ?? 0)
//     const rangeSuppRevenue   = Number(rangeSuppRevAgg._sum?.totalAmount ?? 0)
//     const prevRevenue        = Number(prevRevAgg._sum?.amount          ?? 0)
//     const prevSuppRevenue    = Number(prevSuppRevAgg._sum?.totalAmount  ?? 0)
//     const todayMembershipRev = Number(todayRevAgg._sum?.amount         ?? 0)
//     const todaySuppRev       = Number(todaySuppRevAgg._sum?.totalAmount ?? 0)
//     const rangeExpenses      = Number(rangeExpenseAgg._sum?.amount      ?? 0)
//     const todayExpenses      = Number(todayExpenseAgg._sum?.amount      ?? 0)
//     const prevExpenses       = Number(prevExpenseAgg._sum?.amount       ?? 0)

//     console.log('daily expenses', dailyExpenses)

//     return NextResponse.json({
//       gyms,
//       activeGyms:    allGymIds.length,
//       filteredGymId: filterGymId || null,
//       range,
//       rangeStart:    rangeStart.toISOString(),
//       rangeEnd:      rangeEnd.toISOString(),
//       prevStart:     prevStart.toISOString(),
//       prevEnd:       prevEnd.toISOString(),

//       totalMembers,
//       rangeAttendance,  prevAttendance,
//       rangeNewMembers,  prevNewMembers,
//       todayAttendance,
//       todayNewMembers,

//       rangeRevenue,            prevRevenue,
//       rangeSupplementRevenue:  rangeSuppRevenue,
//       prevSuppRevenue,
//       totalRevenue:            rangeRevenue + rangeSuppRevenue,
//       prevTotalRevenue:        prevRevenue  + prevSuppRevenue,
//       rangeExpenses,           prevExpenses,
//       netRevenue:              (rangeRevenue + rangeSuppRevenue) - rangeExpenses,
//       prevNetRevenue:          (prevRevenue  + prevSuppRevenue)  - prevExpenses,

//       todayRevenue:    todayMembershipRev + todaySuppRev,
//       todayExpenses,

//       expiringMembers:  expiringMembers7,
//       expiringMembers3,
//       expiringToday:    expiringToday.map(m => m.profile.fullName),

//       dailyMembershipRevenue,
//       dailySupplementRevenue,
//       dailyExpenses,

//       recentMembers,
//       todayCheckins,
//       recentSupplementSales,
//       recentExpenses,
//     })
//   } catch (error: any) {
//     console.error("[Dashboard API]", error?.message ?? error)
//     return NextResponse.json(
//       { error: "Internal server error", detail: error?.message ?? String(error) },
//       { status: 500 }
//     )
//   }
// }




// src/app/api/owner/dashboard/route.ts

import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId }          from "@/lib/mobileAuth"
import { prisma }                    from "@/lib/prisma"
import {
  startOfDay, endOfDay, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, startOfHour, addHours,
  addDays, addWeeks, addMonths,
  subDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval,
  format,
} from "date-fns"

export type DashRange =
  | "today"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "financial_year"
  | "custom"

// ── Current period window ─────────────────────────────────────
function getRangeWindow(
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
        start: new Date(fyYear, 3, 1, 0, 0, 0),
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

// ── Previous window ───────────────────────────────────────────
function getPreviousWindow(
  range: DashRange,
  rangeStart: Date,
  rangeEnd: Date,
): { start: Date; end: Date } {
  const durationDays = Math.ceil(
    (rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000
  )

  return {
    start: startOfDay(subDays(rangeStart, durationDays)),
    end:   startOfDay(rangeStart),
  }
}

// ── Buckets (FIXED - NO OVERLAP) ──────────────────────────────
type Bucket = { label: string; start: Date; end: Date }

function buildBuckets(range: DashRange, rangeStart: Date, rangeEnd: Date): Bucket[] {
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
      end:   addDays(startOfDay(d), 1), // ✅ FIX
    }))
  }

  if (range === "last_90_days") {
    const weeks = eachWeekOfInterval({ start: rangeStart, end: rangeEnd }, { weekStartsOn: 1 })
    return weeks.map(w => {
      const s = startOfWeek(w, { weekStartsOn: 1 })
      return { label: format(s, "d MMM"), start: s, end: addWeeks(s, 1) } // ✅ FIX
    })
  }

  if (range === "financial_year") {
    return eachMonthOfInterval({ start: rangeStart, end: rangeEnd }).map(m => ({
      label: format(m, "MMM yy"),
      start: startOfMonth(m),
      end:   addMonths(startOfMonth(m), 1), // ✅ FIX
    }))
  }

  return []
}

// ── Per-bucket aggregation (FIXED) ────────────────────────────
async function fetchBuckets(gymIds: string[], buckets: Bucket[]) {
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
        membershipRevenue: Number(memAgg._sum?.amount ?? 0),
        supplementRevenue: Number(suppAgg._sum?.totalAmount ?? 0),
        expense:           Number(expAgg._sum?.amount ?? 0),
      }
    })
  )
}

// ── MAIN API ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const profileId = await resolveProfileId(req)
    if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const filterGymId = searchParams.get("gymId") ?? ""
    const range       = (searchParams.get("range") ?? "last_30_days") as DashRange
    const customStart = searchParams.get("customStart")
    const customEnd   = searchParams.get("customEnd")
    const now         = new Date()

    const gyms = await prisma.gym.findMany({
      where:  { ownerId: profileId, isActive: true },
      select: { id: true, name: true, city: true },
    })

    const allGymIds = gyms.map(g => g.id)
    const gymIds    = filterGymId && allGymIds.includes(filterGymId)
      ? [filterGymId]
      : allGymIds

    if (!allGymIds.length) {
      return NextResponse.json({ gyms: [] })
    }

    const { start: rangeStart, end: rangeEnd } = getRangeWindow(range, customStart, customEnd)
    const { start: prevStart,  end: prevEnd   } = getPreviousWindow(range, rangeStart, rangeEnd)

    const todayStart = startOfDay(now)
    const todayEnd   = addDays(todayStart, 1) // ✅ FIX

    const in7Days    = new Date(now.getTime() + 7 * 86_400_000)
    const in3Days    = new Date(now.getTime() + 3 * 86_400_000)

    const buckets = buildBuckets(range, rangeStart, rangeEnd)

    const [
      chartData,
      totalMembers,
      rangeRevAgg, rangeSuppRevAgg,
      prevRevAgg, prevSuppRevAgg,
      todayRevAgg, todaySuppRevAgg,
      todayAttendance, todayNewMembers,
      expiringMembers7, expiringMembers3, expiringToday,
      rangeAttendance, rangeNewMembers,
      prevAttendance, prevNewMembers,
      recentMembers, todayCheckins, recentSupplementSales,
      rangeExpenseAgg, todayExpenseAgg, prevExpenseAgg, recentExpenses,
    ] = await Promise.all([

      fetchBuckets(gymIds, buckets),

      prisma.gymMember.count({ where: { gymId: { in: gymIds }, status: "ACTIVE" } }),

      prisma.payment.aggregate({
        where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: rangeStart, lt: rangeEnd } },
        _sum: { amount: true },
      }),
      prisma.supplementSale.aggregate({
        where: { gymId: { in: gymIds }, soldAt: { gte: rangeStart, lt: rangeEnd } },
        _sum: { totalAmount: true },
      }),

      prisma.payment.aggregate({
        where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: prevStart, lt: prevEnd } },
        _sum: { amount: true },
      }),
      prisma.supplementSale.aggregate({
        where: { gymId: { in: gymIds }, soldAt: { gte: prevStart, lt: prevEnd } },
        _sum: { totalAmount: true },
      }),

      prisma.payment.aggregate({
        where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: todayStart, lt: todayEnd } },
        _sum: { amount: true },
      }),
      prisma.supplementSale.aggregate({
        where: { gymId: { in: gymIds }, soldAt: { gte: todayStart, lt: todayEnd } },
        _sum: { totalAmount: true },
      }),

      prisma.attendance.count({ where: { gymId: { in: gymIds }, checkInTime: { gte: todayStart, lt: todayEnd } } }),
      prisma.gymMember.count({ where: { gymId: { in: gymIds }, createdAt: { gte: todayStart, lt: todayEnd } } }),

      prisma.gymMember.count({ where: { gymId: { in: gymIds }, status: "ACTIVE", endDate: { gte: now, lte: in7Days } } }),
      prisma.gymMember.count({ where: { gymId: { in: gymIds }, status: "ACTIVE", endDate: { gte: now, lte: in3Days } } }),
      prisma.gymMember.findMany({
        where: { gymId: { in: gymIds }, status: "ACTIVE", endDate: { gte: todayStart, lt: todayEnd } },
        select: { profile: { select: { fullName: true } } },
        take: 5,
      }),

      prisma.attendance.count({ where: { gymId: { in: gymIds }, checkInTime: { gte: rangeStart, lt: rangeEnd } } }),
      prisma.gymMember.count({ where: { gymId: { in: gymIds }, createdAt: { gte: rangeStart, lt: rangeEnd } } }),

      prisma.attendance.count({ where: { gymId: { in: gymIds }, checkInTime: { gte: prevStart, lt: prevEnd } } }),
      prisma.gymMember.count({ where: { gymId: { in: gymIds }, createdAt: { gte: prevStart, lt: prevEnd } } }),

      prisma.gymMember.findMany({
        where: { gymId: { in: gymIds } },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          createdAt: true,
          status: true,
          profile: { select: { fullName: true, avatarUrl: true, email: true } },
          gym: { select: { name: true } },
        },
      }),

      prisma.attendance.findMany({
        where: { gymId: { in: gymIds }, checkInTime: { gte: todayStart, lt: todayEnd } },
        orderBy: { checkInTime: "desc" },
        take: 8,
        select: {
          id: true,
          checkInTime: true,
          checkOutTime: true,
          member: {
            select: {
              profile: { select: { fullName: true, avatarUrl: true } },
            },
          },
        },
      }),

      prisma.supplementSale.findMany({
        where: { gymId: { in: gymIds } },
        orderBy: { soldAt: "desc" },
        take: 6,
        select: {
          id: true,
          qty: true,
          totalAmount: true,
          memberName: true,
          soldAt: true,
          supplement: { select: { name: true, unitSize: true } },
          member: { select: { profile: { select: { fullName: true } } } },
        },
      }),

      prisma.gymExpense.aggregate({
        where: { gymId: { in: gymIds }, expenseDate: { gte: rangeStart, lt: rangeEnd } },
        _sum: { amount: true },
      }),
      prisma.gymExpense.aggregate({
        where: { gymId: { in: gymIds }, expenseDate: { gte: todayStart, lt: todayEnd } },
        _sum: { amount: true },
      }),
      prisma.gymExpense.aggregate({
        where: { gymId: { in: gymIds }, expenseDate: { gte: prevStart, lt: prevEnd } },
        _sum: { amount: true },
      }),
      prisma.gymExpense.findMany({
        where: { gymId: { in: gymIds }, expenseDate: { gte: rangeStart, lt: rangeEnd } },
        orderBy: { expenseDate: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          amount: true,
          category: true,
          expenseDate: true,
          gym: { select: { name: true } },
        },
      }),
    ])

    return NextResponse.json({
      gyms,
      activeGyms: allGymIds.length,
      filteredGymId: filterGymId || null,
      range,
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
      prevStart: prevStart.toISOString(),
      prevEnd: prevEnd.toISOString(),

      totalMembers,
      rangeAttendance,
      prevAttendance,
      rangeNewMembers,
      prevNewMembers,
      todayAttendance,
      todayNewMembers,

      rangeRevenue: Number(rangeRevAgg._sum?.amount ?? 0),
      prevRevenue: Number(prevRevAgg._sum?.amount ?? 0),
      rangeSupplementRevenue: Number(rangeSuppRevAgg._sum?.totalAmount ?? 0),
      prevSuppRevenue: Number(prevSuppRevAgg._sum?.totalAmount ?? 0),

      totalRevenue: Number(rangeRevAgg._sum?.amount ?? 0) + Number(rangeSuppRevAgg._sum?.totalAmount ?? 0),
      prevTotalRevenue: Number(prevRevAgg._sum?.amount ?? 0) + Number(prevSuppRevAgg._sum?.totalAmount ?? 0),

      rangeExpenses: Number(rangeExpenseAgg._sum?.amount ?? 0),
      prevExpenses: Number(prevExpenseAgg._sum?.amount ?? 0),

      netRevenue:
        (Number(rangeRevAgg._sum?.amount ?? 0) + Number(rangeSuppRevAgg._sum?.totalAmount ?? 0)) -
        Number(rangeExpenseAgg._sum?.amount ?? 0),

      prevNetRevenue:
        (Number(prevRevAgg._sum?.amount ?? 0) + Number(prevSuppRevAgg._sum?.totalAmount ?? 0)) -
        Number(prevExpenseAgg._sum?.amount ?? 0),

      todayRevenue:
        Number(todayRevAgg._sum?.amount ?? 0) +
        Number(todaySuppRevAgg._sum?.totalAmount ?? 0),

      todayExpenses: Number(todayExpenseAgg._sum?.amount ?? 0),

      expiringMembers: expiringMembers7,
      expiringMembers3,
      expiringToday: expiringToday.map(m => m.profile.fullName),

      dailyMembershipRevenue: chartData.map(d => ({ date: d.label, amount: d.membershipRevenue })),
      dailySupplementRevenue: chartData.map(d => ({ date: d.label, amount: d.supplementRevenue })),
      dailyExpenses: chartData.map(d => ({ date: d.label, amount: d.expense })),

      recentMembers,
      todayCheckins,
      recentSupplementSales,
      recentExpenses,
    })

  } catch (error: any) {
    console.error("[Dashboard API]", error?.message ?? error)
    return NextResponse.json(
      { error: "Internal server error", detail: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

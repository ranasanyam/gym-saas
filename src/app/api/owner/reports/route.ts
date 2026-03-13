// // src/app/api/owner/reports/route.ts
// import { NextResponse } from "next/server"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"
// import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"

// export async function GET() {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//   const gyms = await prisma.gym.findMany({ where: { ownerId: session.user.id }, select: { id: true, name: true } })
//   const gymIds = gyms.map(g => g.id)
//   if (!gymIds.length) return NextResponse.json({ revenue: [], memberGrowth: [], topGyms: [], summary: {} })

//   const now = new Date()

//   // Last 6 months revenue (membership + supplements)
//   const revenueData = await Promise.all(
//     Array.from({ length: 6 }, async (_, i) => {
//       const d = subMonths(now, 5 - i)
//       const [membership, supplements] = await Promise.all([
//         prisma.payment.aggregate({
//           where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: startOfMonth(d), lte: endOfMonth(d) } },
//           _sum: { amount: true },
//         }),
//         prisma.supplementSale.aggregate({
//           where: { gymId: { in: gymIds }, soldAt: { gte: startOfMonth(d), lte: endOfMonth(d) } },
//           _sum: { totalAmount: true },
//         }),
//       ])
//       const membershipRev  = Number(membership._sum?.amount ?? 0)
//       const supplementRev  = Number(supplements._sum?.totalAmount ?? 0)
//       return {
//         month:          format(d, "MMM"),
//         revenue:        membershipRev + supplementRev,
//         membershipRev,
//         supplementRev,
//       }
//     })
//   )

//   // Monthly member growth (last 6 months)
//   const memberGrowth = await Promise.all(
//     Array.from({ length: 6 }, (_, i) => {
//       const d = subMonths(now, 5 - i)
//       return prisma.gymMember.count({
//         where: { gymId: { in: gymIds }, createdAt: { gte: startOfMonth(d), lte: endOfMonth(d) } },
//       }).then(count => ({ month: format(d, "MMM"), members: count }))
//     })
//   )

//   // Per-gym summary
//   const topGyms = await Promise.all(
//     gyms.map(async gym => {
//       const [members, revenue, suppRevenue, attendance] = await Promise.all([
//         prisma.gymMember.count({ where: { gymId: gym.id, status: "ACTIVE" } }),
//         prisma.payment.aggregate({
//           where: { gymId: gym.id, status: "COMPLETED", paymentDate: { gte: startOfMonth(now) } },
//           _sum: { amount: true },
//         }),
//         prisma.supplementSale.aggregate({
//           where: { gymId: gym.id, soldAt: { gte: startOfMonth(now) } },
//           _sum: { totalAmount: true },
//         }),
//         prisma.attendance.count({ where: { gymId: gym.id, checkInTime: { gte: startOfMonth(now) } } }),
//       ])
//       const membershipRev = Number(revenue._sum?.amount ?? 0)
//       const supplementRev = Number(suppRevenue._sum?.totalAmount ?? 0)
//       return {
//         name: gym.name, members, attendance,
//         revenue:        membershipRev + supplementRev,
//         membershipRev,
//         supplementRev,
//       }
//     })
//   )

//   const [totalMembers, totalMembershipRevenue, totalSupplementRevenue, totalAttendance] = await Promise.all([
//     prisma.gymMember.count({ where: { gymId: { in: gymIds }, status: "ACTIVE" } }),
//     prisma.payment.aggregate({
//       where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: startOfMonth(now) } },
//       _sum: { amount: true },
//     }),
//     prisma.supplementSale.aggregate({
//       where: { gymId: { in: gymIds }, soldAt: { gte: startOfMonth(now) } },
//       _sum: { totalAmount: true },
//     }),
//     prisma.attendance.count({ where: { gymId: { in: gymIds }, checkInTime: { gte: startOfMonth(now) } } }),
//   ])

//   const membershipRev = Number(totalMembershipRevenue._sum?.amount ?? 0)
//   const supplementRev = Number(totalSupplementRevenue._sum?.totalAmount ?? 0)

//   return NextResponse.json({
//     revenue: revenueData,
//     memberGrowth,
//     topGyms,
//     summary: {
//       totalMembers,
//       totalRevenue:       membershipRev + supplementRev,
//       membershipRevenue:  membershipRev,
//       supplementRevenue:  supplementRev,
//       totalAttendance,
//     },
//   })
// }


// src/app/api/owner/reports/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, subMonths, subWeeks,
  startOfQuarter, endOfQuarter, subQuarters, subYears,
  startOfYear, endOfYear, format,
  eachMonthOfInterval, eachDayOfInterval,
} from "date-fns"

type Range =
  | "today" | "this_week" | "last_week" | "this_month"
  | "last_month" | "last_quarter" | "last_6_months" | "last_year" | "all"

function getDateRange(range: Range): { start: Date; end: Date; groupBy: "day" | "month" } {
  const now = new Date()
  switch (range) {
    case "today":
      return { start: startOfDay(now),  end: endOfDay(now),   groupBy: "day" }
    case "this_week":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }), groupBy: "day" }
    case "last_week": {
      const lw = subWeeks(now, 1)
      return { start: startOfWeek(lw, { weekStartsOn: 1 }), end: endOfWeek(lw, { weekStartsOn: 1 }), groupBy: "day" }
    }
    case "this_month":
      return { start: startOfMonth(now), end: endOfMonth(now), groupBy: "day" }
    case "last_month": {
      const lm = subMonths(now, 1)
      return { start: startOfMonth(lm), end: endOfMonth(lm), groupBy: "day" }
    }
    case "last_quarter": {
      const lq = subQuarters(now, 1)
      return { start: startOfQuarter(lq), end: endOfQuarter(lq), groupBy: "month" }
    }
    case "last_6_months":
      return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now), groupBy: "month" }
    case "last_year": {
      const ly = subYears(now, 1)
      return { start: startOfYear(ly), end: endOfYear(ly), groupBy: "month" }
    }
    case "all":
      return { start: new Date("2020-01-01"), end: endOfDay(now), groupBy: "month" }
    default:
      return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now), groupBy: "month" }
  }
}

async function getRevenueSeries(
  gymIds: string[], start: Date, end: Date, groupBy: "day" | "month"
) {
  const [payments, suppSales] = await Promise.all([
    prisma.payment.findMany({
      where:  { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: start, lte: end } },
      select: { paymentDate: true, amount: true },
    }),
    prisma.supplementSale.findMany({
      where:  { gymId: { in: gymIds }, soldAt: { gte: start, lte: end } },
      select: { soldAt: true, totalAmount: true },
    }),
  ])

  const buckets = new Map<string, { membershipRev: number; supplementRev: number }>()

  const key = (d: Date) => groupBy === "day" ? format(d, "dd MMM") : format(d, "MMM yy")

  // Pre-populate so empty periods show as 0
  if (groupBy === "day") {
    eachDayOfInterval({ start, end }).forEach(d => {
      const k = key(d); if (!buckets.has(k)) buckets.set(k, { membershipRev: 0, supplementRev: 0 })
    })
  } else {
    eachMonthOfInterval({ start, end }).forEach(d => {
      const k = key(d); if (!buckets.has(k)) buckets.set(k, { membershipRev: 0, supplementRev: 0 })
    })
  }

  for (const p of payments) {
    if (!p.paymentDate) continue
    const k = key(new Date(p.paymentDate))
    const b = buckets.get(k) ?? { membershipRev: 0, supplementRev: 0 }
    buckets.set(k, { ...b, membershipRev: b.membershipRev + Number(p.amount) })
  }
  for (const s of suppSales) {
    const k = key(new Date(s.soldAt))
    const b = buckets.get(k) ?? { membershipRev: 0, supplementRev: 0 }
    buckets.set(k, { ...b, supplementRev: b.supplementRev + Number(s.totalAmount) })
  }

  return Array.from(buckets.entries()).map(([label, vals]) => ({
    month:         label,
    membershipRev: vals.membershipRev,
    supplementRev: vals.supplementRev,
    revenue:       vals.membershipRev + vals.supplementRev,
  }))
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const range  = (searchParams.get("range") ?? "last_6_months") as Range
  const gymIdF = searchParams.get("gymId") ?? ""

  const gyms   = await prisma.gym.findMany({
    where:  { ownerId: session.user.id, isActive: true },
    select: { id: true, name: true },
  })
  const gymIds = gymIdF ? gyms.filter(g => g.id === gymIdF).map(g => g.id) : gyms.map(g => g.id)

  if (!gymIds.length) {
    return NextResponse.json({ revenue: [], memberGrowth: [], topGyms: [], summary: {}, range })
  }

  const { start, end, groupBy } = getDateRange(range)

  const [revenueData, memberGrowth, topGyms, totals] = await Promise.all([
    getRevenueSeries(gymIds, start, end, groupBy),

    // Member growth
    (async () => {
      const members = await prisma.gymMember.findMany({
        where:  { gymId: { in: gymIds }, createdAt: { gte: start, lte: end } },
        select: { createdAt: true },
      })
      const buckets = new Map<string, number>()
      const kfn = (d: Date) => groupBy === "day" ? format(d, "dd MMM") : format(d, "MMM yy")

      if (groupBy === "day") {
        eachDayOfInterval({ start, end }).forEach(d => { buckets.set(kfn(d), 0) })
      } else {
        eachMonthOfInterval({ start, end }).forEach(d => { buckets.set(kfn(d), 0) })
      }
      members.forEach(m => {
        const k = kfn(new Date(m.createdAt))
        buckets.set(k, (buckets.get(k) ?? 0) + 1)
      })
      return Array.from(buckets.entries()).map(([month, members]) => ({ month, members }))
    })(),

    // Per-gym summary
    Promise.all(gyms.map(async gym => {
      const [activeMembers, revenue, suppRevenue, attendance, newMembers] = await Promise.all([
        prisma.gymMember.count({ where: { gymId: gym.id, status: "ACTIVE" } }),
        prisma.payment.aggregate({
          where: { gymId: gym.id, status: "COMPLETED", paymentDate: { gte: start, lte: end } },
          _sum:  { amount: true },
        }),
        prisma.supplementSale.aggregate({
          where: { gymId: gym.id, soldAt: { gte: start, lte: end } },
          _sum:  { totalAmount: true },
        }),
        prisma.attendance.count({ where: { gymId: gym.id, checkInTime: { gte: start, lte: end } } }),
        prisma.gymMember.count({ where: { gymId: gym.id, createdAt: { gte: start, lte: end } } }),
      ])
      const membershipRev = Number(revenue._sum?.amount ?? 0)
      const supplementRev = Number(suppRevenue._sum?.totalAmount ?? 0)
      return {
        name: gym.name, members: activeMembers, newMembers, attendance,
        membershipRev, supplementRev, revenue: membershipRev + supplementRev,
      }
    })),

    // Overall summary
    Promise.all([
      prisma.gymMember.count({ where: { gymId: { in: gymIds }, status: "ACTIVE" } }),
      prisma.payment.aggregate({
        where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: start, lte: end } },
        _sum:  { amount: true },
      }),
      prisma.supplementSale.aggregate({
        where: { gymId: { in: gymIds }, soldAt: { gte: start, lte: end } },
        _sum:  { totalAmount: true },
      }),
      prisma.attendance.count({ where: { gymId: { in: gymIds }, checkInTime: { gte: start, lte: end } } }),
      prisma.gymMember.count({ where: { gymId: { in: gymIds }, createdAt: { gte: start, lte: end } } }),
    ]),
  ])

  const [totalMembers, totalMembRev, totalSuppRev, totalAttendance, newMembers] = totals
  const membershipRevenue = Number(totalMembRev._sum?.amount ?? 0)
  const supplementRevenue = Number(totalSuppRev._sum?.totalAmount ?? 0)

  return NextResponse.json({
    revenue:     revenueData,
    memberGrowth,
    topGyms,
    range,
    dateRange:   { start: start.toISOString(), end: end.toISOString() },
    summary: {
      totalMembers, newMembers,
      totalRevenue:       membershipRevenue + supplementRevenue,
      membershipRevenue,
      supplementRevenue,
      totalAttendance,
    },
  })
}
// // src/app/api/owner/dashboard/route.ts
// import { NextResponse } from "next/server"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"
// import { startOfMonth, endOfMonth } from "date-fns"

// export async function GET() {
//   try {
//     const session = await auth()
//     if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//     const profileId = session.user.id
//     const now = new Date()
//     const monthStart = startOfMonth(now)
//     const monthEnd = endOfMonth(now)
//     const todayStart = new Date(now.setHours(0, 0, 0, 0))
//     const todayEnd = new Date(new Date().setHours(23, 59, 59, 999))

//     // Get all gyms owned by this profile
//     const gyms = await prisma.gym.findMany({
//       where: { ownerId: profileId, isActive: true },
//       select: { id: true, name: true, city: true },
//     })
//     const gymIds = gyms.map((g) => g.id)

//     if (gymIds.length === 0) {
//       return NextResponse.json({
//         totalMembers: 0, activeGyms: 0, monthlyRevenue: 0,
//         todayAttendance: 0, recentMembers: [], todayCheckins: [],
//         gyms: [],
//       })
//     }

//     const [totalMembers, monthlyRevenue, supplementRevenue, todayAttendance, recentMembers, todayCheckins, recentSupplementSales] =
//       await Promise.all([
//         prisma.gymMember.count({ where: { gymId: { in: gymIds }, status: "ACTIVE" } }),

//         prisma.payment.aggregate({
//           where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: monthStart, lte: monthEnd } },
//           _sum: { amount: true },
//         }),

//         prisma.supplementSale.aggregate({
//           where: { gymId: { in: gymIds }, soldAt: { gte: monthStart, lte: monthEnd } },
//           _sum: { totalAmount: true },
//         }),

//         prisma.attendance.count({
//           where: { gymId: { in: gymIds }, checkInTime: { gte: todayStart, lte: todayEnd } },
//         }),

//         prisma.gymMember.findMany({
//           where: { gymId: { in: gymIds } },
//           orderBy: { createdAt: "desc" },
//           take: 5,
//           select: {
//             id: true, createdAt: true, status: true,
//             profile: { select: { fullName: true, avatarUrl: true, email: true } },
//             gym: { select: { name: true } },
//           },
//         }),

//         prisma.attendance.findMany({
//           where: { gymId: { in: gymIds }, checkInTime: { gte: todayStart, lte: todayEnd } },
//           orderBy: { checkInTime: "desc" },
//           take: 8,
//           select: {
//             id: true, checkInTime: true, checkOutTime: true,
//             member: { select: { profile: { select: { fullName: true, avatarUrl: true } } } },
//           },
//         }),

//         prisma.supplementSale.findMany({
//           where: { gymId: { in: gymIds } },
//           orderBy: { soldAt: "desc" },
//           take: 5,
//           include: {
//             supplement: { select: { name: true, unitSize: true } },
//             member: { include: { profile: { select: { fullName: true } } } },
//           },
//         }),
//       ])

//     const membershipRevenue    = Number(monthlyRevenue._sum?.amount ?? 0)
//     const supplementRevenueAmt = Number(supplementRevenue._sum?.totalAmount ?? 0)

//     return NextResponse.json({
//       totalMembers,
//       activeGyms: gymIds.length,
//       monthlyRevenue: membershipRevenue,
//       supplementRevenue: supplementRevenueAmt,
//       totalRevenue: membershipRevenue + supplementRevenueAmt,
//       todayAttendance,
//       recentMembers,
//       todayCheckins,
//       recentSupplementSales,
//       gyms,
//     })
//   } catch (error) {
//     console.error("Owner dashboard error:", error)
//     return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
//   }
// }


// src/app/api/owner/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  startOfMonth, endOfMonth, startOfDay, endOfDay, subDays,
  startOfWeek, endOfWeek, subMonths, subWeeks,
  startOfYear, endOfYear, format, addDays
} from "date-fns"

type DashRange =
  | "today" | "this_week" | "last_week" | "this_month"
  | "last_month" | "last_3_months" | "last_6_months" | "last_year" | "all"

function getRangeWindow(range: DashRange): { start: Date; end: Date } {
  const now = new Date()
  switch (range) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) }
    case "this_week":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
    case "last_week": {
      const lw = subWeeks(now, 1)
      return { start: startOfWeek(lw, { weekStartsOn: 1 }), end: endOfWeek(lw, { weekStartsOn: 1 }) }
    }
    case "this_month":
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case "last_month": {
      const lm = subMonths(now, 1)
      return { start: startOfMonth(lm), end: endOfMonth(lm) }
    }
    case "last_3_months":
      return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) }
    case "last_6_months":
      return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) }
    case "last_year": {
      const ly = subMonths(now, 12)
      return { start: startOfYear(ly), end: endOfYear(ly) }
    }
    case "all":
      return { start: new Date("2020-01-01"), end: endOfDay(now) }
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) }
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const filterGymId = searchParams.get("gymId") ?? ""
    const range       = (searchParams.get("range") ?? "this_month") as DashRange

    const now = new Date()

    // 1. Load all owner gyms
    const gyms = await prisma.gym.findMany({
      where:  { ownerId: session.user.id, isActive: true },
      select: { id: true, name: true, city: true },
    })
    const allGymIds = gyms.map(g => g.id)
    const gymIds    = filterGymId && allGymIds.includes(filterGymId)
      ? [filterGymId]
      : allGymIds

    // Empty state — no gyms yet
    if (!allGymIds.length) {
      return NextResponse.json({
        gyms: [], totalMembers: 0, activeGyms: 0, range,
        rangeStart: now.toISOString(), rangeEnd: now.toISOString(),
        rangeRevenue: 0, rangeSupplementRevenue: 0, totalRevenue: 0,
        rangeAttendance: 0, rangeNewMembers: 0,
        todayRevenue: 0, todayAttendance: 0, todayNewMembers: 0,
        expiringMembers: 0, expiringMembers3: 0, expiringToday: [],
        recentMembers: [], todayCheckins: [],
        recentSupplementSales: [], dailyRevenue: [],
        filteredGymId: null,
      })
    }

    const { start: rangeStart, end: rangeEnd } = getRangeWindow(range)
    const todayStart = startOfDay(now)
    const todayEnd   = endOfDay(now)
    const in7Days    = addDays(now, 7)
    const in3Days    = addDays(now, 3)

    // 2. Build 7-day sparkline (always last 7 days regardless of range)
    const sparklinePromise = Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const d  = subDays(now, 6 - i)
        const ds = startOfDay(d)
        const de = endOfDay(d)
        const [mem, supp] = await Promise.all([
          prisma.payment.aggregate({
            where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: ds, lte: de } },
            _sum:  { amount: true },
          }),
          prisma.supplementSale.aggregate({
            where: { gymId: { in: gymIds }, soldAt: { gte: ds, lte: de } },
            _sum:  { totalAmount: true },
          }),
        ])
        return {
          date:    format(d, "EEE"),
          revenue: Number(mem._sum?.amount ?? 0) + Number(supp._sum?.totalAmount ?? 0),
        }
      })
    )

    // 3. All main queries in parallel
    const [
      totalMembers,
      rangeRevAgg,
      rangeSuppRevAgg,
      todayRevAgg,
      todaySuppRevAgg,
      todayAttendance,
      todayNewMembers,
      expiringMembers7,
      expiringMembers3,
      expiringToday,
      rangeAttendance,
      rangeNewMembers,
      recentMembers,
      todayCheckins,
      recentSupplementSales,
    ] = await Promise.all([
      prisma.gymMember.count({ where: { gymId: { in: gymIds }, status: "ACTIVE" } }),

      prisma.payment.aggregate({
        where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: rangeStart, lte: rangeEnd } },
        _sum:  { amount: true },
      }),
      prisma.supplementSale.aggregate({
        where: { gymId: { in: gymIds }, soldAt: { gte: rangeStart, lte: rangeEnd } },
        _sum:  { totalAmount: true },
      }),

      prisma.payment.aggregate({
        where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: todayStart, lte: todayEnd } },
        _sum:  { amount: true },
      }),
      prisma.supplementSale.aggregate({
        where: { gymId: { in: gymIds }, soldAt: { gte: todayStart, lte: todayEnd } },
        _sum:  { totalAmount: true },
      }),

      prisma.attendance.count({
        where: { gymId: { in: gymIds }, checkInTime: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.gymMember.count({
        where: { gymId: { in: gymIds }, createdAt: { gte: todayStart, lte: todayEnd } },
      }),

      prisma.gymMember.count({
        where: { gymId: { in: gymIds }, status: "ACTIVE", endDate: { gte: now, lte: in7Days } },
      }),
      prisma.gymMember.count({
        where: { gymId: { in: gymIds }, status: "ACTIVE", endDate: { gte: now, lte: in3Days } },
      }),
      prisma.gymMember.findMany({
        where:  { gymId: { in: gymIds }, status: "ACTIVE", endDate: { gte: todayStart, lte: todayEnd } },
        select: { profile: { select: { fullName: true } } },
        take:   5,
      }),

      prisma.attendance.count({
        where: { gymId: { in: gymIds }, checkInTime: { gte: rangeStart, lte: rangeEnd } },
      }),
      prisma.gymMember.count({
        where: { gymId: { in: gymIds }, createdAt: { gte: rangeStart, lte: rangeEnd } },
      }),

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
        where:   { gymId: { in: gymIds }, checkInTime: { gte: todayStart, lte: todayEnd } },
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
    ])

    const dailyRevenue         = await sparklinePromise
    const rangeRevenue         = Number(rangeRevAgg._sum?.amount ?? 0)
    const rangeSuppRevenue     = Number(rangeSuppRevAgg._sum?.totalAmount ?? 0)
    const todayMembershipRev   = Number(todayRevAgg._sum?.amount ?? 0)
    const todaySuppRev         = Number(todaySuppRevAgg._sum?.totalAmount ?? 0)

    return NextResponse.json({
      gyms,
      totalMembers,
      activeGyms:             allGymIds.length,
      range,
      rangeStart:             rangeStart.toISOString(),
      rangeEnd:               rangeEnd.toISOString(),
      rangeRevenue,
      rangeSupplementRevenue: rangeSuppRevenue,
      totalRevenue:           rangeRevenue + rangeSuppRevenue,
      rangeAttendance,
      rangeNewMembers,
      todayRevenue:           todayMembershipRev + todaySuppRev,
      todayAttendance,
      todayNewMembers,
      expiringMembers:        expiringMembers7,
      expiringMembers3,
      expiringToday:          expiringToday.map(m => m.profile.fullName),
      recentMembers,
      todayCheckins,
      recentSupplementSales,
      dailyRevenue,
      filteredGymId:          filterGymId || null,
    })
  } catch (error: any) {
    console.error("[Dashboard API]", error?.message ?? error)
    return NextResponse.json(
      { error: "Internal server error", detail: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}
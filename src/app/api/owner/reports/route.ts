// // src/app/api/owner/reports/route.ts
// import { NextRequest, NextResponse }                from "next/server"
// import { resolveProfileId }                         from "@/lib/mobileAuth"
// import { prisma }                                   from "@/lib/prisma"
// import { getOwnerSubscription, checkFeature }       from "@/lib/subscription"
// import { getRangeWindow, buildBuckets }             from "@/lib/dashboard-queries"
// import type { DashRange }                           from "@/lib/dashboard-queries"

// export type { DashRange }

// export async function GET(req: NextRequest) {
//   const profileId = await resolveProfileId(req)
//   if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//   // ── Subscription gate ────────────────────────────────────────
//   const sub = await getOwnerSubscription(profileId)
//   if (!sub || sub.isExpired) {
//     return NextResponse.json(
//       { error: "Your subscription has expired. Please renew to access reports.", upgradeRequired: true },
//       { status: 403 },
//     )
//   }
//   const check = checkFeature(sub.limits.hasFullReports, "Full reports & analytics")
//   if (!check.allowed) {
//     return NextResponse.json({ error: check.reason, upgradeRequired: true }, { status: 403 })
//   }

//   // ── Params ───────────────────────────────────────────────────
//   const { searchParams } = new URL(req.url)
//   const range       = (searchParams.get("range") ?? "last_30_days") as DashRange
//   const customStart = searchParams.get("customStart")
//   const customEnd   = searchParams.get("customEnd")
//   const gymIdF      = searchParams.get("gymId") ?? ""

//   // ── Gyms ─────────────────────────────────────────────────────
//   const gyms      = await prisma.gym.findMany({ where: { ownerId: profileId, isActive: true }, select: { id: true, name: true } })
//   const allGymIds = gyms.map(g => g.id)
//   const gymIds    = gymIdF && allGymIds.includes(gymIdF) ? [gymIdF] : allGymIds

//   const empty = {
//     range, dateRange: null,
//     revenueSeries: [], expenseSeries: [], attendanceSeries: [], memberGrowthSeries: [],
//     topGyms: [],
//     summary: { totalMembers: 0, newMembers: 0, membershipRevenue: 0, supplementRevenue: 0, totalRevenue: 0, totalExpenses: 0, netRevenue: 0, totalAttendance: 0 },
//   }
//   if (!gymIds.length) return NextResponse.json(empty)

//   // ── Time window + buckets ─────────────────────────────────────
//   const { start, end } = getRangeWindow(range, customStart, customEnd)
//   const buckets        = buildBuckets(range, start, end)

//   // ── Per-bucket queries (one Promise.all per bucket with 5 inner queries) ──
//   const bucketData = await Promise.all(
//     buckets.map(async ({ label, start: bs, end: be }) => {
//       const [memAgg, suppAgg, expAgg, attendCount, memberCount] = await Promise.all([
//         prisma.payment.aggregate({
//           where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: bs, lt: be } },
//           _sum:  { amount: true },
//         }),
//         prisma.supplementSale.aggregate({
//           where: { gymId: { in: gymIds }, soldAt: { gte: bs, lt: be } },
//           _sum:  { totalAmount: true },
//         }),
//         prisma.gymExpense.aggregate({
//           where: { gymId: { in: gymIds }, expenseDate: { gte: bs, lt: be } },
//           _sum:  { amount: true },
//         }),
//         prisma.attendance.count({
//           where: { gymId: { in: gymIds }, checkInTime: { gte: bs, lt: be } },
//         }),
//         prisma.gymMember.count({
//           where: { gymId: { in: gymIds }, createdAt: { gte: bs, lt: be } },
//         }),
//       ])
//       return {
//         label,
//         membershipRev: Number(memAgg._sum?.amount      ?? 0),
//         supplementRev: Number(suppAgg._sum?.totalAmount ?? 0),
//         expense:       Number(expAgg._sum?.amount       ?? 0),
//         attendance:    attendCount,
//         newMembers:    memberCount,
//       }
//     }),
//   )

//   // ── Summary totals + per-gym breakdown (parallel) ────────────
//   const [
//     totalMembers,
//     membRevAgg, suppRevAgg, expAggTotal,
//     totalAttendance, newMembers,
//     topGymsData,
//   ] = await Promise.all([
//     prisma.gymMember.count({ where: { gymId: { in: gymIds }, status: "ACTIVE" } }),

//     prisma.payment.aggregate({
//       where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: start, lt: end } },
//       _sum:  { amount: true },
//     }),
//     prisma.supplementSale.aggregate({
//       where: { gymId: { in: gymIds }, soldAt: { gte: start, lt: end } },
//       _sum:  { totalAmount: true },
//     }),
//     prisma.gymExpense.aggregate({
//       where: { gymId: { in: gymIds }, expenseDate: { gte: start, lt: end } },
//       _sum:  { amount: true },
//     }),

//     prisma.attendance.count({
//       where: { gymId: { in: gymIds }, checkInTime: { gte: start, lt: end } },
//     }),
//     prisma.gymMember.count({
//       where: { gymId: { in: gymIds }, createdAt: { gte: start, lt: end } },
//     }),

//     // Per-gym breakdown
//     Promise.all(gyms.map(async gym => {
//       const [active, rev, suppRev, att, newM, exp] = await Promise.all([
//         prisma.gymMember.count({ where: { gymId: gym.id, status: "ACTIVE" } }),
//         prisma.payment.aggregate({ where: { gymId: gym.id, status: "COMPLETED", paymentDate: { gte: start, lt: end } }, _sum: { amount: true } }),
//         prisma.supplementSale.aggregate({ where: { gymId: gym.id, soldAt: { gte: start, lt: end } }, _sum: { totalAmount: true } }),
//         prisma.attendance.count({ where: { gymId: gym.id, checkInTime: { gte: start, lt: end } } }),
//         prisma.gymMember.count({ where: { gymId: gym.id, createdAt: { gte: start, lt: end } } }),
//         prisma.gymExpense.aggregate({ where: { gymId: gym.id, expenseDate: { gte: start, lt: end } }, _sum: { amount: true } }),
//       ])
//       const membershipRev = Number(rev._sum?.amount         ?? 0)
//       const supplementRev = Number(suppRev._sum?.totalAmount ?? 0)
//       const expenses      = Number(exp._sum?.amount          ?? 0)
//       return {
//         name: gym.name,
//         activeMembers: active,
//         newMembers:    newM,
//         attendance:    att,
//         membershipRev,
//         supplementRev,
//         totalRevenue:  membershipRev + supplementRev,
//         expenses,
//         netRevenue:    membershipRev + supplementRev - expenses,
//       }
//     })),
//   ])

//   const membershipRevenue = Number(membRevAgg._sum?.amount      ?? 0)
//   const supplementRevenue = Number(suppRevAgg._sum?.totalAmount ?? 0)
//   const totalExpenses     = Number(expAggTotal._sum?.amount     ?? 0)

//   return NextResponse.json({
//     range,
//     dateRange: { start: start.toISOString(), end: end.toISOString() },

//     // Split bucket data into typed series for the frontend
//     revenueSeries:      bucketData.map(b => ({ label: b.label, membershipRev: b.membershipRev, supplementRev: b.supplementRev, total: b.membershipRev + b.supplementRev })),
//     expenseSeries:      bucketData.map(b => ({ label: b.label, amount: b.expense })),
//     attendanceSeries:   bucketData.map(b => ({ label: b.label, count: b.attendance })),
//     memberGrowthSeries: bucketData.map(b => ({ label: b.label, count: b.newMembers })),

//     topGyms: topGymsData,

//     summary: {
//       totalMembers, newMembers,
//       membershipRevenue, supplementRevenue,
//       totalRevenue:  membershipRevenue + supplementRevenue,
//       totalExpenses,
//       netRevenue:    membershipRevenue + supplementRevenue - totalExpenses,
//       totalAttendance,
//     },
//   })
// }



// src/app/api/owner/reports/route.ts
import { NextRequest, NextResponse }          from "next/server"
import { resolveProfileId }                   from "@/lib/mobileAuth"
import { requireActivePlan } from "@/lib/requireActivePlan"
import { prisma }                             from "@/lib/prisma"
import { getOwnerSubscription, checkFeature } from "@/lib/subscription"
import { getRangeWindow, buildBuckets }       from "@/lib/dashboard-queries"
import type { DashRange }                     from "@/lib/dashboard-queries"

export type { DashRange }

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response


  // ── Subscription gate ────────────────────────────────────────────────────
  const sub = await getOwnerSubscription(profileId)
  if (!sub || sub.isExpired) {
    return NextResponse.json(
      { error: "Your subscription has expired. Please renew to access reports.", upgradeRequired: true },
      { status: 403 }
    )
  }
  // Basic plan and above can access reports; Free plan is blocked.
  const check = checkFeature(sub.limits.hasFullReports, "Reports & analytics")
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason, upgradeRequired: true }, { status: 403 })
  }
  // isPremium = true for Pro/Enterprise (hasFullAnalytics).
  // Basic users get all data but the UI uses this flag to hide export buttons.
  const isPremium = sub.limits.hasFullAnalytics

  // ── Params ───────────────────────────────────────────────────────────────
  const { searchParams } = new URL(req.url)
  const range       = (searchParams.get("range") ?? "last_30_days") as DashRange
  const customStart = searchParams.get("customStart")
  const customEnd   = searchParams.get("customEnd")
  const gymIdF      = searchParams.get("gymId") ?? ""

  // ── Gyms ─────────────────────────────────────────────────────────────────
  const gyms      = await prisma.gym.findMany({
    where:  { ownerId: profileId, isActive: true },
    select: { id: true, name: true },
  })
  const allGymIds = gyms.map(g => g.id)
  const gymIds    = gymIdF && allGymIds.includes(gymIdF) ? [gymIdF] : allGymIds

  const empty = {
    range, dateRange: null,
    revenueSeries: [], expenseSeries: [], attendanceSeries: [],
    memberGrowthSeries: [], lockerRevenueSeries: [],
    topGyms: [],
    summary: {
      totalMembers: 0, newMembers: 0,
      membershipRevenue: 0, supplementRevenue: 0, lockerRevenue: 0,
      totalRevenue: 0, totalExpenses: 0, netRevenue: 0, totalAttendance: 0,
    },
  }
  if (!gymIds.length) return NextResponse.json(empty)

  // ── Time window + buckets ─────────────────────────────────────────────────
  const { start, end } = getRangeWindow(range, customStart, customEnd)
  const buckets        = buildBuckets(range, start, end)

  // ── Per-bucket queries ────────────────────────────────────────────────────
  // Locker revenue = sum of monthlyFee on LockerAssignments where
  // feeCollected=true AND assignedAt falls in the bucket window.
  // We join through locker to get monthlyFee since it's not stored on assignment.
  const bucketData = await Promise.all(
    buckets.map(async ({ label, start: bs, end: be }) => {
      const [memAgg, suppAgg, expAgg, attendCount, memberCount, lockerAssignments] = await Promise.all([
        prisma.payment.aggregate({
          where: {
            gymId:       { in: gymIds },
            status:      "COMPLETED",
            paymentDate: { gte: bs, lt: be },
            // Exclude locker payments from membership revenue line
            // so they appear only in lockerRev (avoid double-count in total)
            planNameSnapshot: { not: "Locker Fee" },
          },
          _sum: { amount: true },
        }),
        prisma.supplementSale.aggregate({
          where: { gymId: { in: gymIds }, soldAt: { gte: bs, lt: be } },
          _sum:  { totalAmount: true },
        }),
        prisma.gymExpense.aggregate({
          where: { gymId: { in: gymIds }, expenseDate: { gte: bs, lt: be } },
          _sum:  { amount: true },
        }),
        prisma.attendance.count({
          where: { gymId: { in: gymIds }, checkInTime: { gte: bs, lt: be } },
        }),
        prisma.gymMember.count({
          where: { gymId: { in: gymIds }, createdAt: { gte: bs, lt: be } },
        }),
        // Locker revenue via the Payment table (tagged with planNameSnapshot="Locker Fee")
        prisma.payment.aggregate({
          where: {
            gymId:            { in: gymIds },
            status:           "COMPLETED",
            paymentDate:      { gte: bs, lt: be },
            planNameSnapshot: "Locker Fee",
          },
          _sum: { amount: true },
        }),
      ])

      return {
        label,
        membershipRev: Number(memAgg._sum?.amount        ?? 0),
        supplementRev: Number(suppAgg._sum?.totalAmount  ?? 0),
        lockerRev:     Number(lockerAssignments._sum?.amount ?? 0),
        expense:       Number(expAgg._sum?.amount        ?? 0),
        attendance:    attendCount,
        newMembers:    memberCount,
      }
    }),
  )

  // ── Summary totals + per-gym breakdown ───────────────────────────────────
  const [
    totalMembers, newMembers,
    membRevAgg, suppRevAgg, lockerRevAgg, expAggTotal,
    totalAttendance,
    topGymsData,
  ] = await Promise.all([
    prisma.gymMember.count({ where: { gymId: { in: gymIds }, status: "ACTIVE" } }),
    prisma.gymMember.count({ where: { gymId: { in: gymIds }, createdAt: { gte: start, lt: end } } }),

    // Membership revenue — exclude locker payments from this line
    prisma.payment.aggregate({
      where: {
        gymId:            { in: gymIds },
        status:           "COMPLETED",
        paymentDate:      { gte: start, lt: end },
        planNameSnapshot: { not: "Locker Fee" },
      },
      _sum: { amount: true },
    }),
    prisma.supplementSale.aggregate({
      where: { gymId: { in: gymIds }, soldAt: { gte: start, lt: end } },
      _sum:  { totalAmount: true },
    }),
    // Locker revenue
    prisma.payment.aggregate({
      where: {
        gymId:            { in: gymIds },
        status:           "COMPLETED",
        paymentDate:      { gte: start, lt: end },
        planNameSnapshot: "Locker Fee",
      },
      _sum: { amount: true },
    }),
    prisma.gymExpense.aggregate({
      where: { gymId: { in: gymIds }, expenseDate: { gte: start, lt: end } },
      _sum:  { amount: true },
    }),
    prisma.attendance.count({
      where: { gymId: { in: gymIds }, checkInTime: { gte: start, lt: end } },
    }),

    // Per-gym breakdown
    Promise.all(gyms.map(async gym => {
      const [active, rev, suppRev, lockerRev, att, newM, exp] = await Promise.all([
        prisma.gymMember.count({ where: { gymId: gym.id, status: "ACTIVE" } }),
        prisma.payment.aggregate({
          where: { gymId: gym.id, status: "COMPLETED", paymentDate: { gte: start, lt: end }, planNameSnapshot: { not: "Locker Fee" } },
          _sum:  { amount: true },
        }),
        prisma.supplementSale.aggregate({
          where: { gymId: gym.id, soldAt: { gte: start, lt: end } },
          _sum:  { totalAmount: true },
        }),
        prisma.payment.aggregate({
          where: { gymId: gym.id, status: "COMPLETED", paymentDate: { gte: start, lt: end }, planNameSnapshot: "Locker Fee" },
          _sum:  { amount: true },
        }),
        prisma.attendance.count({ where: { gymId: gym.id, checkInTime: { gte: start, lt: end } } }),
        prisma.gymMember.count({ where: { gymId: gym.id, createdAt: { gte: start, lt: end } } }),
        prisma.gymExpense.aggregate({
          where: { gymId: gym.id, expenseDate: { gte: start, lt: end } },
          _sum:  { amount: true },
        }),
      ])
      const membershipRev = Number(rev._sum?.amount         ?? 0)
      const supplementRev = Number(suppRev._sum?.totalAmount ?? 0)
      const lockerRevenue = Number(lockerRev._sum?.amount    ?? 0)
      const expenses      = Number(exp._sum?.amount          ?? 0)
      const totalRevenue  = membershipRev + supplementRev + lockerRevenue
      return {
        name:          gym.name,
        activeMembers: active,
        newMembers:    newM,
        attendance:    att,
        membershipRev,
        supplementRev,
        lockerRev:     lockerRevenue,
        totalRevenue,
        expenses,
        netRevenue:    totalRevenue - expenses,
      }
    })),
  ])

  const membershipRevenue = Number(membRevAgg._sum?.amount       ?? 0)
  const supplementRevenue = Number(suppRevAgg._sum?.totalAmount  ?? 0)
  const lockerRevenue     = Number(lockerRevAgg._sum?.amount     ?? 0)
  const totalExpenses     = Number(expAggTotal._sum?.amount      ?? 0)
  const totalRevenue      = membershipRevenue + supplementRevenue + lockerRevenue

  return NextResponse.json({
    range,
    isPremium,
    dateRange: { start: start.toISOString(), end: end.toISOString() },

    revenueSeries: bucketData.map(b => ({
      label:         b.label,
      membershipRev: b.membershipRev,
      supplementRev: b.supplementRev,
      lockerRev:     b.lockerRev,
      total:         b.membershipRev + b.supplementRev + b.lockerRev,
    })),
    expenseSeries:       bucketData.map(b => ({ label: b.label, amount: b.expense    })),
    attendanceSeries:    bucketData.map(b => ({ label: b.label, count:  b.attendance })),
    memberGrowthSeries:  bucketData.map(b => ({ label: b.label, count:  b.newMembers })),
    lockerRevenueSeries: bucketData.map(b => ({ label: b.label, amount: b.lockerRev  })),

    topGyms: topGymsData,

    summary: {
      totalMembers, newMembers,
      membershipRevenue, supplementRevenue, lockerRevenue,
      totalRevenue,
      totalExpenses,
      netRevenue: totalRevenue - totalExpenses,
      totalAttendance,
    },
  })
}
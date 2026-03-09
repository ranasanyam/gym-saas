// src/app/api/owner/reports/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const gyms = await prisma.gym.findMany({ where: { ownerId: session.user.id }, select: { id: true, name: true } })
  const gymIds = gyms.map(g => g.id)
  if (!gymIds.length) return NextResponse.json({ revenue: [], memberGrowth: [], topGyms: [], summary: {} })

  const now = new Date()

  // Last 6 months revenue (membership + supplements)
  const revenueData = await Promise.all(
    Array.from({ length: 6 }, async (_, i) => {
      const d = subMonths(now, 5 - i)
      const [membership, supplements] = await Promise.all([
        prisma.payment.aggregate({
          where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: startOfMonth(d), lte: endOfMonth(d) } },
          _sum: { amount: true },
        }),
        prisma.supplementSale.aggregate({
          where: { gymId: { in: gymIds }, soldAt: { gte: startOfMonth(d), lte: endOfMonth(d) } },
          _sum: { totalAmount: true },
        }),
      ])
      const membershipRev  = Number(membership._sum?.amount ?? 0)
      const supplementRev  = Number(supplements._sum?.totalAmount ?? 0)
      return {
        month:          format(d, "MMM"),
        revenue:        membershipRev + supplementRev,
        membershipRev,
        supplementRev,
      }
    })
  )

  // Monthly member growth (last 6 months)
  const memberGrowth = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i)
      return prisma.gymMember.count({
        where: { gymId: { in: gymIds }, createdAt: { gte: startOfMonth(d), lte: endOfMonth(d) } },
      }).then(count => ({ month: format(d, "MMM"), members: count }))
    })
  )

  // Per-gym summary
  const topGyms = await Promise.all(
    gyms.map(async gym => {
      const [members, revenue, suppRevenue, attendance] = await Promise.all([
        prisma.gymMember.count({ where: { gymId: gym.id, status: "ACTIVE" } }),
        prisma.payment.aggregate({
          where: { gymId: gym.id, status: "COMPLETED", paymentDate: { gte: startOfMonth(now) } },
          _sum: { amount: true },
        }),
        prisma.supplementSale.aggregate({
          where: { gymId: gym.id, soldAt: { gte: startOfMonth(now) } },
          _sum: { totalAmount: true },
        }),
        prisma.attendance.count({ where: { gymId: gym.id, checkInTime: { gte: startOfMonth(now) } } }),
      ])
      const membershipRev = Number(revenue._sum?.amount ?? 0)
      const supplementRev = Number(suppRevenue._sum?.totalAmount ?? 0)
      return {
        name: gym.name, members, attendance,
        revenue:        membershipRev + supplementRev,
        membershipRev,
        supplementRev,
      }
    })
  )

  const [totalMembers, totalMembershipRevenue, totalSupplementRevenue, totalAttendance] = await Promise.all([
    prisma.gymMember.count({ where: { gymId: { in: gymIds }, status: "ACTIVE" } }),
    prisma.payment.aggregate({
      where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: startOfMonth(now) } },
      _sum: { amount: true },
    }),
    prisma.supplementSale.aggregate({
      where: { gymId: { in: gymIds }, soldAt: { gte: startOfMonth(now) } },
      _sum: { totalAmount: true },
    }),
    prisma.attendance.count({ where: { gymId: { in: gymIds }, checkInTime: { gte: startOfMonth(now) } } }),
  ])

  const membershipRev = Number(totalMembershipRevenue._sum?.amount ?? 0)
  const supplementRev = Number(totalSupplementRevenue._sum?.totalAmount ?? 0)

  return NextResponse.json({
    revenue: revenueData,
    memberGrowth,
    topGyms,
    summary: {
      totalMembers,
      totalRevenue:       membershipRev + supplementRev,
      membershipRevenue:  membershipRev,
      supplementRevenue:  supplementRev,
      totalAttendance,
    },
  })
}
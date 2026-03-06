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

  // Last 6 months revenue
  const revenueData = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i)
      return prisma.payment.aggregate({
        where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: startOfMonth(d), lte: endOfMonth(d) } },
        _sum: { amount: true },
      }).then(r => ({ month: format(d, "MMM"), revenue: Number(r._sum?.amount ?? 0) }))
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
      const [members, revenue, attendance] = await Promise.all([
        prisma.gymMember.count({ where: { gymId: gym.id, status: "ACTIVE" } }),
        prisma.payment.aggregate({
          where: { gymId: gym.id, status: "COMPLETED", paymentDate: { gte: startOfMonth(now) } },
          _sum: { amount: true },
        }),
        prisma.attendance.count({ where: { gymId: gym.id, checkInTime: { gte: startOfMonth(now) } } }),
      ])
      return { name: gym.name, members, revenue: Number(revenue._sum?.amount ?? 0), attendance }
    })
  )

  const [totalMembers, totalRevenue, totalAttendance] = await Promise.all([
    prisma.gymMember.count({ where: { gymId: { in: gymIds }, status: "ACTIVE" } }),
    prisma.payment.aggregate({
      where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: startOfMonth(now) } },
      _sum: { amount: true },
    }),
    prisma.attendance.count({ where: { gymId: { in: gymIds }, checkInTime: { gte: startOfMonth(now) } } }),
  ])

  return NextResponse.json({
    revenue: revenueData,
    memberGrowth,
    topGyms,
    summary: { totalMembers, totalRevenue: Number(totalRevenue._sum?.amount ?? 0), totalAttendance },
  })
}
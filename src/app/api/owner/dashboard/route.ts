// src/app/api/owner/dashboard/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth } from "date-fns"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const profileId = session.user.id
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const todayStart = new Date(now.setHours(0, 0, 0, 0))
    const todayEnd = new Date(new Date().setHours(23, 59, 59, 999))

    // Get all gyms owned by this profile
    const gyms = await prisma.gym.findMany({
      where: { ownerId: profileId, isActive: true },
      select: { id: true, name: true, city: true },
    })
    const gymIds = gyms.map((g) => g.id)

    if (gymIds.length === 0) {
      return NextResponse.json({
        totalMembers: 0, activeGyms: 0, monthlyRevenue: 0,
        todayAttendance: 0, recentMembers: [], todayCheckins: [],
        gyms: [],
      })
    }

    const [totalMembers, monthlyRevenue, supplementRevenue, todayAttendance, recentMembers, todayCheckins, recentSupplementSales] =
      await Promise.all([
        prisma.gymMember.count({ where: { gymId: { in: gymIds }, status: "ACTIVE" } }),

        prisma.payment.aggregate({
          where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: monthStart, lte: monthEnd } },
          _sum: { amount: true },
        }),

        prisma.supplementSale.aggregate({
          where: { gymId: { in: gymIds }, soldAt: { gte: monthStart, lte: monthEnd } },
          _sum: { totalAmount: true },
        }),

        prisma.attendance.count({
          where: { gymId: { in: gymIds }, checkInTime: { gte: todayStart, lte: todayEnd } },
        }),

        prisma.gymMember.findMany({
          where: { gymId: { in: gymIds } },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true, createdAt: true, status: true,
            profile: { select: { fullName: true, avatarUrl: true, email: true } },
            gym: { select: { name: true } },
          },
        }),

        prisma.attendance.findMany({
          where: { gymId: { in: gymIds }, checkInTime: { gte: todayStart, lte: todayEnd } },
          orderBy: { checkInTime: "desc" },
          take: 8,
          select: {
            id: true, checkInTime: true, checkOutTime: true,
            member: { select: { profile: { select: { fullName: true, avatarUrl: true } } } },
          },
        }),

        prisma.supplementSale.findMany({
          where: { gymId: { in: gymIds } },
          orderBy: { soldAt: "desc" },
          take: 5,
          include: {
            supplement: { select: { name: true, unitSize: true } },
            member: { include: { profile: { select: { fullName: true } } } },
          },
        }),
      ])

    const membershipRevenue    = Number(monthlyRevenue._sum?.amount ?? 0)
    const supplementRevenueAmt = Number(supplementRevenue._sum?.totalAmount ?? 0)

    return NextResponse.json({
      totalMembers,
      activeGyms: gymIds.length,
      monthlyRevenue: membershipRevenue,
      supplementRevenue: supplementRevenueAmt,
      totalRevenue: membershipRevenue + supplementRevenueAmt,
      todayAttendance,
      recentMembers,
      todayCheckins,
      recentSupplementSales,
      gyms,
    })
  } catch (error) {
    console.error("Owner dashboard error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
// src/app/api/owner/payments/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth } from "date-fns"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const gymId = searchParams.get("gymId")
  const page = parseInt(searchParams.get("page") ?? "1")
  const now = new Date()

  const gyms = await prisma.gym.findMany({ where: { ownerId: session.user.id }, select: { id: true } })
  const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

  const [payments, total, monthTotal] = await Promise.all([
    prisma.payment.findMany({
      where: { gymId: { in: gymIds } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 20, take: 20,
      include: {
        member: { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
        gym: { select: { name: true } },
        membershipPlan: { select: { name: true } },
      },
    }),
    prisma.payment.count({ where: { gymId: { in: gymIds } } }),
    prisma.payment.aggregate({
      where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: startOfMonth(now), lte: endOfMonth(now) } },
      _sum: { amount: true },
    }),
  ])

  return NextResponse.json({ payments, total, pages: Math.ceil(total / 20), monthTotal: Number(monthTotal._sum?.amount ?? 0) })
}
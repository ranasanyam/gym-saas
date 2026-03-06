// // src/app/api/owner/payments/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"
// import { startOfMonth, endOfMonth } from "date-fns"

// export async function GET(req: NextRequest) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   const { searchParams } = new URL(req.url)
//   const gymId = searchParams.get("gymId")
//   const page = parseInt(searchParams.get("page") ?? "1")
//   const now = new Date()

//   const gyms = await prisma.gym.findMany({ where: { ownerId: session.user.id }, select: { id: true } })
//   const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

//   const [payments, total, monthTotal] = await Promise.all([
//     prisma.payment.findMany({
//       where: { gymId: { in: gymIds } },
//       orderBy: { createdAt: "desc" },
//       skip: (page - 1) * 20, take: 20,
//       include: {
//         member: { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
//         gym: { select: { name: true } },
//         membershipPlan: { select: { name: true } },
//       },
//     }),
//     prisma.payment.count({ where: { gymId: { in: gymIds } } }),
//     prisma.payment.aggregate({
//       where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: startOfMonth(now), lte: endOfMonth(now) } },
//       _sum: { amount: true },
//     }),
//   ])

//   return NextResponse.json({ payments, total, pages: Math.ceil(total / 20), monthTotal: Number(monthTotal._sum?.amount ?? 0) })
// }

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

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { gymId, memberId, membershipPlanId, amount, paymentMethod, paymentDate, notes } = await req.json()
  if (!gymId || !memberId || !amount) return NextResponse.json({ error: "gymId, memberId and amount are required" }, { status: 400 })

  const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: session.user.id } })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  const member = await prisma.gymMember.findFirst({ where: { id: memberId, gymId } })
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  let planName: string | null = null
  if (membershipPlanId) {
    const plan = await prisma.membershipPlan.findUnique({ where: { id: membershipPlanId }, select: { name: true } })
    planName = plan?.name ?? null
  }

  const payment = await prisma.payment.create({
    data: {
      gymId,
      memberId,
      membershipPlanId: membershipPlanId || null,
      amount:           parseFloat(amount),
      paymentMethod:    paymentMethod || "CASH",
      status:           "COMPLETED",
      paymentDate:      paymentDate ? new Date(paymentDate) : new Date(),
      planNameSnapshot: planName,
    },
    include: {
      member: { include: { profile: { select: { fullName: true } } } },
      gym:    { select: { name: true } },
    },
  })

  return NextResponse.json(payment, { status: 201 })
}
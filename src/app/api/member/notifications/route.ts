// src/app/api/member/payments/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page  = parseInt(searchParams.get("page") ?? "1")
  const limit = 20

  const memberships = await prisma.gymMember.findMany({
    where: { profileId: session.user.id },
    select: { id: true },
  })
  const memberIds = memberships.map(m => m.id)

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { memberId: { in: memberIds } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit, take: limit,
      include: {
        gym: { select: { name: true } },
        membershipPlan: { select: { name: true } },
      },
    }),
    prisma.payment.count({ where: { memberId: { in: memberIds } } }),
  ])

  return NextResponse.json({ payments, total, pages: Math.ceil(total / limit) })
}
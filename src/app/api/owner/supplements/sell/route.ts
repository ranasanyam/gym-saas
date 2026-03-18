// src/app/api/owner/supplements/sell/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

// GET — sales history for a gym, optionally filtered by supplement
export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const gymId        = searchParams.get("gymId")
  const supplementId = searchParams.get("supplementId")
  const page         = parseInt(searchParams.get("page") ?? "1")
  const limit        = 30

  const gyms   = await prisma.gym.findMany({ where: { ownerId: profileId }, select: { id: true } })
  const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

  const where = {
    gymId: { in: gymIds },
    ...(supplementId ? { supplementId } : {}),
  }

  const [sales, total] = await Promise.all([
    prisma.supplementSale.findMany({
      where,
      include: {
        supplement: { select: { name: true, unitSize: true } },
        member:     { include: { profile: { select: { fullName: true } } } },
      },
      orderBy: { soldAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.supplementSale.count({ where }),
  ])

  return NextResponse.json({ sales, total, pages: Math.ceil(total / limit) })
}

// POST — record a sale, decrement stock
export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { supplementId, gymId, memberId, memberName, qty, paymentMethod, notes } = await req.json()
  if (!supplementId || !gymId || !qty) return NextResponse.json({ error: "supplementId, gymId and qty are required" }, { status: 400 })

  const supplement = await prisma.supplement.findFirst({
    where: { id: supplementId, gym: { ownerId: profileId } },
  })
  if (!supplement) return NextResponse.json({ error: "Supplement not found" }, { status: 404 })

  if (supplement.stockQty < qty) {
    return NextResponse.json({ error: `Only ${supplement.stockQty} units in stock` }, { status: 400 })
  }

  const unitPrice   = Number(supplement.price)
  const totalAmount = unitPrice * qty

  const [sale] = await prisma.$transaction([
    prisma.supplementSale.create({
      data: {
        supplementId, gymId,
        memberId:     memberId     || null,
        memberName:   memberName   || null,
        qty:          parseInt(qty),
        unitPrice,
        totalAmount,
        paymentMethod: paymentMethod || "CASH",
        notes:         notes || null,
      },
    }),
    prisma.supplement.update({
      where: { id: supplementId },
      data:  { stockQty: { decrement: parseInt(qty) } },
    }),
  ])

  return NextResponse.json(sale, { status: 201 })
}
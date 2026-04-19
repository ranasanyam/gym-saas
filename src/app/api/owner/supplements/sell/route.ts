// // src/app/api/owner/supplements/sell/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { resolveProfileId } from "@/lib/mobileAuth"
import { requireActivePlan } from "@/lib/requireActivePlan"
// import { prisma } from "@/lib/prisma"

// // GET — sales history for a gym, optionally filtered by supplement
// export async function GET(req: NextRequest) {
//   const profileId = await resolveProfileId(req)
//   if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//   const { searchParams } = new URL(req.url)
//   const gymId        = searchParams.get("gymId")
//   const supplementId = searchParams.get("supplementId")
//   const page         = parseInt(searchParams.get("page") ?? "1")
//   const limit        = 30

//   const gyms   = await prisma.gym.findMany({ where: { ownerId: profileId }, select: { id: true } })
//   const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

//   const where = {
//     gymId: { in: gymIds },
//     ...(supplementId ? { supplementId } : {}),
//   }

//   const [sales, total] = await Promise.all([
//     prisma.supplementSale.findMany({
//       where,
//       include: {
//         supplement: { select: { name: true, unitSize: true } },
//         member:     { include: { profile: { select: { fullName: true } } } },
//       },
//       orderBy: { soldAt: "desc" },
//       skip: (page - 1) * limit,
//       take: limit,
//     }),
//     prisma.supplementSale.count({ where }),
//   ])

//   return NextResponse.json({ sales, total, pages: Math.ceil(total / limit) })
// }

// // POST — record a sale, decrement stock
// export async function POST(req: NextRequest) {
//   const profileId = await resolveProfileId(req)
//   if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//   const { supplementId, gymId, memberId, memberName, qty, paymentMethod, notes } = await req.json()
//   if (!supplementId || !gymId || !qty) return NextResponse.json({ error: "supplementId, gymId and qty are required" }, { status: 400 })

//   const supplement = await prisma.supplement.findFirst({
//     where: { id: supplementId, gym: { ownerId: profileId } },
//   })
//   if (!supplement) return NextResponse.json({ error: "Supplement not found" }, { status: 404 })

//   if (supplement.stockQty < qty) {
//     return NextResponse.json({ error: `Only ${supplement.stockQty} units in stock` }, { status: 400 })
//   }

//   const unitPrice   = Number(supplement.price)
//   const totalAmount = unitPrice * qty

//   const [sale] = await prisma.$transaction([
//     prisma.supplementSale.create({
//       data: {
//         supplementId, gymId,
//         memberId:     memberId     || null,
//         memberName:   memberName   || null,
//         qty:          parseInt(qty),
//         unitPrice,
//         totalAmount,
//         paymentMethod: paymentMethod || "CASH",
//         notes:         notes || null,
//       },
//     }),
//     prisma.supplement.update({
//       where: { id: supplementId },
//       data:  { stockQty: { decrement: parseInt(qty) } },
//     }),
//   ])

//   return NextResponse.json(sale, { status: 201 })
// }


// src/app/api/owner/supplements/sell/route.ts
import { NextRequest, NextResponse }  from "next/server"
import { resolveProfileId }           from "@/lib/mobileAuth"
import { prisma }                     from "@/lib/prisma"
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, subMonths, subWeeks, subDays,
  startOfYear, endOfYear,
} from "date-fns"

type Range =
  | "today" | "this_week" | "last_week"
  | "this_month" | "last_month"
  | "last_3_months" | "last_6_months" | "last_year" | "all"

function getRange(range: Range): { gte: Date; lte: Date } | null {
  const now = new Date()
  switch (range) {
    case "today":
      return { gte: startOfDay(now),                  lte: endOfDay(now) }
    case "this_week":
      return { gte: startOfWeek(now, { weekStartsOn: 1 }), lte: endOfWeek(now, { weekStartsOn: 1 }) }
    case "last_week": {
      const lw = subWeeks(now, 1)
      return { gte: startOfWeek(lw, { weekStartsOn: 1 }), lte: endOfWeek(lw, { weekStartsOn: 1 }) }
    }
    case "this_month":
      return { gte: startOfMonth(now),                lte: endOfMonth(now) }
    case "last_month": {
      const lm = subMonths(now, 1)
      return { gte: startOfMonth(lm),                 lte: endOfMonth(lm) }
    }
    case "last_3_months":
      return { gte: startOfMonth(subMonths(now, 2)),  lte: endOfMonth(now) }
    case "last_6_months":
      return { gte: startOfMonth(subMonths(now, 5)),  lte: endOfMonth(now) }
    case "last_year": {
      const ly = subMonths(now, 12)
      return { gte: startOfYear(ly),                  lte: endOfYear(ly) }
    }
    case "all":
    default:
      return null  // no date filter
  }
}

// ── GET — sales history with optional date-range filter ───────────────────────
export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response


  const { searchParams } = new URL(req.url)
  const gymId        = searchParams.get("gymId")
  const supplementId = searchParams.get("supplementId")
  const range        = (searchParams.get("range") ?? "all") as Range
  const page         = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit        = 30

  const gyms   = await prisma.gym.findMany({ where: { ownerId: profileId }, select: { id: true } })
  const gymIds = gymId && gyms.some(g => g.id === gymId) ? [gymId] : gyms.map(g => g.id)

  const dateFilter = getRange(range)

  const where = {
    gymId:         { in: gymIds },
    ...(supplementId ? { supplementId }            : {}),
    ...(dateFilter   ? { soldAt: dateFilter }       : {}),
  }

  const [sales, total] = await Promise.all([
    prisma.supplementSale.findMany({
      where,
      include: {
        supplement: { select: { name: true, unitSize: true, category: true } },
        member:     { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
        gym:        { select: { name: true } },
      },
      orderBy: { soldAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.supplementSale.count({ where }),
  ])

  // Also return aggregate totals for the current filter
  const agg = await prisma.supplementSale.aggregate({
    where,
    _sum:   { totalAmount: true, qty: true },
    _count: { id: true },
  })

  return NextResponse.json({
    sales,
    total,
    pages:          Math.ceil(total / limit),
    totalRevenue:   Number(agg._sum.totalAmount ?? 0),
    totalUnitsSold: Number(agg._sum.qty         ?? 0),
    totalSales:     agg._count.id,
  })
}

// ── POST — record a sale, decrement stock ─────────────────────────────────────
export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response


  const {
    supplementId, gymId, memberId, memberName,
    qty, unitPrice, paymentMethod, notes,
  } = await req.json()

  if (!supplementId || !gymId || !qty || qty <= 0) {
    return NextResponse.json(
      { error: "supplementId, gymId and qty (> 0) are required" },
      { status: 400 }
    )
  }

  // Verify supplement belongs to this owner
  const supplement = await prisma.supplement.findFirst({
    where: { id: supplementId, gym: { ownerId: profileId } },
  })
  if (!supplement) {
    return NextResponse.json({ error: "Supplement not found" }, { status: 404 })
  }

  // Stock check
  if (supplement.stockQty < qty) {
    return NextResponse.json(
      { error: `Only ${supplement.stockQty} unit${supplement.stockQty === 1 ? "" : "s"} in stock` },
      { status: 400 }
    )
  }

  // Use provided price or fall back to listed price
  const resolvedUnitPrice =
    unitPrice !== undefined && unitPrice !== null && unitPrice !== ""
      ? Number(unitPrice)
      : Number(supplement.price)
  const totalAmount = resolvedUnitPrice * qty

  const [sale] = await prisma.$transaction([
    prisma.supplementSale.create({
      data: {
        supplementId,
        gymId,
        memberId:      memberId    || null,
        memberName:    memberName  || null,
        qty:           parseInt(qty),
        unitPrice:     resolvedUnitPrice,
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
// // src/app/api/owner/supplements/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"

// export async function GET(req: NextRequest) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//   const { searchParams } = new URL(req.url)
//   const gymId   = searchParams.get("gymId")
//   const search  = searchParams.get("search") ?? ""
//   const category = searchParams.get("category") ?? ""

//   const gyms = await prisma.gym.findMany({ where: { ownerId: session.user.id }, select: { id: true } })
//   const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

//   const supplements = await prisma.supplement.findMany({
//     where: {
//       gymId: { in: gymIds },
//       isActive: true,
//       ...(search   ? { name:     { contains: search,   mode: "insensitive" } } : {}),
//       ...(category ? { category: { equals:   category, mode: "insensitive" } } : {}),
//     },
//     orderBy: { name: "asc" },
//   })

//   return NextResponse.json(supplements)
// }

// export async function POST(req: NextRequest) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//   const { gymId, name, brand, category, description, unitSize, price, costPrice, stockQty, lowStockAt, imageUrl } = await req.json()
//   if (!gymId || !name || price == null) return NextResponse.json({ error: "gymId, name and price are required" }, { status: 400 })

//   const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: session.user.id } })
//   if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

//   const supplement = await prisma.supplement.create({
//     data: {
//       gymId, name, brand: brand || null, category: category || null,
//       description: description || null, unitSize: unitSize || null,
//       price: parseFloat(price),
//       costPrice: costPrice ? parseFloat(costPrice) : null,
//       stockQty:  parseInt(stockQty  ?? 0),
//       lowStockAt: parseInt(lowStockAt ?? 5),
//       imageUrl: imageUrl || null,
//     },
//   })
//   return NextResponse.json(supplement, { status: 201 })
// }

// src/app/api/owner/supplements/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getOwnerSubscription, checkFeature } from "@/lib/subscription"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const gymId = searchParams.get("gymId")
  const search = searchParams.get("search") ?? ""
  const category = searchParams.get("category") ?? ""

  const gyms = await prisma.gym.findMany({ where: { ownerId: session.user.id }, select: { id: true } })
  const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

  const supplements = await prisma.supplement.findMany({
    where: {
      gymId: { in: gymIds },
      isActive: true,
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(category ? { category } : {}),
    },
    include: {
      gym: { select: { name: true } },
      _count: { select: { sales: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(supplements)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // ── Subscription check ────────────────────────────────────────────────────
  const sub = await getOwnerSubscription(session.user.id)
  if (!sub || sub.isExpired) {
    return NextResponse.json(
      { error: "Your subscription has expired. Please renew to manage supplements.", upgradeRequired: true },
      { status: 403 }
    )
  }
  const check = checkFeature(sub.limits.hasSupplements, "Supplement management")
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason, upgradeRequired: true }, { status: 403 })
  }

  const body = await req.json()
  const { gymId, name, brand, category, description, unitSize, price, costPrice, stockQty, lowStockAt, imageUrl } = body

  if (!gymId || !name?.trim() || price == null)
    return NextResponse.json({ error: "gymId, name, and price are required" }, { status: 400 })

  const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: session.user.id } })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  const supplement = await prisma.supplement.create({
    data: {
      gymId, name: name.trim(), brand: brand?.trim() || null,
      category: category?.trim() || null, description: description?.trim() || null,
      unitSize: unitSize?.trim() || null,
      price: parseFloat(price),
      costPrice: costPrice ? parseFloat(costPrice) : null,
      stockQty: stockQty ? parseInt(stockQty) : 0,
      lowStockAt: lowStockAt ? parseInt(lowStockAt) : 5,
      imageUrl: imageUrl || null,
    },
  })
  return NextResponse.json(supplement, { status: 201 })
}
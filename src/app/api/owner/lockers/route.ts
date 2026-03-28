// src/app/api/owner/lockers/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

// ── GET — list lockers for a gym ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const gymId = searchParams.get("gymId")
  const status = searchParams.get("status") ?? ""

  if (!gymId) return NextResponse.json({ error: "gymId is required" }, { status: 400 })

  const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: profileId } })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  const lockers = await prisma.locker.findMany({
    where: {
      gymId,
      ...(status ? { status: status as any } : {}),
    },
    include: {
      assignments: {
        where:   { isActive: true },
        include: {
          member: {
            include: { profile: { select: { fullName: true, avatarUrl: true, mobileNumber: true } } },
          },
        },
        take: 1,
        orderBy: { assignedAt: "desc" },
      },
    },
    orderBy: [{ floor: "asc" }, { lockerNumber: "asc" }],
  })

  // Aggregate stats
  const stats = {
    total:       lockers.length,
    available:   lockers.filter(l => l.status === "AVAILABLE").length,
    assigned:    lockers.filter(l => l.status === "ASSIGNED").length,
    maintenance: lockers.filter(l => l.status === "MAINTENANCE").length,
    reserved:    lockers.filter(l => l.status === "RESERVED").length,
  }

  return NextResponse.json({ lockers, stats })
}

// ── POST — create one or bulk-create lockers ─────────────────────────────────
export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { gymId, lockerNumber, floor, size, monthlyFee, notes, bulk } = body

  if (!gymId) return NextResponse.json({ error: "gymId is required" }, { status: 400 })

  const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: profileId } })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  // ── Bulk creation: { gymId, prefix:"A", from:1, to:20, floor:"Ground", size, monthlyFee }
  if (bulk) {
    const { prefix = "", from = 1, to } = body
    if (!to || to < from || to - from > 200) {
      return NextResponse.json({ error: "from and to are required (max 200 per batch)" }, { status: 400 })
    }

    const numbers  = Array.from({ length: to - from + 1 }, (_, i) => `${prefix}${String(from + i).padStart(2, "0")}`)
    const existing = await prisma.locker.findMany({
      where: { gymId, lockerNumber: { in: numbers } },
      select: { lockerNumber: true },
    })
    const existingSet  = new Set(existing.map(l => l.lockerNumber))
    const newNumbers   = numbers.filter(n => !existingSet.has(n))

    if (!newNumbers.length) {
      return NextResponse.json({ error: "All locker numbers in this range already exist" }, { status: 409 })
    }

    await prisma.locker.createMany({
      data: newNumbers.map(num => ({
        gymId,
        lockerNumber: num,
        floor:       floor || null,
        size:        size  || null,
        monthlyFee:  monthlyFee ? parseFloat(monthlyFee) : null,
        notes:       notes || null,
      })),
    })

    const created = await prisma.locker.findMany({
      where: { gymId, lockerNumber: { in: newNumbers } },
      orderBy: { lockerNumber: "asc" },
    })
    return NextResponse.json({ created, skipped: existing.map(e => e.lockerNumber) }, { status: 201 })
  }

  // ── Single creation
  if (!lockerNumber?.trim()) {
    return NextResponse.json({ error: "lockerNumber is required" }, { status: 400 })
  }

  const existing = await prisma.locker.findUnique({ where: { gymId_lockerNumber: { gymId, lockerNumber: lockerNumber.trim() } } })
  if (existing) return NextResponse.json({ error: `Locker "${lockerNumber}" already exists in this gym` }, { status: 409 })

  const locker = await prisma.locker.create({
    data: {
      gymId,
      lockerNumber: lockerNumber.trim(),
      floor:      floor || null,
      size:       size  || null,
      monthlyFee: monthlyFee ? parseFloat(monthlyFee) : null,
      notes:      notes || null,
    },
  })

  return NextResponse.json(locker, { status: 201 })
}
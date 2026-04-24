// src/app/api/owner/lockers/[lockerId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { requireActivePlan } from "@/lib/requireActivePlan"
import { getOwnerSubscription, checkFeature } from "@/lib/subscription"
import { prisma } from "@/lib/prisma"

async function verifyLockerOwnership(profileId: string, lockerId: string) {
  return prisma.locker.findFirst({
    where: { id: lockerId, gym: { ownerId: profileId } },
  })
}

async function checkLockerAccess(profileId: string) {
  const sub = await getOwnerSubscription(profileId)
  if (!sub || sub.isExpired) {
    return NextResponse.json({ error: "Your subscription has expired. Please renew to access lockers.", upgradeRequired: true }, { status: 403 })
  }
  const check = checkFeature(sub.limits.hasLockers, "Locker Management")
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason, upgradeRequired: true }, { status: 403 })
  }
  return null
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ lockerId: string }> }) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response

  const accessErr = await checkLockerAccess(profileId)
  if (accessErr) return accessErr

  const { lockerId } = await params

  const locker = await prisma.locker.findFirst({
    where: { id: lockerId, gym: { ownerId: profileId } },
    include: {
      gym: { select: { name: true } },
      assignments: {
        orderBy: { assignedAt: "desc" },
        include: {
          member: {
            include: { profile: { select: { fullName: true, avatarUrl: true, mobileNumber: true, email: true } } },
          },
        },
      },
    },
  })
  if (!locker) return NextResponse.json({ error: "Locker not found" }, { status: 404 })
  return NextResponse.json(locker)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ lockerId: string }> }) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response

  const accessErr = await checkLockerAccess(profileId)
  if (accessErr) return accessErr

  const { lockerId } = await params

  const existing = await verifyLockerOwnership(profileId, lockerId)
  if (!existing) return NextResponse.json({ error: "Locker not found" }, { status: 404 })

  const body = await req.json()
  const { lockerNumber, floor, size, status, monthlyFee, notes } = body

  // If updating status to AVAILABLE, auto-deactivate any active assignment
  if (status === "AVAILABLE" && existing.status === "ASSIGNED") {
    await prisma.lockerAssignment.updateMany({
      where: { lockerId, isActive: true },
      data:  { isActive: false },
    })
  }

  // If changing locker number, check uniqueness within gym
  if (lockerNumber && lockerNumber !== existing.lockerNumber) {
    const clash = await prisma.locker.findUnique({
      where: { gymId_lockerNumber: { gymId: existing.gymId, lockerNumber } },
    })
    if (clash) return NextResponse.json({ error: `Locker number "${lockerNumber}" already exists` }, { status: 409 })
  }

  const updated = await prisma.locker.update({
    where: { id: lockerId },
    data: {
      ...(lockerNumber !== undefined ? { lockerNumber }            : {}),
      ...(floor       !== undefined ? { floor: floor || null }     : {}),
      ...(size        !== undefined ? { size: size || null }       : {}),
      ...(status      !== undefined ? { status }                   : {}),
      ...(monthlyFee  !== undefined ? { monthlyFee: monthlyFee ? parseFloat(monthlyFee) : null } : {}),
      ...(notes       !== undefined ? { notes: notes || null }     : {}),
    },
    include: {
      assignments: {
        where:   { isActive: true },
        include: { member: { include: { profile: { select: { fullName: true, avatarUrl: true } } } } },
        take: 1,
      },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ lockerId: string }> }) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response

  const accessErr = await checkLockerAccess(profileId)
  if (accessErr) return accessErr

  const { lockerId } = await params

  const existing = await verifyLockerOwnership(profileId, lockerId)
  if (!existing) return NextResponse.json({ error: "Locker not found" }, { status: 404 })

  if (existing.status === "ASSIGNED") {
    return NextResponse.json({
      error: "Cannot delete an assigned locker. Unassign the member first.",
    }, { status: 400 })
  }

  await prisma.locker.delete({ where: { id: lockerId } })
  return NextResponse.json({ success: true })
}
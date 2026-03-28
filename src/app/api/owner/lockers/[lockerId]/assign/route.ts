// src/app/api/owner/lockers/[lockerId]/assign/route.ts
// POST   → assign locker to a member (or reassign)
// DELETE → unassign (release locker back to AVAILABLE)

import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: Promise<{ lockerId: string }> }) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { lockerId } = await params

  // Verify locker ownership
  const locker = await prisma.locker.findFirst({
    where:   { id: lockerId, gym: { ownerId: profileId } },
    include: { assignments: { where: { isActive: true }, take: 1 } },
  })
  if (!locker) return NextResponse.json({ error: "Locker not found" }, { status: 404 })

  if (locker.status === "MAINTENANCE") {
    return NextResponse.json({ error: "Locker is under maintenance and cannot be assigned" }, { status: 400 })
  }

  const body = await req.json()
  const { memberId, expiresAt, notes, feeCollected = false } = body

  if (!memberId) return NextResponse.json({ error: "memberId is required" }, { status: 400 })

  // Verify member belongs to the same gym
  const member = await prisma.gymMember.findFirst({
    where:   { id: memberId, gymId: locker.gymId },
    include: { profile: { select: { fullName: true } } },
  })
  if (!member) return NextResponse.json({ error: "Member not found in this gym" }, { status: 404 })

  // Check member does not already have an active locker in this gym
  const memberExistingLocker = await prisma.lockerAssignment.findFirst({
    where:   { memberId, gymId: locker.gymId, isActive: true },
    include: { locker: { select: { lockerNumber: true } } },
  })
  if (memberExistingLocker && memberExistingLocker.lockerId !== lockerId) {
    return NextResponse.json({
      error: `${member.profile.fullName} already has locker ${memberExistingLocker.locker.lockerNumber}. Unassign it first.`,
    }, { status: 409 })
  }

  // Run in transaction: deactivate old → create new → update locker status
  const result = await prisma.$transaction(async tx => {
    // Deactivate any current assignment on this locker
    if (locker.assignments.length > 0) {
      await tx.lockerAssignment.updateMany({
        where: { lockerId, isActive: true },
        data:  { isActive: false },
      })
    }

    // Create new assignment
    const assignment = await tx.lockerAssignment.create({
      data: {
        lockerId,
        memberId,
        gymId:       locker.gymId,
        expiresAt:   expiresAt ? new Date(expiresAt) : null,
        notes:       notes || null,
        feeCollected,
      },
      include: {
        member: { include: { profile: { select: { fullName: true, avatarUrl: true, mobileNumber: true } } } },
        locker: { select: { lockerNumber: true, floor: true } },
      },
    })

    // Update locker status to ASSIGNED
    await tx.locker.update({
      where: { id: lockerId },
      data:  { status: "ASSIGNED" },
    })

    return assignment
  })

  return NextResponse.json(result, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ lockerId: string }> }) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { lockerId } = await params

  const locker = await prisma.locker.findFirst({
    where: { id: lockerId, gym: { ownerId: profileId } },
  })
  if (!locker) return NextResponse.json({ error: "Locker not found" }, { status: 404 })

  const activeAssignment = await prisma.lockerAssignment.findFirst({
    where: { lockerId, isActive: true },
  })
  if (!activeAssignment) {
    return NextResponse.json({ error: "Locker is not currently assigned" }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.lockerAssignment.update({
      where: { id: activeAssignment.id },
      data:  { isActive: false },
    }),
    prisma.locker.update({
      where: { id: lockerId },
      data:  { status: "AVAILABLE" },
    }),
  ])

  return NextResponse.json({ success: true })
}

// PATCH — update the active assignment (extend expiry, toggle feeCollected, update notes)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ lockerId: string }> }) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { lockerId } = await params

  const locker = await prisma.locker.findFirst({ where: { id: lockerId, gym: { ownerId: profileId } } })
  if (!locker) return NextResponse.json({ error: "Locker not found" }, { status: 404 })

  const activeAssignment = await prisma.lockerAssignment.findFirst({ where: { lockerId, isActive: true } })
  if (!activeAssignment) return NextResponse.json({ error: "No active assignment to update" }, { status: 400 })

  const body = await req.json()
  const { expiresAt, notes, feeCollected } = body

  const updated = await prisma.lockerAssignment.update({
    where: { id: activeAssignment.id },
    data: {
      ...(expiresAt    !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
      ...(notes        !== undefined ? { notes: notes || null } : {}),
      ...(feeCollected !== undefined ? { feeCollected } : {}),
    },
    include: {
      member: { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
    },
  })

  return NextResponse.json(updated)
}
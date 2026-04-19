// src/app/api/member/gyms/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const memberships = await prisma.gymMember.findMany({
    where: { profileId },
    include: {
      gym: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          state: true,
          pincode: true,
          contactNumber: true,
          whatsappNumber: true,
          services: true,
          facilities: true,
          gymImages: true,
          logoUrl: true,
          timezone: true,
          currency: true,
          isActive: true,
        },
      },
      membershipPlan: {
        select: {
          id: true,
          name: true,
          description: true,
          durationMonths: true,
          price: true,
          features: true,
          maxClasses: true,
        },
      },
      assignedTrainer: {
        include: {
          profile: {
            select: {
              fullName: true,
              avatarUrl: true,
              mobileNumber: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const now = new Date()

  const result = memberships.map(m => ({
    id: m.id,
    status: m.status,
    registrationId: m.registrationId,
    membershipType: m.membershipType,
    startDate: m.startDate,
    endDate: m.endDate,
    currentStreak: m.currentStreak,
    longestStreak: m.longestStreak,
    totalCheckins: m.totalCheckins,
    heightCm: m.heightCm,
    weightKg: m.weightKg,
    daysRemaining: m.endDate
      ? Math.max(0, Math.ceil((m.endDate.getTime() - now.getTime()) / 86400000))
      : null,
    gym: m.gym,
    membershipPlan: m.membershipPlan,
    assignedTrainer: m.assignedTrainer
      ? {
          id: m.assignedTrainer.id,
          fullName: m.assignedTrainer.profile.fullName,
          avatarUrl: m.assignedTrainer.profile.avatarUrl,
          mobileNumber: m.assignedTrainer.profile.mobileNumber,
        }
      : null,
  }))

  return NextResponse.json({ memberships: result })
}

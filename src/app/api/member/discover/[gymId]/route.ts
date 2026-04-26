import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ gymId: string }> }) {
  const { gymId } = await params
  const profileId = await resolveProfileId(req)

  const [gym, membership, myReview, recentReviews] = await Promise.all([
    prisma.gym.findFirst({
      where: { id: gymId, isActive: true },
      include: {
        owner: {
          select: { fullName: true, avatarUrl: true, mobileNumber: true },
        },
        membershipPlans: {
          where: { isActive: true },
          orderBy: { price: "asc" },
        },
        _count: { select: { members: true, trainers: true } },
      },
    }),
    profileId
      ? prisma.gymMember.findFirst({
          where: { gymId, profileId },
          select: { status: true, isActive: true },
          orderBy: { createdAt: "desc" },
        })
      : null,
    profileId
      ? prisma.gymReview.findUnique({
          where: { gymId_profileId: { gymId, profileId } },
          include: { profile: { select: { fullName: true, avatarUrl: true } } },
        })
      : null,
    prisma.gymReview.findMany({
      where: { gymId },
      include: { profile: { select: { fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  return NextResponse.json({
    ...gym,
    isEnrolled: !!membership,
    membershipStatus: membership?.status ?? null,
    memberIsActive: membership?.isActive ?? false,
    recentReviews,
    myReview: myReview ?? null,
  })
}

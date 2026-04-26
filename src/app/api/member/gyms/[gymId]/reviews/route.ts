import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string }> }
) {
  const { gymId } = await params
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"))
  const limit = 10
  const skip = (page - 1) * limit

  const [reviews, total, myReview] = await Promise.all([
    prisma.gymReview.findMany({
      where: { gymId },
      include: { profile: { select: { fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.gymReview.count({ where: { gymId } }),
    prisma.gymReview.findUnique({
      where: { gymId_profileId: { gymId, profileId } },
      include: { profile: { select: { fullName: true, avatarUrl: true } } },
    }),
  ])

  return NextResponse.json({ reviews, total, pages: Math.ceil(total / limit), myReview })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gymId: string }> }
) {
  const { gymId } = await params
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await prisma.gymMember.findFirst({
    where: { gymId, profileId },
  })
  if (!membership) {
    return NextResponse.json(
      { error: "You must be enrolled at this gym to leave a review" },
      { status: 403 }
    )
  }

  const body = await req.json()
  const rating = Number(body.rating)
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
  }
  const comment: string | null = body.comment?.trim() || null

  const review = await prisma.gymReview.upsert({
    where: { gymId_profileId: { gymId, profileId } },
    create: { gymId, profileId, role: "member", rating, comment },
    update: { rating, comment },
    include: { profile: { select: { fullName: true, avatarUrl: true } } },
  })

  const stats = await prisma.gymReview.aggregate({
    where: { gymId },
    _avg: { rating: true },
    _count: { id: true },
  })
  await prisma.gym.update({
    where: { id: gymId },
    data: {
      averageRating: stats._avg.rating ?? 0,
      totalReviews: stats._count.id,
    },
  })

  return NextResponse.json(review)
}

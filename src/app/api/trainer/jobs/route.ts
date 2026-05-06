// GET /api/trainer/jobs — list open jobs; full details gated behind active trainer subscription
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { getTrainerSubscriptionStatus } from "@/lib/trainerSubscription"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit  = 20
  const skip   = (page - 1) * limit
  const search = searchParams.get("q") ?? ""
  const city   = searchParams.get("city") ?? ""

  const { isActive } = await getTrainerSubscriptionStatus(profileId)

  const where: any = { status: "OPEN" }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { city:  { contains: search, mode: "insensitive" } },
    ]
  }
  if (city) where.city = { contains: city, mode: "insensitive" }

  const [jobs, total] = await Promise.all([
    prisma.jobPosting.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id:               true,
        title:            true,
        jobType:          true,
        workMode:         true,
        specializations:  true,
        salaryCurrency:   true,
        salaryMin:        true,
        salaryMax:        true,
        experienceMin:    true,
        city:             true,
        state:            true,
        shortDescription: true,
        status:           true,
        createdAt:        true,
        applicationCount: true,
        // gated fields only if subscribed
        ...(isActive ? {
          fullDescription:          true,
          contactEmail:             true,
          contactPhone:             true,
          applicationInstructions:  true,
          requirements:             true,
          benefits:                 true,
        } : {}),
        gym: {
          select: {
            id:   true,
            name: true,
            city: true,
            ...(isActive ? { address: true, contactNumber: true } : {}),
          },
        },
      },
    }),
    prisma.jobPosting.count({ where }),
  ])

  // Check which jobs this trainer has already applied to
  const appliedJobIds = new Set(
    (await prisma.jobApplication.findMany({
      where: { profileId, jobId: { in: jobs.map((j) => j.id) } },
      select: { jobId: true },
    })).map((a) => a.jobId)
  )

  return NextResponse.json({
    jobs: jobs.map((j) => ({ ...j, hasApplied: appliedJobIds.has(j.id) })),
    total,
    page,
    pages: Math.ceil(total / limit),
    isSubscribed: isActive,
  })
}

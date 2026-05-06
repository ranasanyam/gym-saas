// GET /api/trainer/jobs/[jobId] — job detail; full info gated behind active trainer subscription
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { getTrainerSubscriptionStatus } from "@/lib/trainerSubscription"

export const runtime = "nodejs"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { jobId } = await params
  const { isActive } = await getTrainerSubscriptionStatus(profileId)

  const job = await prisma.jobPosting.findUnique({
    where: { id: jobId },
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
      requirements:     true,
      benefits:         true,
      status:           true,
      createdAt:        true,
      applicationCount: true,
      viewCount:        true,
      ...(isActive ? {
        fullDescription:         true,
        contactEmail:            true,
        contactPhone:            true,
        applicationInstructions: true,
        location:                true,
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
  })

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })
  if (job.status === "CLOSED" || job.status === "FILLED") {
    return NextResponse.json({ error: "Job is no longer active" }, { status: 410 })
  }

  // Increment view count (fire-and-forget)
  prisma.jobPosting.update({ where: { id: jobId }, data: { viewCount: { increment: 1 } } }).catch(() => {})

  const application = await prisma.jobApplication.findUnique({
    where: { jobId_profileId: { jobId, profileId } },
    select: { id: true, status: true, createdAt: true },
  })

  return NextResponse.json({ job, isSubscribed: isActive, application: application ?? null })
}

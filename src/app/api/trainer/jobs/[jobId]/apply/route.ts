// POST /api/trainer/jobs/[jobId]/apply — apply; requires active trainer subscription
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { getTrainerSubscriptionStatus } from "@/lib/trainerSubscription"
import { sendPushToProfile } from "@/lib/push"

export const runtime = "nodejs"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { isActive } = await getTrainerSubscriptionStatus(profileId)
  if (!isActive) {
    return NextResponse.json(
      { error: "An active trainer subscription is required to apply for jobs." },
      { status: 403 }
    )
  }

  const { jobId } = await params

  const job = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    select: { id: true, title: true, status: true, postedByProfileId: true, gymId: true },
  })
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })
  if (job.status !== "OPEN") {
    return NextResponse.json({ error: "This job is no longer accepting applications" }, { status: 410 })
  }
  if (job.postedByProfileId === profileId) {
    return NextResponse.json({ error: "You cannot apply to your own job posting" }, { status: 400 })
  }

  let body: { coverLetter?: string }
  try { body = await req.json() } catch { body = {} }

  const existing = await prisma.jobApplication.findUnique({
    where: { jobId_profileId: { jobId, profileId } },
  })
  if (existing) {
    return NextResponse.json({ error: "You have already applied to this job" }, { status: 409 })
  }
  
  // Fetch trainer name for the notification message
  const trainer = await prisma.profile.findUnique({
    where:  { id: profileId },
    select: { fullName: true },
  })

  const application = await prisma.$transaction(async (tx) => {
    const app = await tx.jobApplication.create({
      data: { jobId, profileId, coverLetter: body.coverLetter ?? null },
    })
    await tx.jobPosting.update({
      where: { id: jobId },
      data:  { applicationCount: { increment: 1 } },
    })
    return app
  })

  // Notify the owner who posted the job (fire-and-forget)
  const trainerName = trainer?.fullName ?? "A trainer"
  await Promise.allSettled([
    prisma.notification.create({
      data: {
        profileId: job.postedByProfileId,
        title:     "New Job Application",
        message:   `${trainerName} applied to your job post "${job.title}". Review their application now.`,
        type:      "SYSTEM",
      },
    }),
    sendPushToProfile(job.postedByProfileId, {
      title: "New Application Received",
      body:  `${trainerName} applied to "${job.title}"`,
      url:   `/owner/jobs/${jobId}/applications`,
      tag:   `job-application-${jobId}`,
    }),
  ]).catch(() => {})
  return NextResponse.json({ success: true, application }, { status: 201 })
}

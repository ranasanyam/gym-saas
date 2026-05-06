// GET  /api/owner/jobs/[jobId]/applications — view applicants for a job
// PATCH /api/owner/jobs/[jobId]/applications — update application status + notify trainer
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { sendPushToProfile } from "@/lib/push"

export const runtime = "nodejs"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { jobId } = await params
  const job = await prisma.jobPosting.findFirst({
    where: { id: jobId, postedByProfileId: profileId },
    select: { id: true, title: true },
  })
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

  const applications = await prisma.jobApplication.findMany({
    where:   { jobId },
    orderBy: { createdAt: "desc" },
    select: {
      id:          true,
      status:      true,
      coverLetter: true,
      createdAt:   true,
      updatedAt:   true,
      profile: {
        select: {
          id:           true,
          fullName:     true,
          email:        true,
          mobileNumber: true,
          avatarUrl:    true,
        },
      },
    },
  })

  return NextResponse.json({ job, applications })
}

const STATUS_MESSAGES: Record<string, { title: string; body: (jobTitle: string) => string }> = {
  REVIEWED:    { title: "Application Reviewed",  body: (t) => `Your application for "${t}" has been reviewed by the gym.` },
  SHORTLISTED: { title: "You've Been Shortlisted!", body: (t) => `Great news! You've been shortlisted for "${t}". The gym may contact you soon.` },
  REJECTED:    { title: "Application Update",    body: (t) => `Your application for "${t}" was not selected this time. Keep applying!` },
  HIRED:       { title: "Congratulations!",      body: (t) => `You've been hired for "${t}"! The gym will contact you with next steps.` },
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { jobId } = await params
  const job = await prisma.jobPosting.findFirst({
    where:  { id: jobId, postedByProfileId: profileId },
    select: { id: true, title: true },
  })
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

  let body: { applicationId?: string; status?: string }
  try { body = await req.json() } catch { body = {} }

  const { applicationId, status } = body
  if (!applicationId || !status) {
    return NextResponse.json({ error: "applicationId and status are required" }, { status: 400 })
  }

  const validStatuses = ["PENDING", "REVIEWED", "SHORTLISTED", "REJECTED", "HIRED"]
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const application = await prisma.jobApplication.update({
    where:  { id: applicationId },
    data:   { status: status as any },
    select: { id: true, status: true, profileId: true },
  })

  // Notify the trainer about their application status change (fire-and-forget)
  const msg = STATUS_MESSAGES[status]
  if (msg) {
    await Promise.allSettled([
      prisma.notification.create({
        data: {
          profileId: application.profileId,
          title:     msg.title,
          message:   msg.body(job.title),
          type:      "SYSTEM",
        },
      }),
      sendPushToProfile(application.profileId, {
        title: msg.title,
        body:  msg.body(job.title),
        url:   "/trainer/jobs/applications",
        tag:   `job-app-status-${applicationId}`,
      }),
    ]).catch(() => {})
  }

  return NextResponse.json(application)
}

// GET    /api/owner/jobs/[jobId] — full job detail for owner (edit pre-fill)
// PATCH  /api/owner/jobs/[jobId] — update job posting
// DELETE /api/owner/jobs/[jobId] — delete job posting
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

async function getOwnedJob(jobId: string, profileId: string) {
  return prisma.jobPosting.findFirst({
    where: { id: jobId, postedByProfileId: profileId },
  })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { jobId } = await params
  const job = await prisma.jobPosting.findFirst({
    where: { id: jobId, postedByProfileId: profileId },
    include: { gym: { select: { id: true, name: true } } },
  })
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

  return NextResponse.json(job)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { jobId } = await params
  const job = await getOwnedJob(jobId, profileId)
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

  let body: any
  try { body = await req.json() } catch { body = {} }

  const allowedFields = [
    "title", "jobType", "workMode", "specializations", "salaryCurrency", "salaryMin", "salaryMax",
    "experienceMin", "city", "state", "shortDescription", "fullDescription", "requirements",
    "benefits", "contactEmail", "contactPhone", "applicationInstructions", "location", "status", "expiresAt",
  ]

  const data: any = {}
  for (const field of allowedFields) {
    if (field in body) {
      data[field] = field === "expiresAt" && body[field] ? new Date(body[field]) : body[field]
    }
  }

  const updated = await prisma.jobPosting.update({ where: { id: jobId }, data })
  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { jobId } = await params
  const job = await getOwnedJob(jobId, profileId)
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

  await prisma.jobPosting.delete({ where: { id: jobId } })
  return NextResponse.json({ success: true })
}

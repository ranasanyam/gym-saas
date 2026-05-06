// GET /api/owner/jobs — list owner's job postings
// POST /api/owner/jobs — create job (requires pro+ plan)
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { getOwnerSubscription, hasAccess } from "@/lib/subscription"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const jobs = await prisma.jobPosting.findMany({
    where: { postedByProfileId: profileId },
    orderBy: { createdAt: "desc" },
    select: {
      id:               true,
      title:            true,
      jobType:          true,
      workMode:         true,
      status:           true,
      city:             true,
      state:            true,
      location:         true,
      applicationCount: true,
      viewCount:        true,
      createdAt:        true,
      expiresAt:        true,
      gym: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(jobs)
}

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sub = await getOwnerSubscription(profileId)
  if (!sub || !hasAccess(sub.planName, "pro")) {
    return NextResponse.json(
      { error: "Job postings require a Pro or Enterprise plan. Please upgrade your subscription." },
      { status: 403 }
    )
  }

  let body: any
  try { body = await req.json() } catch { body = {} }

  const {
    gymId, title, jobType, workMode, specializations, salaryCurrency, salaryMin, salaryMax,
    experienceMin, city, state, shortDescription, fullDescription, requirements, benefits,
    contactEmail, contactPhone, applicationInstructions, location, expiresAt,
  } = body

  if (!gymId || !title || !jobType || !workMode || !fullDescription) {
    return NextResponse.json({ error: "gymId, title, jobType, workMode, and fullDescription are required" }, { status: 400 })
  }

  const gym = await prisma.gym.findFirst({
    where: { id: gymId, ownerId: profileId },
  })
  if (!gym) return NextResponse.json({ error: "Gym not found or not owned by you" }, { status: 404 })

  const job = await prisma.jobPosting.create({
    data: {
      gymId,
      postedByProfileId:       profileId,
      title,
      jobType,
      workMode,
      specializations:         specializations ?? [],
      salaryCurrency:          salaryCurrency ?? "INR",
      salaryMin:               salaryMin ?? null,
      salaryMax:               salaryMax ?? null,
      experienceMin:           experienceMin ?? null,
      city:                    city ?? null,
      state:                   state ?? null,
      shortDescription:        shortDescription ?? null,
      fullDescription,
      requirements:            requirements ?? [],
      benefits:                benefits ?? [],
      contactEmail:            contactEmail ?? null,
      contactPhone:            contactPhone ?? null,
      applicationInstructions: applicationInstructions ?? null,
      location:                location ?? null,
      expiresAt:               expiresAt ? new Date(expiresAt) : null,
      status:                  "OPEN",
    },
  })

  return NextResponse.json(job, { status: 201 })
}

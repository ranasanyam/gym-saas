// GET /api/trainer/jobs/applications — trainer's own job applications
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const applications = await prisma.jobApplication.findMany({
    where: { profileId },
    orderBy: { createdAt: "desc" },
    select: {
      id:          true,
      status:      true,
      coverLetter: true,
      createdAt:   true,
      updatedAt:   true,
      job: {
        select: {
          id:       true,
          title:    true,
          jobType:  true,
          workMode: true,
          city:     true,
          state:    true,
          status:   true,
          gym: { select: { id: true, name: true } },
        },
      },
    },
  })

  return NextResponse.json(applications)
}

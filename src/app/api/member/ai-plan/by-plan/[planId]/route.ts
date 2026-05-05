// GET /api/member/ai-plan/by-plan/[planId]
// Looks up the GeneratedAIPlan record linked to a given DietPlan or WorkoutPlan.
// Returns the record (with generatedAt for 2-hour window check) or 404.
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { planId } = await params

  const generated = await prisma.generatedAIPlan.findFirst({
    where: {
      profileId,
      linkedPlanId: planId,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id:                true,
      planType:          true,
      generatedAt:       true,
      lastChangeRequest: true,
      creditDeducted:    true,
    },
  })

  if (!generated) {
    return NextResponse.json({ found: false })
  }

  const now           = Date.now()
  const withinWindow  = now - new Date(generated.generatedAt).getTime() <= TWO_HOURS_MS
  const minutesLeft   = withinWindow
    ? Math.ceil((new Date(generated.generatedAt).getTime() + TWO_HOURS_MS - now) / 60_000)
    : 0

  return NextResponse.json({
    found:         true,
    id:            generated.id,
    planType:      generated.planType,
    generatedAt:   generated.generatedAt,
    withinWindow,
    minutesLeft,
    lastChangeRequest: generated.lastChangeRequest,
  })
}

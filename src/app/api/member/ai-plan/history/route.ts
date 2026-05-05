// GET /api/member/ai-plan/history — returns the member's AI-generated plan history
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const plans = await prisma.generatedAIPlan.findMany({
    where:   { profileId },
    orderBy: { createdAt: "desc" },
    select: {
      id:                true,
      planType:          true,
      userPrompt:        true,
      lastChangeRequest: true,
      generatedAt:       true,
      creditDeducted:    true,
      linkedPlanId:      true,
      createdAt:         true,
      planContent:       true,
    },
  })

  return NextResponse.json(plans)
}

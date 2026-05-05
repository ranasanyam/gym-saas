// src/app/api/member/ai-plan/request/[requestId]/route.ts
// Returns the current status of an AI plan generation request.
// Used for polling or page-refresh resilience after the generate call.
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { requestId } = await params

  const request = await prisma.pendingAIPlanRequest.findUnique({
    where:   { id: requestId },
    include: { member: { select: { profileId: true } } },
  })

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 })
  }
  if (request.member.profileId !== profileId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({
    success: true,
    data: {
      id:              request.id,
      planType:        request.planType,
      status:          request.status,
      generatedPlanId: request.generatedPlanId,
      errorMessage:    request.errorMessage,
      createdAt:       request.createdAt,
      updatedAt:       request.updatedAt,
    },
  })
}

// GET /api/member/ai-subscription/status — returns the member's active AI subscription
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const subscription = await prisma.memberAISubscription.findFirst({
    where: {
      profileId,
      isActive:   true,
      expiryDate: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  })

  if (!subscription) {
    return NextResponse.json({ hasSubscription: false })
  }

  return NextResponse.json({
    hasSubscription:  true,
    id:               subscription.id,
    planSlug:         subscription.planSlug,
    totalCredits:     subscription.totalCredits,
    usedCredits:      subscription.usedCredits,
    remainingCredits: subscription.totalCredits - subscription.usedCredits,
    expiryDate:       subscription.expiryDate,
    startDate:        subscription.startDate,
  })
}

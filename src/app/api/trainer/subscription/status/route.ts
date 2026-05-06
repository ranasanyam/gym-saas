import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { getTrainerSubscriptionStatus } from "@/lib/trainerSubscription"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { isActive, subscription } = await getTrainerSubscriptionStatus(profileId)

  if (!isActive || !subscription) {
    return NextResponse.json({ isActive: false })
  }

  return NextResponse.json({
    isActive: true,
    id:        subscription.id,
    planSlug:  subscription.planSlug,
    startDate: subscription.startDate,
    endDate:   subscription.endDate,
    status:    subscription.status,
  })
}

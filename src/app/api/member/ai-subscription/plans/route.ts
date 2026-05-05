// GET /api/member/ai-subscription/plans — public, returns the 3 member AI subscription tiers
import { NextResponse } from "next/server"
import { MEMBER_AI_PLANS } from "@/lib/memberAISubscriptionPlans"

export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json(MEMBER_AI_PLANS)
}

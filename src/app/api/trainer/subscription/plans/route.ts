import { NextResponse } from "next/server"
import { TRAINER_PLANS } from "@/lib/trainerSubscriptionPlans"

export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json(TRAINER_PLANS)
}

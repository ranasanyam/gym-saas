// src/lib/requireActivePlan.ts
// Hard plan wall for every owner API route.
// An owner with PENDING_SELECTION (no confirmed subscription) cannot call any
// owner API — not even free-tier data reads.
// This is separate from feature gating (lib/subscription.ts).

import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

const GRACE_DAYS = 7

interface PlanCheckResult {
  ok:       true
  response?: never
}
interface PlanCheckBlocked {
  ok:       false
  response: NextResponse
}

type PlanCheck = PlanCheckResult | PlanCheckBlocked

/**
 * Call at the top of every owner API handler.
 *
 * Returns { ok: true } if the owner has an active (or grace-period) plan.
 * Returns { ok: false, response } with a ready-made 403 JSON response otherwise.
 *
 * Usage:
 *   const check = await requireActivePlan(profileId)
 *   if (!check.ok) return check.response
 */
export async function requireActivePlan(profileId: string): Promise<PlanCheck> {
  const profile = await prisma.profile.findUnique({
    where:  { id: profileId },
    select: { ownerPlanStatus: true },
  })

  if (profile?.ownerPlanStatus !== "ACTIVE") {
    return {
      ok:       false,
      response: NextResponse.json(
        { error: "Please select a plan to continue.", code: "PLAN_NOT_SELECTED" },
        { status: 403 }
      ),
    }
  }

  const sub = await prisma.saasSubscription.findFirst({
    where:   { profileId },
    orderBy: { createdAt: "desc" },
    select:  { status: true, currentPeriodEnd: true },
  })

  // No subscription at all → owner has never selected a plan.
  if (!sub) {
    return {
      ok:       false,
      response: NextResponse.json(
        { error: "Please select a plan to continue.", code: "PLAN_NOT_SELECTED" },
        { status: 403 }
      ),
    }
  }

  // Lifetime plans are always valid.
  if (sub.status === "LIFETIME") return { ok: true }

  const validStatuses = ["ACTIVE", "TRIALING"]
  if (!validStatuses.includes(sub.status)) {
    return {
      ok:       false,
      response: NextResponse.json(
        { error: "Your plan has expired. Please renew to continue.", code: "PLAN_EXPIRED" },
        { status: 403 }
      ),
    }
  }

  if (sub.currentPeriodEnd !== null) {
    const graceCutoff = new Date(Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000)
    if (sub.currentPeriodEnd <= graceCutoff) {
      return {
        ok:       false,
        response: NextResponse.json(
          { error: "Your plan has expired. Please renew to continue.", code: "PLAN_EXPIRED" },
          { status: 403 }
        ),
      }
    }
  }

  return { ok: true }
}

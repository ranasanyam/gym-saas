import { requireActivePlan } from "@/lib/requireActivePlan"
// src/app/api/owner/dashboard/route.ts
// Mobile-compatible API handler. Web dashboard now uses Server Components directly.

import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId }          from "@/lib/mobileAuth"
import { prisma }                    from "@/lib/prisma"
import { getDashboardStats }         from "@/lib/dashboard-queries"
import type { DashRange }            from "@/lib/dashboard-queries"

// Re-export so existing mobile clients that import DashRange from this file continue to work
export type { DashRange } from "@/lib/dashboard-queries"


// ── MAIN API ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const profileId = await resolveProfileId(req)
    if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response

    const { searchParams } = new URL(req.url)
    const filterGymId = searchParams.get("gymId") ?? ""
    const range       = (searchParams.get("range") ?? "last_30_days") as DashRange
    const customStart = searchParams.get("customStart")
    const customEnd   = searchParams.get("customEnd")

    const gyms = await prisma.gym.findMany({
      where:  { ownerId: profileId, isActive: true },
      select: { id: true, name: true, city: true },
    })

    const allGymIds = gyms.map(g => g.id)
    const gymIds    = filterGymId && allGymIds.includes(filterGymId)
      ? [filterGymId]
      : allGymIds

    if (!allGymIds.length) {
      return NextResponse.json({ gyms: [] })
    }

    // All queries delegated to the shared lib (same logic used by Server Components)
    const stats = await getDashboardStats(gymIds, range, customStart, customEnd)

    return NextResponse.json({
      gyms,
      activeGyms:   allGymIds.length,
      filteredGymId: filterGymId || null,

      ...stats,

      // Serialize Date objects to ISO strings for JSON transport
      rangeStart: stats.rangeStart.toISOString(),
      rangeEnd:   stats.rangeEnd.toISOString(),
      prevStart:  stats.prevStart.toISOString(),
      prevEnd:    stats.prevEnd.toISOString(),
    })

  } catch (error: any) {
    console.error("[Dashboard API]", error?.message ?? error)
    return NextResponse.json(
      { error: "Internal server error", detail: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

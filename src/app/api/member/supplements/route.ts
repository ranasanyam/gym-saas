// src/app/api/member/supplements/route.ts
// Returns supplements from the member's active gym(s).
// Members can browse what's available — they ask their trainer/owner to purchase.
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId }          from "@/lib/mobileAuth"
import { prisma }                    from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search   = searchParams.get("search")   ?? ""
  const category = searchParams.get("category") ?? ""

  // Find the member's active gym memberships
  const memberships = await prisma.gymMember.findMany({
    where:  { profileId, status: "ACTIVE" },
    select: { gymId: true },
  })

  if (!memberships.length) {
    return NextResponse.json({ supplements: [], categories: [] })
  }

  const gymIds = memberships.map(m => m.gymId)

  const supplements = await prisma.supplement.findMany({
    where: {
      gymId:    { in: gymIds },
      isActive: true,
      stockQty: { gt: 0 },            // only show in-stock items
      ...(search   ? { name:     { contains: search,   mode: "insensitive" } } : {}),
      ...(category ? { category: { equals:  category,  mode: "insensitive" } } : {}),
    },
    include: {
      gym: { select: { name: true } },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  })

  // Extract unique categories for the filter tabs
  const categories = [...new Set(
    supplements.map(s => s.category).filter(Boolean)
  )].sort() as string[]

  return NextResponse.json({ supplements, categories })
}
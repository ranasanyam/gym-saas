// src/app/api/member/macro-summary/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, parseISO } from "date-fns"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dateParam = searchParams.get("date")
  const date = dateParam ? parseISO(dateParam) : new Date()
  const from = startOfDay(date)
  const to   = endOfDay(date)

  const membership = await prisma.gymMember.findFirst({
    where: { profileId },
    select: { id: true },
  })
  if (!membership) {
    return NextResponse.json({ success: true, data: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 } })
  }

  const logs = await prisma.mealLog.findMany({
    where: { memberId: membership.id, logDate: { gte: from, lte: to } },
    select: { dietPlanId: true, mealKey: true },
  })

  if (logs.length === 0) {
    return NextResponse.json({ success: true, data: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 } })
  }

  // Group logs by dietPlanId so we only fetch each plan once
  const planIds = [...new Set(logs.map(l => l.dietPlanId))]
  const plans = await prisma.dietPlan.findMany({
    where: { id: { in: planIds } },
    select: { id: true, planData: true },
  })
  const planMap = new Map(plans.map(p => [p.id, p.planData as Record<string, any[]>]))

  let calories  = 0
  let protein_g = 0
  let carbs_g   = 0
  let fat_g     = 0

  for (const log of logs) {
    const planData = planMap.get(log.dietPlanId)
    if (!planData) continue
    const items: any[] = planData[log.mealKey] ?? []
    for (const item of items) {
      calories  += Number(item.calories)   || 0
      protein_g += Number(item.protein_g)  || 0
      carbs_g   += Number(item.carbs_g)    || 0
      fat_g     += Number(item.fat_g)      || 0
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      calories:  Math.round(calories),
      protein_g: Math.round(protein_g * 10) / 10,
      carbs_g:   Math.round(carbs_g   * 10) / 10,
      fat_g:     Math.round(fat_g     * 10) / 10,
    },
  })
}

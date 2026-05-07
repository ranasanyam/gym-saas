// src/app/api/saas/payments/route.ts
// Returns the platform subscription payment history for the authenticated user.
// Used by the billing history section on the subscriptions page.
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payments = await prisma.saasPayment.findMany({
    where:   { profileId, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    take:    20,
    include: { subscription: { include: { saasPlan: { select: { name: true, interval: true } } } } },
  })

  return NextResponse.json(payments)
}

// src/app/api/auth/check-mobile-status/route.ts
// GET /api/auth/check-mobile-status?mobile=9876543210
// Public endpoint — returns INVITED | ACTIVE | NOT_FOUND (no PII leaked)

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const raw    = req.nextUrl.searchParams.get("mobile") ?? ""
  const mobile = raw.replace(/\D/g, "").slice(-10)

  if (mobile.length !== 10) {
    return NextResponse.json({ status: "NOT_FOUND" })
  }

  const profile = await prisma.profile.findFirst({
    where:  { mobileNumber: { endsWith: mobile } },
    select: { status: true },
  })

  if (!profile) return NextResponse.json({ status: "NOT_FOUND" })
  return NextResponse.json({ status: profile.status })  // "ACTIVE" | "INVITED"
}

// src/app/api/auth/check-email-status/route.ts
// GET /api/auth/check-email-status?email=user@example.com
// Public endpoint — returns FOUND | NOT_FOUND (no PII leaked)

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const raw   = req.nextUrl.searchParams.get("email") ?? ""
  const email = raw.trim().toLowerCase()

  if (!email || !email.includes("@")) {
    return NextResponse.json({ status: "NOT_FOUND" })
  }

  const profile = await prisma.profile.findUnique({
    where:  { email },
    select: { id: true },
  })

  return NextResponse.json({ status: profile ? "FOUND" : "NOT_FOUND" })
}

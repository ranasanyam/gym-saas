// src/app/api/referral/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

const REFERRAL_REWARD = 100 // ₹100 wallet credit per successful referral

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: {
      referralCode: { select: { id: true, code: true } },
      wallet: { select: { balance: true } },
    },
  })

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  // Referrals I sent (people I referred)
  const referred = await prisma.referral.findMany({
    where: { referrerId: profileId },
    include: {
      referred: { select: { fullName: true, avatarUrl: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  // Wallet transactions
  const transactions = await prisma.walletTransaction.findMany({
    where: { wallet: { profileId: profileId } },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  const stats = {
    totalReferred:   referred.length,
    converted:       referred.filter(r => r.status === "CONVERTED").length,
    pending:         referred.filter(r => r.status === "PENDING").length,
    totalEarned:     referred.filter(r => r.status === "CONVERTED").reduce((s, r) => s + Number(r.rewardAmount ?? REFERRAL_REWARD), 0),
    walletBalance:   Number(profile.wallet?.balance ?? 0),
    rewardPerReferral: REFERRAL_REWARD,
  }

  return NextResponse.json({
    code:         profile.referralCode?.code ?? null,
    stats,
    referred,
    transactions,
  })
}
// src/app/api/owner/referral/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { requireActivePlan } from "@/lib/requireActivePlan"
import { prisma } from "@/lib/prisma"

const REFERRAL_REWARD = 500 // Owners get more — ₹500 per gym owner referral

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response


  const profile = await prisma.profile.findUnique({
    where:  { id: profileId },
    select: {
      referralCode: { select: { id: true, code: true } },
      wallet:       { select: { id: true, balance: true } },
    },
  })
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const [referred, transactions] = await Promise.all([
    prisma.referral.findMany({
      where:   { referrerId: profileId },
      include: {
        referred: {
          select: {
            fullName: true, avatarUrl: true, createdAt: true, role: true,
            ownedGyms: { select: { name: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    profile.wallet
      ? prisma.walletTransaction.findMany({
          where:   { walletId: profile.wallet.id },
          orderBy: { createdAt: "desc" },
          take:    30,
        })
      : [],
  ])

  // Compute usable balance (excluding expired credits)
  const now = new Date()
  let usableBalance = 0
  if (profile.wallet) {
    const credits = await prisma.walletTransaction.findMany({
      where: { walletId: profile.wallet.id, type: { in: ["CREDIT_REFERRAL", "CREDIT_BONUS"] } },
    })
    const debits = await prisma.walletTransaction.findMany({
      where: { walletId: profile.wallet.id, type: { in: ["DEBIT_SUBSCRIPTION", "DEBIT_MEMBERSHIP", "DEBIT_ADJUSTMENT"] } },
    })
    const validCredits = credits.filter(c => !c.expiresAt || c.expiresAt > now).reduce((s, c) => s + Number(c.amount), 0)
    const totalDebits  = debits.reduce((s, d) => s + Number(d.amount), 0)
    usableBalance = Math.max(0, validCredits - totalDebits)
  }

  const stats = {
    totalReferred:     referred.length,
    converted:         referred.filter(r => r.status === "CONVERTED").length,
    pending:           referred.filter(r => r.status === "PENDING").length,
    totalEarned:       referred.filter(r => r.status === "CONVERTED").reduce((s, r) => s + Number(r.rewardAmount ?? REFERRAL_REWARD), 0),
    walletBalance:     Number(profile.wallet?.balance ?? 0),
    usableBalance,
    rewardPerReferral: REFERRAL_REWARD,
  }

  // "Already using" notices: referred profiles who are already owners with active gyms
  // (and whose referral is still PENDING — i.e. haven't paid yet but ARE on the platform)
  const alreadyUsingNotices = await Promise.all(
    referred
      .filter(r => r.status === "PENDING" && r.referred.role === "owner")
      .map(async r => {
        const gym = await prisma.gym.findFirst({
          where:  { ownerId: r.referredId, isActive: true },
          select: { name: true, createdAt: true },
        })
        if (!gym) return null
        return {
          profileId:  r.referredId,
          fullName:   r.referred.fullName,
          avatarUrl:  r.referred.avatarUrl,
          gymName:    gym.name,
          notifiedAt: gym.createdAt.toISOString(),
        }
      })
  ).then(results => results.filter(Boolean))

  return NextResponse.json({
    code:               profile.referralCode?.code ?? null,
    stats,
    referred,
    transactions,
    alreadyUsingNotices,
  })
}
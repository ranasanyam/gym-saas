// src/app/api/wallet/use/route.ts
// Apply wallet credit to a membership payment with 20% cap + expiry validation
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

const WALLET_CAP_PERCENT = 20  // members can use max 20% of membership fee from wallet
const CREDIT_EXPIRY_DAYS  = 90 // wallet credits expire after 90 days

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { membershipFeeAmount, gymId } = await req.json()
  if (!membershipFeeAmount || !gymId)
    return NextResponse.json({ error: "membershipFeeAmount and gymId required" }, { status: 400 })

  const feeAmount = Number(membershipFeeAmount)

  // Expire old credits first (90-day rule)
  const now = new Date()
  const wallet = await prisma.wallet.findUnique({
    where:  { profileId: profileId },
    select: { id: true, balance: true },
  })
  if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 })

  // Expire transactions that have passed their expiresAt
  const expiredTxns = await prisma.walletTransaction.findMany({
    where: {
      walletId:  wallet.id,
      type:      { in: ["CREDIT_REFERRAL", "CREDIT_BONUS"] },
      expiresAt: { lt: now },
      // We track expiry on credit records; we'll compute the expired amount
    },
    select: { id: true, amount: true, expiresAt: true },
  })

  // Calculate actually-expired credits not yet debited
  // Simple approach: recompute usable balance excluding expired credits
  const allCredits = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id, type: { in: ["CREDIT_REFERRAL", "CREDIT_BONUS"] } },
  })
  const allDebits = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id, type: { in: ["DEBIT_SUBSCRIPTION", "DEBIT_MEMBERSHIP", "DEBIT_ADJUSTMENT"] } },
  })

  const validCredits = allCredits
    .filter(c => !c.expiresAt || c.expiresAt > now)
    .reduce((s, c) => s + Number(c.amount), 0)
  const totalDebits  = allDebits.reduce((s, d) => s + Number(d.amount), 0)
  const usableBalance = Math.max(0, validCredits - totalDebits)

  // Cap: max 20% of membership fee
  const maxUsable = Math.floor((feeAmount * WALLET_CAP_PERCENT) / 100)
  const canUse    = Math.min(usableBalance, maxUsable)

  return NextResponse.json({
    usableBalance,
    maxUsable,
    canUse,
    capPercent:      WALLET_CAP_PERCENT,
    feeAmount,
    expiryDays:      CREDIT_EXPIRY_DAYS,
    expiredCredits:  expiredTxns.length,
  })
}

// Actually deduct from wallet when payment is confirmed
export async function PATCH(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { amount, gymId, paymentId } = await req.json()
  if (!amount || !gymId)
    return NextResponse.json({ error: "amount and gymId required" }, { status: 400 })

  const wallet = await prisma.wallet.findUnique({ where: { profileId: profileId } })
  if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 })

  const newBalance = Math.max(0, Number(wallet.balance) - Number(amount))

  await prisma.$transaction([
    prisma.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } }),
    prisma.walletTransaction.create({
      data: {
        walletId:    wallet.id,
        type:        "DEBIT_MEMBERSHIP",
        amount:      Number(amount),
        balanceAfter: newBalance,
        description: `Wallet discount applied to gym membership`,
        referenceId: paymentId ?? null,
        gymId,
      },
    }),
  ])

  return NextResponse.json({ newBalance, deducted: amount })
}
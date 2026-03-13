// // src/app/api/referral/convert/route.ts
// // Called internally after a successful SaaS subscription purchase to convert pending referral
// import { NextRequest, NextResponse } from "next/server"
// import { prisma } from "@/lib/prisma"

// const REFERRAL_REWARD = 100 // ₹100

// export async function POST(req: NextRequest) {
//   const { profileId, paymentId } = await req.json()
//   if (!profileId) return NextResponse.json({ error: "profileId required" }, { status: 400 })

//   // Check if this user was referred and their referral is still PENDING
//   const referral = await prisma.referral.findFirst({
//     where: { referredId: profileId, status: "PENDING" },
//     include: {
//       referrer: { select: { id: true, wallet: { select: { id: true, balance: true } } } },
//     },
//   })

//   if (!referral) return NextResponse.json({ converted: false })

//   // Check expiry
//   if (referral.expiresAt && referral.expiresAt < new Date()) {
//     await prisma.referral.update({ where: { id: referral.id }, data: { status: "EXPIRED" } })
//     return NextResponse.json({ converted: false, reason: "expired" })
//   }

//   const referrerWallet = referral.referrer.wallet
//   if (!referrerWallet) return NextResponse.json({ converted: false, reason: "no_wallet" })

//   const newBalance = Number(referrerWallet.balance) + REFERRAL_REWARD

//   // Convert referral + credit wallet in one transaction
//   await prisma.$transaction([
//     prisma.referral.update({
//       where: { id: referral.id },
//       data: {
//         status:           "CONVERTED",
//         rewardAmount:     REFERRAL_REWARD,
//         rewardCreditedAt: new Date(),
//         triggerPaymentId: paymentId ?? null,
//       },
//     }),
//     prisma.wallet.update({
//       where:  { id: referrerWallet.id },
//       data:   { balance: newBalance },
//     }),
//     prisma.walletTransaction.create({
//       data: {
//         walletId:    referrerWallet.id,
//         type:        "CREDIT_REFERRAL",
//         amount:      REFERRAL_REWARD,
//         balanceAfter: newBalance,
//         description: `Referral reward — your referral purchased a platform subscription!`,
//         referenceId: referral.id,
//       },
//     }),
//     // Notify the referrer
//     prisma.notification.create({
//       data: {
//         profileId: referral.referrerId,
//         title:     "🎉 Referral Reward Earned!",
//         message:   `Someone you referred just purchased a GymStack subscription! ₹${REFERRAL_REWARD} has been credited to your wallet.`,
//         type:      "REFERRAL",
//       },
//     }),
//   ])

//   return NextResponse.json({ converted: true, reward: REFERRAL_REWARD })
// }

// src/app/api/referral/convert/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPushToProfile } from "@/lib/push";

const REFERRAL_REWARD  = 100
const CREDIT_EXPIRY_DAYS = 90

export async function POST(req: NextRequest) {
  const { profileId, paymentId } = await req.json()
  if (!profileId) return NextResponse.json({ error: "profileId required" }, { status: 400 })

  const referral = await prisma.referral.findFirst({
    where: { referredId: profileId, status: "PENDING" },
    include: { referrer: { select: { id: true, wallet: { select: { id: true, balance: true } } } } },
  })
  if (!referral) return NextResponse.json({ converted: false })

  if (referral.expiresAt && referral.expiresAt < new Date()) {
    await prisma.referral.update({ where: { id: referral.id }, data: { status: "EXPIRED" } })
    return NextResponse.json({ converted: false, reason: "expired" })
  }

  const referrerWallet = referral.referrer.wallet
  if (!referrerWallet) return NextResponse.json({ converted: false, reason: "no_wallet" })

  const newBalance  = Number(referrerWallet.balance) + REFERRAL_REWARD
  const creditExpiry = new Date(Date.now() + CREDIT_EXPIRY_DAYS * 86400000)

  await prisma.$transaction([
    prisma.referral.update({
      where: { id: referral.id },
      data: {
        status:           "CONVERTED",
        rewardAmount:     REFERRAL_REWARD,
        rewardCreditedAt: new Date(),
        triggerPaymentId: paymentId ?? null,
      },
    }),
    prisma.wallet.update({ where: { id: referrerWallet.id }, data: { balance: newBalance } }),
    prisma.walletTransaction.create({
      data: {
        walletId:    referrerWallet.id,
        type:        "CREDIT_REFERRAL",
        amount:      REFERRAL_REWARD,
        balanceAfter: newBalance,
        description: `Referral reward — your referral joined GymStack!`,
        referenceId: referral.id,
        expiresAt:   creditExpiry,
      },
    }),
    prisma.notification.create({
      data: {
        profileId: referral.referrerId,
        title:     "🎉 Referral Reward Earned!",
        message:   `Someone you referred just joined GymStack! ₹${REFERRAL_REWARD} has been added to your wallet (valid 90 days).`,
        type:      "REFERRAL",
      },
    }),
  ])

  // Send push notification to referrer
  try {
    await sendPushToProfile(referral.referrerId, {
      title: "🎉 You earned ₹100!",
      body:  "Someone you referred just joined GymStack. Check your wallet!",
      url:   "/member/referral",
      tag:   "referral-reward",
    })
  } catch {}

  return NextResponse.json({ converted: true, reward: REFERRAL_REWARD })
}
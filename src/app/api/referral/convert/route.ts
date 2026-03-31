
// // src/app/api/referral/convert/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { prisma } from "@/lib/prisma"
// import { sendPushToProfile } from "@/lib/push";

// const REFERRAL_REWARD  = 100
// const CREDIT_EXPIRY_DAYS = 90

// export async function POST(req: NextRequest) {
//   const { profileId, paymentId } = await req.json()
//   if (!profileId) return NextResponse.json({ error: "profileId required" }, { status: 400 })

//   const referral = await prisma.referral.findFirst({
//     where: { referredId: profileId, status: "PENDING" },
//     include: { referrer: { select: { id: true, wallet: { select: { id: true, balance: true } } } } },
//   })
//   if (!referral) return NextResponse.json({ converted: false })

//   if (referral.expiresAt && referral.expiresAt < new Date()) {
//     await prisma.referral.update({ where: { id: referral.id }, data: { status: "EXPIRED" } })
//     return NextResponse.json({ converted: false, reason: "expired" })
//   }

//   const referrerWallet = referral.referrer.wallet
//   if (!referrerWallet) return NextResponse.json({ converted: false, reason: "no_wallet" })

//   const newBalance  = Number(referrerWallet.balance) + REFERRAL_REWARD
//   const creditExpiry = new Date(Date.now() + CREDIT_EXPIRY_DAYS * 86400000)

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
//     prisma.wallet.update({ where: { id: referrerWallet.id }, data: { balance: newBalance } }),
//     prisma.walletTransaction.create({
//       data: {
//         walletId:    referrerWallet.id,
//         type:        "CREDIT_REFERRAL",
//         amount:      REFERRAL_REWARD,
//         balanceAfter: newBalance,
//         description: `Referral reward — your referral joined GymStack!`,
//         referenceId: referral.id,
//         expiresAt:   creditExpiry,
//       },
//     }),
//     prisma.notification.create({
//       data: {
//         profileId: referral.referrerId,
//         title:     "🎉 Referral Reward Earned!",
//         message:   `Someone you referred just joined GymStack! ₹${REFERRAL_REWARD} has been added to your wallet (valid 90 days).`,
//         type:      "REFERRAL",
//       },
//     }),
//   ])

//   // Send push notification to referrer
//   try {
//     await sendPushToProfile(referral.referrerId, {
//       title: "🎉 You earned ₹100!",
//       body:  "Someone you referred just joined GymStack. Check your wallet!",
//       url:   "/member/referral",
//       tag:   "referral-reward",
//     })
//   } catch {}

//   return NextResponse.json({ converted: true, reward: REFERRAL_REWARD })
// }

// src/app/api/referral/convert/route.ts
// Converts a pending referral to CONVERTED and credits the referrer's wallet.
//
// SECURITY: This endpoint is internal-only. It must be called either:
//   a) By a logged-in user (converting their own referral after payment), OR
//   b) By a server-side call with CRON_SECRET header (e.g. from a payment webhook)
//
// Before: zero auth — anyone could POST any profileId and steal ₹100.
// After:  caller must be the referred user themselves OR pass CRON_SECRET.

import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId }          from "@/lib/mobileAuth"
import { prisma }                     from "@/lib/prisma"
import { sendPushToProfile }          from "@/lib/push"

const REFERRAL_REWARD    = 100
const CREDIT_EXPIRY_DAYS = 90

export async function POST(req: NextRequest) {
  // ── Auth: accept logged-in user OR internal server secret ────────────────
  const internalSecret = req.headers.get("x-internal-secret")
  const isInternalCall = internalSecret && internalSecret === process.env.CRON_SECRET

  let callerProfileId: string | null = null

  if (!isInternalCall) {
    // Regular call — must be authenticated as the referred user themselves
    callerProfileId = await resolveProfileId(req)
    if (!callerProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const body = await req.json()
  const { profileId, paymentId } = body

  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 })
  }

  // Non-internal callers can only convert their OWN referral
  if (!isInternalCall && callerProfileId !== profileId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // ── Find pending referral ─────────────────────────────────────────────────
  const referral = await prisma.referral.findFirst({
    where:   { referredId: profileId, status: "PENDING" },
    include: {
      referrer: {
        select: { id: true, wallet: { select: { id: true, balance: true } } },
      },
    },
  })

  if (!referral) return NextResponse.json({ converted: false })

  // Check expiry
  if (referral.expiresAt && referral.expiresAt < new Date()) {
    await prisma.referral.update({
      where: { id: referral.id },
      data:  { status: "EXPIRED" },
    })
    return NextResponse.json({ converted: false, reason: "expired" })
  }

  const referrerWallet = referral.referrer.wallet
  if (!referrerWallet) {
    return NextResponse.json({ converted: false, reason: "no_wallet" })
  }

  // ── Credit wallet atomically ──────────────────────────────────────────────
  const newBalance   = Number(referrerWallet.balance) + REFERRAL_REWARD
  const creditExpiry = new Date(Date.now() + CREDIT_EXPIRY_DAYS * 86_400_000)

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
    prisma.wallet.update({
      where: { id: referrerWallet.id },
      data:  { balance: newBalance },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId:    referrerWallet.id,
        type:        "CREDIT_REFERRAL",
        amount:      REFERRAL_REWARD,
        balanceAfter: newBalance,
        description: "Referral reward — your referral joined GymStack!",
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

  // Push to referrer (fire-and-forget)
  sendPushToProfile(referral.referrerId, {
    title: `🎉 You earned ₹${REFERRAL_REWARD}!`,
    body:  "Someone you referred just joined GymStack. Check your wallet!",
    url:   "/member/referral",
    tag:   "referral-reward",
  }).catch(() => {})

  return NextResponse.json({ converted: true, reward: REFERRAL_REWARD })
}
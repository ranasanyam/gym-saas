


// // src/app/api/owner/payments/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"
// import { startOfMonth, endOfMonth } from "date-fns"

// export async function GET(req: NextRequest) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   const { searchParams } = new URL(req.url)
//   const gymId = searchParams.get("gymId")
//   const page = parseInt(searchParams.get("page") ?? "1")
//   const now = new Date()

//   const gyms = await prisma.gym.findMany({ where: { ownerId: session.user.id }, select: { id: true } })
//   const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

//   const [payments, total, monthTotal] = await Promise.all([
//     prisma.payment.findMany({
//       where: { gymId: { in: gymIds } },
//       orderBy: { createdAt: "desc" },
//       skip: (page - 1) * 20, take: 20,
//       include: {
//         member: { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
//         gym: { select: { name: true } },
//         membershipPlan: { select: { name: true } },
//       },
//     }),
//     prisma.payment.count({ where: { gymId: { in: gymIds } } }),
//     prisma.payment.aggregate({
//       where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: startOfMonth(now), lte: endOfMonth(now) } },
//       _sum: { amount: true },
//     }),
//   ])

//   return NextResponse.json({ payments, total, pages: Math.ceil(total / 20), monthTotal: Number(monthTotal._sum?.amount ?? 0) })
// }

// export async function POST(req: NextRequest) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//   const { gymId, memberId, membershipPlanId, amount, paymentMethod, paymentDate, notes } = await req.json()
//   if (!gymId || !memberId || !amount) return NextResponse.json({ error: "gymId, memberId and amount are required" }, { status: 400 })

//   const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: session.user.id } })
//   if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

//   const member = await prisma.gymMember.findFirst({ where: { id: memberId, gymId } })
//   if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

//   let planName: string | null = null
//   if (membershipPlanId) {
//     const plan = await prisma.membershipPlan.findUnique({ where: { id: membershipPlanId }, select: { name: true } })
//     planName = plan?.name ?? null
//   }

//   const payment = await prisma.payment.create({
//     data: {
//       gymId,
//       memberId,
//       membershipPlanId: membershipPlanId || null,
//       amount:           parseFloat(amount),
//       paymentMethod:    paymentMethod || "CASH",
//       status:           "COMPLETED",
//       paymentDate:      paymentDate ? new Date(paymentDate) : new Date(),
//       planNameSnapshot: planName,
//     },
//     include: {
//       member: { include: { profile: { select: { fullName: true } } } },
//       gym:    { select: { name: true } },
//     },
//   })

//   return NextResponse.json(payment, { status: 201 })
// }


// src/app/api/owner/payments/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth } from "date-fns"
import { sendPushToProfile } from "@/lib/push"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const gymId = searchParams.get("gymId")
  const page  = parseInt(searchParams.get("page") ?? "1")
  const now   = new Date()

  const gyms   = await prisma.gym.findMany({ where: { ownerId: profileId }, select: { id: true } })
  const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

  const [payments, total, monthTotal, allTimeTotal] = await Promise.all([
    prisma.payment.findMany({
      where:   { gymId: { in: gymIds } },
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * 20,
      take:    20,
      include: {
        member:        { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
        gym:           { select: { name: true } },
        membershipPlan: { select: { name: true } },
      },
    }),
    prisma.payment.count({ where: { gymId: { in: gymIds } } }),
    prisma.payment.aggregate({
      where: { gymId: { in: gymIds }, status: "COMPLETED", paymentDate: { gte: startOfMonth(now), lte: endOfMonth(now) } },
      _sum:  { amount: true },
    }),
    prisma.payment.aggregate({
      where: { gymId: { in: gymIds }, status: "COMPLETED" },
      _sum:  { amount: true },
    }),
  ])

  return NextResponse.json({
    payments,
    total,
    pages:          Math.ceil(total / 20),
    monthTotal:     Number(monthTotal._sum?.amount ?? 0),
    allTimeRevenue: Number(allTimeTotal._sum?.amount ?? 0),
  })
}

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const {
    gymId, memberId, membershipPlanId, amount,
    paymentMethod, paymentDate, notes,
  } = await req.json()

  if (!gymId || !memberId || !amount)
    return NextResponse.json({ error: "gymId, memberId and amount are required" }, { status: 400 })

  const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: profileId } })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  const member = await prisma.gymMember.findFirst({
    where:   { id: memberId, gymId },
    include: { profile: { select: { id: true, fullName: true } } },
  })
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  let plan: { id: string; name: string; durationMonths: number } | null = null
  if (membershipPlanId) {
    plan = await prisma.membershipPlan.findUnique({
      where:  { id: membershipPlanId },
      select: { id: true, name: true, durationMonths: true },
    }) ?? null
  }

  const paymentDateFinal = paymentDate ? new Date(paymentDate) : new Date()

  // Extend membership end date if plan is assigned
  let newEndDate: Date | undefined
  if (plan?.durationMonths) {
    const base = member.endDate && new Date(member.endDate) > new Date()
      ? new Date(member.endDate)
      : new Date()
    const d = new Date(base)
    d.setMonth(d.getMonth() + plan.durationMonths)
    newEndDate = d
  }

  // Create payment + optionally update membership in a transaction
  const [payment] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        gymId,
        memberId,
        membershipPlanId: membershipPlanId || null,
        amount:           parseFloat(amount),
        paymentMethod:    paymentMethod || "CASH",
        status:           "COMPLETED",
        paymentDate:      paymentDateFinal,
        planNameSnapshot: plan?.name ?? null,
        notes:            notes ?? null,
      },
      include: {
        member: { include: { profile: { select: { fullName: true } } } },
        gym:    { select: { name: true } },
      },
    }),
    ...(membershipPlanId || newEndDate ? [
      prisma.gymMember.update({
        where: { id: memberId },
        data: {
          membershipPlanId: membershipPlanId || undefined,
          status:           "ACTIVE",
          ...(newEndDate ? { endDate: newEndDate } : {}),
        },
      }),
    ] : []),
  ])

  // ── Notify the member ─────────────────────────────────────────────────────
  const memberProfileId = member.profile?.id
  if (memberProfileId) {
    const planDescription = plan
      ? `${plan.name} (${plan.durationMonths} month${plan.durationMonths > 1 ? "s" : ""})`
      : `₹${parseFloat(amount).toLocaleString("en-IN")} fee`

    // In-app notification
    await prisma.notification.create({
      data: {
        profileId: memberProfileId,
        gymId,
        title:   "💳 Payment Received",
        message: plan
          ? `Your ${planDescription} membership at ${gym.name} has been activated! ${newEndDate ? `Valid until ${newEndDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.` : ""}`
          : `A payment of ₹${parseFloat(amount).toLocaleString("en-IN")} has been recorded at ${gym.name}.`,
        type:    "BILLING",
      },
    }).catch(() => {})

    // Push notification
    await sendPushToProfile(memberProfileId, {
      title: plan ? `✅ ${plan.name} Activated!` : "💳 Payment Confirmed",
      body:  plan
        ? `Your ${planDescription} at ${gym.name} is now active!${newEndDate ? ` Valid till ${newEndDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}.` : ""}`
        : `₹${parseFloat(amount).toLocaleString("en-IN")} payment recorded at ${gym.name}.`,
      url:   "/member/payments",
      tag:   "payment-confirmed",
    }).catch(() => {})
  }

  return NextResponse.json(payment, { status: 201 })
}
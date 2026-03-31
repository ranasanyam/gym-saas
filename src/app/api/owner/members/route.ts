

// // src/app/api/owner/members/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { resolveProfileId } from "@/lib/mobileAuth"
// import { prisma } from "@/lib/prisma"
// import bcrypt from "bcryptjs"
// import { sendPushToProfile } from "@/lib/push"
// import { getOwnerSubscription, getOwnerUsage, checkLimit, checkFeature } from "@/lib/subscription"
// import crypto from "crypto"

// function generateReferralCode(name: string): string {
//   const base = name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) || "MEM"
//   return `${base}${Math.floor(1000 + Math.random() * 9000)}`
// }

// function addMonths(date: Date, months: number): Date {
//   const d = new Date(date)
//   const day = d.getDate()
//   d.setMonth(d.getMonth() + months)
//   if (d.getDate() !== day) d.setDate(0)
//   return d
// }

// async function sendPasswordSetupEmail(
//   email: string, fullName: string, gymName: string, ownerName: string, resetLink: string
// ) {
//   if (process.env.NODE_ENV === "development") {
//     console.log(`\n📧 MEMBER SETUP EMAIL → ${email}\n   ${ownerName} added ${fullName} to ${gymName}\n   ${resetLink}\n`)
//     return
//   }
// }

// async function createPasswordSetupToken(profileId: string): Promise<string> {
//   await prisma.refreshToken.deleteMany({
//     where: { profileId, tokenHash: { startsWith: "pwd_reset_" }, revoked: false },
//   })
//   const rawToken = crypto.randomBytes(32).toString("hex")
//   const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")
//   await prisma.refreshToken.create({
//     data: {
//       profileId,
//       tokenHash: `pwd_reset_${hashedToken}`,
//       expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
//     },
//   })
//   return rawToken
// }

// // ── GET ───────────────────────────────────────────────────────────────────────
// export async function GET(req: NextRequest) {
//   const profileId = await resolveProfileId(req)
//   if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//   const { searchParams } = new URL(req.url)
//   const gymId = searchParams.get("gymId")
//   const search = searchParams.get("search") ?? ""
//   const status = searchParams.get("status") ?? ""
//   const page = parseInt(searchParams.get("page") ?? "1")
//   const limit = 20

//   const gyms = await prisma.gym.findMany({ where: { ownerId: profileId }, select: { id: true } })
//   const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

//   const where: any = {
//     gymId: { in: gymIds },
//     ...(status ? { status } : {}),
//     ...(search ? {
//       profile: {
//         OR: [
//           { fullName: { contains: search, mode: "insensitive" } },
//           { email: { contains: search, mode: "insensitive" } },
//           { mobileNumber: { contains: search, mode: "insensitive" } },
//         ],
//       },
//     } : {}),
//   }

//   const [members, total] = await Promise.all([
//     prisma.gymMember.findMany({
//       where,
//       include: {
//         profile: { select: { fullName: true, email: true, mobileNumber: true, avatarUrl: true } },
//         membershipPlan: { select: { name: true, price: true } },
//         gym: { select: { name: true } },
//       },
//       orderBy: { createdAt: "desc" },
//       skip: (page - 1) * limit,
//       take: limit,
//     }),
//     prisma.gymMember.count({ where }),
//   ])

//   return NextResponse.json({ members, total, pages: Math.ceil(total / limit) })
// }

// // ── POST ──────────────────────────────────────────────────────────────────────
// export async function POST(req: NextRequest) {
//   const profileId = await resolveProfileId(req)
//   if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//   // ── Subscription check ────────────────────────────────────────────────────
//   const [sub, usage] = await Promise.all([
//     getOwnerSubscription(profileId),
//     getOwnerUsage(profileId),
//   ])

//   if (!sub || sub.isExpired) {
//     return NextResponse.json(
//       { error: "Your subscription has expired. Please renew to add members.", upgradeRequired: true },
//       { status: 403 }
//     )
//   }

//   const memberCheck = checkLimit(usage.members, sub.limits.maxMembers, "members")
//   if (!memberCheck.allowed) {
//     return NextResponse.json({ error: memberCheck.reason, upgradeRequired: true }, { status: 403 })
//   }

//   const crudCheck = checkFeature(sub.limits.hasMemberCrud, "Member management")
//   if (!crudCheck.allowed) {
//     return NextResponse.json({ error: crudCheck.reason, upgradeRequired: true }, { status: 403 })
//   }

//   const body = await req.json()
//   const {
//     gymId, fullName, email, mobileNumber, gender, dateOfBirth, city,
//     avatarUrl, membershipPlanId, startDate, heightCm, weightKg,
//     medicalNotes, emergencyContactName, emergencyContactPhone,
//     workoutStartTime, workoutEndTime,
//   } = body

//   if (!gymId || !fullName?.trim() || !startDate)
//     return NextResponse.json({ error: "gymId, fullName, and startDate are required" }, { status: 400 })

//   const gym = await prisma.gym.findFirst({
//     where: { id: gymId, ownerId: profileId },
//     select: { id: true, name: true },
//   })
//   if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

//   const ownerProfile = await prisma.profile.findUnique({
//     where: { id: profileId },
//     select: { fullName: true },
//   })

//   let newProfileId: string
//   let isNewProfile = false
//   const finalEmail = email?.trim().toLowerCase() || `${crypto.randomUUID()}@noemail.gymstack`

//   const existingProfile = await prisma.profile.findUnique({ where: { email: finalEmail } })

//   if (existingProfile) {
//     newProfileId = existingProfile.id
//     const alreadyMember = await prisma.gymMember.findFirst({
//       where: { gymId, profileId },
//     })
//     if (alreadyMember) return NextResponse.json({ error: "This member is already enrolled in this gym" }, { status: 409 })
//   } else {
//     const newProfile = await prisma.$transaction(async (tx) => {
//       const p = await tx.profile.create({
//         data: {
//           userId: crypto.randomUUID(),
//           fullName: fullName.trim(),
//           email: finalEmail,
//           mobileNumber: mobileNumber?.trim() || null,
//           passwordHash: null,
//           gender: gender || null,
//           dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
//           city: city?.trim() || null,
//           avatarUrl: avatarUrl || null,
//           role: "member",
//         },
//       })
//       await tx.wallet.create({ data: { profileId: p.id, balance: 0 } })
//       let code = generateReferralCode(fullName)
//       const codeExists = await tx.referralCode.findUnique({ where: { code } })
//       if (codeExists) code = `${code.slice(0, 5)}${Math.floor(100 + Math.random() * 900)}`
//       await tx.referralCode.create({ data: { profileId: p.id, code } })
//       return p
//     })
//     newProfileId = newProfile.id
//     isNewProfile = true
//     const rawToken = await createPasswordSetupToken(newProfileId)
//     const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`
//     await sendPasswordSetupEmail(finalEmail, fullName.trim(), gym.name, ownerProfile?.fullName ?? "Your gym owner", resetLink)
//   }

//   let endDate: Date | null = null
//   if (membershipPlanId) {
//     const plan = await prisma.membershipPlan.findUnique({ where: { id: membershipPlanId } })
//     if (plan) endDate = addMonths(new Date(startDate), plan.durationMonths)
//   }

//   const member = await prisma.gymMember.create({
//     data: {
//       gymId,
//       profileId: newProfileId,
//       membershipPlanId: membershipPlanId || null,
//       startDate: new Date(startDate),
//       endDate,
//       status: "ACTIVE",
//       heightCm: heightCm ? parseFloat(heightCm) : null,
//       weightKg: weightKg ? parseFloat(weightKg) : null,
//       medicalNotes: medicalNotes || null,
//       emergencyContactName: emergencyContactName || null,
//       emergencyContactPhone: emergencyContactPhone || null,
//       workoutStartTime: workoutStartTime || null,
//       workoutEndTime: workoutEndTime || null,
//       gymNameSnapshot: gym.name,
//     },
//   })

//   if (membershipPlanId) {
//     const plan = await prisma.membershipPlan.findUnique({ where: { id: membershipPlanId }, select: { name: true } })
//     if (plan) {
//       const notifTitle = "🎉 Welcome to " + gym.name + "!"
//       const notifMsg = `You've been enrolled in the ${plan.name} membership plan at ${gym.name}.`
//       await Promise.allSettled([
//         prisma.notification.create({
//           data: { gymId, profileId: newProfileId, title: notifTitle, message: notifMsg, type: "BILLING" },
//         }),
//         sendPushToProfile(newProfileId, {
//           title: notifTitle,
//           body: `Your ${plan.name} membership at ${gym.name} is now active. Welcome!`,
//           url: "/member/payments",
//           tag: "membership-enrolled",
//         }).catch(() => { }),
//       ])
//     }
//   }

//   return NextResponse.json(
//     { status: isNewProfile ? "CREATED" : "ENROLLED", id: member.id, gymMemberId: member.id },
//     { status: 201 }
//   )
// }

// src/app/api/owner/members/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { sendPushToProfile } from "@/lib/push"
import { sendMemberWelcomeEmail } from "@/lib/email"
import { getOwnerSubscription, getOwnerUsage, checkLimit, checkFeature } from "@/lib/subscription"
import crypto from "crypto"

function generateReferralCode(name: string): string {
  const base = name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) || "MEM"
  return `${base}${Math.floor(1000 + Math.random() * 9000)}`
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  const day = d.getDate()
  d.setMonth(d.getMonth() + months)
  if (d.getDate() !== day) d.setDate(0)
  return d
}

async function sendPasswordSetupEmail(
  email: string, fullName: string, gymName: string, ownerName: string, resetLink: string
) {
  await sendMemberWelcomeEmail({
    to:         email,
    memberName: fullName,
    gymName,
    ownerName,
    setupLink:  resetLink,
  }).catch(err => console.error("[Email] Member welcome failed:", err))
}

async function createPasswordSetupToken(profileId: string): Promise<string> {
  await prisma.refreshToken.deleteMany({
    where: { profileId, tokenHash: { startsWith: "pwd_reset_" }, revoked: false },
  })
  const rawToken    = crypto.randomBytes(32).toString("hex")
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")
  await prisma.refreshToken.create({
    data: {
      profileId,
      tokenHash: `pwd_reset_${hashedToken}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })
  return rawToken
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const gymId  = searchParams.get("gymId")
  const search = searchParams.get("search") ?? ""
  const status = searchParams.get("status") ?? ""
  const page   = parseInt(searchParams.get("page") ?? "1")
  const limit  = 20

  const gyms   = await prisma.gym.findMany({ where: { ownerId: profileId }, select: { id: true } })
  const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

  const where: any = {
    gymId: { in: gymIds },
    ...(status ? { status } : {}),
    ...(search ? {
      profile: {
        OR: [
          { fullName:     { contains: search, mode: "insensitive" } },
          { email:        { contains: search, mode: "insensitive" } },
          { mobileNumber: { contains: search, mode: "insensitive" } },
        ],
      },
    } : {}),
  }

  const [members, total] = await Promise.all([
    prisma.gymMember.findMany({
      where,
      include: {
        profile:        { select: { fullName: true, email: true, mobileNumber: true, avatarUrl: true } },
        membershipPlan: { select: { name: true, price: true } },
        gym:            { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.gymMember.count({ where }),
  ])

  return NextResponse.json({ members, total, pages: Math.ceil(total / limit) })
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // ── Subscription check ────────────────────────────────────────────────────
  const [sub, usage] = await Promise.all([
    getOwnerSubscription(profileId),
    getOwnerUsage(profileId),
  ])

  if (!sub || sub.isExpired) {
    return NextResponse.json(
      { error: "Your subscription has expired. Please renew to add members.", upgradeRequired: true },
      { status: 403 }
    )
  }

  const memberCheck = checkLimit(usage.members, sub.limits.maxMembers, "members")
  if (!memberCheck.allowed) {
    return NextResponse.json({ error: memberCheck.reason, upgradeRequired: true }, { status: 403 })
  }

  const crudCheck = checkFeature(sub.limits.hasMemberCrud, "Member management")
  if (!crudCheck.allowed) {
    return NextResponse.json({ error: crudCheck.reason, upgradeRequired: true }, { status: 403 })
  }

  const body = await req.json()
  const {
    gymId, fullName, email, mobileNumber, gender, dateOfBirth, city,
    avatarUrl, membershipPlanId, startDate, heightCm, weightKg,
    medicalNotes, emergencyContactName, emergencyContactPhone,
    workoutStartTime, workoutEndTime,
  } = body

  if (!gymId || !fullName?.trim() || !startDate)
    return NextResponse.json({ error: "gymId, fullName, and startDate are required" }, { status: 400 })

  const gym = await prisma.gym.findFirst({
    where:  { id: gymId, ownerId: profileId },
    select: { id: true, name: true },
  })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  const ownerProfile = await prisma.profile.findUnique({
    where:  { id: profileId },
    select: { fullName: true },
  })

  // Use a distinct name to avoid shadowing the outer `profileId` (the owner's ID)
  let memberProfileId: string
  let isNewProfile = false
  const finalEmail  = email?.trim().toLowerCase() || `${crypto.randomUUID()}@noemail.gymstack`

  const existingProfile = await prisma.profile.findUnique({ where: { email: finalEmail } })

  if (existingProfile) {
    memberProfileId = existingProfile.id
    const alreadyMember = await prisma.gymMember.findFirst({
      where: { gymId, profileId: memberProfileId },
    })
    if (alreadyMember) return NextResponse.json({ error: "This member is already enrolled in this gym" }, { status: 409 })
  } else {
    const newProfile = await prisma.$transaction(async (tx) => {
      const p = await tx.profile.create({
        data: {
          userId:       crypto.randomUUID(),
          fullName:     fullName.trim(),
          email:        finalEmail,
          mobileNumber: mobileNumber?.trim() || null,
          passwordHash: null,
          gender:       gender || null,
          dateOfBirth:  dateOfBirth ? new Date(dateOfBirth) : null,
          city:         city?.trim() || null,
          avatarUrl:    avatarUrl   || null,
          role:         "member",
        },
      })
      await tx.wallet.create({ data: { profileId: p.id, balance: 0 } })
      let code = generateReferralCode(fullName)
      const codeExists = await tx.referralCode.findUnique({ where: { code } })
      if (codeExists) code = `${code.slice(0, 5)}${Math.floor(100 + Math.random() * 900)}`
      await tx.referralCode.create({ data: { profileId: p.id, code } })
      return p
    })
    memberProfileId = newProfile.id
    isNewProfile    = true
    const rawToken  = await createPasswordSetupToken(memberProfileId)
    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`
    await sendPasswordSetupEmail(finalEmail, fullName.trim(), gym.name, ownerProfile?.fullName ?? "Your gym owner", resetLink)
  }

  let endDate: Date | null = null
  if (membershipPlanId) {
    const plan = await prisma.membershipPlan.findUnique({ where: { id: membershipPlanId } })
    if (plan) endDate = addMonths(new Date(startDate), plan.durationMonths)
  }

  const member = await prisma.gymMember.create({
    data: {
      gymId,
      profileId:        memberProfileId,
      membershipPlanId: membershipPlanId || null,
      startDate:        new Date(startDate),
      endDate,
      status:           "ACTIVE",
      heightCm:         heightCm ? parseFloat(heightCm) : null,
      weightKg:         weightKg ? parseFloat(weightKg) : null,
      medicalNotes:     medicalNotes || null,
      emergencyContactName:  emergencyContactName || null,
      emergencyContactPhone: emergencyContactPhone || null,
      workoutStartTime:      workoutStartTime  || null,
      workoutEndTime:        workoutEndTime    || null,
      gymNameSnapshot:  gym.name,
    },
  })

  if (membershipPlanId) {
    const plan = await prisma.membershipPlan.findUnique({ where: { id: membershipPlanId }, select: { name: true } })
    if (plan) {
      const notifTitle = "🎉 Welcome to " + gym.name + "!"
      const notifMsg   = `You've been enrolled in the ${plan.name} membership plan at ${gym.name}.`
      await Promise.allSettled([
        prisma.notification.create({
          data: { gymId, profileId: memberProfileId, title: notifTitle, message: notifMsg, type: "BILLING" },
        }),
        sendPushToProfile(memberProfileId, {
          title: notifTitle,
          body:  `Your ${plan.name} membership at ${gym.name} is now active. Welcome!`,
          url:   "/member/payments",
          tag:   "membership-enrolled",
        }).catch(() => {}),
      ])
    }
  }

  return NextResponse.json(
    { status: isNewProfile ? "CREATED" : "ENROLLED", id: member.id, gymMemberId: member.id },
    { status: 201 }
  )
}
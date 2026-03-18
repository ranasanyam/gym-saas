
// // updated code
// // src/app/api/owner/members/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"
// import bcrypt from "bcryptjs"
// import crypto from "crypto"
// import {  sendMemberWelcomeEmail } from "@/lib/email";
// // ── Helpers ──────────────────────────────────────────────────────────────────

// function generateReferralCode(name: string): string {
//   const base = name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) || "MEM"
//   return `${base}${Math.floor(1000 + Math.random() * 9000)}`
// }

// function addMonths(date: Date, months: number): Date {
//   const d = new Date(date)
//   const day = d.getDate()
//   d.setMonth(d.getMonth() + months)
//   // clamp overflow (e.g. Jan 31 + 1 → Feb 28)
//   if (d.getDate() !== day) d.setDate(0)
//   return d
// }

// // async function sendPasswordSetupEmail(
// //   email: string,
// //   fullName: string,
// //   gymName: string,
// //   ownerName: string,
// //   resetLink: string
// // ) {
// //   if (process.env.NODE_ENV === "development") {
// //     console.log("\n──────────────────────────────────────────")
// //     console.log(`📧 MEMBER SETUP EMAIL (dev only) → ${email}`)
// //     console.log(`   ${ownerName} added ${fullName} to ${gymName}`)
// //     console.log(`   Set password link: ${resetLink}`)
// //     console.log("──────────────────────────────────────────\n")
// //     return
// //   }

// //   // TODO: Replace with your email provider (e.g. Resend)
// //   // Example:
// //   // import { Resend } from "resend"
// //   // const resend = new Resend(process.env.RESEND_API_KEY)
// //   // await resend.emails.send({
// //   //   from: "GymStack <noreply@yourdomain.com>",
// //   //   to: email,
// //   //   subject: `You've been added to ${gymName} on GymStack`,
// //   //   html: `
// //   //     <h2>Hi ${fullName},</h2>
// //   //     <p><strong>${ownerName}</strong> has added you as a member at <strong>${gymName}</strong>.</p>
// //   //     <p>Click the button below to set your password and access your gym benefits on GymStack.</p>
// //   //     <a href="${resetLink}" style="background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0;">Set My Password</a>
// //   //     <p style="color:#888;font-size:12px;">This link expires in 24 hours. If you didn't expect this email, you can safely ignore it.</p>
// //   //   `,
// //   // })
// // }
// async function sendPasswordSetupEmail(
//   email: string, fullName: string, gymName: string,
//   ownerName: string, resetLink: string
// ) {
//   await sendMemberWelcomeEmail({ to: email, fullName, gymName, ownerName, setupLink: resetLink })
// }

// async function createPasswordSetupToken(profileId: string): Promise<string> {
//   // Clean up old unused tokens for this profile
//   await prisma.refreshToken.deleteMany({
//     where: {
//       profileId,
//       tokenHash: { startsWith: "pwd_reset_" },
//       revoked: false,
//     },
//   })

//   const rawToken = crypto.randomBytes(32).toString("hex")
//   const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")

//   await prisma.refreshToken.create({
//     data: {
//       profileId,
//       tokenHash: `pwd_reset_${hashedToken}`,
//       expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours (longer than forgot-password)
//     },
//   })

//   return rawToken
// }

// // ── GET — list members ────────────────────────────────────────────────────────

// export async function GET(req: NextRequest) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//   const { searchParams } = new URL(req.url)
//   const gymId  = searchParams.get("gymId")
//   const search = searchParams.get("search") ?? ""
//   const status = searchParams.get("status") ?? ""
//   const page   = parseInt(searchParams.get("page") ?? "1")
//   const limit  = 20

//   const gyms   = await prisma.gym.findMany({ where: { ownerId: session.user.id }, select: { id: true } })
//   const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

//   const where: any = {
//     gymId: { in: gymIds },
//     ...(status && { status }),
//     ...(search && { profile: { fullName: { contains: search, mode: "insensitive" } } }),
//   }

//   const [members, total] = await Promise.all([
//     prisma.gymMember.findMany({
//       where, skip: (page - 1) * limit, take: limit,
//       orderBy: { createdAt: "desc" },
//       include: {
//         profile: { select: { fullName: true, email: true, mobileNumber: true, avatarUrl: true } },
//         gym: { select: { name: true } },
//         membershipPlan: { select: { name: true, durationMonths: true } },
//       },
//     }),
//     prisma.gymMember.count({ where }),
//   ])

//   return NextResponse.json({ members, total, pages: Math.ceil(total / limit) })
// }

// // ── POST — add member (handles all 4 cases) ───────────────────────────────────

// export async function POST(req: NextRequest) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//   try {
//     const body = await req.json()
//     const {
//       // Profile info
//       fullName, mobileNumber, email, gender, dateOfBirth, city,
//       // Enrollment info
//       gymId, membershipPlanId, startDate,
//       heightCm, weightKg, medicalNotes,
//       emergencyContactName, emergencyContactPhone,
//       // Confirmation flag for ACTIVE_ELSEWHERE case
//       confirm = false,
//     } = body

//     if (!fullName?.trim())     return NextResponse.json({ error: "Full name is required" },     { status: 400 })
//     if (!mobileNumber?.trim()) return NextResponse.json({ error: "Mobile number is required" }, { status: 400 })
//     if (!gymId)                return NextResponse.json({ error: "Gym is required" },            { status: 400 })
//     if (!startDate)            return NextResponse.json({ error: "Start date is required" },     { status: 400 })

//     // ── Verify the gym belongs to this owner ──────────────────────────────
//     const gym = await prisma.gym.findFirst({
//       where: { id: gymId, ownerId: session.user.id },
//       select: { id: true, name: true },
//     })
//     if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

//     // ── Get owner name for email ──────────────────────────────────────────
//     const ownerProfile = await prisma.profile.findUnique({
//       where: { id: session.user.id },
//       select: { fullName: true },
//     })

//     // ── Look up existing profile by mobile or email ───────────────────────
//     const existing = await prisma.profile.findFirst({
//       where: {
//         OR: [
//           { mobileNumber: mobileNumber.trim() },
//           ...(email?.trim() ? [{ email: email.trim().toLowerCase() }] : []),
//         ],
//       },
//       select: { id: true, fullName: true, email: true, role: true },
//     })

//     let profileId: string
//     let isNewProfile = false

//     if (existing) {
//       // ── CONFLICT: Owner email cannot be added as a member ─────────────
//       if (existing.role === "owner") {
//         return NextResponse.json({ status: "CONFLICT_OWNER" }, { status: 409 })
//       }

//       // ── Check if already enrolled in THIS gym ─────────────────────────
//       const alreadyHere = await prisma.gymMember.findFirst({
//         where: { profileId: existing.id, gymId },
//       })
//       if (alreadyHere) {
//         return NextResponse.json({ status: "ALREADY_HERE" }, { status: 409 })
//       }

//       // ── Check for active membership in any OTHER gym ───────────────────
//       if (!confirm) {
//         const activeElsewhere = await prisma.gymMember.findFirst({
//           where: {
//             profileId: existing.id,
//             gymId: { not: gymId },
//             status: "ACTIVE",
//           },
//         })
//         if (activeElsewhere) {
//           return NextResponse.json({ status: "ACTIVE_ELSEWHERE" }, { status: 409 })
//         }
//       }

//       profileId = existing.id

//     } else {
//       // ── CASE 1: Brand new user — create profile with null passwordHash ──
//       const resolvedEmail = email?.trim().toLowerCase()
//         || `${mobileNumber.trim().replace(/\D/g, "")}@gymstack.local`

//       // Guard placeholder collision
//       const emailTaken = await prisma.profile.findUnique({ where: { email: resolvedEmail } })
//       const finalEmail = emailTaken
//         ? `${mobileNumber.trim().replace(/\D/g, "")}_${Date.now()}@gymstack.local`
//         : resolvedEmail

//       const newProfile = await prisma.$transaction(async (tx) => {
//         const p = await tx.profile.create({
//           data: {
//             userId:       crypto.randomUUID(),
//             fullName:     fullName.trim(),
//             email:        finalEmail,
//             mobileNumber: mobileNumber.trim(),
//             passwordHash: null,          // no password yet — set via email link
//             gender:       gender || null,
//             dateOfBirth:  dateOfBirth ? new Date(dateOfBirth) : null,
//             city:         city?.trim() || null,
//             role:         "member",
//           },
//         })
//         await tx.wallet.create({ data: { profileId: p.id, balance: 0 } })

//         let code = generateReferralCode(fullName)
//         const codeExists = await tx.referralCode.findUnique({ where: { code } })
//         if (codeExists) code = `${code.slice(0, 5)}${Math.floor(100 + Math.random() * 900)}`
//         await tx.referralCode.create({ data: { profileId: p.id, code } })

//         return p
//       })

//       profileId = newProfile.id
//       isNewProfile = true

//       // Send "set your password" email — reuse reset-password flow
//       const rawToken = await createPasswordSetupToken(profileId)
//       const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`
//       await sendPasswordSetupEmail(
//         finalEmail,
//         fullName.trim(),
//         gym.name,
//         ownerProfile?.fullName ?? "Your gym owner",
//         resetLink
//       )
//     }

//     // ── Calculate end date from plan ──────────────────────────────────────
//     let endDate: Date | null = null
//     if (membershipPlanId) {
//       const plan = await prisma.membershipPlan.findUnique({ where: { id: membershipPlanId } })
//       if (plan) endDate = addMonths(new Date(startDate), plan.durationMonths)
//     }

//     // ── Create GymMember record ───────────────────────────────────────────
//     const member = await prisma.gymMember.create({
//       data: {
//         gymId,
//         profileId,
//         membershipPlanId: membershipPlanId || null,
//         startDate:        new Date(startDate),
//         endDate,
//         status:           "ACTIVE",
//         heightCm:         heightCm ? parseFloat(heightCm) : null,
//         weightKg:         weightKg ? parseFloat(weightKg) : null,
//         medicalNotes:     medicalNotes || null,
//         emergencyContactName:  emergencyContactName || null,
//         emergencyContactPhone: emergencyContactPhone || null,
//         gymNameSnapshot:  gym.name,
//       },
//     })

//     return NextResponse.json(
//       { status: isNewProfile ? "CREATED" : "ENROLLED", id: member.id },
//       { status: 201 }
//     )

//   } catch (err: any) {
//     console.error("Add member error:", err)
//     return NextResponse.json({ error: err.message ?? "Failed to add member" }, { status: 500 })
//   }
// }

// src/app/api/owner/members/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { sendPushToProfile } from "@/lib/push"
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
  if (process.env.NODE_ENV === "development") {
    console.log(`\n📧 MEMBER SETUP EMAIL → ${email}\n   ${ownerName} added ${fullName} to ${gymName}\n   ${resetLink}\n`)
    return
  }
}

async function createPasswordSetupToken(profileId: string): Promise<string> {
  await prisma.refreshToken.deleteMany({
    where: { profileId, tokenHash: { startsWith: "pwd_reset_" }, revoked: false },
  })
  const rawToken = crypto.randomBytes(32).toString("hex")
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
  const gymId = searchParams.get("gymId")
  const search = searchParams.get("search") ?? ""
  const status = searchParams.get("status") ?? ""
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 20

  const gyms = await prisma.gym.findMany({ where: { ownerId: profileId }, select: { id: true } })
  const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

  const where: any = {
    gymId: { in: gymIds },
    ...(status ? { status } : {}),
    ...(search ? {
      profile: {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { mobileNumber: { contains: search, mode: "insensitive" } },
        ],
      },
    } : {}),
  }

  const [members, total] = await Promise.all([
    prisma.gymMember.findMany({
      where,
      include: {
        profile: { select: { fullName: true, email: true, mobileNumber: true, avatarUrl: true } },
        membershipPlan: { select: { name: true, price: true } },
        gym: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
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
    where: { id: gymId, ownerId: profileId },
    select: { id: true, name: true },
  })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  const ownerProfile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { fullName: true },
  })

  let newProfileId: string
  let isNewProfile = false
  const finalEmail = email?.trim().toLowerCase() || `${crypto.randomUUID()}@noemail.gymstack`

  const existingProfile = await prisma.profile.findUnique({ where: { email: finalEmail } })

  if (existingProfile) {
    newProfileId = existingProfile.id
    const alreadyMember = await prisma.gymMember.findFirst({
      where: { gymId, profileId },
    })
    if (alreadyMember) return NextResponse.json({ error: "This member is already enrolled in this gym" }, { status: 409 })
  } else {
    const newProfile = await prisma.$transaction(async (tx) => {
      const p = await tx.profile.create({
        data: {
          userId: crypto.randomUUID(),
          fullName: fullName.trim(),
          email: finalEmail,
          mobileNumber: mobileNumber?.trim() || null,
          passwordHash: null,
          gender: gender || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          city: city?.trim() || null,
          avatarUrl: avatarUrl || null,
          role: "member",
        },
      })
      await tx.wallet.create({ data: { profileId: p.id, balance: 0 } })
      let code = generateReferralCode(fullName)
      const codeExists = await tx.referralCode.findUnique({ where: { code } })
      if (codeExists) code = `${code.slice(0, 5)}${Math.floor(100 + Math.random() * 900)}`
      await tx.referralCode.create({ data: { profileId: p.id, code } })
      return p
    })
    newProfileId = newProfile.id
    isNewProfile = true
    const rawToken = await createPasswordSetupToken(newProfileId)
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
      profileId: newProfileId,
      membershipPlanId: membershipPlanId || null,
      startDate: new Date(startDate),
      endDate,
      status: "ACTIVE",
      heightCm: heightCm ? parseFloat(heightCm) : null,
      weightKg: weightKg ? parseFloat(weightKg) : null,
      medicalNotes: medicalNotes || null,
      emergencyContactName: emergencyContactName || null,
      emergencyContactPhone: emergencyContactPhone || null,
      workoutStartTime: workoutStartTime || null,
      workoutEndTime: workoutEndTime || null,
      gymNameSnapshot: gym.name,
    },
  })

  if (membershipPlanId) {
    const plan = await prisma.membershipPlan.findUnique({ where: { id: membershipPlanId }, select: { name: true } })
    if (plan) {
      const notifTitle = "🎉 Welcome to " + gym.name + "!"
      const notifMsg = `You've been enrolled in the ${plan.name} membership plan at ${gym.name}.`
      await Promise.allSettled([
        prisma.notification.create({
          data: { gymId, profileId: newProfileId, title: notifTitle, message: notifMsg, type: "BILLING" },
        }),
        sendPushToProfile(newProfileId, {
          title: notifTitle,
          body: `Your ${plan.name} membership at ${gym.name} is now active. Welcome!`,
          url: "/member/payments",
          tag: "membership-enrolled",
        }).catch(() => { }),
      ])
    }
  }

  return NextResponse.json(
    { status: isNewProfile ? "CREATED" : "ENROLLED", id: member.id, gymMemberId: member.id },
    { status: 201 }
  )
}
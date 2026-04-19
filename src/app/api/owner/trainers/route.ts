// // src/app/api/owner/trainers/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"
// import bcrypt from "bcryptjs"
// import crypto from "crypto"

// // ── Email helper (same pattern as member welcome email) ───────────────────────
// async function sendTrainerWelcomeEmail(
//   email: string, fullName: string, gymName: string, ownerName: string, setupLink: string
// ) {
//   if (process.env.NODE_ENV === "development") {
//     console.log("\n──────────────────────────────────────────")
//     console.log(`📧 TRAINER WELCOME EMAIL (dev only) → ${email}`)
//     console.log(`   ${ownerName} added ${fullName} as trainer at ${gymName}`)
//     console.log(`   Set password link: ${setupLink}`)
//     console.log("──────────────────────────────────────────\n")
//     return
//   }
//   // TODO: plug in your email provider here (Nodemailer / Resend)
//   // await sendEmail({ to: email, subject: `You've been added as a trainer at ${gymName}`, html: `...` })
// }

// async function createPasswordSetupToken(profileId: string): Promise<string> {
//   await prisma.refreshToken.deleteMany({
//     where: { profileId, tokenHash: { startsWith: "pwd_reset_" }, revoked: false },
//   })
//   const rawToken    = crypto.randomBytes(32).toString("hex")
//   const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")
//   await prisma.refreshToken.create({
//     data: {
//       profileId,
//       tokenHash: `pwd_reset_${hashedToken}`,
//       expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
//     },
//   })
//   return rawToken
// }

// function generateReferralCode(name: string): string {
//   const base   = name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6)
//   const suffix = Math.floor(1000 + Math.random() * 9000)
//   return `${base}${suffix}`
// }

// // ── GET — list trainers ───────────────────────────────────────────────────────
// export async function GET(req: NextRequest) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   const { searchParams } = new URL(req.url)
//   const gymId = searchParams.get("gymId")

//   const gyms   = await prisma.gym.findMany({ where: { ownerId: session.user.id }, select: { id: true } })
//   const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

//   const trainers = await prisma.gymTrainer.findMany({
//     where: { gymId: { in: gymIds } },
//     include: {
//       profile: { select: { fullName: true, email: true, mobileNumber: true, avatarUrl: true } },
//       gym:     { select: { name: true } },
//       _count:  { select: { assignedMembers: true } },
//     },
//     orderBy: { createdAt: "desc" },
//   })
//   return NextResponse.json(trainers)
// }

// // ── POST — add trainer (always creates a new profile) ─────────────────────────
// export async function POST(req: NextRequest) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//   const body = await req.json()
//   const {
//     gymId, fullName, email, mobileNumber, gender, city, avatarUrl,
//     bio, experienceYears, specializations, certifications,
//   } = body

//   if (!gymId)            return NextResponse.json({ error: "Gym is required" },           { status: 400 })
//   if (!fullName?.trim()) return NextResponse.json({ error: "Full name is required" },      { status: 400 })
//   if (!email?.trim())    return NextResponse.json({ error: "Email is required" },          { status: 400 })
//   if (!mobileNumber?.trim()) return NextResponse.json({ error: "Mobile number is required" }, { status: 400 })

//   // Verify gym belongs to this owner
//   const gym = await prisma.gym.findFirst({
//     where:  { id: gymId, ownerId: session.user.id },
//     select: { id: true, name: true },
//   })
//   if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

//   // Fetch owner name for the welcome email
//   const ownerProfile = await prisma.profile.findUnique({
//     where:  { id: session.user.id },
//     select: { fullName: true },
//   })

//   const normalizedEmail = email.toLowerCase().trim()

//   // Check if a profile with this email already exists
//   const existing = await prisma.profile.findUnique({ where: { email: normalizedEmail } })
//   if (existing) {
//     // Already a profile — just add as trainer if not already
//     const alreadyTrainer = await prisma.gymTrainer.findFirst({
//       where: { profileId: existing.id, gymId },
//     })
//     if (alreadyTrainer) {
//       return NextResponse.json({ error: "This person is already a trainer at this gym" }, { status: 409 })
//     }
//     const trainer = await prisma.$transaction(async (tx) => {
//       const t = await tx.gymTrainer.create({
//         data: {
//           gymId, profileId: existing.id,
//           specializations: specializations ?? [],
//           certifications:  certifications  ?? [],
//           bio: bio || null,
//           experienceYears: experienceYears ?? 0,
//         },
//       })
//       await tx.profile.update({ where: { id: existing.id }, data: { role: "trainer" } })
//       return t
//     })
//     return NextResponse.json(trainer, { status: 201 })
//   }

//   // ── Create a brand-new profile ──────────────────────────────────────────────
//   const profileId = await prisma.$transaction(async (tx) => {
//     const profile = await tx.profile.create({
//       data: {
//         userId:       crypto.randomUUID(),
//         email:        normalizedEmail,
//         fullName:     fullName.trim(),
//         mobileNumber: mobileNumber.trim(),
//         gender:       gender || null,
//         city:         city?.trim() || null,
//         avatarUrl:    avatarUrl || null,
//         passwordHash: null, // they set it via welcome email link
//         role:         "trainer",
//       },
//     })
//     await tx.wallet.create({ data: { profileId: profile.id } })
//     const code = generateReferralCode(fullName)
//     await tx.referralCode.create({ data: { profileId: profile.id, code } })
//     await tx.gymTrainer.create({
//       data: {
//         gymId,
//         profileId: profile.id,
//         specializations: specializations ?? [],
//         certifications:  certifications  ?? [],
//         bio: bio || null,
//         experienceYears: experienceYears ?? 0,
//       },
//     })
//     return profile.id
//   })

//   // Send welcome email with set-password link
//   const rawToken  = await createPasswordSetupToken(profileId)
//   const setupLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`
//   await sendTrainerWelcomeEmail(
//     normalizedEmail, fullName.trim(), gym.name,
//     ownerProfile?.fullName ?? "Your gym owner",
//     setupLink
//   )

//   return NextResponse.json({ id: profileId }, { status: 201 })
// }

// src/app/api/owner/trainers/route.ts
import { NextRequest, NextResponse }   from "next/server"
import { resolveProfileId }            from "@/lib/mobileAuth"
import { requireActivePlan } from "@/lib/requireActivePlan"
import { prisma }                      from "@/lib/prisma"
import { getOwnerSubscription, getOwnerUsage, checkLimit } from "@/lib/subscription"
import { resolveInvitedProfile, findExistingGymTrainer, notifyLinkedProfile } from "@/lib/inviteHelpers"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response

  const { searchParams } = new URL(req.url)
  const gymId = searchParams.get("gymId")

  const gyms = await prisma.gym.findMany({ where: { ownerId: profileId }, select: { id: true } })
  const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

  const trainers = await prisma.gymTrainer.findMany({
    where: { gymId: { in: gymIds } },
    include: {
      profile: { select: { fullName: true, email: true, mobileNumber: true, avatarUrl: true, status: true } },
      gym:     { select: { name: true } },
      _count:  { select: { assignedMembers: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(trainers)
}

// ── POST ──────────────────────────────────────────────────────────────────────
// Accepts: { gymId, fullName, mobileNumber, bio?, experienceYears?, specializations?, certifications? }
// Email / password collected via /complete-profile after SMS invite.
export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response


  // ── Subscription check ────────────────────────────────────────────────────
  const [sub, usage] = await Promise.all([
    getOwnerSubscription(profileId),
    getOwnerUsage(profileId),
  ])

  if (!sub || sub.isExpired) {
    return NextResponse.json(
      { error: "Your subscription has expired. Please renew to add trainers.", upgradeRequired: true },
      { status: 403 }
    )
  }

  const check = checkLimit(usage.trainers, sub.limits.maxTrainers, "trainers")
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason, upgradeRequired: true }, { status: 403 })
  }

  const body = await req.json()
  const { gymId, fullName, mobileNumber, bio, experienceYears, specializations, certifications } = body

  if (!gymId)              return NextResponse.json({ error: "Gym is required" },              { status: 400 })
  if (!fullName?.trim())   return NextResponse.json({ error: "Full name is required" },        { status: 400 })
  if (!mobileNumber?.trim()) return NextResponse.json({ error: "Mobile number is required" }, { status: 400 })

  const gym = await prisma.gym.findFirst({
    where:  { id: gymId, ownerId: profileId },
    select: { id: true, name: true },
  })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  // ── Resolve profile ───────────────────────────────────────────────────────
  let result: Awaited<ReturnType<typeof resolveInvitedProfile>>
  try {
    result = await resolveInvitedProfile("trainer", gymId, gym.name, fullName.trim(), mobileNumber.trim())
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  const { outcome, profileId: trainerProfileId } = result

  // Check if already a trainer at THIS gym
  const existing = await findExistingGymTrainer(trainerProfileId, gymId)
  if (existing) {
    return NextResponse.json({ error: "This person is already a trainer at this gym" }, { status: 409 })
  }

  // ── Create GymTrainer record ──────────────────────────────────────────────
  const trainer = await prisma.gymTrainer.create({
    data: {
      gymId,
      profileId:       trainerProfileId,
      specializations: specializations ?? [],
      certifications:  certifications  ?? [],
      bio:             bio || null,
      experienceYears: experienceYears ?? 0,
    },
  })

  if (outcome === "linked") {
    await notifyLinkedProfile(trainerProfileId, gymId, gym.name, "trainer")
  }

  return NextResponse.json({ outcome, id: trainer.id, profileId: trainerProfileId }, { status: 201 })
}
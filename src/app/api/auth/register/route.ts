// import { NextRequest, NextResponse } from "next/server"
// import bcrypt from "bcryptjs"
// import { prisma } from "@/lib/prisma"

// export async function POST(req: NextRequest) {
//   try {
//     const { fullName, email, password } = await req.json()

//     if (!fullName || !email || !password) {
//       return NextResponse.json(
//         { error: "All fields are required" },
//         { status: 400 }
//       )
//     }

//     const existing = await prisma.profile.findUnique({ where: { email } })
//     if (existing) {
//       return NextResponse.json(
//         { error: "Email already registered" },
//         { status: 409 }
//       )
//     }

//     const passwordHash = await bcrypt.hash(password, 12)

//     await prisma.$transaction(async (tx) => {
//       const profile = await tx.profile.create({
//         data: {
//           userId: crypto.randomUUID(),
//           email,
//           fullName,
//           passwordHash,
//         },
//       })

//       // Auto-create wallet
//       await tx.wallet.create({
//         data: { profileId: profile.id },
//       })

//       // Auto-create referral code
//       const code = generateReferralCode(fullName)
//       await tx.referralCode.create({
//         data: { profileId: profile.id, code },
//       })
//     })

//     return NextResponse.json(
//       { message: "Account created successfully" },
//       { status: 201 }
//     )
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Something went wrong" },
//       { status: 500 }
//     )
//   }
// }

// function generateReferralCode(name: string): string {
//   const base = name.split(" ")[0].toUpperCase().slice(0, 6)
//   const suffix = Math.floor(1000 + Math.random() * 9000)
//   return `${base}${suffix}`
// }

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

function generateReferralCode(name: string): string {
  const base = name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6)
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${base}${suffix}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fullName, email, password, mobileNumber, city, gender, referralCode } = body

    // ── Validation ────────────────────────────────────────────────────────────
    if (!fullName?.trim()) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 })
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }
    if (!mobileNumber?.trim()) {
      return NextResponse.json({ error: "Mobile number is required" }, { status: 400 })
    }
    if (!city?.trim()) {
      return NextResponse.json({ error: "City is required" }, { status: 400 })
    }

    // ── Check duplicate email ─────────────────────────────────────────────────
    const existing = await prisma.profile.findUnique({
      where: { email: email.toLowerCase().trim() },
    })
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    // ── Validate referral code if provided ────────────────────────────────────
    let referralCodeRecord = null
    if (referralCode?.trim()) {
      referralCodeRecord = await prisma.referralCode.findUnique({
        where: { code: referralCode.trim().toUpperCase() },
        include: { profile: { select: { id: true } } },
      })
      // Silently ignore invalid codes — don't fail registration
    }

    // ── Hash password ─────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12)

    // ── Create profile + wallet + referral code in one transaction ────────────
    const profile = await prisma.$transaction(async (tx) => {
      const newProfile = await tx.profile.create({
        data: {
          userId: crypto.randomUUID(),
          email: email.toLowerCase().trim(),
          fullName: fullName.trim(),
          passwordHash,
          mobileNumber: mobileNumber.trim(),
          city: city.trim(),
          gender: gender || null,
        },
      })

      // Auto-create wallet
      await tx.wallet.create({
        data: { profileId: newProfile.id, balance: 0 },
      })

      // Auto-create referral code for this new user
      let code = generateReferralCode(fullName)
      // Ensure uniqueness
      const codeExists = await tx.referralCode.findUnique({ where: { code } })
      if (codeExists) {
        code = `${code.slice(0, 5)}${Math.floor(100 + Math.random() * 900)}`
      }
      await tx.referralCode.create({
        data: { profileId: newProfile.id, code },
      })

      // ── Handle referral: link referrer to this new user ───────────────────
      if (referralCodeRecord) {
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        await tx.referral.create({
          data: {
            referralCodeId: referralCodeRecord.id,
            referrerId: referralCodeRecord.profile.id,
            referredId: newProfile.id,
            status: "PENDING",
            expiresAt,
          },
        })
      }

      return newProfile
    })

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        profileId: profile.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
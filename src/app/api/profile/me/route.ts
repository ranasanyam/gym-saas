// import { NextResponse } from "next/server"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"

// export async function GET() {
//   try {
//     const session = await auth()

//     if (!session?.user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const profile = await prisma.profile.findUnique({
//       where: { id: session.user.id },
//       select: {
//         id: true,
//         fullName: true,
//         email: true,
//         avatarUrl: true,
//         mobileNumber: true,
//         city: true,
//         gender: true,
//         role: true,
//         wallet: {
//           select: { balance: true },
//         },
//         referralCode: {
//           select: { code: true },
//         },
//         ownedGyms: {
//           where: { isActive: true },
//           select: { id: true, name: true, isActive: true },
//           take: 1,
//         },
//         gymTrainer: {
//           select: {
//             gym: { select: { id: true, name: true, isActive: true } },
//           },
//           take: 1,
//         },
//         gymMemberships: {
//           where: { status: "ACTIVE" },
//           select: {
//             gym: { select: { id: true, name: true, isActive: true } },
//           },
//           take: 1,
//         },
//       },
//     })

//     if (!profile) {
//       return NextResponse.json({ error: "Profile not found" }, { status: 404 })
//     }

//     // Resolve active gym based on role
//     let gym = null
//     if (profile.role === "owner" && profile.ownedGyms[0]) {
//       gym = profile.ownedGyms[0]
//     } else if (profile.role === "trainer" && profile.gymTrainer[0]) {
//       gym = profile.gymTrainer[0].gym
//     } else if (profile.role === "member" && profile.gymMemberships[0]) {
//       gym = profile.gymMemberships[0].gym
//     }

//     return NextResponse.json({
//       id: profile.id,
//       fullName: profile.fullName,
//       email: profile.email,
//       avatarUrl: profile.avatarUrl,
//       mobileNumber: profile.mobileNumber,
//       city: profile.city,
//       gender: profile.gender,
//       role: profile.role,
//       wallet: profile.wallet
//         ? { balance: Number(profile.wallet.balance) }
//         : null,
//       referralCode: profile.referralCode?.code ?? null,
//       gym,
//     })
//   } catch (error) {
//     console.error("Profile fetch error:", error)
//     return NextResponse.json(
//       { error: "Something went wrong" },
//       { status: 500 }
//     )
//   }
// }


// src/app/api/profile/me/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const profileId = await resolveProfileId(req)

    if (!profileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        mobileNumber: true,
        city: true,
        gender: true,
        dateOfBirth: true,
        role: true,
        wallet: {
          select: { balance: true },
        },
        referralCode: {
          select: { code: true },
        },
        ownedGyms: {
          where: { isActive: true },
          select: { id: true, name: true, isActive: true },
        },
        gymTrainer: {
          select: {
            gym: { select: { id: true, name: true, isActive: true } },
          },
        },
        gymMemberships: {
          where: { status: "ACTIVE" },
          select: {
            gym: { select: { id: true, name: true, isActive: true } },
          },
        },
      },
    })

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Resolve active gym based on role
    let gym = null
    if (profile.role === "owner" && profile.ownedGyms.length > 0) {
      gym = profile.ownedGyms[0]
    } else if (profile.role === "trainer" && profile.gymTrainer) {
      gym = profile.gymTrainer.gym
    } else if (profile.role === "member" && profile.gymMemberships.length > 0) {
      gym = profile.gymMemberships[0].gym
    }

    return NextResponse.json({
      id: profile.id,
      fullName: profile.fullName,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
      mobileNumber: profile.mobileNumber,
      city: profile.city,
      gender: profile.gender,
      dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString() : null,
      role: profile.role,
      wallet: profile.wallet
        ? { balance: Number(profile.wallet.balance) }
        : null,
      referralCode: profile.referralCode?.code ?? null,
      gym,
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
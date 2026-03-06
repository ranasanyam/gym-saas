// // src/app/api/auth/reset-password/route.ts

// import { NextRequest, NextResponse } from "next/server"
// import { prisma } from "@/lib/prisma"
// import bcrypt from "bcryptjs"
// import crypto from "crypto"

// export async function POST(req: NextRequest) {
//   try {
//     const { token, password } = await req.json()

//     if (!token || !password) {
//       return NextResponse.json(
//         { error: "Token and password are required" },
//         { status: 400 }
//       )
//     }

//     if (password.length < 8) {
//       return NextResponse.json(
//         { error: "Password must be at least 8 characters" },
//         { status: 400 }
//       )
//     }

//     // Hash the incoming token to match what's stored
//     const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

//     const resetRecord = await prisma.refreshToken.findUnique({
//       where: { tokenHash: `pwd_reset_${hashedToken}` },
//     })

//     if (!resetRecord) {
//       return NextResponse.json(
//         { error: "Invalid or expired reset link" },
//         { status: 400 }
//       )
//     }

//     if (resetRecord.expiresAt < new Date()) {
//       // Clean up expired token
//       await prisma.refreshToken.delete({ where: { id: resetRecord.id } })
//       return NextResponse.json(
//         { error: "Reset link has expired. Please request a new one." },
//         { status: 400 }
//       )
//     }

//     if (resetRecord.revoked) {
//       return NextResponse.json(
//         { error: "This reset link has already been used." },
//         { status: 400 }
//       )
//     }

//     // Hash the new password
//     const passwordHash = await bcrypt.hash(password, 12)

//     // Update password and revoke the token in a transaction
//     await prisma.$transaction([
//       prisma.profile.update({
//         where: { id: resetRecord.profileId },
//         data: { passwordHash },
//       }),
//       prisma.refreshToken.update({
//         where: { id: resetRecord.id },
//         data: { revoked: true },
//       }),
//     ])

//     return NextResponse.json({ success: true })
//   } catch (error) {
//     console.error("Reset password error:", error)
//     return NextResponse.json(
//       { error: "Something went wrong" },
//       { status: 500 }
//     )
//   }
// }


import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Hash the raw token to match stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    const resetRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash: `pwd_reset_${hashedToken}` },
    })

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      )
    }

    if (resetRecord.revoked) {
      return NextResponse.json(
        { error: "This reset link has already been used." },
        { status: 400 }
      )
    }

    if (resetRecord.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.refreshToken.delete({ where: { id: resetRecord.id } })
      return NextResponse.json(
        { error: "Reset link has expired. Please request a new one." },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // Update password + revoke token atomically
    await prisma.$transaction([
      prisma.profile.update({
        where: { id: resetRecord.profileId },
        data: { passwordHash },
      }),
      prisma.refreshToken.update({
        where: { id: resetRecord.id },
        data: { revoked: true },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
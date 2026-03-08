// import { NextRequest, NextResponse } from "next/server"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"

// const VALID_ROLES = ["owner", "trainer", "member"] as const
// type Role = (typeof VALID_ROLES)[number]

// export async function POST(req: NextRequest) {
//   try {
//     const session = await auth()

//     if (!session?.user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const { role } = await req.json()

//     if (!VALID_ROLES.includes(role)) {
//       return NextResponse.json({ error: "Invalid role" }, { status: 400 })
//     }

//     await prisma.profile.update({
//       where: { id: session.user.id },
//       data: { role: role as Role },
//     })

//     return NextResponse.json({ success: true, role })
//   } catch (error) {
//     console.error("Set role error:", error)
//     return NextResponse.json(
//       { error: "Failed to set role. Please try again." },
//       { status: 500 }
//     )
//   }
// }



// src/app/api/auth/set-role/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const VALID_ROLES = ["owner", "trainer", "member"] as const
type Role = (typeof VALID_ROLES)[number]

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { role } = await req.json()
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // ── Role is permanent — block if already set (non-null) ─────────────────
    // Fresh signups (credentials or OAuth) have role=null until they pick here.
    const profile = await prisma.profile.findUnique({
      where:  { id: session.user.id },
      select: { role: true },
    })

    if (profile?.role !== null && profile?.role !== undefined) {
      return NextResponse.json(
        { error: "Role has already been set and cannot be changed." },
        { status: 403 }
      )
    }

    await prisma.profile.update({
      where: { id: session.user.id },
      data: { role: role as Role },
    })

    return NextResponse.json({ success: true, role })
  } catch (error) {
    console.error("Set role error:", error)
    return NextResponse.json(
      { error: "Failed to set role. Please try again." },
      { status: 500 }
    )
  }
}
// // src/app/api/member/attendance/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"

// export async function GET(req: NextRequest) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//   const { searchParams } = new URL(req.url)
//   const page  = parseInt(searchParams.get("page") ?? "1")
//   const limit = 20

//   const memberships = await prisma.gymMember.findMany({
//     where: { profileId: session.user.id },
//     select: { id: true },
//   })
//   const memberIds = memberships.map(m => m.id)

//   const [records, total] = await Promise.all([
//     prisma.attendance.findMany({
//       where: { memberId: { in: memberIds } },
//       orderBy: { checkInTime: "desc" },
//       skip: (page - 1) * limit, take: limit,
//       include: { gym: { select: { name: true } } },
//     }),
//     prisma.attendance.count({ where: { memberId: { in: memberIds } } }),
//   ])

//   return NextResponse.json({ records, total, pages: Math.ceil(total / limit) })
// }


// src/app/api/member/attendance/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page  = parseInt(searchParams.get("page") ?? "1")
  const limit = 20

  const memberships = await prisma.gymMember.findMany({
    where: { profileId: session.user.id },
    select: { id: true },
  })
  const memberIds = memberships.map(m => m.id)

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where: { memberId: { in: memberIds } },
      orderBy: { checkInTime: "desc" },
      skip: (page - 1) * limit, take: limit,
      include: { gym: { select: { name: true } } },
    }),
    prisma.attendance.count({ where: { memberId: { in: memberIds } } }),
  ])

  return NextResponse.json({ records, total, pages: Math.ceil(total / limit) })
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Find the member's active membership
  const membership = await prisma.gymMember.findFirst({
    where: { profileId: session.user.id, status: "ACTIVE" },
    select: { id: true, gymId: true },
  })
  if (!membership) return NextResponse.json({ error: "No active gym membership found" }, { status: 404 })

  // Only allow today's check-in — block if already checked in today
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

  const existing = await prisma.attendance.findFirst({
    where: { memberId: membership.id, checkInTime: { gte: todayStart, lte: todayEnd } },
  })
  if (existing) return NextResponse.json({ error: "Already checked in today" }, { status: 409 })

  const record = await prisma.attendance.create({
    data: { gymId: membership.gymId, memberId: membership.id, checkInTime: new Date(), method: "MANUAL" },
  })
  return NextResponse.json(record, { status: 201 })
}
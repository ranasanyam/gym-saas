// // src/app/api/owner/attendance/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"

// export async function GET(req: NextRequest) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   const { searchParams } = new URL(req.url)
//   const gymId = searchParams.get("gymId")
//   const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0]
//   const page = parseInt(searchParams.get("page") ?? "1")

//   const gyms = await prisma.gym.findMany({ where: { ownerId: session.user.id }, select: { id: true } })
//   const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

//   const dayStart = new Date(date + "T00:00:00.000Z")
//   const dayEnd   = new Date(date + "T23:59:59.999Z")

//   const [records, total] = await Promise.all([
//     prisma.attendance.findMany({
//       where: { gymId: { in: gymIds }, checkInTime: { gte: dayStart, lte: dayEnd } },
//       orderBy: { checkInTime: "desc" },
//       skip: (page - 1) * 20, take: 20,
//       include: {
//         member: { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
//         gym: { select: { name: true } },
//       },
//     }),
//     prisma.attendance.count({ where: { gymId: { in: gymIds }, checkInTime: { gte: dayStart, lte: dayEnd } } }),
//   ])
//   return NextResponse.json({ records, total })
// }
// src/app/api/owner/attendance/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { requireActivePlan } from "@/lib/requireActivePlan"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response

  const { searchParams } = new URL(req.url)
  const gymId = searchParams.get("gymId")
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0]
  const page = parseInt(searchParams.get("page") ?? "1")

  const gyms = await prisma.gym.findMany({ where: { ownerId: profileId }, select: { id: true } })
  const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

  const dayStart = new Date(date + "T00:00:00.000Z")
  const dayEnd   = new Date(date + "T23:59:59.999Z")

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where: { gymId: { in: gymIds }, checkInTime: { gte: dayStart, lte: dayEnd } },
      orderBy: { checkInTime: "desc" },
      skip: (page - 1) * 20, take: 20,
      include: {
        member: { include: { profile: { select: { fullName: true, avatarUrl: true } } } },
        gym: { select: { name: true } },
      },
    }),
    prisma.attendance.count({ where: { gymId: { in: gymIds }, checkInTime: { gte: dayStart, lte: dayEnd } } }),
  ])
  return NextResponse.json({ records, total })
}

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const planCheck = await requireActivePlan(profileId)
  if (!planCheck.ok) return planCheck.response


  const { gymId, memberId, checkInTime, checkOutTime } = await req.json()
  if (!gymId || !memberId) return NextResponse.json({ error: "gymId and memberId required" }, { status: 400 })

  const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: profileId } })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  const member = await prisma.gymMember.findFirst({ where: { id: memberId, gymId } })
  if (!member) return NextResponse.json({ error: "Member not found in this gym" }, { status: 404 })

  const checkIn  = checkInTime  ? new Date(checkInTime)  : new Date()
  const checkOut = checkOutTime ? new Date(checkOutTime) : null

  // Prevent future dates
  if (checkIn > new Date()) return NextResponse.json({ error: "Check-in time cannot be in the future" }, { status: 400 })

  const record = await prisma.attendance.create({
    data: { gymId, memberId, checkInTime: checkIn, checkOutTime: checkOut, method: "MANUAL" },
    include: { member: { include: { profile: { select: { fullName: true } } } } },
  })

  return NextResponse.json(record, { status: 201 })
}
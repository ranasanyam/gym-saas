// src/app/api/owner/members/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const gymId = searchParams.get("gymId")
  const search = searchParams.get("search") ?? ""
  const status = searchParams.get("status") ?? ""
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 20

  const gyms = await prisma.gym.findMany({ where: { ownerId: session.user.id }, select: { id: true } })
  const gymIds = gymId ? [gymId] : gyms.map(g => g.id)

  const where: any = {
    gymId: { in: gymIds },
    ...(status && { status }),
    ...(search && {
      profile: { fullName: { contains: search, mode: "insensitive" } }
    }),
  }

  const [members, total] = await Promise.all([
    prisma.gymMember.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        profile: { select: { fullName: true, email: true, mobileNumber: true, avatarUrl: true } },
        gym: { select: { name: true } },
        membershipPlan: { select: { name: true, durationMonths: true } },
      },
    }),
    prisma.gymMember.count({ where }),
  ])

  return NextResponse.json({ members, total, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const { gymId, profileId, membershipPlanId, startDate, heightCm, weightKg, medicalNotes, emergencyContactName, emergencyContactPhone } = body
  if (!gymId || !profileId || !startDate) return NextResponse.json({ error: "gymId, profileId, and startDate are required" }, { status: 400 })

  const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: session.user.id } })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  let endDate: Date | null = null
  if (membershipPlanId) {
    const plan = await prisma.membershipPlan.findUnique({ where: { id: membershipPlanId } })
    if (plan) {
      endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + plan.durationMonths)
    }
  }

  const member = await prisma.gymMember.create({
    data: {
      gymId, profileId, membershipPlanId: membershipPlanId || null,
      startDate: new Date(startDate),
      endDate,
      heightCm: heightCm ? parseFloat(heightCm) : null,
      weightKg: weightKg ? parseFloat(weightKg) : null,
      medicalNotes: medicalNotes || null,
      emergencyContactName: emergencyContactName || null,
      emergencyContactPhone: emergencyContactPhone || null,
      gymNameSnapshot: gym.name,
    },
  })
  return NextResponse.json(member, { status: 201 })
}
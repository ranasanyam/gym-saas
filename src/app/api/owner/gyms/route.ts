
// // src/app/api/owner/gyms/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"

// export async function GET() {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   const gyms = await prisma.gym.findMany({
//     where: { ownerId: session.user.id },
//     include: {
//       _count: { select: { members: true, trainers: true } },
//       membershipPlans: { where: { isActive: true }, select: { id: true, name: true, price: true } },
//     },
//     orderBy: { createdAt: "desc" },
//   })
//   return NextResponse.json(gyms)
// }

// export async function POST(req: NextRequest) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   const body = await req.json()
//   const { name, address, city, state, pincode, contactNumber, services, facilities, gymImages } = body
//   if (!name?.trim()) return NextResponse.json({ error: "Gym name is required" }, { status: 400 })
//   const gym = await prisma.gym.create({
//     data: {
//       ownerId: session.user.id,
//       name: name.trim(),
//       address: address?.trim() || null,
//       city: city?.trim() || null,
//       state: state?.trim() || null,
//       pincode: pincode?.trim() || null,
//       contactNumber: contactNumber?.trim() || null,
//       services: services ?? [],
//       facilities: facilities ?? [],
//       gymImages: gymImages ?? [],
//     },
//   })
//   return NextResponse.json(gym, { status: 201 })
// }


// src/app/api/owner/gyms/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOwnerSubscription, getOwnerUsage, checkLimit } from "@/lib/subscription"
import { resolveProfileId } from "@/lib/mobileAuth"
import { requireActivePlan } from "@/lib/requireActivePlan"

export async function GET(req: NextRequest) {
  try {
    const profileId = await resolveProfileId(req)
    if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const planCheck = await requireActivePlan(profileId)
    if (!planCheck.ok) return planCheck.response

    const gyms = await prisma.gym.findMany({
      where: { ownerId: profileId },
      include: {
        _count: { select: { members: true, trainers: true } },
        membershipPlans: { where: { isActive: true }, select: { id: true, name: true, price: true, durationMonths: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(gyms)
  } catch (err: any) {
    console.error("[owner/gyms GET]", err?.message ?? err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const profileId = await resolveProfileId(req)
    if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const planCheck = await requireActivePlan(profileId)
    if (!planCheck.ok) return planCheck.response

    const [sub, usage] = await Promise.all([
      getOwnerSubscription(profileId),
      getOwnerUsage(profileId),
    ])

    if (!sub || sub.isExpired) {
      return NextResponse.json(
        { error: "Your subscription has expired. Please renew to create gyms.", upgradeRequired: true },
        { status: 403 }
      )
    }

    const check = checkLimit(usage.gyms, sub.limits.maxGyms, "gyms")
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason, upgradeRequired: true }, { status: 403 })
    }

    const body = await req.json()
    const { name, address, city, state, pincode, contactNumber, services, facilities, gymImages } = body
    if (!name?.trim()) return NextResponse.json({ error: "Gym name is required" }, { status: 400 })

    const gym = await prisma.gym.create({
      data: {
        ownerId: profileId,
        name: name.trim(),
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        pincode: pincode?.trim() || null,
        contactNumber: contactNumber?.trim() || null,
        services: services ?? [],
        facilities: facilities ?? [],
        gymImages: gymImages ?? [],
      },
    })
    return NextResponse.json(gym, { status: 201 })
  } catch (err: any) {
    console.error("[owner/gyms POST]", err?.message ?? err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
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
//   const { name, address, city, state, pincode, contactNumber, services, facilities } = body
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
//     },
//   })
//   return NextResponse.json(gym, { status: 201 })
// }


// src/app/api/owner/gyms/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const gyms = await prisma.gym.findMany({
    where: { ownerId: session.user.id },
    include: {
      _count: { select: { members: true, trainers: true } },
      membershipPlans: { where: { isActive: true }, select: { id: true, name: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(gyms)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const { name, address, city, state, pincode, contactNumber, services, facilities, gymImages } = body
  if (!name?.trim()) return NextResponse.json({ error: "Gym name is required" }, { status: 400 })
  const gym = await prisma.gym.create({
    data: {
      ownerId: session.user.id,
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
}
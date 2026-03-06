// // src/app/api/owner/gyms/[gymId]/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"

// export async function GET(_: NextRequest, { params }: { params: Promise<{ gymId: string }> }) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   const { gymId } = await params
//   const gym = await prisma.gym.findFirst({
//     where: { id: gymId, ownerId: session.user.id },
//     include: {
//       membershipPlans: { orderBy: { createdAt: "desc" } },
//       _count: { select: { members: true, trainers: true } },
//     },
//   })
//   if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })
//   return NextResponse.json(gym)
// }

// export async function PATCH(req: NextRequest, { params }: { params: Promise<{ gymId: string }> }) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   const { gymId } = await params
//   const body = await req.json()
//   const gym = await prisma.gym.updateMany({
//     where: { id: gymId, ownerId: session.user.id },
//     data: {
//       name: body.name,
//       address: body.address,
//       city: body.city,
//       state: body.state,
//       pincode: body.pincode,
//       contactNumber: body.contactNumber,
//       services: body.services,
//       facilities: body.facilities,
//       isActive: body.isActive,
//     },
//   })
//   if (gym.count === 0) return NextResponse.json({ error: "Gym not found" }, { status: 404 })
//   return NextResponse.json({ success: true })
// }

// export async function DELETE(_: NextRequest, { params }: { params: Promise<{ gymId: string }> }) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   const { gymId } = await params
//   await prisma.gym.updateMany({ where: { id: gymId, ownerId: session.user.id }, data: { isActive: false } })
//   return NextResponse.json({ success: true })
// }


// src/app/api/owner/gyms/[gymId]/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"

// export async function GET(_: NextRequest, { params }: { params: Promise<{ gymId: string }> }) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   const { gymId } = await params
//   const gym = await prisma.gym.findFirst({
//     where: { id: gymId, ownerId: session.user.id },
//     include: {
//       membershipPlans: { orderBy: { createdAt: "desc" } },
//       _count: { select: { members: true, trainers: true } },
//     },
//   })
//   if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })
//   return NextResponse.json(gym)
// }

// export async function PATCH(req: NextRequest, { params }: { params: Promise<{ gymId: string }> }) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   const { gymId } = await params
//   const body = await req.json()
//   const gym = await prisma.gym.updateMany({
//     where: { id: gymId, ownerId: session.user.id },
//     data: {
//       name: body.name, address: body.address, city: body.city,
//       state: body.state, pincode: body.pincode, contactNumber: body.contactNumber,
//       services: body.services, facilities: body.facilities, isActive: body.isActive,
//       ...(body.gymImages !== undefined && { gymImages: body.gymImages }),
//     },
//   })
//   if (gym.count === 0) return NextResponse.json({ error: "Gym not found" }, { status: 404 })
//   return NextResponse.json({ success: true })
// }

// export async function DELETE(_: NextRequest, { params }: { params: Promise<{ gymId: string }> }) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   const { gymId } = await params
//   await prisma.gym.updateMany({ where: { id: gymId, ownerId: session.user.id }, data: { isActive: false } })
//   return NextResponse.json({ success: true })
// }


// src/app/api/owner/gyms/[gymId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_: NextRequest, { params }: { params: Promise<{ gymId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { gymId } = await params
  const gym = await prisma.gym.findFirst({
    where: { id: gymId, ownerId: session.user.id },
    include: {
      membershipPlans: { orderBy: { createdAt: "desc" } },
      _count: { select: { members: true, trainers: true } },
    },
  })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  return NextResponse.json(gym)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ gymId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { gymId } = await params
  const body = await req.json()
  const gym = await prisma.gym.updateMany({
    where: { id: gymId, ownerId: session.user.id },
    data: {
      name: body.name, address: body.address, city: body.city,
      state: body.state, pincode: body.pincode, contactNumber: body.contactNumber,
      services: body.services, facilities: body.facilities, isActive: body.isActive,
      ...(body.gymImages !== undefined && { gymImages: body.gymImages }),
    },
  })
  if (gym.count === 0) return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ gymId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { gymId } = await params
  await prisma.gym.updateMany({ where: { id: gymId, ownerId: session.user.id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}
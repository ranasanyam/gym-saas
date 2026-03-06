// // src/app/api/owner/notifications/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"

// export async function GET(req: NextRequest) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   const gymId = new URL(req.url).searchParams.get("gymId")
//   const gyms = await prisma.gym.findMany({ where: { ownerId: session.user.id }, select: { id: true } })
//   const gymIds = gymId ? [gymId] : gyms.map(g => g.id)
//   const announcements = await prisma.announcement.findMany({
//     where: { gymId: { in: gymIds } },
//     include: { author: { select: { fullName: true } }, gym: { select: { name: true } } },
//     orderBy: { createdAt: "desc" },
//   })
//   return NextResponse.json(announcements)
// }

// export async function POST(req: NextRequest) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   const { gymId, title, body, targetRole, expiresAt } = await req.json()
//   if (!gymId || !title || !body) return NextResponse.json({ error: "gymId, title and body are required" }, { status: 400 })
//   const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: session.user.id } })
//   if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })
//   const announcement = await prisma.announcement.create({
//     data: {
//       gymId, authorId: session.user.id, title, body,
//       targetRole: targetRole || null,
//       publishedAt: new Date(),
//       expiresAt: expiresAt ? new Date(expiresAt) : null,
//     },
//   })
//   return NextResponse.json(announcement, { status: 201 })
// }

// export async function DELETE(req: NextRequest) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   const id = new URL(req.url).searchParams.get("id")
//   if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
//   await prisma.announcement.deleteMany({ where: { id, gym: { ownerId: session.user.id } } })
//   return NextResponse.json({ success: true })
// }



// src/app/api/owner/notifications/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const gymId = new URL(req.url).searchParams.get("gymId")
  const gyms = await prisma.gym.findMany({ where: { ownerId: session.user.id }, select: { id: true } })
  const gymIds = gymId ? [gymId] : gyms.map(g => g.id)
  const announcements = await prisma.announcement.findMany({
    where: { gymId: { in: gymIds } },
    include: { author: { select: { fullName: true } }, gym: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(announcements)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { gymId, title, body, targetRole, expiresAt } = await req.json()
  if (!gymId || !title || !body)
    return NextResponse.json({ error: "gymId, title and body are required" }, { status: 400 })

  const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId: session.user.id } })
  if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  // 1. Create announcement (owner's record)
  const announcement = await prisma.announcement.create({
    data: {
      gymId,
      authorId: session.user.id,
      title,
      body,
      targetRole: targetRole || null,
      publishedAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  })

  // 2. Push individual Notification to every active member of this gym
  //    so it shows up in their notification bell / page
  const gymMembers = await prisma.gymMember.findMany({
    where: { gymId, status: "ACTIVE" },
    select: { profileId: true },
  })

  if (gymMembers.length > 0) {
    await prisma.notification.createMany({
      data: gymMembers.map(m => ({
        profileId: m.profileId,
        gymId,
        title,
        message: body,
        type: "ANNOUNCEMENT" as const,
      })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json(announcement, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await prisma.announcement.deleteMany({ where: { id, gym: { ownerId: session.user.id } } })
  return NextResponse.json({ success: true })
}
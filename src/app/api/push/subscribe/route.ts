// // src/app/api/push/subscribe/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { auth } from "@/auth"
// import { prisma } from "@/lib/prisma"

// export async function POST(req: NextRequest) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   const { endpoint, p256dh, auth: authKey } = await req.json()
//   if (!endpoint || !p256dh || !authKey)
//     return NextResponse.json({ error: "endpoint, p256dh, auth required" }, { status: 400 })
//   const userAgent = req.headers.get("user-agent") ?? undefined
//   await prisma.pushSubscription.upsert({
//     where:  { endpoint },
//     update: { profileId: session.user.id, p256dh, auth: authKey, userAgent },
//     create: { profileId: session.user.id, endpoint, p256dh, auth: authKey, userAgent },
//   })
//   return NextResponse.json({ success: true })
// }

// export async function DELETE(req: NextRequest) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//   const { endpoint } = await req.json()
//   if (!endpoint) return NextResponse.json({ error: "endpoint required" }, { status: 400 })
//   await prisma.pushSubscription.deleteMany({ where: { endpoint, profileId: session.user.id } })
//   return NextResponse.json({ success: true })
// }

// src/app/api/push/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  // const session = await auth()
  // if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })


  const { endpoint, p256dh, auth: authKey } = await req.json()
  if (!endpoint || !p256dh || !authKey)
    return NextResponse.json({ error: "endpoint, p256dh, auth required" }, { status: 400 })
  const userAgent = req.headers.get("user-agent") ?? undefined
  await prisma.pushSubscription.upsert({
    where:  { endpoint },
    update: { profileId: profileId, p256dh, auth: authKey, userAgent },
    create: { profileId: profileId, endpoint, p256dh, auth: authKey, userAgent },
  })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  // const session = await auth()
  // if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const profileId = await resolveProfileId(req);
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { endpoint } = await req.json()
  if (!endpoint) return NextResponse.json({ error: "endpoint required" }, { status: 400 })
  await prisma.pushSubscription.deleteMany({ where: { endpoint, profileId: profileId } })
  return NextResponse.json({ success: true })
}
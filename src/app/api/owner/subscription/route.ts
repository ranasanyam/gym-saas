// src/app/api/owner/subscription/route.ts
// Returns the active subscription, plan limits, and current usage for the owner.
// This is the single endpoint the frontend calls to power all limit checks and UI banners.

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getOwnerSubscription, getOwnerUsage } from "@/lib/subscription"

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [subscription, usage] = await Promise.all([
        getOwnerSubscription(session.user.id),
        getOwnerUsage(session.user.id),
    ])

    return NextResponse.json({ subscription, usage })
}
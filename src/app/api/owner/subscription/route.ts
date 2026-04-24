// src/app/api/owner/subscription/route.ts
// Returns the active subscription, plan limits, and current usage for the owner.
// This is the single endpoint the frontend calls to power all limit checks and UI banners.

import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { getOwnerSubscription, getOwnerUsage } from "@/lib/subscription"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
    const profileId = await resolveProfileId(req)
    if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [subscription, usage] = await Promise.all([
        getOwnerSubscription(profileId),
        getOwnerUsage(profileId),
    ])

    console.log('subscription', subscription);
    console.log('usage', usage);

    return NextResponse.json({ subscription, usage })
}

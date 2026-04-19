// src/app/api/subscriptions/plans/route.ts
// Returns all active SaaS plans ordered by sortOrder.
// Public — no auth required (pricing page).

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET() {
    const plans = await prisma.saasPlan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
            id: true,
            name: true,
            description: true,
            interval: true,
            price: true,
            currency: true,
            sortOrder: true,
            maxGyms: true,
            maxMembers: true,
            maxTrainers: true,
            maxMembershipPlans: true,
            maxNotificationsPerMonth: true,
            attendanceTracking: true,
            workoutPlans: true,
            dietPlans: true,
            reportsAnalytics: true,
            onlinePayments: true,
            balanceSheet: true,
            supplementManagement: true,
            customBranding: true,
            apiAccess: true,
        },
    })

    return NextResponse.json(plans)
}

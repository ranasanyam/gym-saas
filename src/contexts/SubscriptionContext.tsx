// src/contexts/SubscriptionContext.tsx
// Provides subscription plan limits and usage to all owner UI components.
// Consumed via useSubscription() hook.
"use client"

import {
    createContext, useContext, useEffect, useState, useCallback, type ReactNode,
} from "react"
import { useSession } from "next-auth/react"
import type { ActiveSubscription, UsageSnapshot, PlanLimits } from "@/lib/subscription"

// Re-export types so client components can import them from here
export type { ActiveSubscription, UsageSnapshot, PlanLimits }

interface SubscriptionContextValue {
    subscription: ActiveSubscription | null
    usage: UsageSnapshot | null
    loading: boolean
    refresh: () => Promise<void>

    // Convenience helpers
    isExpired: boolean
    isLifetime: boolean
    isTrial: boolean
    planName: string
    limits: PlanLimits | null
    daysRemaining: number | null

    // Limit check helpers (return false = blocked)
    canAddGym: boolean
    canAddMember: boolean
    canAddTrainer: boolean
    canAddMembershipPlan: boolean
    canSendNotification: boolean

    // Feature access
    hasWorkoutPlans: boolean
    hasDietPlans: boolean
    hasSupplements: boolean
    hasPayments: boolean
    hasMemberCrud: boolean
    hasPlanTemplates: boolean
    hasReferAndEarn: boolean
    hasFullReports: boolean
    hasAttendance: boolean
    hasDashboardAnalytics: boolean
    hasFullAnalytics: boolean

    // Usage percent helpers (for progress bars, 0–100)
    gymUsagePct: number | null
    memberUsagePct: number | null
    trainerUsagePct: number | null
    planUsagePct: number | null
    notificationUsagePct: number | null
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
    const { status } = useSession()
    const [subscription, setSubscription] = useState<ActiveSubscription | null>(null)
    const [usage, setUsage] = useState<UsageSnapshot | null>(null)
    const [loading, setLoading] = useState(true)

    const fetch_ = useCallback(async () => {
        if (status === "loading" || status === "unauthenticated") {
            setLoading(false)
            return
        }
        try {
            setLoading(true)
            const res = await fetch("/api/owner/subscription")
            if (!res.ok) { setLoading(false); return }
            const data = await res.json()
            setSubscription(data.subscription ?? null)
            setUsage(data.usage ?? null)
        } catch {
            // non-fatal
        } finally {
            setLoading(false)
        }
    }, [status])

    useEffect(() => { fetch_() }, [fetch_])

    const limits = subscription?.limits ?? null

    // ── Limit checks ─────────────────────────────────────────────────────────
    const within = (current: number | undefined, max: number | null | undefined): boolean => {
        if (max === null || max === undefined) return true   // unlimited
        return (current ?? 0) < max
    }

    const canAddGym = !subscription?.isExpired && within(usage?.gyms, limits?.maxGyms)
    const canAddMember = !subscription?.isExpired && within(usage?.members, limits?.maxMembers)
    const canAddTrainer = !subscription?.isExpired && within(usage?.trainers, limits?.maxTrainers)
    const canAddMembershipPlan = !subscription?.isExpired && within(usage?.membershipPlans, limits?.maxMembershipPlans)
    const canSendNotification = !subscription?.isExpired && within(usage?.notificationsThisMonth, limits?.maxNotificationsPerMonth)

    // ── Usage percentages ─────────────────────────────────────────────────────
    const pct = (cur: number | undefined, max: number | null | undefined): number | null => {
        if (max === null || max === undefined) return null   // unlimited → no bar
        return Math.min(100, Math.round(((cur ?? 0) / max) * 100))
    }

    const gymUsagePct = pct(usage?.gyms, limits?.maxGyms)
    const memberUsagePct = pct(usage?.members, limits?.maxMembers)
    const trainerUsagePct = pct(usage?.trainers, limits?.maxTrainers)
    const planUsagePct = pct(usage?.membershipPlans, limits?.maxMembershipPlans)
    const notificationUsagePct = pct(usage?.notificationsThisMonth, limits?.maxNotificationsPerMonth)

    return (
        <SubscriptionContext.Provider value={{
            subscription,
            usage,
            loading,
            refresh: fetch_,

            isExpired: subscription?.isExpired ?? false,
            isLifetime: subscription?.isLifetime ?? false,
            isTrial: subscription?.isTrial ?? false,
            planName: subscription?.planName ?? "No Plan",
            limits,
            daysRemaining: subscription?.daysRemaining ?? null,

            canAddGym,
            canAddMember,
            canAddTrainer,
            canAddMembershipPlan,
            canSendNotification,

            hasWorkoutPlans: limits?.hasWorkoutPlans ?? false,
            hasDietPlans: limits?.hasDietPlans ?? false,
            hasSupplements: limits?.hasSupplements ?? false,
            hasPayments: limits?.hasPayments ?? false,
            hasMemberCrud: limits?.hasMemberCrud ?? false,
            hasPlanTemplates: limits?.hasPlanTemplates ?? false,
            hasReferAndEarn: limits?.hasReferAndEarn ?? false,
            hasFullReports: limits?.hasFullReports ?? false,
            hasAttendance: limits?.hasAttendance ?? false,
            hasDashboardAnalytics: limits?.hasDashboardAnalytics ?? false,
            hasFullAnalytics: limits?.hasFullAnalytics ?? false,

            gymUsagePct,
            memberUsagePct,
            trainerUsagePct,
            planUsagePct,
            notificationUsagePct,
        }}>
            {children}
        </SubscriptionContext.Provider>
    )
}

export function useSubscription() {
    const ctx = useContext(SubscriptionContext)
    if (!ctx) throw new Error("useSubscription must be used inside <SubscriptionProvider>")
    return ctx
}
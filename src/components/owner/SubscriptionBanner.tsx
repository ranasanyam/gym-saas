// src/components/owner/SubscriptionBanner.tsx
// Sticky banner shown inside the owner layout when plan is expiring, in grace, or expired.
// Grace period and expired banners are NOT dismissable — they show on every page.
"use client"

import Link from "next/link"
import { AlertTriangle, Zap, X, Crown } from "lucide-react"
import { useState } from "react"
import { useSubscription } from "@/contexts/SubscriptionContext"

export function SubscriptionBanner() {
    const {
        subscription,
        isExpired,
        isInGracePeriod,
        isTrial,
        daysUntilExpiry,
        daysRemaining,
        loading,
    } = useSubscription()
    const [dismissed, setDismissed] = useState(false)

    if (loading || !subscription) return null

    // Lifetime — never show any banner
    if (subscription.isLifetime) return null

    // ── Fully expired (past grace period) — persistent, non-dismissable ────
    if (isExpired) {
        return (
            <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-red-300 text-xs font-medium">
                        Your subscription has expired. Renew to restore access to locked features.
                    </p>
                </div>
                <Link
                    href="/owner/subscriptions"
                    className="shrink-0 text-xs font-semibold bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-400 transition-all flex items-center gap-1.5"
                >
                    <Zap className="w-3 h-3" /> Renew Now
                </Link>
            </div>
        )
    }

    // ── Grace period (7 days after expiry) — persistent, non-dismissable ───
    if (isInGracePeriod) {
        // daysUntilExpiry is negative here: e.g. -3 means expired 3 days ago
        const daysSinceExpiry = daysUntilExpiry !== null ? Math.abs(daysUntilExpiry) : 0
        const graceDaysLeft   = Math.max(0, 7 - daysSinceExpiry)
        return (
            <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-red-300 text-xs font-medium">
                        Your plan expired{" "}
                        <strong>{daysSinceExpiry} day{daysSinceExpiry !== 1 ? "s" : ""} ago</strong>.
                        {" "}You have <strong>{graceDaysLeft} day{graceDaysLeft !== 1 ? "s" : ""} left</strong> in your grace period.
                        Renew now to keep full access.
                    </p>
                </div>
                <Link
                    href="/owner/subscriptions"
                    className="shrink-0 text-xs font-semibold bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-400 transition-all flex items-center gap-1.5"
                >
                    <Zap className="w-3 h-3" /> Renew Now
                </Link>
            </div>
        )
    }

    // For the remaining cases, respect the dismiss state
    if (dismissed) return null

    // ── Expires today ───────────────────────────────────────────────────────
    if (daysUntilExpiry === 0) {
        return (
            <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-red-300 text-xs font-medium">
                        Your <strong>{subscription.planName}</strong> plan expires <strong>today</strong>. Renew now to keep access.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        href="/owner/subscriptions"
                        className="text-xs font-semibold bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-400 transition-all flex items-center gap-1.5"
                    >
                        <Zap className="w-3 h-3" /> Renew Now
                    </Link>
                    <button onClick={() => setDismissed(true)} className="text-red-400/50 hover:text-red-300 transition-colors">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        )
    }

    // ── Expires in ≤ 7 days — orange, prominent ─────────────────────────────
    if (daysRemaining !== null && daysRemaining <= 7) {
        return (
            <div className="bg-orange-500/10 border-b border-orange-500/20 px-6 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                    <p className="text-orange-200 text-xs font-medium">
                        Your <strong>{subscription.planName}</strong> plan expires in{" "}
                        <strong>{daysRemaining} day{daysRemaining !== 1 ? "s" : ""}</strong>. Renew immediately to avoid interruption.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        href="/owner/subscriptions"
                        className="text-xs font-semibold bg-orange-500 text-white px-4 py-1.5 rounded-lg hover:bg-orange-400 transition-all flex items-center gap-1.5"
                    >
                        <Zap className="w-3 h-3" /> Renew
                    </Link>
                    <button onClick={() => setDismissed(true)} className="text-orange-400/50 hover:text-orange-300 transition-colors">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        )
    }

    // ── Expires in ≤ 30 days — subtle yellow ───────────────────────────────
    if (daysRemaining !== null && daysRemaining <= 30) {
        return (
            <div className="bg-yellow-500/8 border-b border-yellow-500/15 px-6 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
                    <p className="text-yellow-300 text-xs font-medium">
                        Your <strong>{subscription.planName}</strong> plan expires in{" "}
                        <strong>{daysRemaining} days</strong>. Renew now to avoid interruption.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        href="/owner/subscriptions"
                        className="text-xs font-semibold bg-yellow-500 text-black px-4 py-1.5 rounded-lg hover:bg-yellow-400 transition-all flex items-center gap-1.5"
                    >
                        <Zap className="w-3 h-3" /> Renew
                    </Link>
                    <button onClick={() => setDismissed(true)} className="text-yellow-400/50 hover:text-yellow-300 transition-colors">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        )
    }

    // ── Trial notice ────────────────────────────────────────────────────────
    if (isTrial) {
        return (
            <div className="bg-primary/8 border-b border-primary/15 px-6 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <Crown className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-primary/90 text-xs font-medium">
                        You are on the <strong>Free Trial</strong>{" "}
                        ({daysRemaining !== null ? `${daysRemaining} days remaining` : "active"}).
                        Upgrade to unlock full features.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        href="/owner/subscriptions"
                        className="text-xs font-semibold bg-linear-to-r from-primary to-orange-400 text-white px-4 py-1.5 rounded-lg hover:opacity-90 transition-all flex items-center gap-1.5"
                    >
                        <Zap className="w-3 h-3" /> Upgrade
                    </Link>
                    <button onClick={() => setDismissed(true)} className="text-primary/40 hover:text-primary/80 transition-colors">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        )
    }

    return null
}

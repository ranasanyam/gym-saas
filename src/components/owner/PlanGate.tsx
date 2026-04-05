// src/components/owner/PlanGate.tsx
// Renders children when the feature is available, or a locked/upgrade card otherwise.
"use client"

import Link from "next/link"
import { Lock, Zap } from "lucide-react"

interface PlanGateProps {
    allowed: boolean
    featureLabel: string
    children: React.ReactNode
    // compact = inline chip instead of full card
    compact?: boolean
}

export function PlanGate({ allowed, featureLabel, children, compact = false }: PlanGateProps) {
    if (allowed) return <>{children}</>

    if (compact) {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs text-white/35 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <Lock className="w-3 h-3" />
                Upgrade to unlock
            </span>
        )
    }

    return (
        <div className="relative rounded-2xl border border-white/8 overflow-hidden">
            {/* Blurred preview placeholder */}
            <div className="absolute inset-0 bg-[hsl(220_25%_9%)] backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <p className="text-white font-semibold text-sm">{featureLabel}</p>
                    <p className="text-white/40 text-xs mt-1">This feature is not included in your current plan.</p>
                </div>
                <Link
                    href="/owner/subscriptions"
                    className="inline-flex items-center gap-2 bg-linear-to-r from-primary to-orange-400 text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all"
                >
                    <Zap className="w-3.5 h-3.5" />
                    Upgrade Plan
                </Link>
            </div>
            {/* Blurred ghost of children */}
            <div className="blur-sm pointer-events-none select-none opacity-40">
                {children}
            </div>
        </div>
    )
}

// ── UpgradeButton — inline CTA used on limit-hit ──────────────────────────────
export function UpgradeButton({ label = "Upgrade Plan" }: { label?: string }) {
    return (
        <Link
            href="/owner/subscriptions"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-linear-to-r from-primary to-orange-400 px-4 py-2 rounded-xl hover:opacity-90 transition-all"
        >
            <Zap className="w-3.5 h-3.5" />
            {label}
        </Link>
    )
}
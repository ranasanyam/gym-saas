// src/components/owner/UsageMeter.tsx
// Compact usage widget. Embed in sidebar or dashboard.
"use client"

import Link from "next/link"
import { Zap, Crown, Infinity } from "lucide-react"
import { useSubscription } from "@/contexts/SubscriptionContext"

function Bar({ label, used, max, pct, warn }: {
    label: string; used: number; max: number | null; pct: number | null; warn?: boolean
}) {
    if (max === null) {
        // Unlimited — show a simple "∞" row
        return (
            <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">{label}</span>
                <span className="flex items-center gap-1 text-white/25">
                    <Infinity className="w-3 h-3" /> Unlimited
                </span>
            </div>
        )
    }

    const pctN = pct ?? 0
    const color = pctN >= 90 ? "bg-red-500" : pctN >= 70 ? "bg-yellow-500" : "bg-primary"

    return (
        <div>
            <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-white/40">{label}</span>
                <span className={`font-medium ${pctN >= 90 ? "text-red-400" : pctN >= 70 ? "text-yellow-400" : "text-white/60"}`}>
                    {used} / {max}
                </span>
            </div>
            <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${color}`}
                    style={{ width: `${pctN}%` }}
                />
            </div>
        </div>
    )
}

export function UsageMeter() {
    const {
        loading, planName, isLifetime, isTrial, isExpired, daysRemaining,
        usage, limits,
        gymUsagePct, memberUsagePct, trainerUsagePct, planUsagePct,
    } = useSubscription()

    if (loading || !usage || !limits) return null

    return (
        <div className="mx-3 mb-4 bg-[hsl(220_25%_10%)] border border-white/8 rounded-xl p-3 space-y-3">
            {/* Plan badge */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-primary" />
                    <span className="text-white/80 text-xs font-semibold">{planName}</span>
                </div>
                {isExpired ? (
                    <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">Expired</span>
                ) : isTrial ? (
                    <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">Trial</span>
                ) : isLifetime ? (
                    <span className="text-[10px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">Lifetime</span>
                ) : daysRemaining !== null && daysRemaining <= 14 ? (
                    <span className="text-[10px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">{daysRemaining}d left</span>
                ) : null}
            </div>

            {/* Usage bars */}
            <div className="space-y-2">
                <Bar label="Gyms" used={usage.gyms} max={limits.maxGyms} pct={gymUsagePct} />
                <Bar label="Members" used={usage.members} max={limits.maxMembers} pct={memberUsagePct} />
                <Bar label="Trainers" used={usage.trainers} max={limits.maxTrainers} pct={trainerUsagePct} />
                <Bar label="Plans" used={usage.membershipPlans} max={limits.maxMembershipPlans} pct={planUsagePct} />
            </div>

            {/* Upgrade CTA */}
            {!isLifetime && (
                <Link
                    href="/owner/billing"
                    className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-white/80 bg-white/5 hover:bg-primary/20 border border-white/8 hover:border-primary/30 rounded-lg py-1.5 transition-all"
                >
                    <Zap className="w-3 h-3 text-primary" />
                    {isExpired ? "Renew Plan" : "Upgrade Plan"}
                </Link>
            )}
        </div>
    )
}
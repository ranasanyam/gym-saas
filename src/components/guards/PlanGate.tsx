// src/components/guards/PlanGate.tsx
// Wraps UI elements behind plan-based feature checks.
// Shows an upgrade prompt when the feature is not available on the current plan.

"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Lock, Zap } from "lucide-react"
import { usePlan } from "@/hooks/usePlan"

interface PlanGateProps {
  feature:  string
  children: ReactNode
  fallback?: ReactNode
  showUpgradePrompt?: boolean
}

function UpgradePrompt({ feature }: { feature: string }) {
  return (
    <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
      <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
        <Lock className="w-5 h-5 text-purple-400" />
      </div>
      <div>
        <p className="text-white font-semibold text-sm">Upgrade Required</p>
        <p className="text-white/50 text-xs mt-1">
          {feature.replace(/_/g, " ")} is not available on your current plan.
        </p>
      </div>
      <Link
        href="/owner/subscriptions"
        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-300 text-xs font-medium transition-colors"
      >
        <Zap className="w-3.5 h-3.5" />
        Upgrade Plan
      </Link>
    </div>
  )
}

export function PlanGate({ feature, children, fallback, showUpgradePrompt = false }: PlanGateProps) {
  const { canAccess, loading } = usePlan()

  if (loading) return null

  if (!canAccess(feature)) {
    if (fallback) return <>{fallback}</>
    if (showUpgradePrompt) return <UpgradePrompt feature={feature} />
    return null
  }

  return <>{children}</>
}

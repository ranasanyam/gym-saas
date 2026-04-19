// src/hooks/usePlan.ts
// Returns current plan info and exposes canAccess(feature) helper.
// Reads from SubscriptionContext — never makes its own fetch.

"use client"

import { useSubscription } from "@/contexts/SubscriptionContext"
import { FEATURE_TO_LIMIT_KEY } from "@/lib/plans"
import type { PlanLimits } from "@/lib/subscription"

export function usePlan() {
  const sub = useSubscription()

  function canAccess(feature: string): boolean {
    if (sub.loading) return false
    if (sub.isExpired) return false

    const limitKey = FEATURE_TO_LIMIT_KEY[feature]
    if (!limitKey) return true // unknown feature → allow by default

    return (sub.limits?.[limitKey as keyof PlanLimits] as boolean | number | null) === true
  }

  return {
    ...sub,
    canAccess,
  }
}

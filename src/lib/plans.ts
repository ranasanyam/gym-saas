// src/lib/plans.ts
// Single source of truth for plan-based feature access.
// Re-exports from subscription.ts and adds the PLAN_FEATURES map
// that maps string feature keys to plan-tier requirements.

export {
  getLimitsForPlan,
  getOwnerSubscription,
  getOwnerUsage,
  checkLimit,
  checkFeature,
  requirePlanFeature,
  hasAccess,
  type PlanLimits,
  type ActiveSubscription,
  type UsageSnapshot,
  type LimitCheckResult,
  type Plan,
} from "@/lib/subscription"

// ── Feature key map ───────────────────────────────────────────────────────────
// Maps a feature string key to the minimum plan tier required.
// Use canAccess(feature) on the client or PLAN_FEATURES[feature] on the server.

export const PLAN_FEATURES: Record<string, string> = {
  // Available on Free and above
  attendance:     "free",
  member_crud:    "free",
  analytics:      "free",

  // Available on Basic and above
  workout_plans:  "basic",
  diet_plans:     "basic",
  payments:       "basic",
  full_reports:   "basic",
  refer_and_earn: "basic",
  dashboard_analytics: "basic",

  // Available on Pro and above
  supplements:    "pro",
  plan_templates: "pro",
  full_analytics: "pro",
  multi_trainer:  "pro",

  // Available on Enterprise only
  multi_gym:      "enterprise",
  api_access:     "enterprise",
  custom_branding: "enterprise",
}

// Maps feature key → the PlanLimits boolean field name for server-side checks
export const FEATURE_TO_LIMIT_KEY: Record<string, keyof import("@/lib/subscription").PlanLimits> = {
  attendance:          "hasAttendance",
  member_crud:         "hasMemberCrud",
  analytics:           "hasAnalytics",
  workout_plans:       "hasWorkoutPlans",
  diet_plans:          "hasDietPlans",
  payments:            "hasPayments",
  full_reports:        "hasFullReports",
  refer_and_earn:      "hasReferAndEarn",
  dashboard_analytics: "hasDashboardAnalytics",
  supplements:         "hasSupplements",
  plan_templates:      "hasPlanTemplates",
  full_analytics:      "hasFullAnalytics",
}

// // src/lib/subscription.ts
// // ─────────────────────────────────────────────────────────────────────────────
// // Single source of truth for subscription plan limits and feature flags.
// // Used server-side (API routes) AND exported as types for the client.
// // ─────────────────────────────────────────────────────────────────────────────

// import { prisma } from "@/lib/prisma"

// // ── Plan limit definitions ────────────────────────────────────────────────────
// // Mirrors the 5 plans described in the spec. "null" = unlimited.

// export interface PlanLimits {
//     maxGyms: number | null
//     maxMembers: number | null   // total across all gyms
//     maxTrainers: number | null   // total across all gyms
//     maxMembershipPlans: number | null   // total across all gyms
//     maxNotificationsPerMonth: number | null

//     // Feature flags
//     hasAnalytics: boolean
//     hasDashboardAnalytics: boolean
//     hasFullAnalytics: boolean
//     hasWorkoutPlans: boolean
//     hasDietPlans: boolean
//     hasAttendance: boolean
//     hasSupplements: boolean
//     hasPayments: boolean
//     hasMemberCrud: boolean
//     hasPlanTemplates: boolean
//     hasReferAndEarn: boolean
//     hasFullReports: boolean
// }

// // Keyed by plan name (lowercase). The same limits apply regardless of duration.
// const PLAN_LIMITS: Record<string, PlanLimits> = {
//     "free": {
//         maxGyms: 1,
//         maxMembers: null,
//         maxTrainers: null,
//         maxMembershipPlans: null,
//         maxNotificationsPerMonth: null,
//         hasAnalytics: true,
//         hasDashboardAnalytics: false,
//         hasFullAnalytics: false,
//         hasWorkoutPlans: false,
//         hasDietPlans: false,
//         hasAttendance: true,
//         hasSupplements: false,
//         hasPayments: false,
//         hasMemberCrud: true,
//         hasPlanTemplates: false,
//         hasReferAndEarn: false,
//         hasFullReports: false,
//     },
//     "basic": {
//         maxGyms: 1,
//         maxMembers: null,
//         maxTrainers: null,
//         maxMembershipPlans: null,
//         maxNotificationsPerMonth: null,
//         hasAnalytics: true,
//         hasDashboardAnalytics: true,
//         hasFullAnalytics: false,
//         hasWorkoutPlans: true,
//         hasDietPlans: true,
//         hasAttendance: true,
//         hasSupplements: false,
//         hasPayments: true,
//         hasMemberCrud: true,
//         hasPlanTemplates: false,
//         hasReferAndEarn: false,
//         hasFullReports: false,
//     },
//     "pro": {
//         maxGyms: 5,
//         maxMembers: null,
//         maxTrainers: null,
//         maxMembershipPlans: null,
//         maxNotificationsPerMonth: null,
//         hasAnalytics: true,
//         hasDashboardAnalytics: true,
//         hasFullAnalytics: true,
//         hasWorkoutPlans: true,
//         hasDietPlans: true,
//         hasAttendance: true,
//         hasSupplements: true,
//         hasPayments: true,
//         hasMemberCrud: true,
//         hasPlanTemplates: true,
//         hasReferAndEarn: false,
//         hasFullReports: true,
//     },
//     "enterprise": {
//         maxGyms: null,
//         maxMembers: null,
//         maxTrainers: null,
//         maxMembershipPlans: null,
//         maxNotificationsPerMonth: null,
//         hasAnalytics: true,
//         hasDashboardAnalytics: true,
//         hasFullAnalytics: true,
//         hasWorkoutPlans: true,
//         hasDietPlans: true,
//         hasAttendance: true,
//         hasSupplements: true,
//         hasPayments: true,
//         hasMemberCrud: true,
//         hasPlanTemplates: true,
//         hasReferAndEarn: true,
//         hasFullReports: true,
//     },
// }

// // Fallback — most restrictive limits for unknown/expired plans
// const EXPIRED_LIMITS: PlanLimits = {
//     maxGyms: 0,
//     maxMembers: 0,
//     maxTrainers: 0,
//     maxMembershipPlans: 0,
//     maxNotificationsPerMonth: 0,
//     hasAnalytics: false,
//     hasDashboardAnalytics: false,
//     hasFullAnalytics: false,
//     hasWorkoutPlans: false,
//     hasDietPlans: false,
//     hasAttendance: false,
//     hasSupplements: false,
//     hasPayments: false,
//     hasMemberCrud: false,
//     hasPlanTemplates: false,
//     hasReferAndEarn: false,
//     hasFullReports: false,
// }

// // ── Subscription shape returned to callers ────────────────────────────────────

// export interface ActiveSubscription {
//     id: string
//     status: string
//     planName: string
//     planSlug: string
//     limits: PlanLimits
//     currentPeriodEnd: Date | null
//     isExpired: boolean
//     isLifetime: boolean
//     isTrial: boolean
//     daysRemaining: number | null
// }

// // ── Resolve limits from plan name ─────────────────────────────────────────────

// export function getLimitsForPlan(planName: string): PlanLimits {
//     const slug = planName.toLowerCase().trim()
//     return PLAN_LIMITS[slug] ?? EXPIRED_LIMITS
// }

// // ── Fetch the active subscription + resolved limits for an owner ──────────────

// export async function getOwnerSubscription(profileId: string): Promise<ActiveSubscription | null> {
//     const sub = await prisma.saasSubscription.findFirst({
//         where: { profileId },
//         include: { saasPlan: true },
//         orderBy: { createdAt: "desc" },
//     })

//     if (!sub) return null

//     const now = new Date()
//     const isLifetime = sub.status === "LIFETIME" || sub.saasPlan.interval === "LIFETIME"
//     const isExpired = !isLifetime && sub.currentPeriodEnd !== null && sub.currentPeriodEnd < now
//     const isActive = (sub.status === "ACTIVE" || sub.status === "TRIALING" || isLifetime) && !isExpired
//     const isTrial = sub.status === "TRIALING"

//     let daysRemaining: number | null = null
//     if (!isLifetime && sub.currentPeriodEnd) {
//         daysRemaining = Math.max(0, Math.ceil((sub.currentPeriodEnd.getTime() - now.getTime()) / 86400000))
//     }

//     const limits = isActive ? getLimitsForPlan(sub.saasPlan.name) : EXPIRED_LIMITS

//     return {
//         id: sub.id,
//         status: sub.status,
//         planName: sub.saasPlan.name,
//         planSlug: sub.saasPlan.name.toLowerCase().trim(),
//         limits,
//         currentPeriodEnd: sub.currentPeriodEnd,
//         isExpired,
//         isLifetime,
//         isTrial,
//         daysRemaining,
//     }
// }

// // ── Current usage snapshot ────────────────────────────────────────────────────

// export interface UsageSnapshot {
//     gyms: number
//     members: number
//     trainers: number
//     membershipPlans: number
//     notificationsThisMonth: number
// }

// export async function getOwnerUsage(profileId: string): Promise<UsageSnapshot> {
//     const now = new Date()
//     const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

//     const gyms = await prisma.gym.findMany({
//         where: { ownerId: profileId, isActive: true },
//         select: { id: true },
//     })
//     const gymIds = gyms.map(g => g.id)

//     const [members, trainers, membershipPlans, notificationsThisMonth] = await Promise.all([
//         gymIds.length ? prisma.gymMember.count({ where: { gymId: { in: gymIds }, status: "ACTIVE" } }) : 0,
//         gymIds.length ? prisma.gymTrainer.count({ where: { gymId: { in: gymIds } } }) : 0,
//         gymIds.length ? prisma.membershipPlan.count({ where: { gymId: { in: gymIds }, isActive: true } }) : 0,
//         gymIds.length
//             ? prisma.announcement.count({
//                 where: { gymId: { in: gymIds }, createdAt: { gte: monthStart } },
//             })
//             : 0,
//     ])

//     return {
//         gyms: gyms.length,
//         members,
//         trainers,
//         membershipPlans,
//         notificationsThisMonth,
//     }
// }

// // ── Limit check helpers ───────────────────────────────────────────────────────
// // Returns { allowed: true } or { allowed: false, reason: string }

// export type LimitCheckResult =
//     | { allowed: true }
//     | { allowed: false; reason: string; upgradeRequired: true }

// export function checkLimit(
//     current: number,
//     max: number | null,
//     resourceLabel: string
// ): LimitCheckResult {
//     if (max === null) return { allowed: true }               // unlimited
//     if (current < max) return { allowed: true }
//     return {
//         allowed: false,
//         upgradeRequired: true,
//         reason: `You've reached the limit of ${max} ${resourceLabel} on your current plan. Please upgrade to add more.`,
//     }
// }

// export function checkFeature(hasFeature: boolean, featureLabel: string): LimitCheckResult {
//     if (hasFeature) return { allowed: true }
//     return {
//         allowed: false,
//         upgradeRequired: true,
//         reason: `${featureLabel} is not available on your current plan. Please upgrade to access this feature.`,
//     }
// }

// // ── Convenience: full guard (subscription + limit) ────────────────────────────
// // Use in API routes: const guard = await requirePlanFeature(profileId, sub => sub.limits.hasSupplements, "Supplement management")

// export async function requirePlanFeature(
//     profileId: string,
//     featureGetter: (sub: ActiveSubscription) => boolean,
//     featureLabel: string
// ): Promise<LimitCheckResult> {
//     const sub = await getOwnerSubscription(profileId)
//     if (!sub || sub.isExpired) {
//         return {
//             allowed: false,
//             upgradeRequired: true,
//             reason: "Your subscription has expired. Please renew to continue using this feature.",
//         }
//     }
//     return checkFeature(featureGetter(sub), featureLabel)
// }


// src/lib/subscription.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for subscription plan limits and feature flags.
// Used server-side (API routes) AND exported as types for the client.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma"

// ── Plan limit definitions ────────────────────────────────────────────────────
// Mirrors the 5 plans described in the spec. "null" = unlimited.

export interface PlanLimits {
  maxGyms:              number | null
  maxMembers:           number | null   // total across all gyms
  maxTrainers:          number | null   // total across all gyms
  maxMembershipPlans:   number | null   // total across all gyms
  maxNotificationsPerMonth: number | null

  // Feature flags
  hasAnalytics:         boolean
  hasDashboardAnalytics: boolean
  hasFullAnalytics:     boolean
  hasWorkoutPlans:      boolean
  hasDietPlans:         boolean
  hasAttendance:        boolean
  hasSupplements:       boolean
  hasPayments:          boolean
  hasMemberCrud:        boolean
  hasPlanTemplates:     boolean
  hasReferAndEarn:      boolean
  hasFullReports:       boolean
}

// Stable plan slugs — matches the seed IDs in seed-saas-plans.ts
// We also match by name.toLowerCase() as fallback.
const PLAN_LIMITS: Record<string, PlanLimits> = {
  // ── Legacy plan slugs (kept so existing subscriptions don't break) ─────────
  "free trial": {
    maxGyms:              1,
    maxMembers:           null,
    maxTrainers:          null,
    maxMembershipPlans:   null,
    maxNotificationsPerMonth: null,
    hasAnalytics:         true,
    hasDashboardAnalytics: true,
    hasFullAnalytics:     false,
    hasWorkoutPlans:      false,
    hasDietPlans:         false,
    hasAttendance:        true,
    hasSupplements:       false,
    hasPayments:          false,
    hasMemberCrud:        true,
    hasPlanTemplates:     false,
    hasReferAndEarn:      false,
    hasFullReports:       false,
  },

  // ── Current plan slugs (matched by getLimitsForPlan via name.toLowerCase()) ─
  // "free" matches plan name "Free"
  "free": {
    maxGyms:              1,
    maxMembers:           null,
    maxTrainers:          null,
    maxMembershipPlans:   null,
    maxNotificationsPerMonth: null,
    hasAnalytics:         true,
    hasDashboardAnalytics: true,
    hasFullAnalytics:     false,
    hasWorkoutPlans:      false,
    hasDietPlans:         false,
    hasAttendance:        true,
    hasSupplements:       false,
    hasPayments:          false,
    hasMemberCrud:        true,
    hasPlanTemplates:     false,
    hasReferAndEarn:      false,
    hasFullReports:       false,
  },

  // "basic" matches plan name "Basic"
  "basic": {
    maxGyms:              1,
    maxMembers:           null,
    maxTrainers:          null,
    maxMembershipPlans:   null,
    maxNotificationsPerMonth: null,
    hasAnalytics:         true,
    hasDashboardAnalytics: true,
    hasFullAnalytics:     false,
    hasWorkoutPlans:      false,
    hasDietPlans:         false,
    hasAttendance:        true,
    hasSupplements:       false,
    hasPayments:          false,
    hasMemberCrud:        true,
    hasPlanTemplates:     false,
    hasReferAndEarn:      true,
    hasFullReports:       true,
  },

  "starter": {
    maxGyms:              2,
    maxMembers:           200,
    maxTrainers:          2,
    maxMembershipPlans:   20,
    maxNotificationsPerMonth: 50,
    hasAnalytics:         true,
    hasDashboardAnalytics: true,
    hasFullAnalytics:     false,
    hasWorkoutPlans:      true,
    hasDietPlans:         true,
    hasAttendance:        true,
    hasSupplements:       false,
    hasPayments:          false,
    hasMemberCrud:        false,
    hasPlanTemplates:     false,
    hasReferAndEarn:      false,
    hasFullReports:       false,
  },
  "growth": {
    maxGyms:              10,
    maxMembers:           500,
    maxTrainers:          10,
    maxMembershipPlans:   50,
    maxNotificationsPerMonth: 100,
    hasAnalytics:         true,
    hasDashboardAnalytics: true,
    hasFullAnalytics:     true,
    hasWorkoutPlans:      true,
    hasDietPlans:         true,
    hasAttendance:        true,
    hasSupplements:       true,
    hasPayments:          true,
    hasMemberCrud:        true,
    hasPlanTemplates:     false,
    hasReferAndEarn:      false,
    hasFullReports:       false,
  },
  // "pro" matches plan name "Pro"
  "pro": {
    maxGyms:              1,    // Pro plan: 1 gym (Enterprise has 5)
    maxMembers:           null,
    maxTrainers:          null,
    maxMembershipPlans:   null,
    maxNotificationsPerMonth: null,
    hasAnalytics:         true,
    hasDashboardAnalytics: true,
    hasFullAnalytics:     true,
    hasWorkoutPlans:      true,
    hasDietPlans:         true,
    hasAttendance:        true,
    hasSupplements:       true,
    hasPayments:          true,
    hasMemberCrud:        true,
    hasPlanTemplates:     true,
    hasReferAndEarn:      true,
    hasFullReports:       true,
  },
  "lifetime": {
    maxGyms:              null,
    maxMembers:           null,
    maxTrainers:          null,
    maxMembershipPlans:   null,
    maxNotificationsPerMonth: null,
    hasAnalytics:         true,
    hasDashboardAnalytics: true,
    hasFullAnalytics:     true,
    hasWorkoutPlans:      true,
    hasDietPlans:         true,
    hasAttendance:        true,
    hasSupplements:       true,
    hasPayments:          true,
    hasMemberCrud:        true,
    hasPlanTemplates:     true,
    hasReferAndEarn:      true,
    hasFullReports:       true,
  },

  // "enterprise" matches plan name "Enterprise"
  "enterprise": {
    maxGyms:              5,
    maxMembers:           null,
    maxTrainers:          null,
    maxMembershipPlans:   null,
    maxNotificationsPerMonth: null,
    hasAnalytics:         true,
    hasDashboardAnalytics: true,
    hasFullAnalytics:     true,
    hasWorkoutPlans:      true,
    hasDietPlans:         true,
    hasAttendance:        true,
    hasSupplements:       true,
    hasPayments:          true,
    hasMemberCrud:        true,
    hasPlanTemplates:     true,
    hasReferAndEarn:      true,
    hasFullReports:       true,
  },
}

// Fallback — most restrictive limits for unknown/expired plans
const EXPIRED_LIMITS: PlanLimits = {
  maxGyms:              0,
  maxMembers:           0,
  maxTrainers:          0,
  maxMembershipPlans:   0,
  maxNotificationsPerMonth: 0,
  hasAnalytics:         false,
  hasDashboardAnalytics: false,
  hasFullAnalytics:     false,
  hasWorkoutPlans:      false,
  hasDietPlans:         false,
  hasAttendance:        false,
  hasSupplements:       false,
  hasPayments:          false,
  hasMemberCrud:        false,
  hasPlanTemplates:     false,
  hasReferAndEarn:      false,
  hasFullReports:       false,
}

// ── Subscription shape returned to callers ────────────────────────────────────

export interface ActiveSubscription {
  id:               string
  status:           string
  planName:         string
  planSlug:         string
  limits:           PlanLimits
  currentPeriodEnd: Date | null
  isExpired:        boolean
  isLifetime:       boolean
  isTrial:          boolean
  daysRemaining:    number | null
}

// ── Resolve limits from plan name ─────────────────────────────────────────────

export function getLimitsForPlan(planName: string): PlanLimits {
  const slug = planName.toLowerCase().trim()
  return PLAN_LIMITS[slug] ?? EXPIRED_LIMITS
}

// ── Fetch the active subscription + resolved limits for an owner ──────────────

export async function getOwnerSubscription(profileId: string): Promise<ActiveSubscription | null> {
  const sub = await prisma.saasSubscription.findFirst({
    where:   { profileId },
    include: { saasPlan: true },
    orderBy: { createdAt: "desc" },
  })

  if (!sub) return null

  const now        = new Date()
  const isLifetime = sub.status === "LIFETIME" || sub.saasPlan.interval === "LIFETIME"
  const isExpired  = !isLifetime && sub.currentPeriodEnd !== null && sub.currentPeriodEnd < now
  const isActive   = (sub.status === "ACTIVE" || sub.status === "TRIALING" || isLifetime) && !isExpired
  const isTrial    = sub.status === "TRIALING"

  let daysRemaining: number | null = null
  if (!isLifetime && sub.currentPeriodEnd) {
    daysRemaining = Math.max(0, Math.ceil((sub.currentPeriodEnd.getTime() - now.getTime()) / 86400000))
  }

  const limits = isActive ? getLimitsForPlan(sub.saasPlan.name) : EXPIRED_LIMITS

  return {
    id:               sub.id,
    status:           sub.status,
    planName:         sub.saasPlan.name,
    planSlug:         sub.saasPlan.name.toLowerCase().trim(),
    limits,
    currentPeriodEnd: sub.currentPeriodEnd,
    isExpired,
    isLifetime,
    isTrial,
    daysRemaining,
  }
}

// ── Current usage snapshot ────────────────────────────────────────────────────

export interface UsageSnapshot {
  gyms:             number
  members:          number
  trainers:         number
  membershipPlans:  number
  notificationsThisMonth: number
}

export async function getOwnerUsage(profileId: string): Promise<UsageSnapshot> {
  const now         = new Date()
  const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1)

  const gyms = await prisma.gym.findMany({
    where:  { ownerId: profileId, isActive: true },
    select: { id: true },
  })
  const gymIds = gyms.map(g => g.id)

  const [members, trainers, membershipPlans, notificationsThisMonth] = await Promise.all([
    gymIds.length ? prisma.gymMember.count({ where: { gymId: { in: gymIds }, status: "ACTIVE" } }) : 0,
    gymIds.length ? prisma.gymTrainer.count({ where: { gymId: { in: gymIds } } }) : 0,
    gymIds.length ? prisma.membershipPlan.count({ where: { gymId: { in: gymIds }, isActive: true } }) : 0,
    gymIds.length
      ? prisma.announcement.count({
          where: { gymId: { in: gymIds }, createdAt: { gte: monthStart } },
        })
      : 0,
  ])

  return {
    gyms:    gyms.length,
    members,
    trainers,
    membershipPlans,
    notificationsThisMonth,
  }
}

// ── Limit check helpers ───────────────────────────────────────────────────────
// Returns { allowed: true } or { allowed: false, reason: string }

export type LimitCheckResult =
  | { allowed: true }
  | { allowed: false; reason: string; upgradeRequired: true }

export function checkLimit(
  current: number,
  max: number | null,
  resourceLabel: string
): LimitCheckResult {
  if (max === null) return { allowed: true }               // unlimited
  if (current < max) return { allowed: true }
  return {
    allowed: false,
    upgradeRequired: true,
    reason: `You've reached the limit of ${max} ${resourceLabel} on your current plan. Please upgrade to add more.`,
  }
}

export function checkFeature(hasFeature: boolean, featureLabel: string): LimitCheckResult {
  if (hasFeature) return { allowed: true }
  return {
    allowed: false,
    upgradeRequired: true,
    reason: `${featureLabel} is not available on your current plan. Please upgrade to access this feature.`,
  }
}

// ── Convenience: full guard (subscription + limit) ────────────────────────────
// Use in API routes: const guard = await requirePlanFeature(profileId, sub => sub.limits.hasSupplements, "Supplement management")

export async function requirePlanFeature(
  profileId: string,
  featureGetter: (sub: ActiveSubscription) => boolean,
  featureLabel: string
): Promise<LimitCheckResult> {
  const sub = await getOwnerSubscription(profileId)
  if (!sub || sub.isExpired) {
    return {
      allowed: false,
      upgradeRequired: true,
      reason: "Your subscription has expired. Please renew to continue using this feature.",
    }
  }
  return checkFeature(featureGetter(sub), featureLabel)
}

// ── Reusable subscription guard ───────────────────────────────────────────────
// Plan hierarchy for access checks.
// "pro" and "enterprise" are treated as equals at tier 5.
const PLAN_ORDER: Record<string, number> = {
  "free":       1,
  "free trial": 1,
  "basic":      2,
  "starter":    3,
  "growth":     4,
  "pro":        5,
  "enterprise": 5,
  "lifetime":   6,
}

export type Plan = "free" | "basic" | "pro" | "enterprise"

/**
 * Returns true when the user's plan meets or exceeds the required plan tier.
 * Safe to use in middleware, API routes, server components, and client UI.
 *
 * @example
 * if (!hasAccess(userPlan, "pro")) return NextResponse.json({ error: "Upgrade required" }, { status: 403 })
 */
export function hasAccess(userPlan: string, requiredPlan: string): boolean {
  const userLevel = PLAN_ORDER[userPlan.toLowerCase().trim()] ?? 0
  const reqLevel  = PLAN_ORDER[requiredPlan.toLowerCase().trim()] ?? 999
  return userLevel >= reqLevel
}
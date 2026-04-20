// src/app/owner/dashboard/page.tsx
// Async Server Component — URL-driven state, Suspense-streamed sections.

import { Suspense }      from "react"
import Link              from "next/link"
import { redirect }      from "next/navigation"
import { auth }          from "@/auth"
import { prisma }        from "@/lib/prisma"
import { getOwnerSubscription } from "@/lib/subscription"
import {
  UserPlus, CalendarCheck,
  ShoppingBag, BarChart3, Building2, ArrowRight, IndianRupee,
  Crown, Zap,
} from "lucide-react"
import type { DashRange }         from "@/lib/dashboard-queries"
import { Controls }               from "./_components/Controls"
import { StatsSection }           from "./_components/StatsSection"
import { RecentMembers }          from "./_components/RecentMembers"
import { TodayCheckins }          from "./_components/TodayCheckins"
import { SupplementSales }        from "./_components/SupplementSales"
import { RecentExpenses }         from "./_components/RecentExpenses"
import { LowStockAlerts }         from "./_components/Lowstockalerts"
import {
  StatsSkeleton, MembersSkeleton, CheckinsSkeleton,
  ExpensesSkeleton, SuppSkeleton, LowStockSkeleton,
} from "./_components/Skeletons"

// ── Quick Actions (static, no data) ──────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "Add Member",  href: "/owner/members/new",  icon: UserPlus,      color: "text-blue-400",   bg: "bg-blue-500/10"   },
  { label: "Add Trainer", href: "/owner/trainers/new", icon: UserPlus,      color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { label: "Attendance",  href: "/owner/attendance",   icon: CalendarCheck, color: "text-green-400",  bg: "bg-green-500/10"  },
  { label: "Expenses",    href: "/owner/expenses",     icon: IndianRupee,   color: "text-red-400",    bg: "bg-red-500/10"    },
  { label: "Supplements", href: "/owner/supplements",  icon: ShoppingBag,   color: "text-purple-400", bg: "bg-purple-500/10" },
  { label: "Reports",     href: "/owner/reports",      icon: BarChart3,     color: "text-orange-400", bg: "bg-orange-500/10" },
]

function QuickActions() {
  return (
    <div>
      <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-3">
        Quick Actions
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {QUICK_ACTIONS.map(a => (
          <Link key={a.label} href={a.href}
            className="flex flex-col items-center gap-2.5 p-4 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl hover:border-white/15 transition-all group text-center">
            <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center`}>
              <a.icon className={`w-5 h-5 ${a.color}`} />
            </div>
            <span className="text-white/60 text-xs font-medium group-hover:text-white transition-colors leading-tight">
              {a.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Subscription Badge ──────────────────────────────────────────────────────
function SubscriptionBadge({ planSlug, isExpired }: { planSlug: string; isExpired: boolean }) {
  const planName = planSlug === "free" ? "Free" : planSlug.charAt(0).toUpperCase() + planSlug.slice(1)
  const isEnterprise = planSlug === "enterprise"

  if (isEnterprise && !isExpired) return null // Don't show for enterprise users

  return (
    <Link href="/owner/subscriptions"
      className="block bg-linear-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-4 hover:border-purple-500/40 transition-all group cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            {isExpired ? (
              <Zap className="w-5 h-5 text-purple-400" />
            ) : (
              <Crown className="w-5 h-5 text-purple-400" />
            )}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              Current Plan: {planName} {isExpired && "(Expired)"}
            </p>
            <p className="text-white/60 text-xs">
              Upgrade to Enterprise for unlimited gyms, advanced analytics, and premium features
            </p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function OwnerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    gymId?:       string
    range?:       string
    customStart?: string
    customEnd?:   string
  }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { gymId = "", range = "last_30_days", customStart, customEnd } = await searchParams

  const safeRange = (
    ["today", "last_7_days", "last_30_days", "last_90_days", "financial_year", "custom"]
      .includes(range) ? range : "last_30_days"
  ) as DashRange

  // Fetch gyms + subscription in parallel — both needed before rendering
  const [gyms, subscription] = await Promise.all([
    prisma.gym.findMany({
      where:  { ownerId: session.user.id, isActive: true },
      select: { id: true, name: true, city: true },
    }),
    getOwnerSubscription(session.user.id),
  ])

  const allGymIds  = gyms.map(g => g.id)
  const gymIds     = gymId && allGymIds.includes(gymId) ? [gymId] : allGymIds
  const ownerName  = session.user.name ?? "Owner"
  const multiGym   = allGymIds.length > 1

  // Derive plan tier for UI gating (server-side, never trust client)
  const planSlug   = subscription?.planSlug ?? "free"
  const isExpired  = subscription?.isExpired ?? true
  const hasPremium = !isExpired && (subscription?.limits.hasFullAnalytics ?? false)

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Controls — rendered immediately (no Suspense needed) */}
      <Controls gyms={gyms} ownerName={ownerName} />

      {/* Subscription Badge */}
      <SubscriptionBadge planSlug={planSlug} isExpired={isExpired} />

      {/* No gyms yet */}
      {allGymIds.length === 0 ? (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-10 text-center space-y-4">
          <Building2 className="w-12 h-12 text-white/15 mx-auto" />
          <div>
            <h2 className="text-white font-bold text-lg">Set up your first gym</h2>
            <p className="text-white/40 text-sm mt-1">
              Create a gym to start adding members and tracking revenue.
            </p>
          </div>
          <Link href="/owner/choose-plan"
            className="inline-flex items-center gap-2 bg-linear-to-r from-primary to-orange-400 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* ── Stats + alerts + chart ─────────────────────────────────────── */}
          <Suspense fallback={<StatsSkeleton />}>
            <StatsSection
              gymIds={gymIds}
              activeGyms={allGymIds.length}
              range={safeRange}
              customStart={customStart}
              customEnd={customEnd}
              hasPremium={hasPremium}
              planSlug={planSlug}
            />
          </Suspense>

          {/* ── Low Stock Alerts ───────────────────────────────────────────── */}
          {/* Rendered only when supplements are at or below their alert
              threshold. The component returns null when everything is fine,
              so nothing is rendered and there is no empty card.             */}
          <Suspense fallback={<LowStockSkeleton />}>
            <LowStockAlerts gymIds={gymIds} multiGym={multiGym} />
          </Suspense>

          {/* ── Quick Actions (static) ─────────────────────────────────────── */}
          <QuickActions />

          {/* ── Recent Members + Today's Check-ins ────────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-5">
            <Suspense fallback={<MembersSkeleton />}>
              <RecentMembers gymIds={gymIds} />
            </Suspense>

            <Suspense fallback={<CheckinsSkeleton />}>
              <TodayCheckins gymIds={gymIds} />
            </Suspense>
          </div>

          {/* ── Recent Expenses ────────────────────────────────────────────── */}
          <Suspense fallback={<ExpensesSkeleton />}>
            <RecentExpenses
              gymIds={gymIds}
              range={safeRange}
              customStart={customStart}
              customEnd={customEnd}
            />
          </Suspense>

          {/* ── Recent Supplement Sales ────────────────────────────────────── */}
          <Suspense fallback={<SuppSkeleton />}>
            <SupplementSales gymIds={gymIds} />
          </Suspense>
        </>
      )}
    </div>
  )
}
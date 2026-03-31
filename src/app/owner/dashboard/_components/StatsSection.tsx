// src/app/owner/dashboard/_components/StatsSection.tsx
// Async Server Component — fetches & renders all stat cards + revenue chart.

import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react"
import Link from "next/link"
import {
  Users, UserPlus, CreditCard, CalendarCheck, ShoppingBag, Zap, Receipt,
} from "lucide-react"
import { getDashboardStats } from "@/lib/dashboard-queries"
import type { DashRange } from "@/lib/dashboard-queries"
import { RevenueChart } from "./RevenueChart"

const RANGE_LABELS: Record<DashRange, string> = {
  today:          "Today",
  last_7_days:    "Last 7 Days",
  last_30_days:   "Last 30 Days",
  last_90_days:   "This Quarter (90 days)",
  financial_year: "Financial Year (Apr–Mar)",
  custom:         "Custom Range",
}

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toLocaleString("en-IN")}`
}

function computeDelta(current: number, prev: number): number | null {
  if (prev === 0) return null
  return ((current - prev) / prev) * 100
}

function DeltaBadge({ pct }: { pct: number | null }) {
  if (pct == null || !isFinite(pct)) return null
  const up = pct >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
      up ? "bg-green-500/12 text-green-400" : "bg-red-500/12 text-red-400"
    }`}>
      {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

function StatCard({
  icon: Icon, label, value, sub, subColor = "text-primary", highlight = false, delta,
}: {
  icon: React.ElementType; label: string; value: string | number; sub: string
  subColor?: string; highlight?: boolean; delta?: number | null
}) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-3 transition-all border ${
      highlight
        ? "bg-primary/8 border-primary/25 hover:border-primary/40"
        : "bg-[hsl(220_25%_9%)] border-white/6 hover:border-white/12"
    }`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${highlight ? "bg-primary/20" : "bg-white/6"}`}>
        <Icon className={`w-4 h-4 ${highlight ? "text-primary" : "text-white/50"}`} />
      </div>
      <div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className={`text-2xl font-display font-bold ${highlight ? "text-primary" : "text-white"}`}>{value}</p>
          {delta != null && <DeltaBadge pct={delta} />}
        </div>
        <p className="text-white/40 text-xs mt-0.5">{label}</p>
      </div>
      <p className={`text-xs ${subColor}`}>{sub}</p>
    </div>
  )
}

interface Props {
  gymIds:      string[]
  activeGyms:  number
  range:       DashRange
  customStart?: string
  customEnd?:   string
}

export async function StatsSection({ gymIds, activeGyms, range, customStart, customEnd }: Props) {
  const d = await getDashboardStats(gymIds, range, customStart, customEnd)
  const rangeLabel = RANGE_LABELS[range]

  const prevStart = new Date(d.prevStart)
  const prevEnd   = new Date(d.prevEnd)
  const prevLabel = `vs ${prevStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${prevEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`

  const hasChartData =
    d.dailyMembershipRevenue.some(x => x.amount > 0) ||
    d.dailySupplementRevenue.some(x => x.amount > 0) ||
    d.dailyExpenses.some(x => x.amount > 0)

  return (
    <div className="space-y-6">

      {/* ── Expiry alerts ─────────────────────────────────── */}
      {d.expiringToday.length > 0 && (
        <div className="bg-red-500/8 border border-red-500/25 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-red-300 text-sm flex-1">
            <span className="font-semibold">Last day today: </span>
            {d.expiringToday.join(", ")} — collect payment now.
          </p>
          <Link href="/owner/members?filter=expiring" className="text-red-400 text-xs hover:underline shrink-0">View →</Link>
        </div>
      )}
      {d.expiringMembers3 > 0 && d.expiringToday.length === 0 && (
        <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-yellow-300 text-sm flex-1">
            <span className="font-semibold">{d.expiringMembers3} membership{d.expiringMembers3 > 1 ? "s" : ""}</span>{" "}
            expiring in the next 3 days.
          </p>
          <Link href="/owner/members?filter=expiring" className="text-yellow-400 text-xs hover:underline shrink-0">View →</Link>
        </div>
      )}
      {d.expiringMembers > 0 && d.expiringMembers3 === 0 && (
        <div className="bg-yellow-500/5 border border-yellow-500/12 rounded-2xl px-5 py-3 flex items-center gap-3">
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-500/60 shrink-0" />
          <p className="text-yellow-400/60 text-xs flex-1">
            {d.expiringMembers} membership{d.expiringMembers > 1 ? "s" : ""} expiring within 7 days.
          </p>
          <Link href="/owner/members?filter=expiring" className="text-yellow-500/60 text-xs hover:text-yellow-400 shrink-0">View →</Link>
        </div>
      )}

      {/* ── Today stats ────────────────────────────────────── */}
      {range !== "today" && (
        <div>
          <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-3">Today</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={Zap}           label="Today's Revenue"  value={fmt(d.todayRevenue)}  sub="Membership + supplements" highlight subColor="text-primary" />
            <StatCard icon={CalendarCheck} label="Check-ins Today"  value={d.todayAttendance}    sub="Members in gym today"     subColor="text-green-400" />
            <StatCard icon={UserPlus}      label="New Members"      value={d.todayNewMembers}    sub="Joined today"             subColor="text-blue-400" />
            <StatCard icon={TrendingDown}  label="Today's Expenses" value={fmt(d.todayExpenses)} sub="Operational costs"        subColor="text-red-400" />
          </div>
        </div>
      )}

      {/* ── Range stats ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-wider">{rangeLabel}</p>
          <p className="text-white/20 text-xs">{prevLabel}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            icon={Users}
            label="Active Members"
            value={d.totalMembers}
            sub={`Across ${activeGyms} gym${activeGyms !== 1 ? "s" : ""}`}
          />
          <StatCard
            icon={UserPlus}
            label="New Joinings"
            value={d.rangeNewMembers}
            sub={rangeLabel}
            subColor="text-blue-400"
            delta={computeDelta(d.rangeNewMembers, d.prevNewMembers)}
          />
          <StatCard
            icon={CreditCard}
            label="Membership Revenue"
            value={fmt(d.rangeRevenue)}
            sub={rangeLabel}
            subColor="text-primary"
            delta={computeDelta(d.rangeRevenue, d.prevRevenue)}
          />
          <StatCard
            icon={ShoppingBag}
            label="Supplement Revenue"
            value={fmt(d.rangeSuppRevenue)}
            sub={rangeLabel}
            subColor="text-green-400"
            delta={computeDelta(d.rangeSuppRevenue, d.prevSuppRevenue)}
          />
          <StatCard
            icon={Receipt}
            label="Total Expenses"
            value={fmt(d.rangeExpenses)}
            sub={rangeLabel}
            subColor="text-red-400"
            delta={computeDelta(d.rangeExpenses, d.prevExpenses)}
          />
          <StatCard
            icon={TrendingUp}
            label="Net Revenue"
            value={fmt(d.netRevenue)}
            sub="Revenue − Expenses"
            subColor={d.netRevenue >= 0 ? "text-green-400" : "text-red-400"}
            delta={computeDelta(d.netRevenue, d.prevNetRevenue)}
          />
        </div>
      </div>

      {/* ── Revenue chart ─────────────────────────────────── */}
      {hasChartData && (
        <RevenueChart
          membership={d.dailyMembershipRevenue}
          supplement={d.dailySupplementRevenue}
          expenses={d.dailyExpenses}
          rangeLabel={rangeLabel}
        />
      )}
    </div>
  )
}

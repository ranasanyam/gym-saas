// src/app/owner/dashboard/page.tsx
"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Link from "next/link"
import { useProfile } from "@/contexts/ProfileContext"
import {
  Users, Building2, CreditCard, CalendarCheck, UserPlus, ClipboardList,
  BarChart3, ArrowRight, TrendingUp, ShoppingBag, TrendingDown,
  Receipt, Package, AlertTriangle, Zap, ChevronDown, RefreshCw, Apple,
  Calendar, X,
} from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"
import type { DashRange } from "@/app/api/owner/dashboard/route"

// ── Range options ─────────────────────────────────────────────────────────────
const RANGE_OPTIONS: { value: DashRange; label: string }[] = [
  { value: "today",          label: "Today"                    },
  { value: "last_7_days",    label: "Last 7 Days"              },
  { value: "last_30_days",   label: "Last 30 Days"             },
  { value: "last_90_days",   label: "This Quarter (90 days)"   },
  { value: "financial_year", label: "Financial Year (Apr–Mar)" },
  { value: "custom",         label: "Custom Range"             },
]

// ── Types ──────────────────────────────────────────────────────────────────────
interface ChartBucket {
  date:              string
  membershipRevenue: number
  supplementRevenue: number
  expense:           number
}

interface DashboardData {
  gyms:                   { id: string; name: string; city: string | null }[]
  totalMembers:           number
  activeGyms:             number
  range:                  DashRange
  rangeStart:             string
  rangeEnd:               string
  prevStart:              string
  prevEnd:                string
  rangeRevenue:           number
  rangeSupplementRevenue: number
  totalRevenue:           number
  prevRevenue:            number
  prevSuppRevenue:        number
  prevTotalRevenue:       number
  rangeExpenses:          number
  prevExpenses:           number
  todayExpenses:          number
  netRevenue:             number
  prevNetRevenue:         number
  rangeAttendance:        number
  prevAttendance:         number
  rangeNewMembers:        number
  prevNewMembers:         number
  todayRevenue:           number
  todayAttendance:        number
  todayNewMembers:        number
  expiringMembers:        number
  expiringMembers3:       number
  expiringToday:          string[]
  dailyMembershipRevenue: { date: string; amount: number }[]
  dailySupplementRevenue: { date: string; amount: number }[]
  dailyExpenses:          { date: string; amount: number }[]
  recentMembers:          { id: string; createdAt: string; status: string; profile: { fullName: string; avatarUrl: string | null; email: string }; gym: { name: string } }[]
  todayCheckins:          { id: string; checkInTime: string; checkOutTime: string | null; member: { profile: { fullName: string; avatarUrl: string | null } } }[]
  recentSupplementSales:  { id: string; qty: number; totalAmount: number; memberName: string | null; soldAt: string; supplement: { name: string; unitSize: string | null }; member: { profile: { fullName: string } } | null }[]
  recentExpenses:         { id: string; title: string; amount: number; category: string; expenseDate: string; gym: { name: string } }[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toLocaleString("en-IN")}`
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), dy = Math.floor(diff / 86400000)
  if (dy > 0) return `${dy}d ago`
  if (h  > 0) return `${h}h ago`
  return `${Math.max(0, m)}m ago`
}

function computeDelta(current: number, prev: number): number | null {
  if (prev === 0) return null
  return ((current - prev) / prev) * 100
}

function mergeChartData(
  membership: { date: string; amount: number }[],
  supplement: { date: string; amount: number }[],
  expenses:   { date: string; amount: number }[]
): ChartBucket[] {
  const dates   = membership.map(d => d.date)
  const suppMap: Record<string, number> = {}
  const expMap:  Record<string, number> = {}
  for (const s of supplement) suppMap[s.date] = s.amount
  for (const e of expenses)   expMap[e.date]  = e.amount
  return dates.map(date => ({
    date,
    membershipRevenue: membership.find(d => d.date === date)?.amount ?? 0,
    supplementRevenue: suppMap[date] ?? 0,
    expense:           expMap[date]  ?? 0,
  }))
}

const C = {
  membership: "hsl(24 95% 53%)",
  supplement: "#eab308",
  expense:    "#3b82f6",
}

// ── Delta badge ───────────────────────────────────────────────────────────────
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

// ── Range picker ──────────────────────────────────────────────────────────────
function RangePicker({
  range,
  onApply,
}: {
  range:    DashRange
  onApply:  (range: DashRange, customStart?: string, customEnd?: string) => void
}) {
  const [open,    setOpen]    = useState(false)
  const [customS, setCustomS] = useState("")
  const [customE, setCustomE] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const currentLabel = RANGE_OPTIONS.find(o => o.value === range)?.label ?? "Select range"

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 bg-[hsl(220_25%_11%)] border border-white/10 text-white/80 rounded-xl px-3.5 h-10 text-sm hover:border-primary/40 transition-colors focus:outline-none"
      >
        <Calendar className="w-3.5 h-3.5 text-white/40 shrink-0" />
        <span className="truncate max-w-40">{currentLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/30 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-60 bg-[hsl(220_25%_10%)] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

          {/* Preset options */}
          <div className="p-1.5">
            {RANGE_OPTIONS.filter(o => o.value !== "custom").map(opt => (
              <button
                key={opt.value}
                onClick={() => { onApply(opt.value); setOpen(false) }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                  range === opt.value
                    ? "bg-primary/12 text-primary font-semibold"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Custom range */}
          <div className="border-t border-white/6 p-3">
            <p className={`text-xs font-semibold mb-2.5 ${range === "custom" ? "text-primary" : "text-white/40"}`}>
              Custom Range
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customS}
                  onChange={e => setCustomS(e.target.value)}
                  max={customE || undefined}
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/70 focus:outline-none focus:border-primary/40"
                  style={{ colorScheme: "dark" }}
                />
                <span className="text-white/20 text-xs shrink-0">→</span>
                <input
                  type="date"
                  value={customE}
                  onChange={e => setCustomE(e.target.value)}
                  min={customS || undefined}
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/70 focus:outline-none focus:border-primary/40"
                  style={{ colorScheme: "dark" }}
                />
              </div>
              <button
                disabled={!customS || !customE}
                onClick={() => { onApply("custom", customS, customE); setOpen(false) }}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-primary text-white disabled:opacity-35 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                Apply Custom Range
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

// ── Revenue chart ─────────────────────────────────────────────────────────────
function RevenueChart({ data, rangeLabel }: { data: DashboardData; rangeLabel: string }) {
  const buckets: ChartBucket[] = mergeChartData(
    data.dailyMembershipRevenue ?? [],
    data.dailySupplementRevenue ?? [],
    data.dailyExpenses          ?? []
  )
  if (!buckets.length) return null

  const max = Math.max(
    ...buckets.flatMap(b => [b.membershipRevenue, b.supplementRevenue, b.expense]),
    1
  )
  const totalMem  = buckets.reduce((s, b) => s + b.membershipRevenue, 0)
  const totalSupp = buckets.reduce((s, b) => s + b.supplementRevenue, 0)
  const totalExp  = buckets.reduce((s, b) => s + b.expense, 0)
  const net       = totalMem + totalSupp - totalExp

  const showEvery = buckets.length > 10 ? Math.ceil(buckets.length / 7) : 1

  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-white font-semibold text-sm">{rangeLabel}</p>
          <p className="text-white/35 text-xs mt-0.5">Membership · Supplements · Expenses</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {([
            { color: C.membership, label: "Membership"  },
            { color: C.supplement, label: "Supplements" },
            { color: C.expense,    label: "Expenses"    },
          ] as const).map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color, opacity: 0.85 }} />
              <span className="text-white/40 text-xs">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-0.5 h-28">
        {buckets.map((b, i) => {
          const memPct  = (b.membershipRevenue / max) * 100
          const suppPct = (b.supplementRevenue / max) * 100
          const expPct  = (b.expense           / max) * 100
          const memH  = b.membershipRevenue > 0 ? Math.max(memPct,  2) : 2
          const suppH = b.supplementRevenue > 0 ? Math.max(suppPct, 2) : 2
          const expH  = b.expense           > 0 ? Math.max(expPct,  2) : 2
          const memOp  = b.membershipRevenue > 0 ? 0.85 : 0.12
          const suppOp = b.supplementRevenue > 0 ? 0.85 : 0.12
          const expOp  = b.expense           > 0 ? 0.85 : 0.12
          return (
            <div key={i} className="flex-1 h-full flex items-end gap-px group relative min-w-0">
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none
                bg-[hsl(220_25%_13%)] border border-white/10 rounded-xl px-3 py-2 shadow-xl
                text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white/50 font-medium mb-1">{b.date}</p>
                <div className="space-y-0.5">
                  <p style={{ color: C.membership }}>Membership:  {fmt(b.membershipRevenue)}</p>
                  <p style={{ color: C.supplement }}>Supplements: {fmt(b.supplementRevenue)}</p>
                  <p style={{ color: C.expense    }}>Expenses:    {fmt(b.expense)}</p>
                </div>
                <p className="text-white/35 border-t border-white/8 mt-1.5 pt-1.5">
                  Net: <span className={b.membershipRevenue + b.supplementRevenue - b.expense >= 0 ? "text-green-400" : "text-red-400"}>
                    {fmt(b.membershipRevenue + b.supplementRevenue - b.expense)}
                  </span>
                </p>
              </div>
              <div className="flex-1 rounded-t-sm cursor-default" style={{ height: `${memH}%`, backgroundColor: C.membership, opacity: memOp, minHeight: "2px" }} />
              <div className="flex-1 rounded-t-sm cursor-default" style={{ height: `${suppH}%`, backgroundColor: C.supplement, opacity: suppOp, minHeight: "2px" }} />
              <div className="flex-1 rounded-t-sm cursor-default" style={{ height: `${expH}%`, backgroundColor: C.expense, opacity: expOp, minHeight: "2px" }} />
            </div>
          )
        })}
      </div>

      <div className="flex mt-2">
        {buckets.map((b, i) => (
          <span key={i} className="flex-1 text-center text-white/20 text-[10px] truncate">
            {i % showEvery === 0 ? b.date : ""}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 pt-3 border-t border-white/6 text-xs">
        <span className="text-white/40">Membership: <span className="font-semibold" style={{ color: C.membership }}>{fmt(totalMem)}</span></span>
        <span className="text-white/40">Supplements: <span className="font-semibold" style={{ color: C.supplement }}>{fmt(totalSupp)}</span></span>
        <span className="text-white/40">Expenses: <span className="font-semibold" style={{ color: C.expense }}>−{fmt(totalExp)}</span></span>
        <span className="text-white/40 ml-auto">Net: <span className={`font-semibold ${net >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(net)}</span></span>
      </div>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, subColor = "text-primary", highlight = false, delta,
}: {
  icon: any; label: string; value: string | number; sub: string
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OwnerDashboardPage() {
  const { profile } = useProfile()

  const [data,          setData]          = useState<DashboardData | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [refreshing,    setRefreshing]    = useState(false)
  const [gymFilter,     setGymFilter]     = useState("")
  const [range,         setRange]         = useState<DashRange>("last_30_days")
  const [appliedCustom, setAppliedCustom] = useState({ start: "", end: "" })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async (
    gid: string,
    r:   DashRange,
    silent  = false,
    cs?: string,
    ce?: string,
  ) => {
    if (!silent) { setLoading(true); setError(null) }
    else setRefreshing(true)
    try {
      const params = new URLSearchParams({ range: r })
      if (gid) params.set("gymId", gid)
      if (r === "custom" && cs && ce) {
        params.set("customStart", cs)
        params.set("customEnd",   ce)
      }
      const res  = await fetch(`/api/owner/dashboard?${params}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.detail ?? body?.error ?? `HTTP ${res.status}`)
      }
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
      setError(null)
    } catch (err: any) {
      console.error("[Dashboard]", err)
      setError(err?.message ?? "Failed to load dashboard")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load(gymFilter, range, false, appliedCustom.start, appliedCustom.end)
  }, [gymFilter, range, appliedCustom, load])

  useEffect(() => {
    timerRef.current = setInterval(
      () => load(gymFilter, range, true, appliedCustom.start, appliedCustom.end),
      5 * 60_000
    )
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [gymFilter, range, appliedCustom, load])

  function handleRangeApply(r: DashRange, cs?: string, ce?: string) {
    setRange(r)
    if (r === "custom" && cs && ce) {
      setAppliedCustom({ start: cs, end: ce })
    } else {
      setAppliedCustom({ start: "", end: "" })
    }
  }

  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const firstName = profile?.fullName?.split(" ")[0] ?? "Owner"
  const rangeLabel = RANGE_OPTIONS.find(o => o.value === range)?.label ?? range

  const QUICK_ACTIONS = [
    { label: "Add Member",    href: "/owner/members/new", icon: UserPlus,      color: "text-blue-400",   bg: "bg-blue-500/10"   },
    { label: "Attendance",    href: "/owner/attendance",  icon: CalendarCheck, color: "text-green-400",  bg: "bg-green-500/10"  },
    { label: "Workout Plans", href: "/owner/workouts",    icon: ClipboardList, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Diet Plans",    href: "/owner/diets",       icon: Apple,         color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Supplements",   href: "/owner/supplements", icon: ShoppingBag,   color: "text-green-400",  bg: "bg-green-500/10"  },
    { label: "Reports",       href: "/owner/reports",     icon: BarChart3,     color: "text-orange-400", bg: "bg-orange-500/10" },
  ]

  const Skeleton = ({ h = "h-28", n = 4, cols = "grid-cols-2 sm:grid-cols-4" }: { h?: string; n?: number; cols?: string }) => (
    <div className={`grid ${cols} gap-4`}>
      {[...Array(n)].map((_, i) => <div key={i} className={`${h} bg-white/4 rounded-2xl animate-pulse`} />)}
    </div>
  )

  const hasChartData =
    (data?.dailyMembershipRevenue?.length ?? 0) > 0 ||
    (data?.dailySupplementRevenue?.length ?? 0) > 0 ||
    (data?.dailyExpenses?.length          ?? 0) > 0

  // Previous period label (e.g. "vs prev 30d")
  function prevLabel() {
    if (!data?.prevStart || !data?.prevEnd) return ""
    const s = new Date(data.prevStart).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    const e = new Date(data.prevEnd).toLocaleDateString("en-IN",   { day: "numeric", month: "short" })
    return `vs ${s} – ${e}`
  }

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">{greeting}, {firstName} 👋</h1>
          <p className="text-white/35 text-sm mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Gym filter */}
          {!loading && (data?.gyms?.length ?? 0) > 1 && (
            <div className="relative">
              <select
                value={gymFilter}
                onChange={e => setGymFilter(e.target.value)}
                className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white/80 rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="">All Gyms</option>
                {data!.gyms.map(g => (
                  <option key={g.id} value={g.id}>{g.name}{g.city ? ` (${g.city})` : ""}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            </div>
          )}

          {/* Range picker */}
          <RangePicker range={range} onApply={handleRangeApply} />

          <button
            onClick={() => load(gymFilter, range, true, appliedCustom.start, appliedCustom.end)}
            disabled={refreshing}
            title="Refresh"
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-red-300 text-sm font-medium">Could not load dashboard</p>
            <p className="text-red-400/60 text-xs mt-0.5 truncate">{error}</p>
          </div>
          <button onClick={() => load(gymFilter, range)} className="text-red-400 text-xs hover:underline shrink-0">Retry</button>
        </div>
      )}

      {/* ── Setup CTA ──────────────────────────────────────────── */}
      {!loading && !error && data?.activeGyms === 0 && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-10 text-center space-y-4">
          <Building2 className="w-12 h-12 text-white/15 mx-auto" />
          <div>
            <h2 className="text-white font-bold text-lg">Set up your first gym</h2>
            <p className="text-white/40 text-sm mt-1">Create a gym to start adding members and tracking revenue.</p>
          </div>
          <Link href="/owner/setup"
            className="inline-flex items-center gap-2 bg-linear-to-r from-primary to-orange-400 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ── Expiry Alerts ──────────────────────────────────────── */}
      {!loading && !error && (data?.expiringToday?.length ?? 0) > 0 && (
        <div className="bg-red-500/8 border border-red-500/25 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-red-300 text-sm flex-1">
            <span className="font-semibold">Last day today: </span>
            {data!.expiringToday.join(", ")} — collect payment now.
          </p>
          <Link href="/owner/members?filter=expiring" className="text-red-400 text-xs hover:underline shrink-0">View →</Link>
        </div>
      )}
      {!loading && !error && (data?.expiringMembers3 ?? 0) > 0 && (data?.expiringToday?.length ?? 0) === 0 && (
        <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-yellow-300 text-sm flex-1">
            <span className="font-semibold">{data!.expiringMembers3} membership{data!.expiringMembers3 > 1 ? "s" : ""}</span>{" "}
            expiring in the next 3 days.
          </p>
          <Link href="/owner/members?filter=expiring" className="text-yellow-400 text-xs hover:underline shrink-0">View →</Link>
        </div>
      )}
      {!loading && !error && (data?.expiringMembers ?? 0) > 0 && (data?.expiringMembers3 ?? 0) === 0 && (
        <div className="bg-yellow-500/5 border border-yellow-500/12 rounded-2xl px-5 py-3 flex items-center gap-3">
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-500/60 shrink-0" />
          <p className="text-yellow-400/60 text-xs flex-1">
            {data!.expiringMembers} membership{data!.expiringMembers > 1 ? "s" : ""} expiring within 7 days.
          </p>
          <Link href="/owner/members?filter=expiring" className="text-yellow-500/60 text-xs hover:text-yellow-400 shrink-0">View →</Link>
        </div>
      )}

      {/* ── Today Stats ────────────────────────────────────────── */}
      {range !== "today" && (
        <div>
          <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-3">Today</p>
          {loading ? <Skeleton /> : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon={Zap}           label="Today's Revenue"  value={fmt(data?.todayRevenue ?? 0)}  sub="Membership + supplements" highlight subColor="text-primary" />
              <StatCard icon={CalendarCheck} label="Check-ins Today"  value={data?.todayAttendance ?? 0}    sub="Members in gym today"     subColor="text-green-400" />
              <StatCard icon={UserPlus}      label="New Members"      value={data?.todayNewMembers ?? 0}    sub="Joined today"             subColor="text-blue-400" />
              <StatCard icon={TrendingDown}  label="Today's Expenses" value={fmt(data?.todayExpenses ?? 0)} sub="Operational costs"        subColor="text-red-400" />
            </div>
          )}
        </div>
      )}

      {/* ── Range Stats ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-wider">{rangeLabel}</p>
          {!loading && data?.prevStart && (
            <p className="text-white/20 text-xs">{prevLabel()}</p>
          )}
        </div>
        {loading ? <Skeleton n={6} cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              icon={Users}
              label="Active Members"
              value={data?.totalMembers ?? 0}
              sub={`Across ${data?.activeGyms ?? 0} gyms`}
            />
            <StatCard
              icon={UserPlus}
              label="New Joinings"
              value={data?.rangeNewMembers ?? 0}
              sub={rangeLabel}
              subColor="text-blue-400"
              delta={computeDelta(data?.rangeNewMembers ?? 0, data?.prevNewMembers ?? 0)}
            />
            <StatCard
              icon={CreditCard}
              label="Membership Revenue"
              value={fmt(data?.rangeRevenue ?? 0)}
              sub={rangeLabel}
              subColor="text-primary"
              delta={computeDelta(data?.rangeRevenue ?? 0, data?.prevRevenue ?? 0)}
            />
            <StatCard
              icon={ShoppingBag}
              label="Supplement Revenue"
              value={fmt(data?.rangeSupplementRevenue ?? 0)}
              sub={rangeLabel}
              subColor="text-green-400"
              delta={computeDelta(data?.rangeSupplementRevenue ?? 0, data?.prevSuppRevenue ?? 0)}
            />
            <StatCard
              icon={TrendingDown}
              label="Total Expenses"
              value={fmt(data?.rangeExpenses ?? 0)}
              sub={rangeLabel}
              subColor="text-red-400"
              delta={computeDelta(data?.rangeExpenses ?? 0, data?.prevExpenses ?? 0)}
            />
            <StatCard
              icon={TrendingUp}
              label="Net Revenue"
              value={fmt(data?.netRevenue ?? 0)}
              sub="Revenue − Expenses"
              subColor={(data?.netRevenue ?? 0) >= 0 ? "text-green-400" : "text-red-400"}
              delta={computeDelta(data?.netRevenue ?? 0, data?.prevNetRevenue ?? 0)}
            />
          </div>
        )}
      </div>

      {/* ── Chart ──────────────────────────────────────────────── */}
      {!loading && !error && hasChartData && (
        <RevenueChart data={data!} rangeLabel={rangeLabel} />
      )}

      {/* ── Quick Actions ──────────────────────────────────────── */}
      <div>
        <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(a => (
            <Link key={a.label} href={a.href}
              className="flex flex-col items-center gap-2.5 p-4 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl hover:border-white/15 transition-all group text-center">
              <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center`}>
                <a.icon className={`w-5 h-5 ${a.color}`} />
              </div>
              <span className="text-white/60 text-xs font-medium group-hover:text-white transition-colors leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Two-column: Members + Check-ins ────────────────────── */}
      {!error && (
        <div className="grid lg:grid-cols-2 gap-5">

          {/* Recent Members */}
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">Recent Members</h3>
              <Link href="/owner/members" className="text-primary text-xs hover:text-primary/80 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-11 bg-white/3 rounded-xl animate-pulse" />)}</div>
            ) : (data?.recentMembers?.length ?? 0) === 0 ? (
              <div className="text-center py-10">
                <Users className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-white/30 text-sm">No members yet</p>
                <Link href="/owner/members/new" className="text-primary text-xs mt-1 inline-block hover:underline">Add your first →</Link>
              </div>
            ) : (
              <div className="space-y-0.5">
                {data!.recentMembers.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/3 transition-colors">
                    <Avatar name={m.profile.fullName} url={m.profile.avatarUrl} size={34} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{m.profile.fullName}</p>
                      <p className="text-white/35 text-xs">{m.gym.name} · {timeAgo(m.createdAt)}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      m.status === "ACTIVE" ? "bg-green-500/15 text-green-400" : "bg-white/8 text-white/40"
                    }`}>{m.status === "ACTIVE" ? "Active" : m.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Check-ins */}
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">Today&apos;s Check-ins</h3>
              <Link href="/owner/attendance" className="text-primary text-xs hover:text-primary/80 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-11 bg-white/3 rounded-xl animate-pulse" />)}</div>
            ) : (data?.todayCheckins?.length ?? 0) === 0 ? (
              <div className="text-center py-10">
                <CalendarCheck className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-white/30 text-sm">No check-ins today yet</p>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-4xl font-display font-bold text-primary">{data!.todayAttendance}</span>
                  <span className="text-white/30 text-sm">check-ins today</span>
                </div>
                <div className="space-y-0.5">
                  {data!.todayCheckins.slice(0, 5).map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/3 transition-colors">
                      <Avatar name={c.member.profile.fullName} url={c.member.profile.avatarUrl} size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{c.member.profile.fullName}</p>
                        <p className="text-white/35 text-xs">
                          {new Date(c.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${c.checkOutTime ? "bg-white/15" : "bg-green-400"}`} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Recent Expenses ────────────────────────────────────── */}
      {!loading && !error && (data?.recentExpenses?.length ?? 0) > 0 && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt size={16} className="text-red-400" />
              <p className="text-white font-semibold text-sm">Recent Expenses</p>
            </div>
            <a href="/owner/expenses" className="text-primary text-xs hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </a>
          </div>
          <div className="space-y-0.5">
            {data!.recentExpenses.map(e => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <Receipt className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">{e.title}</p>
                    <p className="text-white/30 text-xs">
                      {e.gym?.name} · {e.category} · {new Date(e.expenseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
                <span className="text-red-400 font-semibold text-sm shrink-0">−{fmt(e.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Supplement Sales ────────────────────────────── */}
      {!loading && !error && (data?.recentSupplementSales?.length ?? 0) > 0 && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-green-400" />
              <h3 className="text-white font-semibold text-sm">Recent Supplement Sales</h3>
            </div>
            <Link href="/owner/supplements" className="text-primary text-xs hover:text-primary/80 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {data!.recentSupplementSales.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/4">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{s.supplement.name}</p>
                  <p className="text-white/35 text-[11px]">
                    {s.member?.profile.fullName ?? s.memberName ?? "Walk-in"} · {s.qty}×
                  </p>
                </div>
                <p className="text-green-400 text-xs font-semibold shrink-0">
                  ₹{Number(s.totalAmount).toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

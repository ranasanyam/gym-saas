

// // src/app/owner/reports/page.tsx
// "use client"

// import { useEffect, useState, useCallback } from "react"
// import { PageHeader } from "@/components/owner/PageHeader"
// import { TrendingUp, Users, CreditCard, CalendarCheck, ShoppingBag, Loader2, Download, ChevronDown } from "lucide-react"

// interface ReportData {
//   revenue: { month: string; revenue: number; membershipRev: number; supplementRev: number }[]
//   memberGrowth: { month: string; members: number }[]
//   topGyms: { name: string; members: number; revenue: number; membershipRev: number; supplementRev: number; attendance: number }[]
//   summary: { totalMembers: number; totalRevenue: number; membershipRevenue: number; supplementRevenue: number; totalAttendance: number }
// }

// function fmt(n: number) {
//   if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`
//   if (n >= 1000)   return `₹${(n/1000).toFixed(1)}K`
//   return `₹${n.toLocaleString("en-IN")}`
// }

// type SegmentKey = "revenue" | "membershipRev" | "supplementRev"

// function BarChart({ data, keys,  height = 80 }: {
//   data: any[]; keys: { key: string; color: string; label: string }[]; height?: number
// }) {
//   const max = Math.max(...data.map(d => keys.reduce((s, k) => s + (d[k.key] ?? 0), 0)), 1)
//   return (
//     <div className="flex items-end gap-2" style={{ height }}>
//       {data.map((d, i) => {
//         const total = keys.reduce((s, k) => s + (d[k.key] ?? 0), 0)
//         return (
//           <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
//             {/* Tooltip */}
//             <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-[hsl(220_25%_14%)] border border-white/10 rounded-xl px-3 py-2 z-10 whitespace-nowrap shadow-xl">
//               <p className="text-white text-xs font-medium">{d.month ?? d.name}</p>
//               {keys.map(k => (
//                 <p key={k.key} className="text-xs" style={{ color: k.color }}>{k.label}: {fmt(d[k.key] ?? 0)}</p>
//               ))}
//             </div>
//             {/* Stacked bars */}
//             <div className="w-full flex flex-col-reverse rounded-t-sm overflow-hidden" style={{ height: `${(total / max) * (height - 20)}px`, minHeight: total > 0 ? "3px" : "2px" }}>
//               {keys.map(k => {
//                 const h = total > 0 ? ((d[k.key] ?? 0) / total) * 100 : 0
//                 return <div key={k.key} style={{ height: `${h}%`, background: k.color, minHeight: (d[k.key] ?? 0) > 0 ? "2px" : "0" }} />
//               })}
//             </div>
//             <span className="text-white/30 text-[10px]">{d.month ?? d.name?.slice(0, 8)}</span>
//           </div>
//         )
//       })}
//     </div>
//   )
// }

// function LineChart({ data, valueKey, color }: { data: any[]; valueKey: string; color: string }) {
//   const max = Math.max(...data.map(d => d[valueKey]), 1)
//   const H = 64, W_UNIT = 100 / Math.max(data.length - 1, 1)
//   const pts = data.map((d, i) => ({ x: i * W_UNIT, y: H - (d[valueKey] / max) * (H - 8) }))
//   const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")

//   return (
//     <div className="relative h-20">
//       <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className="w-full h-full">
//         <defs>
//           <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
//             <stop offset="0%" stopColor={color} stopOpacity="0.3" />
//             <stop offset="100%" stopColor={color} stopOpacity="0" />
//           </linearGradient>
//         </defs>
//         <path d={`${path} L ${pts[pts.length-1].x} ${H} L 0 ${H} Z`} fill="url(#lg)" />
//         <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
//         {pts.map((p, i) => (
//           <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={color} />
//         ))}
//       </svg>
//       <div className="absolute bottom-0 left-0 right-0 flex justify-between">
//         {data.map((d, i) => <span key={i} className="text-[9px] text-white/25 flex-1 text-center">{d.month}</span>)}
//       </div>
//     </div>
//   )
// }

// export default function ReportsPage() {
//   const [data,    setData]    = useState<ReportData | null>(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     fetch("/api/owner/reports").then(r => r.json()).then(setData).finally(() => setLoading(false))
//   }, [])

//   if (loading) return (
//     <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
//   )

//   const s = data?.summary

//   const revenueKeys = [
//     { key: "membershipRev", color: "hsl(24 95% 53%)",  label: "Membership" },
//     { key: "supplementRev", color: "hsl(142 72% 50%)", label: "Supplements" },
//   ]

//   return (
//     <div className="max-w-6xl space-y-6">
//       <PageHeader title="Reports & Analytics" subtitle="Performance overview for the last 6 months" />

//       {/* Summary cards */}
//       <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
//         {[
//           { icon: Users,       label: "Active Members",      value: s?.totalMembers ?? 0,         fmt: (n: number) => n.toLocaleString("en-IN"), color: "text-blue-400",   bg: "bg-blue-500/10" },
//           { icon: CreditCard,  label: "Membership Revenue",  value: s?.membershipRevenue ?? 0,    fmt, color: "text-primary",    bg: "bg-primary/10" },
//           { icon: ShoppingBag, label: "Supplement Revenue",  value: s?.supplementRevenue ?? 0,    fmt, color: "text-green-400",  bg: "bg-green-500/10" },
//           { icon: CalendarCheck, label: "Attendance (Month)",  value: s?.totalAttendance ?? 0,    fmt: (n: number) => n.toLocaleString("en-IN"), color: "text-purple-400", bg: "bg-purple-500/10" },
//         ].map(({ icon: Icon, label, value, fmt: f, color, bg }) => (
//           <div key={label} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
//             <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
//               <Icon className={`w-4 h-4 ${color}`} />
//             </div>
//             <p className={`text-2xl font-display font-bold ${color}`}>{f(value)}</p>
//             <p className="text-white/40 text-xs mt-0.5">{label}</p>
//           </div>
//         ))}
//       </div>

//       {/* Total revenue banner */}
//       <div className="bg-linear-to-r from-primary/15 to-transparent border border-primary/20 rounded-2xl px-5 py-4 flex items-center justify-between">
//         <div>
//           <p className="text-white/50 text-xs uppercase tracking-wider">Total Revenue This Month</p>
//           <p className="text-3xl font-display font-bold text-primary mt-0.5">{fmt(s?.totalRevenue ?? 0)}</p>
//         </div>
//         <div className="flex items-center gap-4 text-xs">
//           {revenueKeys.map(k => (
//             <div key={k.key} className="flex items-center gap-1.5">
//               <div className="w-2.5 h-2.5 rounded-sm" style={{ background: k.color }} />
//               <span className="text-white/50">{k.label}</span>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Charts row */}
//       <div className="grid lg:grid-cols-2 gap-5">
//         {/* Revenue chart (stacked) */}
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
//           <div className="flex items-center justify-between mb-4">
//             <div>
//               <h3 className="text-white font-semibold text-sm">Monthly Revenue</h3>
//               <p className="text-white/35 text-xs mt-0.5">Membership + Supplement (last 6 months)</p>
//             </div>
//             <div className="flex items-center gap-3">
//               {revenueKeys.map(k => (
//                 <div key={k.key} className="flex items-center gap-1.5">
//                   <div className="w-2 h-2 rounded-sm" style={{ background: k.color }} />
//                   <span className="text-white/40 text-[10px]">{k.label}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//           <BarChart data={data?.revenue ?? []} keys={revenueKeys} height={100} />
//         </div>

//         {/* Member growth */}
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
//           <div className="mb-4">
//             <h3 className="text-white font-semibold text-sm">New Members</h3>
//             <p className="text-white/35 text-xs mt-0.5">Monthly new member joins (last 6 months)</p>
//           </div>
//           <LineChart data={data?.memberGrowth ?? []} valueKey="members" color="hsl(24 95% 53%)" />
//         </div>
//       </div>

//       {/* Per-gym breakdown */}
//       {(data?.topGyms?.length ?? 0) > 0 && (
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
//           <div className="px-5 py-4 border-b border-white/5">
//             <h3 className="text-white font-semibold text-sm">Per-Gym Breakdown</h3>
//             <p className="text-white/35 text-xs mt-0.5">Current month performance by gym</p>
//           </div>
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="border-b border-white/5">
//                   {["Gym", "Members", "Attendance", "Membership Rev", "Supplement Rev", "Total"].map(h => (
//                     <th key={h} className="px-5 py-3 text-left text-white/30 text-xs font-medium">{h}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-white/4">
//                 {data!.topGyms.map((g, i) => (
//                   <tr key={i} className="hover:bg-white/2 transition-colors">
//                     <td className="px-5 py-3.5 text-white font-medium">{g.name}</td>
//                     <td className="px-5 py-3.5 text-white/60">{g.members.toLocaleString("en-IN")}</td>
//                     <td className="px-5 py-3.5 text-white/60">{g.attendance.toLocaleString("en-IN")}</td>
//                     <td className="px-5 py-3.5 text-primary">{fmt(g.membershipRev)}</td>
//                     <td className="px-5 py-3.5 text-green-400">{fmt(g.supplementRev)}</td>
//                     <td className="px-5 py-3.5 text-white font-semibold">{fmt(g.revenue)}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }


// src/app/owner/reports/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { PageHeader } from "@/components/owner/PageHeader"
import {
  TrendingUp, Users, CreditCard, CalendarCheck, ShoppingBag,
  Loader2, ChevronDown, UserPlus
} from "lucide-react"

const RANGES = [
  { value: "today",         label: "Today" },
  { value: "this_week",     label: "This Week" },
  { value: "last_week",     label: "Last Week" },
  { value: "this_month",    label: "This Month" },
  { value: "last_month",    label: "Last Month" },
  { value: "last_quarter",  label: "Last Quarter" },
  { value: "last_6_months", label: "Last 6 Months" },
  { value: "last_year",     label: "Last Year" },
  { value: "all",           label: "All Time" },
]

interface ReportData {
  revenue:     { month: string; revenue: number; membershipRev: number; supplementRev: number }[]
  memberGrowth:{ month: string; members: number }[]
  topGyms:     { name: string; members: number; newMembers: number; revenue: number; membershipRev: number; supplementRev: number; attendance: number }[]
  summary:     { totalMembers: number; newMembers: number; totalRevenue: number; membershipRevenue: number; supplementRevenue: number; totalAttendance: number }
  range:       string
  dateRange?:  { start: string; end: string }
}

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toLocaleString("en-IN")}`
}

function StackedBar({ data, height = 100 }: { data: ReportData["revenue"]; height?: number }) {
  const max = Math.max(...data.map(d => d.revenue), 1)
  const MEM_COLOR  = "hsl(24 95% 53%)"
  const SUPP_COLOR = "hsl(142 72% 50%)"

  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const mH = d.revenue > 0 ? (d.membershipRev / max) * (height - 24) : 0
        const sH = d.revenue > 0 ? (d.supplementRev / max) * (height - 24) : 0
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap pointer-events-none">
              <div className="bg-[hsl(220_25%_14%)] border border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs">
                <p className="text-white font-medium mb-1">{d.month}</p>
                <p style={{ color: MEM_COLOR  }}>Membership: {fmt(d.membershipRev)}</p>
                <p style={{ color: SUPP_COLOR }}>Supplements: {fmt(d.supplementRev)}</p>
                <p className="text-white font-semibold mt-1 border-t border-white/10 pt-1">Total: {fmt(d.revenue)}</p>
              </div>
            </div>
            {/* Stacked bars */}
            <div className="w-full flex flex-col-reverse rounded-t-sm overflow-hidden" style={{ minHeight: d.revenue > 0 ? "3px" : "2px" }}>
              <div style={{ height: `${Math.max(mH, d.membershipRev > 0 ? 2 : 0)}px`, background: MEM_COLOR }} />
              <div style={{ height: `${Math.max(sH, d.supplementRev > 0 ? 2 : 0)}px`, background: SUPP_COLOR }} />
            </div>
            <span className="text-white/25 text-[9px] truncate w-full text-center">{d.month}</span>
          </div>
        )
      })}
    </div>
  )
}

function LineChart({ data, valueKey, color }: { data: any[]; valueKey: string; color: string }) {
  if (data.length < 2) return (
    <div className="h-20 flex items-center justify-center text-white/20 text-xs">Not enough data</div>
  )
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  const H   = 60
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: H - (d[valueKey] / max) * (H - 6),
  }))
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")

  return (
    <div className="relative h-20">
      <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L 100 ${H} L 0 ${H} Z`} fill="url(#lineFill)" />
        <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={color} />)}
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between">
        {data
          .filter((_, i) => data.length <= 12 || i % Math.ceil(data.length / 8) === 0)
          .map((d, i) => (
            <span key={i} className="text-[9px] text-white/25">{d.month}</span>
          ))}
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const [data,    setData]    = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [range,   setRange]   = useState("last_6_months")
  const [gymId,   setGymId]   = useState("")
  const [gyms,    setGyms]    = useState<{ id: string; name: string }[]>([])

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ range })
    if (gymId) params.set("gymId", gymId)
    fetch(`/api/owner/reports?${params}`)
      .then(r => r.json())
      .then(d => { setData(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [range, gymId])

  useEffect(() => {
    fetch("/api/owner/gyms")
      .then(r => r.json())
      .then(g => { if (Array.isArray(g)) setGyms(g) })
      .catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  const rangeLabel = RANGES.find(r => r.value === range)?.label ?? "Last 6 Months"
  const s = data?.summary

  return (
    <div className="max-w-6xl space-y-6">
      <PageHeader title="Reports & Analytics" subtitle="Track your gym's performance" />

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date range */}
        <div className="relative">
          <select
            value={range}
            onChange={e => setRange(e.target.value)}
            className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none focus:border-primary cursor-pointer"
          >
            {RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
        </div>

        {/* Gym filter */}
        {gyms.length > 1 && (
          <div className="relative">
            <select
              value={gymId}
              onChange={e => setGymId(e.target.value)}
              className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white/70 rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">All Gyms</option>
              {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>
        )}

        {loading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}

        {data?.dateRange && (
          <p className="text-white/25 text-xs ml-auto">
            {new Date(data.dateRange.start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            {" — "}
            {new Date(data.dateRange.end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}
      </div>

      {/* ── Summary cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { icon: Users,         label: "Active Members",  value: s?.totalMembers ?? 0,        f: (n: number) => n.toString(), color: "text-blue-400",   bg: "bg-blue-500/10" },
          { icon: UserPlus,      label: "New Members",     value: s?.newMembers ?? 0,           f: (n: number) => n.toString(), color: "text-green-400",  bg: "bg-green-500/10" },
          { icon: CreditCard,    label: "Membership Rev",  value: s?.membershipRevenue ?? 0,   f: fmt,                         color: "text-primary",    bg: "bg-primary/10" },
          { icon: ShoppingBag,   label: "Supplement Rev",  value: s?.supplementRevenue ?? 0,   f: fmt,                         color: "text-green-400",  bg: "bg-green-500/10" },
          { icon: TrendingUp,    label: "Total Revenue",   value: s?.totalRevenue ?? 0,         f: fmt,                         color: "text-white",      bg: "bg-white/8" },
          { icon: CalendarCheck, label: "Attendance",      value: s?.totalAttendance ?? 0,      f: (n: number) => n.toString(), color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map(({ icon: Icon, label, value, f, color, bg }) => (
          <div key={label} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4">
            <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-xl font-display font-bold ${color}`}>{loading ? "—" : f(value)}</p>
            <p className="text-white/35 text-xs mt-0.5">{label}</p>
            <p className="text-white/20 text-[10px] mt-0.5">{rangeLabel}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ──────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Revenue breakdown */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-sm">Revenue Breakdown</h3>
              <p className="text-white/35 text-xs mt-0.5">{rangeLabel}</p>
            </div>
            <div className="flex items-center gap-3">
              {[
                ["hsl(24 95% 53%)",  "Membership"],
                ["hsl(142 72% 50%)", "Supplements"],
              ].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
                  <span className="text-white/35 text-[10px]">{label}</span>
                </div>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="h-24 bg-white/3 rounded-xl animate-pulse" />
          ) : (data?.revenue.length ?? 0) === 0 ? (
            <div className="h-24 flex items-center justify-center text-white/20 text-sm">No data for this period</div>
          ) : (
            <StackedBar data={data!.revenue} height={110} />
          )}
        </div>

        {/* Member growth */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="mb-4">
            <h3 className="text-white font-semibold text-sm">New Members</h3>
            <p className="text-white/35 text-xs mt-0.5">{rangeLabel}</p>
          </div>
          {loading ? (
            <div className="h-20 bg-white/3 rounded-xl animate-pulse" />
          ) : (
            <LineChart
              data={data?.memberGrowth ?? []}
              valueKey="members"
              color="hsl(24 95% 53%)"
            />
          )}
        </div>
      </div>

      {/* ── Per-gym table ───────────────────────────────────────── */}
      {(data?.topGyms?.length ?? 0) > 0 && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-white font-semibold text-sm">Per-Gym Breakdown</h3>
            <p className="text-white/35 text-xs mt-0.5">{rangeLabel}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["Gym", "Active Members", "New Members", "Attendance", "Membership Rev", "Supplement Rev", "Total"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-white/30 text-xs font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {data!.topGyms.map((g, i) => (
                  <tr key={i} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3.5 text-white font-medium">{g.name}</td>
                    <td className="px-5 py-3.5 text-white/60">{g.members}</td>
                    <td className="px-5 py-3.5 text-green-400">+{g.newMembers}</td>
                    <td className="px-5 py-3.5 text-white/60">{g.attendance}</td>
                    <td className="px-5 py-3.5 text-primary">{fmt(g.membershipRev)}</td>
                    <td className="px-5 py-3.5 text-green-400">{fmt(g.supplementRev)}</td>
                    <td className="px-5 py-3.5 text-white font-semibold">{fmt(g.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
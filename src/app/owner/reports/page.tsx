
// // src/app/owner/reports/page.tsx
// "use client"

// import { useEffect, useState, useCallback } from "react"
// import { useSubscription } from "@/contexts/SubscriptionContext"
// import { PlanGate, UpgradeButton } from "@/components/owner/PlanGate"
// import { PageHeader } from "@/components/owner/PageHeader"
// import {
//   TrendingUp, Users, CreditCard, CalendarCheck, ShoppingBag,
//   Loader2, ChevronDown, UserPlus
// } from "lucide-react"

// const RANGES = [
//   { value: "today", label: "Today" },
//   { value: "this_week", label: "This Week" },
//   { value: "last_week", label: "Last Week" },
//   { value: "this_month", label: "This Month" },
//   { value: "last_month", label: "Last Month" },
//   { value: "last_quarter", label: "Last Quarter" },
//   { value: "last_6_months", label: "Last 6 Months" },
//   { value: "last_year", label: "Last Year" },
//   { value: "all", label: "All Time" },
// ]

// interface ReportData {
//   revenue: { month: string; revenue: number; membershipRev: number; supplementRev: number }[]
//   memberGrowth: { month: string; members: number }[]
//   topGyms: { name: string; members: number; newMembers: number; revenue: number; membershipRev: number; supplementRev: number; attendance: number }[]
//   summary: { totalMembers: number; newMembers: number; totalRevenue: number; membershipRevenue: number; supplementRevenue: number; totalAttendance: number }
//   range: string
//   dateRange?: { start: string; end: string }
// }

// function fmt(n: number) {
//   if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
//   if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
//   return `₹${n.toLocaleString("en-IN")}`
// }

// function StackedBar({ data, height = 110 }: { data: ReportData["revenue"]; height?: number }) {
//   const max = Math.max(...data.map(d => d.revenue), 1)
//   const MEM_COLOR = "hsl(24 95% 53%)"
//   const SUPP_COLOR = "hsl(142 72% 50%)"
//   return (
//     <div className="flex items-end gap-1.5" style={{ height }}>
//       {data.map((d, i) => {
//         const mH = d.revenue > 0 ? (d.membershipRev / max) * (height - 24) : 0
//         const sH = d.revenue > 0 ? (d.supplementRev / max) * (height - 24) : 0
//         return (
//           <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
//             <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap pointer-events-none">
//               <div className="bg-[hsl(220_25%_14%)] border border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs">
//                 <p className="text-white font-medium mb-1">{d.month}</p>
//                 <p style={{ color: MEM_COLOR }}>Membership: {fmt(d.membershipRev)}</p>
//                 <p style={{ color: SUPP_COLOR }}>Supplements: {fmt(d.supplementRev)}</p>
//                 <p className="text-white font-semibold mt-1 border-t border-white/10 pt-1">Total: {fmt(d.revenue)}</p>
//               </div>
//             </div>
//             <div className="w-full flex flex-col-reverse rounded-t-sm overflow-hidden" style={{ minHeight: d.revenue > 0 ? "3px" : "2px" }}>
//               <div style={{ height: `${Math.max(mH, d.membershipRev > 0 ? 2 : 0)}px`, background: MEM_COLOR }} />
//               <div style={{ height: `${Math.max(sH, d.supplementRev > 0 ? 2 : 0)}px`, background: SUPP_COLOR }} />
//             </div>
//             <span className="text-white/25 text-[9px] truncate w-full text-center">{d.month}</span>
//           </div>
//         )
//       })}
//     </div>
//   )
// }

// function LineChart({ data, valueKey, color }: { data: any[]; valueKey: string; color: string }) {
//   if (data.length < 2) return (
//     <div className="h-20 flex items-center justify-center text-white/20 text-xs">Not enough data</div>
//   )
//   const max = Math.max(...data.map(d => d[valueKey]), 1)
//   const H = 60
//   const pts = data.map((d, i) => ({ x: (i / (data.length - 1)) * 100, y: H - (d[valueKey] / max) * (H - 6) }))
//   const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
//   return (
//     <div className="relative h-20">
//       <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className="w-full h-full">
//         <defs>
//           <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
//             <stop offset="0%" stopColor={color} stopOpacity="0.25" />
//             <stop offset="100%" stopColor={color} stopOpacity="0" />
//           </linearGradient>
//         </defs>
//         <path d={`${path} L 100 ${H} L 0 ${H} Z`} fill="url(#lineFill)" />
//         <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
//         {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={color} />)}
//       </svg>
//     </div>
//   )
// }

// function ReportsContent() {
//   const [data, setData] = useState<ReportData | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [range, setRange] = useState("last_6_months")
//   const [gymId, setGymId] = useState("")
//   const [gyms, setGyms] = useState<{ id: string; name: string }[]>([])

//   const load = useCallback(() => {
//     setLoading(true)
//     const params = new URLSearchParams({ range })
//     if (gymId) params.set("gymId", gymId)
//     fetch(`/api/owner/reports?${params}`)
//       .then(r => r.json())
//       .then(d => { if (!d.upgradeRequired) setData(d) })
//       .catch(console.error)
//       .finally(() => setLoading(false))
//   }, [range, gymId])

//   useEffect(() => {
//     fetch("/api/owner/gyms").then(r => r.json()).then(g => { if (Array.isArray(g)) setGyms(g) }).catch(() => { })
//   }, [])
//   useEffect(() => { load() }, [load])

//   const rangeLabel = RANGES.find(r => r.value === range)?.label ?? "Last 6 Months"
//   const s = data?.summary

//   return (
//     <div className="space-y-6">
//       {/* Filters */}
//       <div className="flex flex-wrap items-center gap-3">
//         <div className="relative">
//           <select value={range} onChange={e => setRange(e.target.value)}
//             className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none focus:border-primary cursor-pointer">
//             {RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
//           </select>
//           <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
//         </div>
//         {gyms.length > 1 && (
//           <div className="relative">
//             <select value={gymId} onChange={e => setGymId(e.target.value)}
//               className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white/70 rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none focus:border-primary cursor-pointer">
//               <option value="">All Gyms</option>
//               {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
//             </select>
//             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
//           </div>
//         )}
//         {loading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
//         {data?.dateRange && (
//           <p className="text-white/25 text-xs ml-auto">
//             {new Date(data.dateRange.start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
//             {" — "}
//             {new Date(data.dateRange.end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
//           </p>
//         )}
//       </div>

//       {/* Summary cards */}
//       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
//         {[
//           { icon: Users, label: "Active Members", value: s?.totalMembers ?? 0, f: (n: number) => n.toString(), color: "text-blue-400", bg: "bg-blue-500/10" },
//           { icon: UserPlus, label: "New Members", value: s?.newMembers ?? 0, f: (n: number) => n.toString(), color: "text-green-400", bg: "bg-green-500/10" },
//           { icon: CreditCard, label: "Membership Rev", value: s?.membershipRevenue ?? 0, f: fmt, color: "text-primary", bg: "bg-primary/10" },
//           { icon: ShoppingBag, label: "Supplement Rev", value: s?.supplementRevenue ?? 0, f: fmt, color: "text-green-400", bg: "bg-green-500/10" },
//           { icon: TrendingUp, label: "Total Revenue", value: s?.totalRevenue ?? 0, f: fmt, color: "text-white", bg: "bg-white/8" },
//           { icon: CalendarCheck, label: "Attendance", value: s?.totalAttendance ?? 0, f: (n: number) => n.toString(), color: "text-purple-400", bg: "bg-purple-500/10" },
//         ].map(({ icon: Icon, label, value, f, color, bg }) => (
//           <div key={label} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4">
//             <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
//               <Icon className={`w-4 h-4 ${color}`} />
//             </div>
//             <p className={`text-xl font-display font-bold ${color}`}>{loading ? "—" : f(value)}</p>
//             <p className="text-white/35 text-xs mt-0.5">{label}</p>
//             <p className="text-white/20 text-[10px] mt-0.5">{rangeLabel}</p>
//           </div>
//         ))}
//       </div>

//       {/* Charts */}
//       <div className="grid lg:grid-cols-2 gap-5">
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
//           <div className="flex items-center justify-between mb-4">
//             <div>
//               <h3 className="text-white font-semibold text-sm">Revenue Breakdown</h3>
//               <p className="text-white/35 text-xs mt-0.5">{rangeLabel}</p>
//             </div>
//             <div className="flex items-center gap-3">
//               {[["hsl(24 95% 53%)", "Membership"], ["hsl(142 72% 50%)", "Supplements"]].map(([color, label]) => (
//                 <div key={label} className="flex items-center gap-1.5">
//                   <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
//                   <span className="text-white/35 text-[10px]">{label}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//           {loading ? <div className="h-24 bg-white/3 rounded-xl animate-pulse" /> :
//             (data?.revenue.length ?? 0) === 0 ? <div className="h-24 flex items-center justify-center text-white/20 text-sm">No data for this period</div> :
//               <StackedBar data={data!.revenue} />}
//         </div>
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
//           <div className="mb-4">
//             <h3 className="text-white font-semibold text-sm">New Members</h3>
//             <p className="text-white/35 text-xs mt-0.5">{rangeLabel}</p>
//           </div>
//           {loading ? <div className="h-20 bg-white/3 rounded-xl animate-pulse" /> :
//             <LineChart data={data?.memberGrowth ?? []} valueKey="members" color="hsl(24 95% 53%)" />}
//         </div>
//       </div>

//       {/* Per-gym table */}
//       {(data?.topGyms?.length ?? 0) > 0 && (
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
//           <div className="px-5 py-4 border-b border-white/5">
//             <h3 className="text-white font-semibold text-sm">Per-Gym Breakdown</h3>
//             <p className="text-white/35 text-xs mt-0.5">{rangeLabel}</p>
//           </div>
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="border-b border-white/5">
//                   {["Gym", "Active Members", "New Members", "Attendance", "Membership Rev", "Supplement Rev", "Total"].map(h => (
//                     <th key={h} className="px-5 py-3 text-left text-white/30 text-xs font-medium whitespace-nowrap">{h}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-white/4">
//                 {data!.topGyms.map((g, i) => (
//                   <tr key={i} className="hover:bg-white/2 transition-colors">
//                     <td className="px-5 py-3.5 text-white font-medium">{g.name}</td>
//                     <td className="px-5 py-3.5 text-white/60">{g.members}</td>
//                     <td className="px-5 py-3.5 text-green-400">+{g.newMembers}</td>
//                     <td className="px-5 py-3.5 text-white/60">{g.attendance}</td>
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

// export default function ReportsPage() {
//   const { hasFullReports, isExpired } = useSubscription()

//   return (
//     <div className="max-w-6xl space-y-6">
//       <PageHeader title="Reports & Analytics" subtitle="Track your gym's performance" />
//       <PlanGate allowed={hasFullReports && !isExpired} featureLabel="Full Reports & Analytics">
//         <ReportsContent />
//       </PlanGate>
//     </div>
//   )
// }


// src/app/owner/reports/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { PlanGate, UpgradeButton } from "@/components/owner/PlanGate"
import { PageHeader } from "@/components/owner/PageHeader"
import {
  TrendingUp, TrendingDown, Users, CreditCard, CalendarCheck, ShoppingBag,
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
  summary:     { totalMembers: number; newMembers: number; totalRevenue: number; membershipRevenue: number; supplementRevenue: number; totalAttendance: number; totalExpenses: number; netRevenue: number }
  range:       string
  dateRange?:  { start: string; end: string }
}

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toLocaleString("en-IN")}`
}

function StackedBar({ data, height = 110 }: { data: ReportData["revenue"]; height?: number }) {
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
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap pointer-events-none">
              <div className="bg-[hsl(220_25%_14%)] border border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs">
                <p className="text-white font-medium mb-1">{d.month}</p>
                <p style={{ color: MEM_COLOR  }}>Membership: {fmt(d.membershipRev)}</p>
                <p style={{ color: SUPP_COLOR }}>Supplements: {fmt(d.supplementRev)}</p>
                <p className="text-white font-semibold mt-1 border-t border-white/10 pt-1">Total: {fmt(d.revenue)}</p>
              </div>
            </div>
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
  const pts = data.map((d, i) => ({ x: (i / (data.length - 1)) * 100, y: H - (d[valueKey] / max) * (H - 6) }))
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
    </div>
  )
}

function ReportsContent() {
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
      .then(d => { if (!d.upgradeRequired) setData(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [range, gymId])

  useEffect(() => {
    fetch("/api/owner/gyms").then(r => r.json()).then(g => { if (Array.isArray(g)) setGyms(g) }).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  const rangeLabel = RANGES.find(r => r.value === range)?.label ?? "Last 6 Months"
  const s = data?.summary

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select value={range} onChange={e => setRange(e.target.value)}
            className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none focus:border-primary cursor-pointer">
            {RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
        </div>
        {gyms.length > 1 && (
          <div className="relative">
            <select value={gymId} onChange={e => setGymId(e.target.value)}
              className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white/70 rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none focus:border-primary cursor-pointer">
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

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { icon: Users,         label: "Active Members",  value: s?.totalMembers ?? 0,       f: (n: number) => n.toString(), color: "text-blue-400",   bg: "bg-blue-500/10" },
          { icon: UserPlus,      label: "New Members",     value: s?.newMembers ?? 0,          f: (n: number) => n.toString(), color: "text-green-400",  bg: "bg-green-500/10" },
          { icon: CreditCard,    label: "Membership Rev",  value: s?.membershipRevenue ?? 0,  f: fmt,                         color: "text-primary",    bg: "bg-primary/10" },
          { icon: ShoppingBag,   label: "Supplement Rev",  value: s?.supplementRevenue ?? 0,  f: fmt,                         color: "text-green-400",  bg: "bg-green-500/10" },
          { icon: TrendingUp,    label: "Total Revenue",   value: s?.totalRevenue ?? 0,        f: fmt,                         color: "text-white",      bg: "bg-white/8" },
          { icon: TrendingDown,  label: "Total Expenses",  value: s?.totalExpenses ?? 0,       f: fmt,                         color: "text-red-400",    bg: "bg-red-500/10" },
          { icon: TrendingUp,    label: "Net Revenue",     value: s?.netRevenue ?? 0,          f: fmt,                         color: (s?.netRevenue ?? 0) >= 0 ? "text-green-400" : "text-red-400", bg: (s?.netRevenue ?? 0) >= 0 ? "bg-green-500/10" : "bg-red-500/10" },
          { icon: CalendarCheck, label: "Attendance",      value: s?.totalAttendance ?? 0,     f: (n: number) => n.toString(), color: "text-purple-400", bg: "bg-purple-500/10" },
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

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-sm">Revenue Breakdown</h3>
              <p className="text-white/35 text-xs mt-0.5">{rangeLabel}</p>
            </div>
            <div className="flex items-center gap-3">
              {[["hsl(24 95% 53%)", "Membership"], ["hsl(142 72% 50%)", "Supplements"]].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
                  <span className="text-white/35 text-[10px]">{label}</span>
                </div>
              ))}
            </div>
          </div>
          {loading ? <div className="h-24 bg-white/3 rounded-xl animate-pulse" /> :
           (data?.revenue.length ?? 0) === 0 ? <div className="h-24 flex items-center justify-center text-white/20 text-sm">No data for this period</div> :
           <StackedBar data={data!.revenue} />}
        </div>
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="mb-4">
            <h3 className="text-white font-semibold text-sm">New Members</h3>
            <p className="text-white/35 text-xs mt-0.5">{rangeLabel}</p>
          </div>
          {loading ? <div className="h-20 bg-white/3 rounded-xl animate-pulse" /> :
           <LineChart data={data?.memberGrowth ?? []} valueKey="members" color="hsl(24 95% 53%)" />}
        </div>
      </div>

      {/* Per-gym table */}
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

export default function ReportsPage() {
  const { hasFullReports, isExpired } = useSubscription()

  return (
    <div className="max-w-6xl space-y-6">
      <PageHeader title="Reports & Analytics" subtitle="Track your gym's performance" />
      <PlanGate allowed={hasFullReports && !isExpired} featureLabel="Full Reports & Analytics">
        <ReportsContent />
      </PlanGate>
    </div>
  )
}
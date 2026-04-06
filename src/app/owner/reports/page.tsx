// // src/app/owner/reports/page.tsx
// "use client"

// import { useEffect, useState, useCallback, useRef } from "react"
// import { useSubscription }              from "@/contexts/SubscriptionContext"
// import { PlanGate }                     from "@/components/owner/PlanGate"
// import { PageHeader }                   from "@/components/owner/PageHeader"
// import {
//   TrendingUp, TrendingDown, Users, CreditCard, CalendarCheck, ShoppingBag,
//   Loader2, ChevronDown, UserPlus, Receipt, Download, FileText, FileSpreadsheet,
//   Calendar,
// } from "lucide-react"
// import type { DashRange } from "@/lib/dashboard-queries"

// // ── Constants ──────────────────────────────────────────────────────────────────
// const RANGE_OPTIONS: { value: DashRange; label: string }[] = [
//   { value: "today",          label: "Today"                    },
//   { value: "last_7_days",    label: "Last 7 Days"              },
//   { value: "last_30_days",   label: "Last 30 Days"             },
//   { value: "last_90_days",   label: "This Quarter (90 days)"   },
//   { value: "financial_year", label: "Financial Year (Apr–Mar)" },
//   { value: "custom",         label: "Custom Range"             },
// ]

// // ── Types ──────────────────────────────────────────────────────────────────────
// interface RevenueBucket    { label: string; membershipRev: number; supplementRev: number; total: number }
// interface ExpenseBucket    { label: string; amount: number }
// interface AttendanceBucket { label: string; count: number }
// interface GrowthBucket     { label: string; count: number }

// interface TopGym {
//   name: string; activeMembers: number; newMembers: number; attendance: number
//   membershipRev: number; supplementRev: number; totalRevenue: number
//   expenses: number; netRevenue: number
// }

// interface ReportData {
//   range:              DashRange
//   dateRange?:         { start: string; end: string }
//   revenueSeries:      RevenueBucket[]
//   expenseSeries:      ExpenseBucket[]
//   attendanceSeries:   AttendanceBucket[]
//   memberGrowthSeries: GrowthBucket[]
//   topGyms:            TopGym[]
//   summary: {
//     totalMembers: number; newMembers: number
//     membershipRevenue: number; supplementRevenue: number; totalRevenue: number
//     totalExpenses: number; netRevenue: number; totalAttendance: number
//   }
// }

// // ── Formatters ─────────────────────────────────────────────────────────────────
// function fmt(n: number) {
//   if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
//   if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`
//   return `₹${n.toLocaleString("en-IN")}`
// }

// // ── Range Picker ───────────────────────────────────────────────────────────────
// function RangePicker({
//   range, customS, customE,
//   onApply,
// }: {
//   range:   DashRange
//   customS: string
//   customE: string
//   onApply: (r: DashRange, cs?: string, ce?: string) => void
// }) {
//   const [open,  setOpen]  = useState(false)
//   const [cs,    setCs]    = useState(customS)
//   const [ce,    setCe]    = useState(customE)
//   const ref = useRef<HTMLDivElement>(null)

//   useEffect(() => {
//     const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
//     document.addEventListener("mousedown", h)
//     return () => document.removeEventListener("mousedown", h)
//   }, [])

//   const label = RANGE_OPTIONS.find(o => o.value === range)?.label ?? "Select range"

//   return (
//     <div ref={ref} className="relative">
//       <button
//         onClick={() => setOpen(v => !v)}
//         className="flex items-center gap-2 bg-[hsl(220_25%_11%)] border border-white/10 text-white/80 rounded-xl px-3.5 h-10 text-sm hover:border-primary/40 transition-colors focus:outline-none"
//       >
//         <Calendar className="w-3.5 h-3.5 text-white/40 shrink-0" />
//         <span className="truncate max-w-44">{label}</span>
//         <ChevronDown className={`w-3.5 h-3.5 text-white/30 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
//       </button>

//       {open && (
//         <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-64 bg-[hsl(220_25%_10%)] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
//           <div className="p-1.5">
//             {RANGE_OPTIONS.filter(o => o.value !== "custom").map(opt => (
//               <button
//                 key={opt.value}
//                 onClick={() => { onApply(opt.value); setOpen(false) }}
//                 className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
//                   range === opt.value
//                     ? "bg-primary/12 text-primary font-semibold"
//                     : "text-white/60 hover:bg-white/5 hover:text-white"
//                 }`}
//               >{opt.label}</button>
//             ))}
//           </div>
//           <div className="border-t border-white/6 p-3">
//             <p className={`text-xs font-semibold mb-2.5 ${range === "custom" ? "text-primary" : "text-white/40"}`}>Custom Range</p>
//             <div className="space-y-2">
//               <div className="flex items-center gap-2">
//                 <input type="date" value={cs} onChange={e => setCs(e.target.value)} max={ce || undefined}
//                   className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/70 focus:outline-none focus:border-primary/40"
//                   style={{ colorScheme: "dark" }} />
//                 <span className="text-white/20 text-xs shrink-0">→</span>
//                 <input type="date" value={ce} onChange={e => setCe(e.target.value)} min={cs || undefined}
//                   className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/70 focus:outline-none focus:border-primary/40"
//                   style={{ colorScheme: "dark" }} />
//               </div>
//               <button
//                 disabled={!cs || !ce}
//                 onClick={() => { onApply("custom", cs, ce); setOpen(false) }}
//                 className="w-full py-2 rounded-xl text-xs font-semibold bg-primary text-white disabled:opacity-35 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
//               >Apply Custom Range</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// // ── Chart helpers ──────────────────────────────────────────────────────────────
// const SHOW_EVERY = (len: number) => len > 10 ? Math.ceil(len / 7) : 1

// function ChartEmpty() {
//   return <div className="h-28 flex items-center justify-center text-white/20 text-sm">No data for this period</div>
// }

// // Stacked bar: membership (orange) + supplement (green)
// function RevenueBar({ data }: { data: RevenueBucket[] }) {
//   if (!data.length || data.every(d => d.total === 0)) return <ChartEmpty />
//   const max   = Math.max(...data.map(d => d.total), 1)
//   const every = SHOW_EVERY(data.length)
//   const MEM   = "hsl(24 95% 53%)"
//   const SUPP  = "#22c55e"

//   return (
//     <div>
//       <div className="flex items-end gap-0.5 h-28">
//         {data.map((d, i) => {
//           const mH = d.membershipRev > 0 ? Math.max((d.membershipRev / max) * 100, 2) : 2
//           const sH = d.supplementRev > 0 ? Math.max((d.supplementRev / max) * 100, 2) : 2
//           return (
//             <div key={i} className="flex-1 h-full flex items-end gap-px group relative min-w-0">
//               <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none
//                 bg-[hsl(220_25%_13%)] border border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs whitespace-nowrap
//                 opacity-0 group-hover:opacity-100 transition-opacity">
//                 <p className="text-white/50 font-medium mb-1">{d.label}</p>
//                 <p style={{ color: MEM  }}>Membership:  {fmt(d.membershipRev)}</p>
//                 <p style={{ color: SUPP }}>Supplements: {fmt(d.supplementRev)}</p>
//                 <p className="text-white font-semibold mt-1 border-t border-white/10 pt-1">Total: {fmt(d.total)}</p>
//               </div>
//               <div className="flex-1 rounded-t-sm" style={{ height: `${mH}%`, background: MEM, opacity: d.membershipRev > 0 ? 0.85 : 0.1, minHeight: "2px" }} />
//               <div className="flex-1 rounded-t-sm" style={{ height: `${sH}%`, background: SUPP, opacity: d.supplementRev > 0 ? 0.85 : 0.1, minHeight: "2px" }} />
//             </div>
//           )
//         })}
//       </div>
//       <div className="flex mt-1.5">
//         {data.map((d, i) => (
//           <span key={i} className="flex-1 text-center text-white/20 text-[9px] truncate">{i % every === 0 ? d.label : ""}</span>
//         ))}
//       </div>
//     </div>
//   )
// }

// // Simple bar: single colour (expenses = blue, attendance = purple, growth = green)
// function SimpleBar({ data, valueKey, color, formatValue = String }: {
//   data: any[]; valueKey: string; color: string; formatValue?: (n: number) => string
// }) {
//   if (!data.length || data.every((d: any) => d[valueKey] === 0)) return <ChartEmpty />
//   const max   = Math.max(...data.map((d: any) => d[valueKey]), 1)
//   const every = SHOW_EVERY(data.length)

//   return (
//     <div>
//       <div className="flex items-end gap-0.5 h-28">
//         {data.map((d: any, i: number) => {
//           const h  = d[valueKey] > 0 ? Math.max((d[valueKey] / max) * 100, 2) : 2
//           const op = d[valueKey] > 0 ? 0.8 : 0.1
//           return (
//             <div key={i} className="flex-1 h-full flex items-end group relative min-w-0">
//               <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none
//                 bg-[hsl(220_25%_13%)] border border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs whitespace-nowrap
//                 opacity-0 group-hover:opacity-100 transition-opacity">
//                 <p className="text-white/50 font-medium mb-0.5">{d.label}</p>
//                 <p style={{ color }}>{formatValue(d[valueKey])}</p>
//               </div>
//               <div className="flex-1 rounded-t-sm" style={{ height: `${h}%`, backgroundColor: color, opacity: op, minHeight: "2px" }} />
//             </div>
//           )
//         })}
//       </div>
//       <div className="flex mt-1.5">
//         {data.map((d: any, i: number) => (
//           <span key={i} className="flex-1 text-center text-white/20 text-[9px] truncate">{i % every === 0 ? d.label : ""}</span>
//         ))}
//       </div>
//     </div>
//   )
// }

// // Line chart (SVG)
// function LineChart({ data, valueKey, color, formatValue = String }: {
//   data: any[]; valueKey: string; color: string; formatValue?: (n: number) => string
// }) {
//   if (data.length < 2 || data.every((d: any) => d[valueKey] === 0))
//     return <div className="h-28 flex items-center justify-center text-white/20 text-sm">Not enough data</div>

//   const max = Math.max(...data.map((d: any) => d[valueKey]), 1)
//   const H   = 80
//   const pts = data.map((d: any, i: number) => ({
//     x: (i / (data.length - 1)) * 100,
//     y: H - (d[valueKey] / max) * (H - 8),
//     v: d[valueKey],
//     l: d.label,
//   }))
//   const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
//   const uid  = `lg-${color.replace(/\W/g, "")}`

//   return (
//     <div className="relative h-28">
//       <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className="w-full h-full">
//         <defs>
//           <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
//             <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
//             <stop offset="100%" stopColor={color} stopOpacity="0.02" />
//           </linearGradient>
//         </defs>
//         <path d={`${path} L 100 ${H} L 0 ${H} Z`} fill={`url(#${uid})`} />
//         <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
//         {pts.map((p, i) => (
//           <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} className="opacity-70" />
//         ))}
//       </svg>
//     </div>
//   )
// }

// // ── Chart card wrapper ─────────────────────────────────────────────────────────
// function ChartCard({ title, sub, legend, loading, children }: {
//   title: string; sub: string; legend?: { color: string; label: string }[]
//   loading: boolean; children: React.ReactNode
// }) {
//   return (
//     <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
//       <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
//         <div>
//           <h3 className="text-white font-semibold text-sm">{title}</h3>
//           <p className="text-white/35 text-xs mt-0.5">{sub}</p>
//         </div>
//         {legend && (
//           <div className="flex items-center gap-3 flex-wrap">
//             {legend.map(l => (
//               <div key={l.label} className="flex items-center gap-1.5">
//                 <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color, opacity: 0.85 }} />
//                 <span className="text-white/35 text-[10px]">{l.label}</span>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//       {loading ? <div className="h-28 bg-white/3 rounded-xl animate-pulse" /> : children}
//     </div>
//   )
// }

// // ── Excel export ───────────────────────────────────────────────────────────────
// async function exportExcel(data: ReportData, rangeLabel: string) {
//   const XLSX = await import("xlsx")

//   const wb = XLSX.utils.book_new()

//   // Sheet 1: Summary
//   XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
//     ["GymStack Report", rangeLabel],
//     [],
//     ["Metric", "Value"],
//     ["Active Members",      data.summary.totalMembers],
//     ["New Members",         data.summary.newMembers],
//     ["Membership Revenue",  data.summary.membershipRevenue],
//     ["Supplement Revenue",  data.summary.supplementRevenue],
//     ["Total Revenue",       data.summary.totalRevenue],
//     ["Total Expenses",      data.summary.totalExpenses],
//     ["Net Revenue",         data.summary.netRevenue],
//     ["Total Attendance",    data.summary.totalAttendance],
//   ]), "Summary")

//   // Sheet 2: Revenue
//   XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
//     ["Period", "Membership (₹)", "Supplements (₹)", "Total (₹)"],
//     ...data.revenueSeries.map(r => [r.label, r.membershipRev, r.supplementRev, r.total]),
//   ]), "Revenue")

//   // Sheet 3: Expenses
//   XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
//     ["Period", "Expenses (₹)"],
//     ...data.expenseSeries.map(e => [e.label, e.amount]),
//   ]), "Expenses")

//   // Sheet 4: Attendance
//   XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
//     ["Period", "Check-ins"],
//     ...data.attendanceSeries.map(a => [a.label, a.count]),
//   ]), "Attendance")

//   // Sheet 5: New Members
//   XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
//     ["Period", "New Members"],
//     ...data.memberGrowthSeries.map(m => [m.label, m.count]),
//   ]), "New Members")

//   // Sheet 6: Per-Gym
//   if (data.topGyms.length) {
//     XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
//       ["Gym", "Active Members", "New Members", "Attendance", "Membership Rev (₹)", "Supplement Rev (₹)", "Total Revenue (₹)", "Expenses (₹)", "Net Revenue (₹)"],
//       ...data.topGyms.map(g => [g.name, g.activeMembers, g.newMembers, g.attendance, g.membershipRev, g.supplementRev, g.totalRevenue, g.expenses, g.netRevenue]),
//     ]), "Per-Gym")
//   }

//   XLSX.writeFile(wb, `gymstack-report-${rangeLabel.replace(/\s+/g, "-").toLowerCase()}.xlsx`)
// }

// // ── PDF export (browser print) ────────────────────────────────────────────────
// function exportPDF() {
//   window.print()
// }

// // ── Main report content ────────────────────────────────────────────────────────
// function ReportsContent() {
//   const [data,     setData]    = useState<ReportData | null>(null)
//   const [loading,  setLoading] = useState(true)
//   const [exporting,setExp]     = useState(false)
//   const [range,    setRange]   = useState<DashRange>("last_30_days")
//   const [customS,  setCustomS] = useState("")
//   const [customE,  setCustomE] = useState("")
//   const [gymId,    setGymId]   = useState("")
//   const [gyms,     setGyms]    = useState<{ id: string; name: string }[]>([])

//   // Fetch gyms once
//   useEffect(() => {
//     fetch("/api/owner/gyms").then(r => r.json()).then(g => { if (Array.isArray(g)) setGyms(g) }).catch(() => {})
//   }, [])

//   const load = useCallback(async () => {
//     setLoading(true)
//     const p = new URLSearchParams({ range })
//     if (gymId)                           p.set("gymId", gymId)
//     if (range === "custom" && customS && customE) {
//       p.set("customStart", customS)
//       p.set("customEnd",   customE)
//     }
//     try {
//       const res = await fetch(`/api/owner/reports?${p}`)
//       const d   = await res.json()
//       if (!d.upgradeRequired) setData(d)
//     } catch { /* ignore */ }
//     finally { setLoading(false) }
//   }, [range, gymId, customS, customE])

//   useEffect(() => { load() }, [load])

//   function handleApply(r: DashRange, cs?: string, ce?: string) {
//     setRange(r)
//     if (r === "custom" && cs && ce) { setCustomS(cs); setCustomE(ce) }
//     else                            { setCustomS(""); setCustomE("") }
//   }

//   const s          = data?.summary
//   const rangeLabel = RANGE_OPTIONS.find(o => o.value === range)?.label ?? range
//   const dateHint   = data?.dateRange
//     ? `${new Date(data.dateRange.start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(data.dateRange.end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
//     : ""

//   const summaryCards = [
//     { icon: Users,        label: "Active Members",  value: s?.totalMembers ?? 0,      fmt: String,   color: "text-blue-400",   bg: "bg-blue-500/10"  },
//     { icon: UserPlus,     label: "New Members",     value: s?.newMembers ?? 0,         fmt: String,   color: "text-green-400",  bg: "bg-green-500/10" },
//     { icon: CreditCard,   label: "Membership Rev",  value: s?.membershipRevenue ?? 0,  fmt,           color: "text-primary",    bg: "bg-primary/10"   },
//     { icon: ShoppingBag,  label: "Supplement Rev",  value: s?.supplementRevenue ?? 0,  fmt,           color: "text-yellow-400", bg: "bg-yellow-500/10"},
//     { icon: TrendingUp,   label: "Total Revenue",   value: s?.totalRevenue ?? 0,       fmt,           color: "text-white",      bg: "bg-white/8"      },
//     { icon: Receipt,      label: "Total Expenses",  value: s?.totalExpenses ?? 0,      fmt,           color: "text-red-400",    bg: "bg-red-500/10"   },
//     { icon: TrendingUp,   label: "Net Revenue",     value: s?.netRevenue ?? 0,         fmt,           color: (s?.netRevenue ?? 0) >= 0 ? "text-green-400" : "text-red-400", bg: (s?.netRevenue ?? 0) >= 0 ? "bg-green-500/10" : "bg-red-500/10" },
//     { icon: CalendarCheck,label: "Attendance",      value: s?.totalAttendance ?? 0,    fmt: String,   color: "text-purple-400", bg: "bg-purple-500/10"},
//   ]

//   return (
//     <>
//       {/* Print styles */}
//       <style>{`
//         @media print {
//           .no-print { display: none !important; }
//           body { background: #fff !important; color: #000 !important; }
//           .print-page { background: #fff !important; padding: 0 !important; }
//         }
//       `}</style>

//       <div className="space-y-6 print-page">
//         {/* ── Controls ──────────────────────────────────────── */}
//         <div className="flex flex-wrap items-center gap-3 no-print">
//           <RangePicker range={range} customS={customS} customE={customE} onApply={handleApply} />

//           {gyms.length > 1 && (
//             <div className="relative">
//               <select value={gymId} onChange={e => setGymId(e.target.value)}
//                 className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white/80 rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none focus:border-primary cursor-pointer">
//                 <option value="">All Gyms</option>
//                 {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
//               </select>
//               <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
//             </div>
//           )}

//           {loading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}

//           {dateHint && <p className="text-white/25 text-xs">{dateHint}</p>}

//           {/* Export buttons */}
//           <div className="flex items-center gap-2 ml-auto">
//             <button
//               disabled={!data || loading || exporting}
//               onClick={async () => {
//                 if (!data) return
//                 setExp(true)
//                 try { await exportExcel(data, rangeLabel) }
//                 finally { setExp(false) }
//               }}
//               className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[hsl(220_25%_11%)] border border-white/10 text-white/70 text-xs font-medium hover:border-green-500/40 hover:text-green-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
//             >
//               {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
//               Export Excel
//             </button>
//             <button
//               disabled={!data || loading}
//               onClick={exportPDF}
//               className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[hsl(220_25%_11%)] border border-white/10 text-white/70 text-xs font-medium hover:border-red-500/40 hover:text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
//             >
//               <FileText className="w-3.5 h-3.5" />
//               Export PDF
//             </button>
//           </div>
//         </div>

//         {/* Print header (only visible when printing) */}
//         <div className="hidden print:block mb-4">
//           <h1 className="text-2xl font-bold">GymStack Report — {rangeLabel}</h1>
//           {dateHint && <p className="text-sm text-gray-500 mt-1">{dateHint}</p>}
//         </div>

//         {/* ── Summary cards ─────────────────────────────────── */}
//         <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
//           {summaryCards.map(({ icon: Icon, label, value, fmt: f, color, bg }) => (
//             <div key={label} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4">
//               <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
//                 <Icon className={`w-4 h-4 ${color}`} />
//               </div>
//               <p className={`text-xl font-display font-bold ${color}`}>{loading ? "—" : f(value)}</p>
//               <p className="text-white/35 text-xs mt-0.5">{label}</p>
//             </div>
//           ))}
//         </div>

//         {/* ── Charts row 1: Revenue + Expenses ──────────────── */}
//         <div className="grid lg:grid-cols-2 gap-5">
//           <ChartCard
//             title="Revenue Breakdown"
//             sub={rangeLabel}
//             loading={loading}
//             legend={[{ color: "hsl(24 95% 53%)", label: "Membership" }, { color: "#22c55e", label: "Supplements" }]}
//           >
//             <RevenueBar data={data?.revenueSeries ?? []} />
//             {/* Summary footer */}
//             {data && (() => {
//               const tm = data.revenueSeries.reduce((s, d) => s + d.membershipRev, 0)
//               const ts = data.revenueSeries.reduce((s, d) => s + d.supplementRev, 0)
//               return (
//                 <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 pt-3 border-t border-white/6 text-xs">
//                   <span className="text-white/40">Membership: <span className="font-semibold text-orange-400">{fmt(tm)}</span></span>
//                   <span className="text-white/40">Supplements: <span className="font-semibold text-green-400">{fmt(ts)}</span></span>
//                   <span className="text-white/40 ml-auto">Total: <span className="font-semibold text-white">{fmt(tm + ts)}</span></span>
//                 </div>
//               )
//             })()}
//           </ChartCard>

//           <ChartCard title="Expenses" sub={rangeLabel} loading={loading} legend={[{ color: "#3b82f6", label: "Expenses" }]}>
//             <SimpleBar data={data?.expenseSeries ?? []} valueKey="amount" color="#3b82f6" formatValue={fmt} />
//             {data && (() => {
//               const total = data.expenseSeries.reduce((s, d) => s + d.amount, 0)
//               return (
//                 <div className="flex mt-3 pt-3 border-t border-white/6 text-xs">
//                   <span className="text-white/40 ml-auto">Total: <span className="font-semibold text-blue-400">{fmt(total)}</span></span>
//                 </div>
//               )
//             })()}
//           </ChartCard>
//         </div>

//         {/* ── Charts row 2: Attendance + New Members ─────────── */}
//         <div className="grid lg:grid-cols-2 gap-5">
//           <ChartCard title="Attendance" sub={`Check-ins · ${rangeLabel}`} loading={loading} legend={[{ color: "#a855f7", label: "Check-ins" }]}>
//             <SimpleBar data={data?.attendanceSeries ?? []} valueKey="count" color="#a855f7" formatValue={n => `${n} check-ins`} />
//             {data && (() => {
//               const total = data.attendanceSeries.reduce((s, d) => s + d.count, 0)
//               return (
//                 <div className="flex mt-3 pt-3 border-t border-white/6 text-xs">
//                   <span className="text-white/40 ml-auto">Total: <span className="font-semibold text-purple-400">{total.toLocaleString("en-IN")} check-ins</span></span>
//                 </div>
//               )
//             })()}
//           </ChartCard>

//           <ChartCard title="New Members" sub={rangeLabel} loading={loading}>
//             <LineChart data={data?.memberGrowthSeries ?? []} valueKey="count" color="hsl(24 95% 53%)" formatValue={n => `${n} members`} />
//             {data && (() => {
//               const total = data.memberGrowthSeries.reduce((s, d) => s + d.count, 0)
//               return (
//                 <div className="flex mt-3 pt-3 border-t border-white/6 text-xs">
//                   <span className="text-white/40 ml-auto">Total: <span className="font-semibold text-orange-400">{total} new members</span></span>
//                 </div>
//               )
//             })()}
//           </ChartCard>
//         </div>

//         {/* ── Net Revenue chart ──────────────────────────────── */}
//         {data && data.revenueSeries.length > 0 && (() => {
//           const netSeries = data.revenueSeries.map((r, i) => ({
//             label: r.label,
//             net:   r.total - (data.expenseSeries[i]?.amount ?? 0),
//           }))
//           const hasNeg = netSeries.some(d => d.net < 0)
//           return (
//             <ChartCard title="Net Revenue" sub={`Revenue minus Expenses · ${rangeLabel}`} loading={loading}
//               legend={[{ color: hasNeg ? "#f87171" : "#4ade80", label: "Net" }]}>
//               <SimpleBar data={netSeries} valueKey="net" color={hasNeg ? "#f87171" : "#4ade80"} formatValue={fmt} />
//             </ChartCard>
//           )
//         })()}

//         {/* ── Per-gym table ──────────────────────────────────── */}
//         {!loading && (data?.topGyms?.length ?? 0) > 0 && (
//           <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
//             <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
//               <div>
//                 <h3 className="text-white font-semibold text-sm">Per-Gym Breakdown</h3>
//                 <p className="text-white/35 text-xs mt-0.5">{rangeLabel}</p>
//               </div>
//             </div>
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="border-b border-white/5">
//                     {["Gym", "Active", "New", "Attendance", "Mem. Rev", "Supp. Rev", "Revenue", "Expenses", "Net"].map(h => (
//                       <th key={h} className="px-4 py-3 text-left text-white/30 text-xs font-medium whitespace-nowrap">{h}</th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-white/4">
//                   {data!.topGyms.map((g, i) => (
//                     <tr key={i} className="hover:bg-white/2 transition-colors">
//                       <td className="px-4 py-3.5 text-white font-medium">{g.name}</td>
//                       <td className="px-4 py-3.5 text-white/60">{g.activeMembers}</td>
//                       <td className="px-4 py-3.5 text-green-400">+{g.newMembers}</td>
//                       <td className="px-4 py-3.5 text-white/60">{g.attendance}</td>
//                       <td className="px-4 py-3.5 text-primary">{fmt(g.membershipRev)}</td>
//                       <td className="px-4 py-3.5 text-yellow-400">{fmt(g.supplementRev)}</td>
//                       <td className="px-4 py-3.5 text-white font-semibold">{fmt(g.totalRevenue)}</td>
//                       <td className="px-4 py-3.5 text-red-400">−{fmt(g.expenses)}</td>
//                       <td className={`px-4 py-3.5 font-semibold ${g.netRevenue >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(g.netRevenue)}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}
//       </div>
//     </>
//   )
// }

// // ── Page ───────────────────────────────────────────────────────────────────────
// export default function ReportsPage() {
//   const { hasFullReports, isExpired } = useSubscription()

//   return (
//     <div className="max-w-7xl space-y-6">
//       <div className="flex items-center justify-between no-print">
//         <PageHeader title="Reports & Analytics" subtitle="Track your gym's performance across all metrics" />
//       </div>
//       <PlanGate allowed={hasFullReports && !isExpired} featureLabel="Full Reports & Analytics">
//         <ReportsContent />
//       </PlanGate>
//     </div>
//   )
// }


// src/app/owner/reports/page.tsx
"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSubscription }   from "@/contexts/SubscriptionContext"
import { PlanGate }          from "@/components/owner/PlanGate"
import { PageHeader }        from "@/components/owner/PageHeader"
import {
  TrendingUp, TrendingDown, Users, CreditCard, CalendarCheck,
  ShoppingBag, Loader2, ChevronDown, UserPlus, Lock,
  FileSpreadsheet, FileText, Zap, Calendar,
} from "lucide-react"
import type { DashRange } from "@/lib/dashboard-queries"

// ── Constants ─────────────────────────────────────────────────────────────────
// Values must match DashRange in src/lib/dashboard-queries.ts
const RANGE_OPTIONS: { value: DashRange; label: string }[] = [
  { value: "today",          label: "Today"                    },
  { value: "last_7_days",    label: "Last 7 Days"              },
  { value: "last_30_days",   label: "Last 30 Days"             },
  { value: "last_90_days",   label: "This Quarter (90 days)"   },
  { value: "financial_year", label: "Financial Year (Apr–Mar)" },
  { value: "custom",         label: "Custom Range"             },
]

// Revenue segment colours
const C = {
  membership: "hsl(24 95% 53%)",    // orange  — primary brand
  supplement: "hsl(142 72% 50%)",   // green
  locker:     "hsl(217 91% 60%)",   // blue
  expense:    "hsl(0 84% 60%)",     // red
  members:    "hsl(262 80% 65%)",   // purple
  attendance: "hsl(280 80% 65%)",   // violet
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface RevenueBucket {
  label: string; membershipRev: number; supplementRev: number
  lockerRev: number; total: number
}
interface ReportData {
  revenueSeries:       RevenueBucket[]
  expenseSeries:       { label: string; amount: number }[]
  attendanceSeries:    { label: string; count: number }[]
  memberGrowthSeries:  { label: string; count: number }[]
  lockerRevenueSeries: { label: string; amount: number }[]
  topGyms: {
    name: string; activeMembers: number; newMembers: number; attendance: number
    membershipRev: number; supplementRev: number; lockerRev: number
    totalRevenue: number; expenses: number; netRevenue: number
  }[]
  summary: {
    totalMembers: number; newMembers: number
    membershipRevenue: number; supplementRevenue: number; lockerRevenue: number
    totalRevenue: number; totalExpenses: number; netRevenue: number; totalAttendance: number
  }
  range:      DashRange
  isPremium:  boolean
  dateRange?: { start: string; end: string }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000)   return `₹${(n / 1_000).toFixed(1)}K`
  return `₹${n.toLocaleString("en-IN")}`
}

// ── Stacked bar (Revenue breakdown) ──────────────────────────────────────────
function StackedBar({ data, height = 110 }: { data: RevenueBucket[]; height?: number }) {
  const max = Math.max(...data.map(d => d.total), 1)
  const barH = height - 24   // reserve 24px for labels

  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const mH = d.total > 0 ? (d.membershipRev / max) * barH : 0
        const sH = d.total > 0 ? (d.supplementRev / max) * barH : 0
        const lH = d.total > 0 ? (d.lockerRev     / max) * barH : 0
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            {/* Hover tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap pointer-events-none">
              <div className="bg-[hsl(220_25%_14%)] border border-white/10 rounded-xl px-3 py-2.5 shadow-xl text-xs space-y-1">
                <p className="text-white font-semibold mb-1.5">{d.label}</p>
                <p style={{ color: C.membership }}>Membership: {fmt(d.membershipRev)}</p>
                <p style={{ color: C.supplement }}>Supplements: {fmt(d.supplementRev)}</p>
                {d.lockerRev > 0 && <p style={{ color: C.locker }}>Lockers: {fmt(d.lockerRev)}</p>}
                <p className="text-white font-bold border-t border-white/10 pt-1.5 mt-1">Total: {fmt(d.total)}</p>
              </div>
            </div>

            {/* Bar segments — stacked bottom-up: membership, supplement, locker */}
            <div className="w-full flex flex-col-reverse rounded-t-sm overflow-hidden"
              style={{ minHeight: d.total > 0 ? "3px" : "2px" }}>
              <div style={{ height: `${Math.max(mH, d.membershipRev > 0 ? 2 : 0)}px`, background: C.membership }} />
              <div style={{ height: `${Math.max(sH, d.supplementRev > 0 ? 2 : 0)}px`, background: C.supplement }} />
              <div style={{ height: `${Math.max(lH, d.lockerRev     > 0 ? 2 : 0)}px`, background: C.locker    }} />
            </div>
            <span className="text-white/20 text-[9px] truncate w-full text-center">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Simple line/area chart (locker revenue, member growth) ────────────────────
function LineChart({
  data, valueKey, color, emptyMsg = "No data for this period",
}: {
  data: any[]; valueKey: string; color: string; emptyMsg?: string
}) {
  if (data.length < 2) return (
    <div className="h-20 flex items-center justify-center text-white/20 text-xs">{emptyMsg}</div>
  )
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  const H   = 60
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: H - (d[valueKey] / max) * (H - 8),
  }))
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")

  return (
    <div className="relative h-20">
      <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id={`fill-${color.replace(/[^a-z]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0"   />
          </linearGradient>
        </defs>
        <path
          d={`${path} L 100 ${H} L 0 ${H} Z`}
          fill={`url(#fill-${color.replace(/[^a-z]/gi, "")})`}
        />
        <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.8" fill={color} />)}
      </svg>
    </div>
  )
}

// ── Range picker dropdown ─────────────────────────────────────────────────────
function RangePicker({
  range, customS, customE, onApply,
}: {
  range:   DashRange
  customS: string
  customE: string
  onApply: (r: DashRange, cs?: string, ce?: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [cs,   setCs]   = useState(customS)
  const [ce,   setCe]   = useState(customE)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const label = RANGE_OPTIONS.find(o => o.value === range)?.label ?? "Select range"

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 bg-[hsl(220_25%_11%)] border border-white/10 text-white/80 rounded-xl px-3.5 h-10 text-sm hover:border-primary/40 transition-colors focus:outline-none"
      >
        <Calendar className="w-3.5 h-3.5 text-white/40 shrink-0" />
        <span className="truncate max-w-44">{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/30 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-64 bg-[hsl(220_25%_10%)] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
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
          <div className="border-t border-white/6 p-3">
            <p className={`text-xs font-semibold mb-2.5 ${range === "custom" ? "text-primary" : "text-white/40"}`}>
              Custom Range
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="date" value={cs} onChange={e => setCs(e.target.value)} max={ce || undefined}
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/70 focus:outline-none focus:border-primary/40"
                  style={{ colorScheme: "dark" }}
                />
                <span className="text-white/20 text-xs shrink-0">→</span>
                <input
                  type="date" value={ce} onChange={e => setCe(e.target.value)} min={cs || undefined}
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/70 focus:outline-none focus:border-primary/40"
                  style={{ colorScheme: "dark" }}
                />
              </div>
              <button
                disabled={!cs || !ce}
                onClick={() => { onApply("custom", cs, ce); setOpen(false) }}
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

// ── Excel export (xlsx is already a project dependency) ───────────────────────
async function exportExcel(data: ReportData, rangeLabel: string) {
  const XLSX = await import("xlsx")
  const wb   = XLSX.utils.book_new()

  // Sheet 1: Summary
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["GymStack Report", rangeLabel],
    [],
    ["Metric",               "Value"],
    ["Active Members",        data.summary.totalMembers],
    ["New Members",           data.summary.newMembers],
    ["Membership Revenue",    data.summary.membershipRevenue],
    ["Supplement Revenue",    data.summary.supplementRevenue],
    ["Locker Revenue",        data.summary.lockerRevenue],
    ["Total Revenue",         data.summary.totalRevenue],
    ["Total Expenses",        data.summary.totalExpenses],
    ["Net Revenue",           data.summary.netRevenue],
    ["Total Attendance",      data.summary.totalAttendance],
  ]), "Summary")

  // Sheet 2: Revenue breakdown
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["Period", "Membership (₹)", "Supplements (₹)", "Lockers (₹)", "Total (₹)"],
    ...data.revenueSeries.map(r => [r.label, r.membershipRev, r.supplementRev, r.lockerRev, r.total]),
  ]), "Revenue")

  // Sheet 3: Expenses
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["Period", "Expenses (₹)"],
    ...data.expenseSeries.map(e => [e.label, e.amount]),
  ]), "Expenses")

  // Sheet 4: Attendance
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["Period", "Check-ins"],
    ...(data.attendanceSeries ?? []).map(a => [a.label, a.count]),
  ]), "Attendance")

  // Sheet 5: New Members
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["Period", "New Members"],
    ...data.memberGrowthSeries.map(m => [m.label, m.count]),
  ]), "New Members")

  // Sheet 6: Per-Gym (if applicable)
  if (data.topGyms.length > 1) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ["Gym", "Active Members", "New Members", "Attendance",
       "Membership Rev (₹)", "Supplement Rev (₹)", "Locker Rev (₹)", "Total Revenue (₹)", "Expenses (₹)", "Net Revenue (₹)"],
      ...data.topGyms.map(g => [
        g.name, g.activeMembers, g.newMembers, g.attendance,
        g.membershipRev, g.supplementRev, g.lockerRev ?? 0,
        g.totalRevenue, g.expenses, g.netRevenue,
      ]),
    ]), "Per-Gym")
  }

  XLSX.writeFile(wb, `gymstack-report-${rangeLabel.replace(/\s+/g, "-").toLowerCase()}.xlsx`)
}

// ── Reports content ───────────────────────────────────────────────────────────
function ReportsContent() {
  const { hasFullAnalytics } = useSubscription()

  const [data,      setData]      = useState<ReportData | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [range,     setRange]     = useState<DashRange>("last_30_days")
  const [customS,   setCustomS]   = useState("")
  const [customE,   setCustomE]   = useState("")
  const [gymId,     setGymId]     = useState("")
  const [gyms,      setGyms]      = useState<{ id: string; name: string }[]>([])

  // Fetch gyms once on mount
  useEffect(() => {
    fetch("/api/owner/gyms")
      .then(r => r.ok ? r.json() : [])
      .then(g => { if (Array.isArray(g)) setGyms(g) })
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ range })
      if (gymId) params.set("gymId", gymId)
      if (range === "custom" && customS && customE) {
        params.set("customStart", customS)
        params.set("customEnd",   customE)
      }
      const res = await fetch(`/api/owner/reports?${params}`)
      const d   = await res.json()
      if (!res.ok) {
        setError(d.error ?? "Failed to load report data.")
        return
      }
      setData(d)
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }, [range, gymId, customS, customE])

  useEffect(() => { load() }, [load])

  function handleApply(r: DashRange, cs?: string, ce?: string) {
    setRange(r)
    setCustomS(r === "custom" && cs ? cs : "")
    setCustomE(r === "custom" && ce ? ce : "")
  }

  const rangeLabel  = RANGE_OPTIONS.find(o => o.value === range)?.label ?? "Last 30 Days"
  const s           = data?.summary
  const isPremium   = data?.isPremium ?? hasFullAnalytics
  const hasLocker   = (s?.lockerRevenue ?? 0) > 0 ||
    (data?.lockerRevenueSeries ?? []).some(b => b.amount > 0)

  const dateHint = data?.dateRange
    ? `${new Date(data.dateRange.start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(data.dateRange.end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
    : ""

  return (
    <>
      {/* Print styles — only active when window.print() is called */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; color: #000 !important; }
          .print-target { background: #fff !important; }
        }
      `}</style>

      <div className="space-y-6 print-target">
        {/* ── Controls ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 no-print">
          <RangePicker
            range={range} customS={customS} customE={customE}
            onApply={handleApply}
          />

          {/* Gym selector — Enterprise/multi-gym */}
          {gyms.length > 1 && (
            <div className="relative">
              <select
                value={gymId}
                onChange={e => setGymId(e.target.value)}
                className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white/80 rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="">All Gyms</option>
                {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            </div>
          )}

          {loading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
          {dateHint && <p className="text-white/25 text-xs">{dateHint}</p>}

          {/* Export buttons — Pro/Enterprise only */}
          {isPremium && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                disabled={!data || loading || exporting}
                onClick={async () => {
                  if (!data) return
                  setExporting(true)
                  try { await exportExcel(data, rangeLabel) }
                  catch (e) { console.error("Excel export failed", e) }
                  finally { setExporting(false) }
                }}
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[hsl(220_25%_11%)] border border-white/10 text-white/70 text-xs font-medium hover:border-green-500/40 hover:text-green-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {exporting
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <FileSpreadsheet className="w-3.5 h-3.5" />}
                Excel
              </button>
              <button
                disabled={!data || loading}
                onClick={() => window.print()}
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[hsl(220_25%_11%)] border border-white/10 text-white/70 text-xs font-medium hover:border-red-500/40 hover:text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FileText className="w-3.5 h-3.5" />
                PDF
              </button>
            </div>
          )}
        </div>

        {/* Print-only header */}
        <div className="hidden print:block mb-4">
          <h1 className="text-2xl font-bold">GymStack Report — {rangeLabel}</h1>
          {dateHint && <p className="text-sm text-gray-500 mt-1">{dateHint}</p>}
        </div>

        {/* ── Error state ─────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-500/8 border border-red-500/20 rounded-2xl px-5 py-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* ── Summary cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { icon: Users,        label: "Active Members",  value: s?.totalMembers      ?? 0, f: (n: number) => n.toLocaleString("en-IN"), color: "text-blue-400",   bg: "bg-blue-500/10"   },
            { icon: UserPlus,     label: "New Members",     value: s?.newMembers        ?? 0, f: (n: number) => n.toLocaleString("en-IN"), color: "text-emerald-400",bg: "bg-emerald-500/10"},
            { icon: CreditCard,   label: "Membership Rev",  value: s?.membershipRevenue ?? 0, f: fmt,                                      color: "text-primary",    bg: "bg-primary/10"    },
            { icon: ShoppingBag,  label: "Supplement Rev",  value: s?.supplementRevenue ?? 0, f: fmt,                                      color: "text-green-400",  bg: "bg-green-500/10"  },
            { icon: Lock,         label: "Locker Revenue",  value: s?.lockerRevenue     ?? 0, f: fmt,                                      color: "text-blue-400",   bg: "bg-blue-500/10"   },
            { icon: TrendingUp,   label: "Total Revenue",   value: s?.totalRevenue      ?? 0, f: fmt,                                      color: "text-white",      bg: "bg-white/8"       },
            { icon: TrendingDown, label: "Total Expenses",  value: s?.totalExpenses     ?? 0, f: fmt,                                      color: "text-red-400",    bg: "bg-red-500/10"    },
            {
              icon: TrendingUp,   label: "Net Revenue",     value: s?.netRevenue        ?? 0, f: fmt,
              color: (s?.netRevenue ?? 0) >= 0 ? "text-emerald-400" : "text-red-400",
              bg:    (s?.netRevenue ?? 0) >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
            },
            { icon: CalendarCheck,label: "Attendance",      value: s?.totalAttendance   ?? 0, f: (n: number) => n.toLocaleString("en-IN"), color: "text-purple-400", bg: "bg-purple-500/10" },
          ].map(({ icon: Icon, label, value, f, color, bg }) => (
            <div key={label} className={`bg-[hsl(220_25%_9%)] border rounded-2xl p-4 ${
              isPremium ? "border-white/10 hover:border-white/20 transition-colors" : "border-white/6"
            }`}>
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className={`text-xl font-bold ${color}`}>{loading ? "—" : f(value)}</p>
              <p className="text-white/35 text-xs mt-0.5">{label}</p>
              <p className="text-white/20 text-[10px] mt-0.5">{rangeLabel}</p>
            </div>
          ))}
        </div>

        {/* ── Charts: Revenue breakdown + Member growth ────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-5">

          {/* Revenue stacked bar */}
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold text-sm">Revenue Breakdown</h3>
                <p className="text-white/35 text-xs mt-0.5">{rangeLabel}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {([[C.membership, "Membership"], [C.supplement, "Supplements"], [C.locker, "Lockers"]] as const).map(
                  ([color, label]) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
                      <span className="text-white/30 text-[10px]">{label}</span>
                    </div>
                  )
                )}
              </div>
            </div>
            {loading
              ? <div className="h-28 bg-white/3 rounded-xl animate-pulse" />
              : (data?.revenueSeries?.length ?? 0) === 0
                ? <div className="h-28 flex items-center justify-center text-white/20 text-sm">No data for this period</div>
                : <StackedBar data={data!.revenueSeries} />
            }
            {/* Revenue footer totals */}
            {data && !loading && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-white/6 text-xs">
                <span className="text-white/40">Membership: <span className="font-semibold" style={{ color: C.membership }}>{fmt(s?.membershipRevenue ?? 0)}</span></span>
                <span className="text-white/40">Supplements: <span className="font-semibold" style={{ color: C.supplement }}>{fmt(s?.supplementRevenue ?? 0)}</span></span>
                {hasLocker && <span className="text-white/40">Lockers: <span className="font-semibold" style={{ color: C.locker }}>{fmt(s?.lockerRevenue ?? 0)}</span></span>}
                <span className="text-white/40 ml-auto">Total: <span className="font-semibold text-white">{fmt(s?.totalRevenue ?? 0)}</span></span>
              </div>
            )}
          </div>

          {/* Member growth */}
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
            <div className="mb-4">
              <h3 className="text-white font-semibold text-sm">New Members</h3>
              <p className="text-white/35 text-xs mt-0.5">{rangeLabel}</p>
            </div>
            {loading
              ? <div className="h-20 bg-white/3 rounded-xl animate-pulse" />
              : <LineChart data={data?.memberGrowthSeries ?? []} valueKey="count" color={C.members} />
            }
            {data && !loading && (
              <div className="flex mt-3 pt-3 border-t border-white/6 text-xs">
                <span className="text-white/40 ml-auto">
                  Total: <span className="font-semibold" style={{ color: C.members }}>
                    {(data.memberGrowthSeries ?? []).reduce((sum, d) => sum + d.count, 0)} new members
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Attendance chart ─────────────────────────────────────────────── */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-sm">Attendance</h3>
              <p className="text-white/35 text-xs mt-0.5">Check-ins · {rangeLabel}</p>
            </div>
            {data && !loading && (
              <p className="text-purple-400 font-bold text-lg">
                {(data.attendanceSeries ?? []).reduce((sum, d) => sum + d.count, 0).toLocaleString("en-IN")}
              </p>
            )}
          </div>
          {loading
            ? <div className="h-20 bg-white/3 rounded-xl animate-pulse" />
            : <LineChart data={data?.attendanceSeries ?? []} valueKey="count" color={C.attendance} emptyMsg="No check-ins in this period" />
          }
        </div>

        {/* ── Locker revenue (only when data exists) ──────────────────────── */}
        {(hasLocker || loading) && (
          <div className="bg-[hsl(220_25%_9%)] border border-blue-500/15 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-500/12 rounded-lg flex items-center justify-center">
                  <Lock className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Locker Revenue</h3>
                  <p className="text-white/35 text-xs mt-0.5">Fee collected · {rangeLabel}</p>
                </div>
              </div>
              {(s?.lockerRevenue ?? 0) > 0 && (
                <p className="text-blue-400 font-bold text-lg">{fmt(s!.lockerRevenue)}</p>
              )}
            </div>
            {loading
              ? <div className="h-20 bg-white/3 rounded-xl animate-pulse" />
              : <LineChart
                  data={data?.lockerRevenueSeries ?? []}
                  valueKey="amount"
                  color={C.locker}
                  emptyMsg="No locker fees in this period"
                />
            }
          </div>
        )}

        {/* ── Premium: expense trend (Pro/Enterprise) ─────────────────────── */}
        {isPremium && (
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold text-sm">Expense Trend</h3>
                <p className="text-white/35 text-xs mt-0.5">{rangeLabel}</p>
              </div>
              {data && !loading && (
                <p className="text-red-400 font-bold text-lg">{fmt(s?.totalExpenses ?? 0)}</p>
              )}
            </div>
            {loading
              ? <div className="h-20 bg-white/3 rounded-xl animate-pulse" />
              : <LineChart data={data?.expenseSeries ?? []} valueKey="amount" color={C.expense} emptyMsg="No expenses in this period" />
            }
          </div>
        )}

        {/* ── Per-gym breakdown table ──────────────────────────────────────── */}
        {(data?.topGyms?.length ?? 0) > 0 && (
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-sm">Per-Gym Breakdown</h3>
                <p className="text-white/35 text-xs mt-0.5">{rangeLabel}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {[
                      "Gym", "Active", "New", "Attendance",
                      "Mem. Rev", "Supp. Rev", "Locker Rev", "Total", "Expenses", "Net",
                    ].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-white/30 text-xs font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {data!.topGyms.map((g, i) => (
                    <tr key={i} className="hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3.5 text-white font-medium whitespace-nowrap">{g.name}</td>
                      <td className="px-5 py-3.5 text-white/60">{g.activeMembers}</td>
                      <td className="px-5 py-3.5 text-emerald-400">+{g.newMembers}</td>
                      <td className="px-5 py-3.5 text-white/60">{g.attendance}</td>
                      <td className="px-5 py-3.5 text-primary">{fmt(g.membershipRev)}</td>
                      <td className="px-5 py-3.5 text-green-400">{fmt(g.supplementRev)}</td>
                      <td className="px-5 py-3.5 text-blue-400">{fmt(g.lockerRev ?? 0)}</td>
                      <td className="px-5 py-3.5 text-white font-semibold">{fmt(g.totalRevenue)}</td>
                      <td className="px-5 py-3.5 text-red-400">{fmt(g.expenses)}</td>
                      <td className={`px-5 py-3.5 font-semibold ${g.netRevenue >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmt(g.netRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Upgrade prompt for Basic plan ────────────────────────────────── */}
        {!isPremium && data && (
          <div className="bg-linear-to-r from-primary/8 to-orange-500/5 border border-primary/15 rounded-2xl px-5 py-4 flex items-center gap-4 no-print">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">Unlock Premium Reports</p>
              <p className="text-white/45 text-xs mt-0.5">
                Upgrade to Pro or Enterprise to get Excel/PDF exports, expense trend charts, and detailed multi-gym analytics.
              </p>
            </div>
            <a
              href="/owner/subscriptions"
              className="shrink-0 inline-flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              <Zap className="w-3.5 h-3.5" />
              Upgrade
            </a>
          </div>
        )}
      </div>
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
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
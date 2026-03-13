// // src/app/owner/dashboard/page.tsx
// "use client"

// import { useEffect, useState } from "react"
// import Link from "next/link"
// import { useProfile } from "@/contexts/ProfileContext"
// import {
//   Users, Building2, CreditCard, CalendarCheck,
//   UserPlus, ClipboardList, BarChart3, Calendar,
//   ArrowRight, Loader2, TrendingUp, ShoppingBag, Package
// } from "lucide-react"
// import { Avatar } from "@/components/ui/Avatar"

// interface DashboardData {
//   totalMembers: number
//   activeGyms: number
//   monthlyRevenue: number
//   supplementRevenue: number
//   totalRevenue: number
//   todayAttendance: number
//   recentMembers: {
//     id: string
//     createdAt: string
//     status: string
//     profile: { fullName: string; avatarUrl: string | null; email: string }
//     gym: { name: string }
//   }[]
//   todayCheckins: {
//     id: string
//     checkInTime: string
//     checkOutTime: string | null
//     member: { profile: { fullName: string; avatarUrl: string | null } }
//   }[]
//   recentSupplementSales: {
//     id: string
//     qty: number
//     unitPrice: number
//     totalAmount: number
//     memberName: string | null
//     soldAt: string
//     supplement: { name: string; unitSize: string | null }
//     member: { profile: { fullName: string } } | null
//   }[]
//   gyms: { id: string; name: string; city: string | null }[]
// }

// function formatCurrency(amount: number) {
//   if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
//   if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
//   return `₹${amount}`
// }

// function timeAgo(dateStr: string) {
//   const diff = Date.now() - new Date(dateStr).getTime()
//   const days = Math.floor(diff / 86400000)
//   const hours = Math.floor(diff / 3600000)
//   const mins = Math.floor(diff / 60000)
//   if (days > 0) return `${days}d ago`
//   if (hours > 0) return `${hours}h ago`
//   return `${mins}m ago`
// }

// function StatCard({ icon: Icon, label, value, sub, subColor = "text-primary" }: {
//   icon: any; label: string; value: string | number; sub: string; subColor?: string
// }) {
//   return (
//     <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 flex items-start justify-between">
//       <div>
//         <p className="text-white/45 text-xs mb-3">{label}</p>
//         <p className="text-white text-3xl font-display font-bold mb-1">{value}</p>
//         <p className={`text-xs ${subColor}`}>{sub}</p>
//       </div>
//       <div className="p-2.5 bg-primary/10 rounded-xl">
//         <Icon className="w-5 h-5 text-primary" />
//       </div>
//     </div>
//   )
// }

// const quickActions = [
//   { icon: UserPlus,     label: "Add New Member",      desc: "Register a new gym member",   href: "/owner/members/new",   active: false },
//   { icon: ClipboardList,label: "Create Workout Plan", desc: "Design a new workout routine", href: "/owner/workouts/new",  active: true  },
//   { icon: BarChart3,    label: "View Reports",         desc: "Check your gym analytics",    href: "/owner/reports",       active: false },
//   { icon: Calendar,     label: "Schedule",             desc: "Manage gym schedules",         href: "/owner/schedule",      active: false },
// ]

// export default function OwnerDashboardPage() {
//   const { profile } = useProfile()
//   const [data, setData] = useState<DashboardData | null>(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     fetch("/api/owner/dashboard")
//       .then(r => r.json())
//       .then(d => { setData(d); setLoading(false) })
//       .catch(() => setLoading(false))
//   }, [])

//   const firstName = profile?.fullName?.split(" ")[0] ?? "there"

//   return (
//     <div className="space-y-6 max-w-7xl">

//       {/* Welcome Banner */}
//       <div className="relative bg-gradient-primary rounded-2xl p-8 overflow-hidden">
//         <div className="absolute inset-0 opacity-10"
//           style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
//         <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
//           <div>
//             <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-1">
//               Welcome back, {firstName}! 💪
//             </h2>
//             <p className="text-white/70 text-sm">Here&apos;s what&apos;s happening with your gyms today.</p>
//           </div>
//           <div className="flex items-center gap-3">
//             <Link href="/owner/gyms"
//               className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
//               Manage Gyms <ArrowRight className="w-4 h-4" />
//             </Link>
//             <Link href="/owner/gyms/new"
//               className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
//               Add New Gym
//             </Link>
//           </div>
//         </div>
//       </div>

//       {/* Stat Cards */}
//       {loading ? (
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//           {[...Array(4)].map((_, i) => (
//             <div key={i} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 h-28 animate-pulse" />
//           ))}
//         </div>
//       ) : (
//         <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
//           <StatCard icon={Users}       label="Total Members"       value={data?.totalMembers ?? 0}                            sub={`${data?.totalMembers ?? 0} active`} />
//           <StatCard icon={Building2}   label="Active Gyms"         value={data?.activeGyms ?? 0}                              sub="Managed by you" />
//           <StatCard icon={CreditCard}  label="Membership Revenue"  value={formatCurrency(data?.monthlyRevenue ?? 0)}          sub="This month" />
//           <StatCard icon={ShoppingBag} label="Supplement Revenue"  value={formatCurrency(data?.supplementRevenue ?? 0)}       sub="This month" subColor="text-green-400" />
//           <StatCard icon={TrendingUp}  label="Today's Attendance"  value={data?.todayAttendance ?? 0}                         sub="Check-ins today" />
//         </div>
//       )}

//       {/* Quick Actions */}
//       <div>
//         <h3 className="text-white font-display font-semibold mb-4">Quick Actions</h3>
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//           {quickActions.map(({ icon: Icon, label, desc, href, active }) => (
//             <Link key={href} href={href}
//               className={`rounded-2xl p-5 border transition-all hover:scale-[1.02] group ${
//                 active
//                   ? "border-primary/50 bg-primary/8"
//                   : "border-white/6 bg-[hsl(220_25%_9%)] hover:border-white/15"
//               }`}>
//               <div className={`p-2.5 rounded-xl mb-4 w-fit ${active ? "bg-primary/20" : "bg-white/5 group-hover:bg-white/8"}`}>
//                 <Icon className={`w-5 h-5 ${active ? "text-primary" : "text-white/50"}`} />
//               </div>
//               <p className="text-white font-semibold text-sm mb-1">{label}</p>
//               <p className="text-white/40 text-xs">{desc}</p>
//             </Link>
//           ))}
//         </div>
//       </div>

//       {/* Bottom grid */}
//       <div className="grid lg:grid-cols-2 gap-5">

//         {/* Recent Members */}
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
//           <div className="flex items-center justify-between mb-5">
//             <h3 className="text-white font-display font-semibold">Recent Members</h3>
//             <Link href="/owner/members" className="text-primary text-xs hover:text-primary/80 transition-colors flex items-center gap-1">
//               View all <ArrowRight className="w-3 h-3" />
//             </Link>
//           </div>
//           {loading ? (
//             <div className="space-y-3">
//               {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-white/3 rounded-xl animate-pulse" />)}
//             </div>
//           ) : data?.recentMembers.length === 0 ? (
//             <div className="text-center py-8">
//               <Users className="w-8 h-8 text-white/15 mx-auto mb-2" />
//               <p className="text-white/30 text-sm">No members yet</p>
//               <Link href="/owner/members/new" className="text-primary text-xs mt-1 inline-block hover:underline">Add your first member</Link>
//             </div>
//           ) : (
//             <div className="space-y-2">
//               {data?.recentMembers.map((m) => (
//                 <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors">
//                   <Avatar name={m.profile.fullName} url={m.profile.avatarUrl} size={36} />
//                   <div className="flex-1 min-w-0">
//                     <p className="text-white text-sm font-medium truncate">{m.profile.fullName}</p>
//                     <p className="text-white/35 text-xs">Joined {timeAgo(m.createdAt)}</p>
//                   </div>
//                   <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
//                     m.status === "ACTIVE" ? "bg-green-500/15 text-green-400" : "bg-white/8 text-white/40"
//                   }`}>
//                     {m.status === "ACTIVE" ? "Active" : "New"}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Today's Attendance */}
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
//           <div className="flex items-center justify-between mb-5">
//             <h3 className="text-white font-display font-semibold">Today&apos;s Attendance</h3>
//             <Link href="/owner/attendance" className="text-primary text-xs hover:text-primary/80 transition-colors flex items-center gap-1">
//               View all <ArrowRight className="w-3 h-3" />
//             </Link>
//           </div>
//           {loading ? (
//             <div className="space-y-3">
//               {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-white/3 rounded-xl animate-pulse" />)}
//             </div>
//           ) : data?.todayCheckins.length === 0 ? (
//             <div className="text-center py-4">
//               <div className="text-5xl font-display font-bold text-primary mb-2">0</div>
//               <p className="text-white/35 text-sm">Members checked in today</p>
//             </div>
//           ) : (
//             <>
//               <div className="text-center py-3 mb-4">
//                 <div className="text-5xl font-display font-bold text-primary">{data?.todayAttendance}</div>
//                 <p className="text-white/35 text-sm mt-1">Members checked in today</p>
//               </div>
//               <div className="space-y-2">
//                 {data?.todayCheckins.slice(0, 4).map((c) => (
//                   <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors">
//                     <Avatar name={c.member.profile.fullName} url={c.member.profile.avatarUrl} size={32} />
//                     <div className="flex-1 min-w-0">
//                       <p className="text-white text-sm truncate">{c.member.profile.fullName}</p>
//                       <p className="text-white/35 text-xs">{new Date(c.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
//                     </div>
//                     <span className={`w-2 h-2 rounded-full ${c.checkOutTime ? "bg-white/20" : "bg-green-400"}`} />
//                   </div>
//                 ))}
//               </div>
//             </>
//           )}
//         </div>
//       </div>

//       {/* Recent Supplement Sales */}
//       {(data?.recentSupplementSales?.length ?? 0) > 0 && (
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
//           <div className="flex items-center justify-between mb-5">
//             <div className="flex items-center gap-2">
//               <Package className="w-4 h-4 text-primary/70" />
//               <h3 className="text-white font-display font-semibold">Recent Supplement Sales</h3>
//             </div>
//             <Link href="/owner/supplements" className="text-primary text-xs hover:text-primary/80 transition-colors flex items-center gap-1">
//               View all <ArrowRight className="w-3 h-3" />
//             </Link>
//           </div>
//           <div className="space-y-2">
//             {data?.recentSupplementSales.map(s => (
//               <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors">
//                 <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
//                   <ShoppingBag className="w-4 h-4 text-green-400" />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-white text-sm font-medium truncate">
//                     {s.supplement.name}{s.supplement.unitSize ? ` (${s.supplement.unitSize})` : ""}
//                   </p>
//                   <p className="text-white/35 text-xs">
//                     {s.member?.profile.fullName ?? s.memberName ?? "Walk-in"} · {s.qty} unit{s.qty > 1 ? "s" : ""} · {timeAgo(s.soldAt)}
//                   </p>
//                 </div>
//                 <span className="text-green-400 font-semibold text-sm">₹{Number(s.totalAmount).toLocaleString("en-IN")}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }



// src/app/owner/dashboard/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useProfile } from "@/contexts/ProfileContext"
import {
  Users, Building2, CreditCard, CalendarCheck, UserPlus, ClipboardList,
  BarChart3, Calendar, ArrowRight, Loader2, TrendingUp, ShoppingBag,
  Package, AlertTriangle, Zap, ChevronDown, RefreshCw, Bell
} from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"

interface DashboardData {
  totalMembers: number; activeGyms: number; monthlyRevenue: number
  supplementRevenue: number; totalRevenue: number
  todayRevenue: number; todayAttendance: number
  todayNewMembers: number; expiringMembers: number
  recentMembers: {
    id: string; createdAt: string; status: string
    profile: { fullName: string; avatarUrl: string | null; email: string }
    gym: { name: string }
  }[]
  todayCheckins: {
    id: string; checkInTime: string; checkOutTime: string | null
    member: { profile: { fullName: string; avatarUrl: string | null } }
  }[]
  recentSupplementSales: {
    id: string; qty: number; totalAmount: number; memberName: string | null; soldAt: string
    supplement: { name: string; unitSize: string | null }
    member: { profile: { fullName: string } } | null
  }[]
  gyms: { id: string; name: string; city: string | null }[]
  dailyRevenue: { date: string; revenue: number }[]
  filteredGymId: string | null
}

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toLocaleString("en-IN")}`
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), dy = Math.floor(diff / 86400000)
  if (dy > 0) return `${dy}d ago`; if (h > 0) return `${h}h ago`; return `${m}m ago`
}

function Sparkline({ data }: { data: { date: string; revenue: number }[] }) {
  const max = Math.max(...data.map(d => d.revenue), 1)
  return (
    <div className="flex items-end gap-1 h-8 mt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="w-full rounded-sm transition-all"
            style={{ height: `${Math.max((d.revenue / max) * 28, 2)}px`, background: d.revenue > 0 ? "hsl(24 95% 53%)" : "rgba(255,255,255,0.08)" }} />
        </div>
      ))}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, subColor = "text-primary", highlight = false, trend }: {
  icon: any; label: string; value: string | number; sub: string
  subColor?: string; highlight?: boolean; trend?: "up" | "down" | null
}) {
  return (
    <div className={`bg-[hsl(220_25%_9%)] border rounded-2xl p-5 flex flex-col gap-3 transition-all hover:border-white/12 ${
      highlight ? "border-primary/30 bg-primary/5" : "border-white/6"
    }`}>
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${highlight ? "bg-primary/20" : "bg-white/6"}`}>
          <Icon className={`w-4 h-4 ${highlight ? "text-primary" : "text-white/50"}`} />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            trend === "up" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
          }`}>
            {trend === "up" ? "↑" : "↓"}
          </span>
        )}
      </div>
      <div>
        <p className={`text-2xl font-display font-bold ${highlight ? "text-primary" : "text-white"}`}>{value}</p>
        <p className="text-white/40 text-xs mt-0.5">{label}</p>
      </div>
      <p className={`text-xs ${subColor}`}>{sub}</p>
    </div>
  )
}

export default function OwnerDashboardPage() {
  const { profile } = useProfile()
  const [data,       setData]       = useState<DashboardData | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [gymFilter,  setGymFilter]  = useState("")

  const load = useCallback(async (gid = gymFilter, silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true)
    const url = gid ? `/api/owner/dashboard?gymId=${gid}` : "/api/owner/dashboard"
    try {
      const res = await fetch(url)
      const d   = await res.json()
      setData(d)
    } finally {
      setLoading(false); setRefreshing(false)
    }
  }, [gymFilter])

  useEffect(() => { load() }, [gymFilter])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const id = setInterval(() => load(gymFilter, true), 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [gymFilter, load])

  const firstName = profile?.fullName?.split(" ")[0] ?? "Owner"
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  const QUICK_ACTIONS = [
    { label: "Add Member",   href: "/owner/members/new",     icon: UserPlus,     color: "text-blue-400",   bg: "bg-blue-500/10" },
    { label: "Attendance",   href: "/owner/attendance",      icon: CalendarCheck, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Workout Plan", href: "/owner/workouts",        icon: ClipboardList, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Reports",      href: "/owner/reports",         icon: BarChart3,    color: "text-orange-400", bg: "bg-orange-500/10" },
  ]

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">{greeting}, {firstName} 👋</h1>
          <p className="text-white/35 text-sm mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Gym filter */}
          {(data?.gyms?.length ?? 0) > 1 && (
            <div className="relative">
              <select
                value={gymFilter}
                onChange={e => setGymFilter(e.target.value)}
                className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white/70 rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none focus:border-primary cursor-pointer">
                <option value="">All Gyms</option>
                {data?.gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            </div>
          )}
          <button onClick={() => load(gymFilter, true)} disabled={refreshing}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Expiring Members Alert */}
      {!loading && (data?.expiringMembers ?? 0) > 0 && (
        <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-yellow-300 text-sm flex-1">
            <span className="font-semibold">{data!.expiringMembers} member{data!.expiringMembers > 1 ? "s" : ""}</span>{" "}
            expiring within 7 days — consider sending renewal reminders.
          </p>
          <Link href="/owner/members" className="text-yellow-400 text-xs hover:underline shrink-0">View →</Link>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-white/3 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* TODAY stats row */}
          <div>
            <p className="text-white/30 text-xs font-medium uppercase tracking-wider mb-3">Today</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon={Zap}          label="Today's Revenue"   value={fmt(data?.todayRevenue ?? 0)}       sub="All sources"         highlight subColor="text-primary" />
              <StatCard icon={CalendarCheck} label="Check-ins Today"   value={data?.todayAttendance ?? 0}         sub="Members in gym"      subColor="text-green-400" />
              <StatCard icon={UserPlus}      label="New Members Today" value={data?.todayNewMembers ?? 0}          sub="Joined today"        subColor="text-blue-400" />
              <StatCard icon={AlertTriangle} label="Expiring Soon"     value={data?.expiringMembers ?? 0}         sub="Next 7 days"         subColor="text-yellow-400" />
            </div>
          </div>

          {/* MONTH stats row */}
          <div>
            <p className="text-white/30 text-xs font-medium uppercase tracking-wider mb-3">This Month</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon={Users}      label="Active Members"      value={data?.totalMembers ?? 0}            sub={`${data?.activeGyms} gym${(data?.activeGyms ?? 0) > 1 ? "s" : ""}`} />
              <StatCard icon={Building2}  label="Active Gyms"         value={data?.activeGyms ?? 0}              sub="Managed by you" />
              <StatCard icon={CreditCard} label="Membership Revenue"  value={fmt(data?.monthlyRevenue ?? 0)}     sub="This month"         subColor="text-primary" />
              <StatCard icon={ShoppingBag} label="Supplement Revenue" value={fmt(data?.supplementRevenue ?? 0)}  sub="This month"         subColor="text-green-400" />
            </div>
          </div>

          {/* Revenue sparkline */}
          {(data?.dailyRevenue?.length ?? 0) > 0 && (
            <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white font-medium text-sm">Last 7 Days Revenue</p>
                <p className="text-primary font-bold text-sm">{fmt(data?.totalRevenue ?? 0)} this month</p>
              </div>
              <Sparkline data={data!.dailyRevenue} />
              <div className="flex justify-between mt-1.5">
                {data!.dailyRevenue.map((d, i) => (
                  <span key={i} className="flex-1 text-center text-white/25 text-[10px]">{d.date}</span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick Actions */}
      <div>
        <p className="text-white/30 text-xs font-medium uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(a => (
            <Link key={a.label} href={a.href}
              className="flex items-center gap-3 p-4 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl hover:border-white/15 transition-all group">
              <div className={`w-9 h-9 rounded-xl ${a.bg} flex items-center justify-center shrink-0`}>
                <a.icon className={`w-4 h-4 ${a.color}`} />
              </div>
              <span className="text-white/70 text-sm font-medium group-hover:text-white transition-colors">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Two-column section */}
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
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-white/3 rounded-xl animate-pulse" />)}</div>
          ) : (data?.recentMembers.length ?? 0) === 0 ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-white/15 mx-auto mb-2" />
              <p className="text-white/30 text-sm">No members yet</p>
              <Link href="/owner/members/new" className="text-primary text-xs mt-1 inline-block hover:underline">Add your first member →</Link>
            </div>
          ) : (
            <div className="space-y-1">
              {data!.recentMembers.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/3 transition-colors">
                  <Avatar name={m.profile.fullName} url={m.profile.avatarUrl} size={34} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{m.profile.fullName}</p>
                    <p className="text-white/35 text-xs">{m.gym.name} · {timeAgo(m.createdAt)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    m.status === "ACTIVE" ? "bg-green-500/15 text-green-400" : "bg-white/8 text-white/40"
                  }`}>{m.status === "ACTIVE" ? "Active" : "Pending"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Check-ins */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Today's Check-ins</h3>
            <Link href="/owner/attendance" className="text-primary text-xs hover:text-primary/80 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-white/3 rounded-xl animate-pulse" />)}</div>
          ) : (data?.todayCheckins.length ?? 0) === 0 ? (
            <div className="text-center py-6">
              <div className="text-4xl font-display font-bold text-white/10 mb-2">0</div>
              <p className="text-white/30 text-sm">No check-ins today yet</p>
            </div>
          ) : (
            <>
              <div className="text-center py-2 mb-3">
                <div className="text-4xl font-display font-bold text-primary">{data!.todayAttendance}</div>
                <p className="text-white/35 text-xs mt-0.5">total check-ins today</p>
              </div>
              <div className="space-y-1">
                {data!.todayCheckins.slice(0, 5).map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/3 transition-colors">
                    <Avatar name={c.member.profile.fullName} url={c.member.profile.avatarUrl} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{c.member.profile.fullName}</p>
                      <p className="text-white/35 text-xs">{new Date(c.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${c.checkOutTime ? "bg-white/20" : "bg-green-400"}`} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Supplement Sales */}
      {(data?.recentSupplementSales?.length ?? 0) > 0 && (
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
                  <p className="text-white/35 text-[11px]">{s.member?.profile.fullName ?? s.memberName ?? "Walk-in"} · {s.qty}×</p>
                </div>
                <p className="text-green-400 text-xs font-semibold">₹{Number(s.totalAmount).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
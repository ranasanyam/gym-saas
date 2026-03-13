// // src/app/member/dashboard/page.tsx
// "use client"

// import { useEffect, useState } from "react"
// import Link from "next/link"
// import { useProfile } from "@/contexts/ProfileContext"
// import {
//   CalendarCheck, Dumbbell, UtensilsCrossed, Bell, Clock,
//   Building2, ChevronRight, AlertTriangle, CheckCircle2, Loader2, Compass
// } from "lucide-react"

// interface DashboardData {
//   activeMembership: any
//   memberships: any[]
//   stats: { attendanceThisMonth: number; totalAttendance: number; workoutPlans: number; dietPlans: number; daysUntilExpiry: number | null; unreadNotifications: number }
//   recentAttendance: any[]
// }

// export default function MemberDashboard() {
//   const { profile } = useProfile()
//   const [data, setData] = useState<DashboardData | null>(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     fetch("/api/member/dashboard").then(r => r.json()).then(setData).finally(() => setLoading(false))
//   }, [])

//   if (loading) return (
//     <div className="flex items-center justify-center h-64">
//       <Loader2 className="w-6 h-6 text-primary animate-spin" />
//     </div>
//   )

//   const { activeMembership, stats, recentAttendance, memberships } = data!
//   const noGym = !activeMembership

//   const firstName = profile?.fullName?.split(" ")[0] ?? "there"

//   return (
//     <div className="max-w-5xl space-y-6">

//       {/* Welcome banner */}
//       <div className="relative bg-linear-to-br from-primary/20 via-primary/8 to-transparent border border-primary/15 rounded-2xl p-6 overflow-hidden">
//         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
//         <div className="relative">
//           <p className="text-primary text-sm font-medium mb-1">Welcome back 👋</p>
//           <h2 className="text-2xl font-display font-bold text-white mb-2">{firstName}!</h2>
//           {activeMembership ? (
//             <p className="text-white/50 text-sm">Active member at <span className="text-white font-medium">{activeMembership.gym.name}</span></p>
//           ) : (
//             <p className="text-white/50 text-sm">You're not enrolled in any gym yet.</p>
//           )}
//         </div>
//       </div>

//       {/* No gym — Discover CTA */}
//       {noGym && (
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-8 text-center">
//           <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
//             <Compass className="w-7 h-7 text-primary" />
//           </div>
//           <h3 className="text-white font-display font-bold text-lg mb-2">Find Your Gym</h3>
//           <p className="text-white/40 text-sm mb-5 max-w-xs mx-auto">Browse gyms in your city, view membership plans, and join the one that fits you.</p>
//           <Link href="/member/discover"
//             className="inline-flex items-center gap-2 bg-gradient-primary text-white font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
//             <Compass className="w-4 h-4" /> Discover Gyms
//           </Link>
//         </div>
//       )}

//       {/* Expiry warning */}
//       {stats.daysUntilExpiry !== null && stats.daysUntilExpiry <= 10 && stats.daysUntilExpiry > 0 && (
//         <div className="flex items-start gap-3 bg-yellow-500/8 border border-yellow-500/20 rounded-2xl p-4">
//           <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
//           <div>
//             <p className="text-yellow-300 font-semibold text-sm">Membership expiring soon</p>
//             <p className="text-yellow-400/70 text-xs mt-0.5">Your membership expires in {stats.daysUntilExpiry} day{stats.daysUntilExpiry !== 1 ? "s" : ""}. Contact your gym to renew.</p>
//           </div>
//         </div>
//       )}

//       {stats.daysUntilExpiry !== null && stats.daysUntilExpiry <= 0 && (
//         <div className="flex items-start gap-3 bg-red-500/8 border border-red-500/20 rounded-2xl p-4">
//           <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
//           <div>
//             <p className="text-red-300 font-semibold text-sm">Membership expired</p>
//             <p className="text-red-400/70 text-xs mt-0.5">Your membership has expired. Contact your gym owner to renew.</p>
//           </div>
//         </div>
//       )}

//       {/* Stat cards */}
//       {activeMembership && (
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//           {[
//             { icon: CalendarCheck, label: "This Month", value: stats.attendanceThisMonth, sub: "Check-ins", href: "/member/attendance", color: "text-green-400", bg: "bg-green-500/10" },
//             { icon: Dumbbell, label: "Workout Plans", value: stats.workoutPlans, sub: "Available", href: "/member/workouts", color: "text-blue-400", bg: "bg-blue-500/10" },
//             { icon: UtensilsCrossed, label: "Diet Plans", value: stats.dietPlans, sub: "Available", href: "/member/diet", color: "text-orange-400", bg: "bg-orange-500/10" },
//             { icon: Bell, label: "Notifications", value: stats.unreadNotifications, sub: "Unread", href: "/member/notifications", color: "text-purple-400", bg: "bg-purple-500/10" },
//           ].map(({ icon: Icon, label, value, sub, href, color, bg }) => (
//             <Link key={label} href={href}
//               className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 flex items-start justify-between hover:border-white/12 transition-colors group">
//               <div>
//                 <p className="text-white/40 text-xs mb-1">{label}</p>
//                 <p className="text-white text-2xl font-display font-bold">{value}</p>
//                 <p className="text-white/35 text-xs mt-0.5">{sub}</p>
//               </div>
//               <div className={`p-2.5 ${bg} rounded-xl`}><Icon className={`w-5 h-5 ${color}`} /></div>
//             </Link>
//           ))}
//         </div>
//       )}

//       <div className="grid lg:grid-cols-2 gap-5">
//         {/* Active Membership Card */}
//         {activeMembership && (
//           <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
//             <div className="flex items-center justify-between mb-5">
//               <h3 className="text-white font-semibold text-sm">Active Membership</h3>
//               <Link href="/member/gym" className="text-primary text-xs hover:underline flex items-center gap-1">
//                 View details <ChevronRight className="w-3 h-3" />
//               </Link>
//             </div>
//             <div className="flex items-start gap-4">
//               <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
//                 <Building2 className="w-6 h-6 text-primary" />
//               </div>
//               <div className="flex-1 min-w-0">
//                 <p className="text-white font-semibold truncate">{activeMembership.gym.name}</p>
//                 <p className="text-white/40 text-xs mt-0.5">{activeMembership.gym.city}</p>
//                 {activeMembership.membershipPlan && (
//                   <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
//                     {activeMembership.membershipPlan.name}
//                   </span>
//                 )}
//               </div>
//             </div>
//             <div className="mt-4 pt-4 border-t border-white/6 grid grid-cols-2 gap-3 text-xs">
//               <div>
//                 <p className="text-white/35">Start Date</p>
//                 <p className="text-white/80 font-medium mt-0.5">
//                   {new Date(activeMembership.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
//                 </p>
//               </div>
//               <div>
//                 <p className="text-white/35">Expires</p>
//                 <p className={`font-medium mt-0.5 ${stats.daysUntilExpiry !== null && stats.daysUntilExpiry <= 10 ? "text-yellow-400" : "text-white/80"}`}>
//                   {activeMembership.endDate
//                     ? new Date(activeMembership.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
//                     : "No expiry"}
//                 </p>
//               </div>
//               {activeMembership.assignedTrainer && (
//                 <div className="col-span-2">
//                   <p className="text-white/35">Assigned Trainer</p>
//                   <p className="text-white/80 font-medium mt-0.5">{activeMembership.assignedTrainer.profile.fullName}</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Recent Attendance */}
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
//           <div className="flex items-center justify-between mb-5">
//             <h3 className="text-white font-semibold text-sm">Recent Check-ins</h3>
//             <Link href="/member/attendance" className="text-primary text-xs hover:underline flex items-center gap-1">
//               View all <ChevronRight className="w-3 h-3" />
//             </Link>
//           </div>
//           {recentAttendance.length === 0 ? (
//             <div className="text-center py-6">
//               <CalendarCheck className="w-8 h-8 text-white/15 mx-auto mb-2" />
//               <p className="text-white/30 text-sm">No check-ins yet</p>
//             </div>
//           ) : (
//             <div className="space-y-3">
//               {recentAttendance.map((a: any) => {
//                 const checkIn  = new Date(a.checkInTime)
//                 const checkOut = a.checkOutTime ? new Date(a.checkOutTime) : null
//                 const durationMin = checkOut ? Math.round((checkOut.getTime() - checkIn.getTime()) / 60000) : null
//                 return (
//                   <div key={a.id} className="flex items-center gap-3">
//                     <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
//                       <CheckCircle2 className="w-4 h-4 text-green-400" />
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <p className="text-white/80 text-sm font-medium">{a.gym.name}</p>
//                       <p className="text-white/35 text-xs">
//                         {checkIn.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {checkIn.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
//                       </p>
//                     </div>
//                     {durationMin && (
//                       <span className="text-white/30 text-xs flex items-center gap-1">
//                         <Clock className="w-3 h-3" /> {durationMin}m
//                       </span>
//                     )}
//                   </div>
//                 )
//               })}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Multiple memberships */}
//       {memberships.length > 1 && (
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
//           <h3 className="text-white font-semibold text-sm mb-4">All Memberships</h3>
//           <div className="space-y-3">
//             {memberships.map((m: any) => (
//               <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
//                 <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
//                   <Building2 className="w-4 h-4 text-primary" />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-white text-sm font-medium truncate">{m.gym.name}</p>
//                   <p className="text-white/35 text-xs">{m.membershipPlan?.name ?? "No plan"}</p>
//                 </div>
//                 <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
//                   m.status === "ACTIVE" ? "bg-green-500/15 text-green-400"
//                   : m.status === "EXPIRED" ? "bg-red-500/15 text-red-400"
//                   : "bg-white/8 text-white/40"
//                 }`}>{m.status}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// src/app/member/dashboard/page.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useProfile } from "@/contexts/ProfileContext"
import {
  CalendarCheck, Dumbbell, UtensilsCrossed, Bell, Clock,
  Building2, ChevronRight, AlertTriangle, CheckCircle2, Loader2, Compass,
  Flame, Trophy, Zap, Star, Gift, TrendingUp
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar } from "@/components/ui/Avatar"

interface DashboardData {
  activeMembership: any
  memberships:      any[]
  stats: {
    attendanceThisMonth:  number
    totalAttendance:      number
    workoutPlans:         number
    dietPlans:            number
    daysUntilExpiry:      number | null
    unreadNotifications:  number
  }
  recentAttendance: any[]
  streak?:          { current: number; longest: number; total: number }
  milestones?:      { milestone: number; achievedAt: string }[]
  checkedInToday?:  boolean
}

const MILESTONE_LABELS: Record<number, { emoji: string; title: string; color: string }> = {
  7:   { emoji: "🔥", title: "7-Day Streak",      color: "from-orange-500/20 to-yellow-500/10"  },
  14:  { emoji: "⚡", title: "2-Week Warrior",     color: "from-yellow-500/20 to-orange-500/10" },
  30:  { emoji: "🏆", title: "Consistency King",   color: "from-primary/20 to-orange-500/10"    },
  60:  { emoji: "💪", title: "60-Day Champion",    color: "from-blue-500/20 to-primary/10"      },
  100: { emoji: "👑", title: "100-Day Legend",     color: "from-purple-500/20 to-blue-500/10"   },
  180: { emoji: "🌟", title: "180-Day Elite",      color: "from-green-500/20 to-blue-500/10"    },
  365: { emoji: "🎖️", title: "1-Year Titan",       color: "from-yellow-500/20 to-purple-500/10" },
}

// Consistency poster — shown for 30 / 100 / 365-day milestones
function ConsistencyPoster({
  memberName, gymName, milestone, avatarUrl, achievedAt,
}: {
  memberName: string; gymName: string; milestone: number
  avatarUrl?: string | null; achievedAt: string
}) {
  const cfg = MILESTONE_LABELS[milestone] ?? {
    emoji: "🏆",
    title: `${milestone}-Day Achievement`,
    color: "from-primary/20 to-orange-500/10",
  }
  return (
    <div className={`relative bg-linear-to-br ${cfg.color} border border-primary/20 rounded-2xl p-6 overflow-hidden`}>
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-orange-500/10 blur-2xl" />
      <div className="relative text-center space-y-3">
        <div className="text-4xl">{cfg.emoji}</div>
        <div>
          <p className="text-primary text-xs font-semibold uppercase tracking-widest">{gymName}</p>
          <p className="text-white text-xl font-display font-bold mt-1">{cfg.title}</p>
          <p className="text-white/50 text-xs mt-0.5">
            {milestone} days of consistency —{" "}
            {new Date(achievedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 mt-2">
          <Avatar name={memberName} url={avatarUrl} size={48} />
          <div className="text-left">
            <p className="text-white font-bold text-sm">{memberName}</p>
            <p className="text-white/40 text-xs">{milestone}-Day Member</p>
          </div>
        </div>
        <div className="flex justify-center gap-1 mt-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 text-primary fill-primary" />
          ))}
        </div>
      </div>
    </div>
  )
}

function StreakWidget({
  streak, checkedInToday, onCheckIn, checking,
}: {
  streak: { current: number; longest: number; total: number }
  checkedInToday: boolean; onCheckIn: () => void; checking: boolean
}) {
  const cur = streak.current
  const flameColor = cur >= 30 ? "text-yellow-400" : cur >= 7 ? "text-orange-400" : "text-primary"

  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className={`w-5 h-5 ${flameColor}`} />
          <h3 className="text-white font-semibold text-sm">Your Streak</h3>
        </div>
        {checkedInToday ? (
          <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
            <CheckCircle2 className="w-3 h-3" /> Checked in today
          </span>
        ) : (
          <button
            onClick={onCheckIn}
            disabled={checking}
            className="flex items-center gap-1.5 text-xs text-white font-semibold bg-linear-to-r from-primary to-orange-400 rounded-full px-4 py-1.5 hover:opacity-90 transition-all disabled:opacity-50"
          >
            {checking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {checking ? "Checking in…" : "Check In Now"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: "Current Streak", value: cur,          color: flameColor, sub: "days" },
          { label: "Best Streak",    value: streak.longest, color: "text-white",  sub: "days" },
          { label: "Total Check-ins",value: streak.total,  color: "text-white",  sub: "all time" },
        ].map(s => (
          <div key={s.label}>
            <div className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</div>
            <p className="text-white/35 text-xs mt-0.5">{s.label}</p>
            <p className="text-white/20 text-[10px]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* 7-day mini bar */}
      <div className="mt-4 flex gap-1">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-all ${i < Math.min(cur, 7) ? "bg-primary" : "bg-white/10"}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <p className="text-white/20 text-[10px]">This week</p>
        {cur > 0 && <p className="text-primary/60 text-[10px]">🔥 Keep it up!</p>}
      </div>
    </div>
  )
}

export default function MemberDashboard() {
  const { profile } = useProfile()
  const { toast }   = useToast()
  const [data,     setData]     = useState<DashboardData | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [checking, setChecking] = useState(false)

  const load = () => {
    fetch("/api/member/dashboard")
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCheckIn = async () => {
    setChecking(true)
    try {
      const res = await fetch("/api/member/attendance", { method: "POST" })
      const d   = await res.json()
      if (res.ok) {
        toast({
          variant:     "success",
          title:       d.message ?? "Checked in! 🔥",
          description: d.newMilestones?.length > 0
            ? `🏆 New milestone: ${d.newMilestones.map((m: number) => MILESTONE_LABELS[m]?.title ?? `${m} days`).join(", ")}!`
            : undefined,
        })
        load()
      } else {
        toast({ variant: "destructive", title: d.error ?? "Could not check in" })
      }
    } finally {
      setChecking(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  )
  if (!data) return null

  const { activeMembership, stats, recentAttendance } = data
  const streak         = data.streak ?? { current: 0, longest: 0, total: 0 }
  const checkedInToday = data.checkedInToday ?? false
  const milestones     = data.milestones ?? []
  const firstName      = profile?.fullName?.split(" ")[0] ?? "there"

  // Poster milestones — 30, 100, 365
  const posterMilestones = milestones.filter(m => [30, 100, 365].includes(m.milestone))

  return (
    <div className="max-w-5xl space-y-6">

      {/* ── Welcome banner ─────────────────────────────────────── */}
      <div className="relative bg-linear-to-br from-primary/20 via-primary/8 to-transparent border border-primary/15 rounded-2xl p-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-primary text-sm font-medium mb-1">Welcome back 👋</p>
            <h2 className="text-2xl font-display font-bold text-white">{firstName}!</h2>
            {activeMembership ? (
              <p className="text-white/50 text-sm mt-1">
                Active member at{" "}
                <span className="text-white font-medium">{activeMembership.gym.name}</span>
              </p>
            ) : (
              <p className="text-white/50 text-sm mt-1">You're not enrolled in any gym yet.</p>
            )}
          </div>
          {streak.current > 0 && (
            <div className="flex flex-col items-center bg-black/20 rounded-2xl p-3 border border-primary/20 shrink-0">
              <Flame className="w-5 h-5 text-primary mb-1" />
              <p className="text-primary font-display font-bold text-lg leading-none">{streak.current}</p>
              <p className="text-white/30 text-[10px] mt-0.5">streak</p>
            </div>
          )}
        </div>
      </div>

      {/* ── No gym CTA ─────────────────────────────────────────── */}
      {!activeMembership && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Compass className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-white font-display font-bold text-lg mb-2">Find Your Gym</h3>
          <p className="text-white/40 text-sm mb-5 max-w-xs mx-auto">Browse gyms in your city and join today.</p>
          <Link href="/member/discover"
            className="inline-flex items-center gap-2 bg-linear-to-r from-primary to-orange-400 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-all">
            <Compass className="w-4 h-4" /> Discover Gyms
          </Link>
        </div>
      )}

      {/* ── Expiry warning ─────────────────────────────────────── */}
      {stats.daysUntilExpiry !== null && stats.daysUntilExpiry <= 10 && stats.daysUntilExpiry > 0 && (
        <div className="flex items-start gap-3 bg-yellow-500/8 border border-yellow-500/20 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 font-semibold text-sm">Membership expiring soon</p>
            <p className="text-yellow-400/70 text-xs mt-0.5">
              Expires in {stats.daysUntilExpiry} day{stats.daysUntilExpiry !== 1 ? "s" : ""} — contact your gym to renew.
            </p>
          </div>
        </div>
      )}

      {/* ── Streak widget ───────────────────────────────────────── */}
      {activeMembership && (
        <StreakWidget
          streak={streak}
          checkedInToday={checkedInToday}
          onCheckIn={handleCheckIn}
          checking={checking}
        />
      )}

      {/* ── Consistency Posters ─────────────────────────────────── */}
      {posterMilestones.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-primary" />
            <h3 className="text-white font-semibold text-sm">Your Achievements</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {posterMilestones.map(m => (
              <ConsistencyPoster
                key={m.milestone}
                memberName={profile?.fullName ?? "Member"}
                gymName={activeMembership?.gym?.name ?? "Your Gym"}
                milestone={m.milestone}
                avatarUrl={profile?.avatarUrl}
                achievedAt={m.achievedAt}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Stats grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: CalendarCheck,  label: "This Month",      value: stats.attendanceThisMonth, color: "text-primary",    bg: "bg-primary/10" },
          { icon: TrendingUp,     label: "Total Check-ins", value: streak.total,              color: "text-blue-400",   bg: "bg-blue-500/10" },
          { icon: Dumbbell,       label: "Workout Plans",   value: stats.workoutPlans,         color: "text-purple-400", bg: "bg-purple-500/10" },
          { icon: UtensilsCrossed,label: "Diet Plans",      value: stats.dietPlans,            color: "text-green-400",  bg: "bg-green-500/10" },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4">
            <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-white/35 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Quick links ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Workout Plans", href: "/member/workouts",   icon: Dumbbell,         color: "text-purple-400", bg: "bg-purple-500/10", desc: `${stats.workoutPlans} plans` },
          { label: "Diet Plans",    href: "/member/diet",       icon: UtensilsCrossed,  color: "text-green-400",  bg: "bg-green-500/10",  desc: "Nutrition guide" },
          { label: "Attendance",    href: "/member/attendance", icon: CalendarCheck,    color: "text-primary",    bg: "bg-primary/10",    desc: `${stats.attendanceThisMonth} this month` },
          { label: "Refer & Earn",  href: "/member/referral",   icon: Gift,             color: "text-yellow-400", bg: "bg-yellow-500/10", desc: "Earn ₹100/referral" },
        ].map(q => (
          <Link key={q.label} href={q.href}
            className="flex items-center gap-3 p-4 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl hover:border-white/15 transition-all group">
            <div className={`w-9 h-9 ${q.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <q.icon className={`w-4 h-4 ${q.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{q.label}</p>
              <p className="text-white/35 text-xs">{q.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 shrink-0" />
          </Link>
        ))}
      </div>

      {/* ── Recent attendance ───────────────────────────────────── */}
      {recentAttendance.length > 0 && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Recent Activity</h3>
            <Link href="/member/attendance" className="text-primary text-xs hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {recentAttendance.slice(0, 4).map((r: any) => {
              const checkinDate = new Date(r.checkInTime)
              const isToday     = checkinDate.toDateString() === new Date().toDateString()
              return (
                <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isToday ? "bg-green-400" : "bg-white/20"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium">{r.gym?.name}</p>
                    <p className="text-white/35 text-xs">
                      {isToday
                        ? "Today"
                        : checkinDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                      {" · "}
                      {checkinDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {r.checkOutTime ? (
                    <span className="text-white/30 text-[10px]">
                      {Math.round((new Date(r.checkOutTime).getTime() - checkinDate.getTime()) / 60000)}m
                    </span>
                  ) : isToday ? (
                    <span className="text-green-400 text-[10px] bg-green-500/10 px-2 py-0.5 rounded-full">Active</span>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
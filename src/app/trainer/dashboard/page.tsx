// src/app/trainer/dashboard/page.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Users, CalendarCheck, TrendingUp, Clock,
  AlertTriangle, ArrowRight, Loader2, Dumbbell, CheckCircle2
} from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"

function StatCard({ icon: Icon, label, value, sub, color = "text-primary" }: any) {
  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-white/5`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
      <p className="text-white/50 text-xs mt-0.5">{label}</p>
      {sub && <p className="text-white/25 text-[10px] mt-1">{sub}</p>}
    </div>
  )
}

export default function TrainerDashboard() {
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/trainer/dashboard").then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  )

  const { trainer, stats, recentAttendance, expiringSoon } = data ?? {}

  return (
    <div className="max-w-6xl space-y-6">
      {/* Welcome */}
      <div className="flex items-center gap-4">
        <Avatar name={trainer?.profile?.fullName ?? "Trainer"} url={trainer?.profile?.avatarUrl} size={52} rounded="lg" />
        <div>
          <h2 className="text-2xl font-display font-bold text-white">
            Welcome back, {trainer?.profile?.fullName?.split(" ")[0] ?? "Trainer"} 👋
          </h2>
          <p className="text-white/40 text-sm mt-0.5">{trainer?.gym?.name} · Trainer</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}        label="Total Members"    value={stats?.totalMembers ?? 0}    color="text-primary" />
        <StatCard icon={CheckCircle2} label="Active Members"   value={stats?.activeMembers ?? 0}   color="text-green-400" />
        <StatCard icon={CalendarCheck} label="Check-ins This Month" value={stats?.attendanceThisMonth ?? 0} color="text-blue-400" />
        <StatCard icon={TrendingUp}   label="Total Check-ins"  value={stats?.totalAttendance ?? 0} color="text-purple-400" />
      </div>

      {/* Expiring soon warning */}
      {expiringSoon?.length > 0 && (
        <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <h3 className="text-yellow-400 font-semibold text-sm">Members Expiring Soon</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {expiringSoon.map((m: any) => {
              const days = Math.ceil((new Date(m.endDate).getTime() - Date.now()) / 86400000)
              return (
                <Link key={m.id} href={`/trainer/members/${m.id}`}
                  className="flex items-center gap-2.5 bg-yellow-500/10 border border-yellow-500/15 rounded-xl px-3 py-2 hover:border-yellow-500/30 transition-colors">
                  <Avatar name={m.profile.fullName} url={m.profile.avatarUrl} size={28} />
                  <div>
                    <p className="text-white text-xs font-medium">{m.profile.fullName}</p>
                    <p className="text-yellow-400/70 text-[10px]">{days === 0 ? "Expires today" : `${days}d left`}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* My Members */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> My Members
            </h3>
            <Link href="/trainer/members" className="text-primary text-xs hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {trainer?.assignedMembers?.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-white/15 mx-auto mb-2" />
              <p className="text-white/30 text-sm">No members assigned yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trainer.assignedMembers.slice(0, 6).map((m: any) => (
                <Link key={m.id} href={`/trainer/members/${m.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/4 transition-colors group">
                  <Avatar name={m.profile.fullName} url={m.profile.avatarUrl} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{m.profile.fullName}</p>
                    <p className="text-white/35 text-xs">{m.membershipPlan?.name ?? "No plan"}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    m.status === "ACTIVE" ? "bg-green-500/15 text-green-400"
                    : m.status === "EXPIRED" ? "bg-red-500/15 text-red-400"
                    : "bg-yellow-500/15 text-yellow-400"
                  }`}>{m.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Attendance */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-primary" /> Recent Attendance
            </h3>
            <Link href="/trainer/attendance" className="text-primary text-xs hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentAttendance?.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-white/15 mx-auto mb-2" />
              <p className="text-white/30 text-sm">No attendance yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAttendance?.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl">
                  <Avatar name={r.member.profile.fullName} url={r.member.profile.avatarUrl} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{r.member.profile.fullName}</p>
                    <p className="text-white/35 text-xs">
                      {new Date(r.checkInTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  {r.checkOutTime ? (
                    <span className="text-white/30 text-xs shrink-0">
                      {Math.round((new Date(r.checkOutTime).getTime() - new Date(r.checkInTime).getTime()) / 60000)}m
                    </span>
                  ) : (
                    <span className="text-green-400 text-xs shrink-0">In gym</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/trainer/members",     icon: Users,         label: "View Members",    color: "text-blue-400",   bg: "bg-blue-500/10"   },
          { href: "/trainer/attendance",  icon: CalendarCheck, label: "Mark Attendance", color: "text-green-400",  bg: "bg-green-500/10"  },
          { href: "/trainer/workouts",    icon: Dumbbell,      label: "Workout Plans",   color: "text-purple-400", bg: "bg-purple-500/10" },
          { href: "/trainer/diets",       icon: TrendingUp,    label: "Diet Plans",      color: "text-orange-400", bg: "bg-orange-500/10" },
        ].map(({ href, icon: Icon, label, color, bg }) => (
          <Link key={href} href={href}
            className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-white/12 transition-colors group text-center">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <span className="text-white/60 text-xs font-medium group-hover:text-white transition-colors">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
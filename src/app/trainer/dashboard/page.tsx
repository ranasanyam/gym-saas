// src/app/trainer/dashboard/page.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Users, CalendarCheck, Dumbbell, UtensilsCrossed,
  AlertTriangle, ArrowRight, CheckCircle2, AlertCircle,
  Building2, Search,
} from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"

function StatCard({ icon: Icon, label, value, color = "text-primary" }: any) {
  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
      <div className="mb-3">
        <div className="p-2.5 rounded-xl bg-white/5 w-fit">
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
      <p className="text-white/50 text-xs mt-0.5">{label}</p>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 animate-pulse">
      <div className="w-9 h-9 bg-white/5 rounded-xl mb-3" />
      <div className="h-7 w-12 bg-white/5 rounded mb-1" />
      <div className="h-3 w-20 bg-white/5 rounded" />
    </div>
  )
}

export default function TrainerDashboard() {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/trainer/dashboard")
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="max-w-6xl space-y-6">
      {/* Welcome skeleton */}
      <div className="flex items-center gap-4 animate-pulse">
        <div className="w-13 h-13 bg-white/5 rounded-xl shrink-0" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-white/5 rounded" />
          <div className="h-3 w-32 bg-white/5 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 animate-pulse h-64" />
        ))}
      </div>
    </div>
  )

  const { hasNoGym, trainerName, gymName, trainer, stats, membersNeedingAttention, recentAttendance, expiringSoon } = data ?? {}

  // ── No gym joined yet ─────────────────────────────────────────────────────
  if (hasNoGym) return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5">
      <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/8 flex items-center justify-center">
        <Building2 className="w-10 h-10 text-white/20" />
      </div>
      <div>
        <h2 className="text-2xl font-display font-bold text-white">You haven't joined any gym yet</h2>
        <p className="text-white/40 text-sm mt-2 max-w-sm mx-auto">
          Discover gyms near you and reach out to the gym owner to get added as a trainer. Once you join, you'll start getting clients.
        </p>
      </div>
      <Link href="/trainer/discover"
        className="flex items-center gap-2 bg-gradient-primary text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm">
        <Search className="w-4 h-4" /> Discover Gyms
      </Link>
    </div>
  )

  return (
    <div className="max-w-6xl space-y-6">
      {/* Welcome */}
      <div className="flex items-center gap-4">
        <Avatar name={trainer?.profile?.fullName ?? "Trainer"} url={trainer?.profile?.avatarUrl} size={52} rounded="lg" />
        <div>
          <h2 className="text-2xl font-display font-bold text-white">
            Welcome back, {(trainerName ?? "Trainer").split(" ")[0]} 👋
          </h2>
          <p className="text-white/40 text-sm mt-0.5">{gymName} · Trainer</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}        label="Total Members"     value={stats?.totalMembers ?? 0}        color="text-primary" />
        <StatCard icon={CheckCircle2} label="Active Members"    value={stats?.activeMembers ?? 0}       color="text-green-400" />
        <StatCard icon={Dumbbell}     label="Workout Plans"     value={stats?.workoutPlans ?? 0}        color="text-purple-400" />
        <StatCard icon={UtensilsCrossed} label="Diet Plans"     value={stats?.dietPlans ?? 0}           color="text-orange-400" />
      </div>

      {/* Expiring soon warning */}
      {expiringSoon?.length > 0 && (
        <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <h3 className="text-yellow-400 font-semibold text-sm">Memberships Expiring Soon</h3>
          </div>
          <div className="flex flex-wrap gap-2">
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
        {/* Members Needing Attention */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400" /> Needs Attention
            </h3>
            <Link href="/trainer/members" className="text-primary text-xs hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {!membersNeedingAttention?.length ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-8 h-8 text-green-400/40 mx-auto mb-2" />
              <p className="text-white/30 text-sm">All members are set up</p>
            </div>
          ) : (
            <div className="space-y-2">
              {membersNeedingAttention.map((m: any) => (
                <Link key={m.id} href={`/trainer/members/${m.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/4 transition-colors group">
                  <Avatar name={m.profile.fullName} url={m.profile.avatarUrl} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{m.profile.fullName}</p>
                    <div className="flex gap-2 mt-0.5">
                      {!m.hasWorkoutPlan && (
                        <span className="text-[10px] text-orange-400/80 bg-orange-500/10 px-1.5 py-0.5 rounded-full">
                          No workout
                        </span>
                      )}
                      {!m.hasDietPlan && (
                        <span className="text-[10px] text-blue-400/80 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                          No diet plan
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/25 group-hover:text-primary transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Attendance */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-primary" /> Recent Check-ins
            </h3>
            <Link href="/trainer/attendance" className="text-primary text-xs hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {!recentAttendance?.length ? (
            <div className="text-center py-8">
              <CalendarCheck className="w-8 h-8 text-white/15 mx-auto mb-2" />
              <p className="text-white/30 text-sm">No recent check-ins</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAttendance.map((r: any) => (
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
                    <span className="text-green-400 text-[10px] shrink-0 bg-green-500/10 px-2 py-0.5 rounded-full">In gym</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* No members CTA */}
      {trainer?.assignedMembers?.length === 0 && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-white/20" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">No clients yet</p>
            <p className="text-white/40 text-xs mt-0.5">
              You're in <span className="text-white/60">{gymName}</span>. Ask the gym owner to assign members to you to start training them.
            </p>
          </div>
        </div>
      )}

      {/* My Members quick view */}
      {trainer?.assignedMembers?.length > 0 && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> My Members
            </h3>
            <Link href="/trainer/members" className="text-primary text-xs hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {trainer.assignedMembers.slice(0, 6).map((m: any) => (
              <Link key={m.id} href={`/trainer/members/${m.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                <Avatar name={m.profile.fullName} url={m.profile.avatarUrl} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate group-hover:text-primary transition-colors">{m.profile.fullName}</p>
                  <p className="text-white/35 text-xs truncate">{m.membershipPlan?.name ?? "No plan"}</p>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                  m.status === "ACTIVE"  ? "bg-green-500/15 text-green-400"
                  : m.status === "EXPIRED" ? "bg-red-500/15 text-red-400"
                  : "bg-yellow-500/15 text-yellow-400"
                }`}>{m.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/trainer/attendance",  icon: CalendarCheck,    label: "Mark Attendance",   color: "text-green-400",  bg: "bg-green-500/10"  },
          { href: "/trainer/workouts",    icon: Dumbbell,         label: "Create Workout",    color: "text-purple-400", bg: "bg-purple-500/10" },
          { href: "/trainer/diets",       icon: UtensilsCrossed,  label: "Create Diet Plan",  color: "text-orange-400", bg: "bg-orange-500/10" },
          { href: "/trainer/members",     icon: Users,            label: "View All Members",  color: "text-blue-400",   bg: "bg-blue-500/10"   },
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

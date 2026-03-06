"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useProfile } from "@/contexts/ProfileContext"
import {
  Users, Building2, CreditCard, CalendarCheck,
  UserPlus, ClipboardList, BarChart3, Calendar,
  ArrowRight, Loader2, TrendingUp
} from "lucide-react"

interface DashboardData {
  totalMembers: number
  activeGyms: number
  monthlyRevenue: number
  todayAttendance: number
  recentMembers: {
    id: string
    createdAt: string
    status: string
    profile: { fullName: string; avatarUrl: string | null; email: string }
    gym: { name: string }
  }[]
  todayCheckins: {
    id: string
    checkInTime: string
    checkOutTime: string | null
    member: { profile: { fullName: string; avatarUrl: string | null } }
  }[]
  gyms: { id: string; name: string; city: string | null }[]
}

function formatCurrency(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount}`
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor(diff / 60000)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return `${mins}m ago`
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

function StatCard({ icon: Icon, label, value, sub, subColor = "text-primary" }: {
  icon: any; label: string; value: string | number; sub: string; subColor?: string
}) {
  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 flex items-start justify-between">
      <div>
        <p className="text-white/45 text-xs mb-3">{label}</p>
        <p className="text-white text-3xl font-display font-bold mb-1">{value}</p>
        <p className={`text-xs ${subColor}`}>{sub}</p>
      </div>
      <div className="p-2.5 bg-primary/10 rounded-xl">
        <Icon className="w-5 h-5 text-primary" />
      </div>
    </div>
  )
}

const quickActions = [
  { icon: UserPlus,     label: "Add New Member",      desc: "Register a new gym member",   href: "/owner/members/new",   active: false },
  { icon: ClipboardList,label: "Create Workout Plan", desc: "Design a new workout routine", href: "/owner/workouts/new",  active: true  },
  { icon: BarChart3,    label: "View Reports",         desc: "Check your gym analytics",    href: "/owner/reports",       active: false },
  { icon: Calendar,     label: "Schedule",             desc: "Manage gym schedules",         href: "/owner/schedule",      active: false },
]

export default function OwnerDashboardPage() {
  const { profile } = useProfile()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/owner/dashboard")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const firstName = profile?.fullName?.split(" ")[0] ?? "there"

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Welcome Banner */}
      <div className="relative bg-gradient-primary rounded-2xl p-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-1">
              Welcome back, {firstName}! 💪
            </h2>
            <p className="text-white/70 text-sm">Here&apos;s what&apos;s happening with your gyms today.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/owner/gyms"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              Manage Gyms <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/owner/gyms/new"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
              Add New Gym
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users}        label="Total Members"     value={data?.totalMembers ?? 0}                       sub={`${data?.totalMembers ?? 0} active`} />
          <StatCard icon={Building2}    label="Active Gyms"       value={data?.activeGyms ?? 0}                         sub="Managed by you" />
          <StatCard icon={CreditCard}   label="Monthly Revenue"   value={formatCurrency(data?.monthlyRevenue ?? 0)}     sub="This month" />
          <StatCard icon={TrendingUp}   label="Today's Attendance" value={data?.todayAttendance ?? 0}                   sub="Check-ins today" />
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-white font-display font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(({ icon: Icon, label, desc, href, active }) => (
            <Link key={href} href={href}
              className={`rounded-2xl p-5 border transition-all hover:scale-[1.02] group ${
                active
                  ? "border-primary/50 bg-primary/8"
                  : "border-white/6 bg-[hsl(220_25%_9%)] hover:border-white/15"
              }`}>
              <div className={`p-2.5 rounded-xl mb-4 w-fit ${active ? "bg-primary/20" : "bg-white/5 group-hover:bg-white/8"}`}>
                <Icon className={`w-5 h-5 ${active ? "text-primary" : "text-white/50"}`} />
              </div>
              <p className="text-white font-semibold text-sm mb-1">{label}</p>
              <p className="text-white/40 text-xs">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Recent Members */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-display font-semibold">Recent Members</h3>
            <Link href="/owner/members" className="text-primary text-xs hover:text-primary/80 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-white/3 rounded-xl animate-pulse" />)}
            </div>
          ) : data?.recentMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-white/15 mx-auto mb-2" />
              <p className="text-white/30 text-sm">No members yet</p>
              <Link href="/owner/members/new" className="text-primary text-xs mt-1 inline-block hover:underline">Add your first member</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {data?.recentMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {getInitials(m.profile.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{m.profile.fullName}</p>
                    <p className="text-white/35 text-xs">Joined {timeAgo(m.createdAt)}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    m.status === "ACTIVE" ? "bg-green-500/15 text-green-400" : "bg-white/8 text-white/40"
                  }`}>
                    {m.status === "ACTIVE" ? "Active" : "New"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Attendance */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-display font-semibold">Today&apos;s Attendance</h3>
            <Link href="/owner/attendance" className="text-primary text-xs hover:text-primary/80 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-white/3 rounded-xl animate-pulse" />)}
            </div>
          ) : data?.todayCheckins.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-5xl font-display font-bold text-primary mb-2">0</div>
              <p className="text-white/35 text-sm">Members checked in today</p>
            </div>
          ) : (
            <>
              <div className="text-center py-3 mb-4">
                <div className="text-5xl font-display font-bold text-primary">{data?.todayAttendance}</div>
                <p className="text-white/35 text-sm mt-1">Members checked in today</p>
              </div>
              <div className="space-y-2">
                {data?.todayCheckins.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {getInitials(c.member.profile.fullName)}
                    </div>
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
    </div>
  )
}
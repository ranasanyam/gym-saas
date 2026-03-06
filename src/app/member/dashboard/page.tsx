// src/app/member/dashboard/page.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useProfile } from "@/contexts/ProfileContext"
import {
  CalendarCheck, Dumbbell, UtensilsCrossed, Bell, Clock,
  Building2, ChevronRight, AlertTriangle, CheckCircle2, Loader2, Compass
} from "lucide-react"

interface DashboardData {
  activeMembership: any
  memberships: any[]
  stats: { attendanceThisMonth: number; totalAttendance: number; workoutPlans: number; dietPlans: number; daysUntilExpiry: number | null; unreadNotifications: number }
  recentAttendance: any[]
}

export default function MemberDashboard() {
  const { profile } = useProfile()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/member/dashboard").then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  )

  const { activeMembership, stats, recentAttendance, memberships } = data!
  const noGym = !activeMembership

  const firstName = profile?.fullName?.split(" ")[0] ?? "there"

  return (
    <div className="max-w-5xl space-y-6">

      {/* Welcome banner */}
      <div className="relative bg-linear-to-br from-primary/20 via-primary/8 to-transparent border border-primary/15 rounded-2xl p-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="text-primary text-sm font-medium mb-1">Welcome back 👋</p>
          <h2 className="text-2xl font-display font-bold text-white mb-2">{firstName}!</h2>
          {activeMembership ? (
            <p className="text-white/50 text-sm">Active member at <span className="text-white font-medium">{activeMembership.gym.name}</span></p>
          ) : (
            <p className="text-white/50 text-sm">You're not enrolled in any gym yet.</p>
          )}
        </div>
      </div>

      {/* No gym — Discover CTA */}
      {noGym && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Compass className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-white font-display font-bold text-lg mb-2">Find Your Gym</h3>
          <p className="text-white/40 text-sm mb-5 max-w-xs mx-auto">Browse gyms in your city, view membership plans, and join the one that fits you.</p>
          <Link href="/member/discover"
            className="inline-flex items-center gap-2 bg-gradient-primary text-white font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
            <Compass className="w-4 h-4" /> Discover Gyms
          </Link>
        </div>
      )}

      {/* Expiry warning */}
      {stats.daysUntilExpiry !== null && stats.daysUntilExpiry <= 10 && stats.daysUntilExpiry > 0 && (
        <div className="flex items-start gap-3 bg-yellow-500/8 border border-yellow-500/20 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 font-semibold text-sm">Membership expiring soon</p>
            <p className="text-yellow-400/70 text-xs mt-0.5">Your membership expires in {stats.daysUntilExpiry} day{stats.daysUntilExpiry !== 1 ? "s" : ""}. Contact your gym to renew.</p>
          </div>
        </div>
      )}

      {stats.daysUntilExpiry !== null && stats.daysUntilExpiry <= 0 && (
        <div className="flex items-start gap-3 bg-red-500/8 border border-red-500/20 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-semibold text-sm">Membership expired</p>
            <p className="text-red-400/70 text-xs mt-0.5">Your membership has expired. Contact your gym owner to renew.</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      {activeMembership && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: CalendarCheck, label: "This Month", value: stats.attendanceThisMonth, sub: "Check-ins", href: "/member/attendance", color: "text-green-400", bg: "bg-green-500/10" },
            { icon: Dumbbell, label: "Workout Plans", value: stats.workoutPlans, sub: "Available", href: "/member/workouts", color: "text-blue-400", bg: "bg-blue-500/10" },
            { icon: UtensilsCrossed, label: "Diet Plans", value: stats.dietPlans, sub: "Available", href: "/member/diet", color: "text-orange-400", bg: "bg-orange-500/10" },
            { icon: Bell, label: "Notifications", value: stats.unreadNotifications, sub: "Unread", href: "/member/notifications", color: "text-purple-400", bg: "bg-purple-500/10" },
          ].map(({ icon: Icon, label, value, sub, href, color, bg }) => (
            <Link key={label} href={href}
              className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 flex items-start justify-between hover:border-white/12 transition-colors group">
              <div>
                <p className="text-white/40 text-xs mb-1">{label}</p>
                <p className="text-white text-2xl font-display font-bold">{value}</p>
                <p className="text-white/35 text-xs mt-0.5">{sub}</p>
              </div>
              <div className={`p-2.5 ${bg} rounded-xl`}><Icon className={`w-5 h-5 ${color}`} /></div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Active Membership Card */}
        {activeMembership && (
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-sm">Active Membership</h3>
              <Link href="/member/gym" className="text-primary text-xs hover:underline flex items-center gap-1">
                View details <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{activeMembership.gym.name}</p>
                <p className="text-white/40 text-xs mt-0.5">{activeMembership.gym.city}</p>
                {activeMembership.membershipPlan && (
                  <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                    {activeMembership.membershipPlan.name}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/6 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-white/35">Start Date</p>
                <p className="text-white/80 font-medium mt-0.5">
                  {new Date(activeMembership.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div>
                <p className="text-white/35">Expires</p>
                <p className={`font-medium mt-0.5 ${stats.daysUntilExpiry !== null && stats.daysUntilExpiry <= 10 ? "text-yellow-400" : "text-white/80"}`}>
                  {activeMembership.endDate
                    ? new Date(activeMembership.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "No expiry"}
                </p>
              </div>
              {activeMembership.assignedTrainer && (
                <div className="col-span-2">
                  <p className="text-white/35">Assigned Trainer</p>
                  <p className="text-white/80 font-medium mt-0.5">{activeMembership.assignedTrainer.profile.fullName}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Attendance */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold text-sm">Recent Check-ins</h3>
            <Link href="/member/attendance" className="text-primary text-xs hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {recentAttendance.length === 0 ? (
            <div className="text-center py-6">
              <CalendarCheck className="w-8 h-8 text-white/15 mx-auto mb-2" />
              <p className="text-white/30 text-sm">No check-ins yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAttendance.map((a: any) => {
                const checkIn  = new Date(a.checkInTime)
                const checkOut = a.checkOutTime ? new Date(a.checkOutTime) : null
                const durationMin = checkOut ? Math.round((checkOut.getTime() - checkIn.getTime()) / 60000) : null
                return (
                  <div key={a.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-medium">{a.gym.name}</p>
                      <p className="text-white/35 text-xs">
                        {checkIn.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {checkIn.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {durationMin && (
                      <span className="text-white/30 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {durationMin}m
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Multiple memberships */}
      {memberships.length > 1 && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
          <h3 className="text-white font-semibold text-sm mb-4">All Memberships</h3>
          <div className="space-y-3">
            {memberships.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{m.gym.name}</p>
                  <p className="text-white/35 text-xs">{m.membershipPlan?.name ?? "No plan"}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  m.status === "ACTIVE" ? "bg-green-500/15 text-green-400"
                  : m.status === "EXPIRED" ? "bg-red-500/15 text-red-400"
                  : "bg-white/8 text-white/40"
                }`}>{m.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
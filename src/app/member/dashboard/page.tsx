// src/app/member/dashboard/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Building2, Dumbbell, UtensilsCrossed, CreditCard, ShoppingBag,
  Bell, Flame, CalendarCheck, Clock, CheckCircle2, Loader2, Compass,
  ArrowRight, ChevronRight,
  AlertCircle,
  ClockAlert,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { NoGymState } from "@/components/member/NoGymState"

interface GymMembership {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  currentStreak: number;
  longestStreak: number;
  totalCheckins: number;
  lastCheckinDate: string | null;
  gym: {
    id: string;
    name: string;
    city: string | null;
    address: string | null;
    contactNumber: string | null;
  } | null;
  membershipPlan: {
    name: string;
    price: string | number;
    durationMonths: number;
  } | null;
  assignedTrainer: {
    profile: { fullName: string; avatarUrl: string | null };
  } | null;
}
interface DashData {
  memberName: string
  gymName: string | null
  membershipStatus: string | null
  membershipPlan: string | null
  expiryDate: string | null
  daysRemaining: number | null
  hasCheckedInToday: boolean
  currentStreak: number
  monthlyCheckIns: number
  todayWorkout: { exercises: any[]; day: string } | null
  todayDiet: { mealCount: number; totalCalories: number } | null
  recentNotifications: any[]
  unreadCount: number
  activeMembership: GymMembership | null
  memberships: GymMembership[]
}

function StatCard({ icon: Icon, label, value, color = "text-primary" }: any) {
  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4 flex items-center gap-3">
      <div className="p-2.5 rounded-xl bg-white/5">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className={`text-xl font-display font-bold ${color}`}>{value}</p>
        <p className="text-white/40 text-xs">{label}</p>
      </div>
    </div>
  )
}

export default function MemberDashboard() {
  const { toast }     = useToast()
  const [data, setData]       = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [justCheckedIn, setJustCheckedIn] = useState(false)

  const load = useCallback(() => {
    fetch("/api/member/dashboard")
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const checkIn = async () => {
    setCheckingIn(true)
    const res = await fetch("/api/member/attendance", { method: "POST" })
    if (res.ok) {
      setJustCheckedIn(true)
      setData(d => d ? { ...d, hasCheckedInToday: true } : d)
      toast({ variant: "success", title: "Checked in! 🔥", description: "Your attendance has been recorded." })
    } else {
      const d = await res.json()
      toast({ variant: "destructive", title: d.error ?? "Check-in failed" })
    }
    setCheckingIn(false)
  }

  if (loading) return (
    <div className="max-w-4xl space-y-5 animate-pulse">
      <div className="h-28 bg-white/3 rounded-2xl" />
      <div className="h-14 bg-white/3 rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white/3 rounded-2xl" />)}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => <div key={i} className="h-40 bg-white/3 rounded-2xl" />)}
      </div>
    </div>
  )

  if (!data) return null

  console.log('data', data);

  const firstName = data.memberName?.split(" ")[0] ?? "there"
  const noGym     = !data.gymName

  if (noGym) return <NoGymState />

  const statusColor =
    data.membershipStatus === "ACTIVE"    ? "text-green-400 bg-green-500/10 border-green-500/20"
    : data.membershipStatus === "EXPIRED" ? "text-red-400 bg-red-500/10 border-red-500/20"
    : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"

  return (
    <div className="max-w-4xl space-y-5">
      {/* Welcome banner */}
      <div className="relative bg-linear-to-br from-primary/20 via-primary/6 to-transparent border border-primary/15 rounded-2xl p-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-primary text-sm font-medium mb-1">Welcome back 👋</p>
            <h2 className="text-2xl font-display font-bold text-white">{firstName}!</h2>
            {data.gymName ? (
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-white/50 text-sm">{data.gymName}</span>
                {data.membershipStatus && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${statusColor}`}>
                    {data.membershipStatus}
                  </span>
                )}
                {data.membershipPlan && (
                  <span className="text-white/35 text-xs">{data.membershipPlan}</span>
                )}
              </div>
            ) : (
              <p className="text-white/40 text-sm mt-1">You're not enrolled in any gym yet.</p>
            )}
            {data.daysRemaining !== null && data.daysRemaining <= 7 && data.daysRemaining > 0 && (
              <p className="text-yellow-400/80 text-xs mt-2">
                ⚠ Membership expires in {data.daysRemaining} day{data.daysRemaining !== 1 ? "s" : ""}
              </p>
            )}
            

          
          </div>
          
          {data.gymName && (
            <button
              onClick={checkIn}
              disabled={data.hasCheckedInToday || checkingIn || justCheckedIn}
              className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
                data.hasCheckedInToday || justCheckedIn
                  ? "bg-green-500/15 text-green-400 border border-green-500/20 cursor-default"
                  : "bg-gradient-primary text-white hover:opacity-90 shadow-lg shadow-primary/20"
              }`}
            >
              {checkingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : data.hasCheckedInToday || justCheckedIn ? (
                <><CheckCircle2 className="w-4 h-4" /> Checked In</>
              ) : (
                <><CalendarCheck className="w-4 h-4" /> Check In</>
              )}
            </button>
          )}
        </div>
      </div>
      {!loading && data?.memberships && data?.memberships
              .filter((m) => {
                if(!m.endDate) return false;
                const days = Math.ceil(
                  (new Date(m.endDate).getTime() - Date.now()) / ( 1000 * 60 * 60 * 24)
                );
                return days <= 7;
            })
            .map((m) => {
              const days = Math.ceil(
                (new Date(m.endDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const expired = days <= 0;
              return (
                <div 
                key={m.id}
                className={`flex items-center justify-between gap-5 border rounded-xl p-5 ${expired ? "bg-red-500/10 border-red-500/25" : "bg-yellow-500/8 border-yellow-500/20"}`}
                >
                  <div className="flex items-center gap-4">
                    {expired ? <AlertCircle className="w-5 h-5 text-red-400" /> : <ClockAlert className="w-5 h-5 text-yellow-400" />}
                  <div>
                    <div
                    className={`text-md font-semibold ${expired ? "text-red-400" : "text-yello-400"}`}
                    >
                      {expired ? `Membership Expired - ${m.gym?.name ?? "Your Gym"}` : `Expiring Soon - ${m.gym?.name ?? "Your Gym"}`}
                    </div>
                    <div className="text-white/50 text-sm">
                      {expired ? `Your membership has expired. Renew to keep access.` : `${days} day${days === 1 ? "" : "s"} left on your membership.`}
                    </div>
                  </div>
                  </div>
                  {m.gym?.id && (
                    <Link href={`/member/discover/${m.gym?.id}`} className={`border border-red-500/25 text-red-400 bg-red-500/10 hover:bg-red-500/5 py-2 px-4 rounded-xl`}>
                      <span>Renew Now</span>
                    </Link>
                  )}
                </div>
              )
            })}

      {/* No gym CTA */}
      {noGym && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Compass className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-white font-display font-bold text-lg mb-2">Find Your Gym</h3>
          <p className="text-white/40 text-sm mb-5 max-w-xs mx-auto">Browse gyms in your city and join one to get started.</p>
          <Link href="/member/discover"
            className="inline-flex items-center gap-2 bg-gradient-primary text-white font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
            <Compass className="w-4 h-4" /> Discover Gyms
          </Link>
        </div>
      )}

      {/* Stats row */}
      {!noGym && (
        <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Flame}          label="Day Streak"       value={`🔥 ${data.currentStreak}`}   color="text-orange-400" />
        <StatCard icon={CalendarCheck}  label="This Month"       value={data.monthlyCheckIns}           color="text-blue-400" />
        <StatCard icon={Clock}          label="Days Left"        value={data.daysRemaining ?? "∞"}      color="text-green-400" />
      </div>
      )}

      {!noGym && (
        <div className="grid md:grid-cols-2 gap-4">
        {/* Today's workout */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-primary" /> Today's Workout
            </h3>
            <Link href="/member/workouts" className="text-primary text-xs hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {!data.todayWorkout || data.todayWorkout.exercises.length === 0 ? (
            <div className="text-center py-6">
              <Dumbbell className="w-7 h-7 text-white/15 mx-auto mb-2" />
              <p className="text-white/30 text-sm">No workout assigned yet</p>
              <Link href="/member/workouts" className="text-primary text-xs mt-1 hover:underline inline-block">View plans</Link>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-white/35 text-xs mb-2">{data.todayWorkout.day} · {data.todayWorkout.exercises.length} exercise{data.todayWorkout.exercises.length !== 1 ? "s" : ""}</p>
              {data.todayWorkout.exercises.slice(0, 4).map((ex: any, i: number) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5 bg-white/3 rounded-xl">
                  <span className="text-white/25 text-xs w-4 shrink-0">{i + 1}.</span>
                  <p className="text-white text-sm font-medium flex-1 truncate">{ex.name}</p>
                  {ex.sets && ex.reps && (
                    <span className="text-white/35 text-xs shrink-0">{ex.sets}×{ex.reps}</span>
                  )}
                </div>
              ))}
              {data.todayWorkout.exercises.length > 4 && (
                <p className="text-white/30 text-xs text-center">+{data.todayWorkout.exercises.length - 4} more</p>
              )}
            </div>
          )}
        </div>

        {/* Today's diet */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-primary" /> Today's Diet
            </h3>
            <Link href="/member/diet" className="text-primary text-xs hover:underline flex items-center gap-1">
              View plan <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {!data.todayDiet ? (
            <div className="text-center py-6">
              <UtensilsCrossed className="w-7 h-7 text-white/15 mx-auto mb-2" />
              <p className="text-white/30 text-sm">No diet plan assigned yet</p>
              <Link href="/member/diet" className="text-primary text-xs mt-1 hover:underline inline-block">View plans</Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-500/8 border border-orange-500/15 rounded-xl p-3 text-center">
                  <p className="text-orange-400 font-bold text-xl">{data.todayDiet.totalCalories}</p>
                  <p className="text-white/40 text-xs">kcal today</p>
                </div>
                <div className="bg-white/3 border border-white/6 rounded-xl p-3 text-center">
                  <p className="text-white font-bold text-xl">{data.todayDiet.mealCount}</p>
                  <p className="text-white/40 text-xs">meal{data.todayDiet.mealCount !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <Link href="/member/diet"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/8 text-white/50 hover:text-white hover:border-white/15 transition-all text-sm">
                View full plan <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Recent notifications */}
      {data.recentNotifications.length > 0 && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> Notifications
              {data.unreadCount > 0 && (
                <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {data.unreadCount}
                </span>
              )}
            </h3>
            <Link href="/member/notifications" className="text-primary text-xs hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {data.recentNotifications.map((n: any) => (
              <div key={n.id} className="flex items-start gap-3 p-3 bg-white/3 rounded-xl">
                {!n.isRead && <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{n.title}</p>
                  <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{n.message}</p>
                </div>
                <span className="text-white/25 text-[10px] shrink-0">
                  {new Date(n.createdAt).toLocaleTimeString("en-IN", { timeStyle: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      {!noGym && (
        <div>
        <p className="text-white/35 text-xs uppercase tracking-wider font-semibold mb-3">Quick Links</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {[
            { href: "/member/gym",         icon: Building2,      label: "My Gym",     color: "text-blue-400",   bg: "bg-blue-500/10"   },
            { href: "/member/workouts",    icon: Dumbbell,       label: "Workouts",   color: "text-purple-400", bg: "bg-purple-500/10" },
            { href: "/member/diet",        icon: UtensilsCrossed,label: "Diet Plan",  color: "text-green-400",  bg: "bg-green-500/10"  },
            { href: "/member/payments",    icon: CreditCard,     label: "Payments",   color: "text-yellow-400", bg: "bg-yellow-500/10" },
            { href: "/member/supplements", icon: ShoppingBag,    label: "Supplements",color: "text-orange-400", bg: "bg-orange-500/10" },
          ].map(({ href, icon: Icon, label, color, bg }) => (
            <Link key={href} href={href}
              className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-white/12 transition-colors group text-center">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <span className="text-white/50 text-xs font-medium group-hover:text-white transition-colors">{label}</span>
            </Link>
          ))}
        </div>
      </div>
      )}
    </div>
  )
}

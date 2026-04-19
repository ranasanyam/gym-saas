// src/app/member/attendance/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { CalendarCheck, Clock, Loader2, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useMemberGym } from "@/contexts/MemberGymContext"
import { NoGymState } from "@/components/member/NoGymState"

function StatCard({ label, value, sub, color = "text-white" }: { label: string; value: any; sub?: string; color?: string }) {
  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 text-center">
      <p className={`text-3xl font-display font-bold ${color}`}>{value}</p>
      <p className="text-white/50 text-xs mt-1">{label}</p>
      {sub && <p className="text-white/25 text-[10px] mt-0.5">{sub}</p>}
    </div>
  )
}

export default function MemberAttendancePage() {
  const { toast }                   = useToast()
  const { hasGym, gymLoading }      = useMemberGym()
  const [data, setData]             = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch("/api/member/attendance?page=1")
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const checkIn = async () => {
    setCheckingIn(true)
    const res = await fetch("/api/member/attendance", { method: "POST" })
    if (res.ok) {
      toast({ variant: "success", title: "Checked in! 🔥" })
      load()
    } else {
      const d = await res.json()
      toast({ variant: "destructive", title: d.error ?? "Check-in failed" })
    }
    setCheckingIn(false)
  }

  if (loading || gymLoading) return (
    <div className="max-w-3xl space-y-5 animate-pulse">
      <div className="h-8 w-48 bg-white/5 rounded" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}
      </div>
      <div className="h-72 bg-white/5 rounded-2xl" />
      <div className="h-64 bg-white/5 rounded-2xl" />
    </div>
  )

  if (!hasGym) return <NoGymState pageName="Attendance" />

  const records    = data?.records ?? []
  const streak     = data?.streak  ?? { current: 0, longest: 0, total: 0 }
  const checkedIn  = data?.checkedInToday ?? false

  // Build calendar for current month
  const now        = new Date()
  const y          = now.getFullYear()
  const m          = now.getMonth()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const firstDay    = new Date(y, m, 1).getDay() // 0=Sun

  // Set of attended dates this month (YYYY-MM-DD)
  const attendedSet = new Set(
    records
      .filter((r: any) => {
        const d = new Date(r.checkInTime)
        return d.getMonth() === m && d.getFullYear() === y
      })
      .map((r: any) => new Date(r.checkInTime).getDate())
  )

  const todayDate = now.getDate()
  const monthName = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
  const daysPresent = attendedSet.size
  const daysAbsent  = Math.max(0, todayDate - 1 - daysPresent) // past days not attended
  const rate        = todayDate > 1 ? Math.round((daysPresent / (todayDate - 1)) * 100) : 0

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Attendance</h2>
          <p className="text-white/35 text-sm mt-0.5">{monthName}</p>
        </div>
        {!checkedIn && (
          <button onClick={checkIn} disabled={checkingIn}
            className="flex items-center gap-2 bg-gradient-primary hover:opacity-90 text-white font-semibold px-5 py-2.5 rounded-xl transition-opacity disabled:opacity-60">
            {checkingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
            {checkingIn ? "Checking in…" : "Check In Now"}
          </button>
        )}
        {checkedIn && (
          <span className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl">
            <CheckCircle2 className="w-4 h-4" /> Checked in today
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Current Streak" value={`🔥 ${streak.current}`} sub="days"        color="text-orange-400" />
        <StatCard label="Longest Streak" value={`⭐ ${streak.longest}`} sub="days"         color="text-yellow-400" />
        <StatCard label="This Month"     value={daysPresent}             sub={`${rate}% rate`} color="text-blue-400" />
        <StatCard label="All Time"       value={streak.total}            sub="total check-ins" color="text-purple-400" />
      </div>

      {/* Calendar */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-primary" /> {monthName}
          </h3>
          <div className="flex items-center gap-3 text-xs text-white/35">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-green-500/60 rounded-full" />Attended</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 border border-primary rounded-full" />Today</span>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
            <div key={d} className="text-center text-white/30 text-xs py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {[...Array(firstDay)].map((_, i) => <div key={`e-${i}`} />)}
          {[...Array(daysInMonth)].map((_, i) => {
            const day      = i + 1
            const attended = attendedSet.has(day)
            const isToday  = day === todayDate
            const isPast   = day < todayDate

            return (
              <div key={day}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                  attended
                    ? "bg-green-500/25 text-green-400 border border-green-500/30"
                    : isToday
                    ? "border border-primary text-primary"
                    : isPast
                    ? "text-white/20"
                    : "text-white/15"
                }`}>
                {day}
                {attended && <span className="absolute w-1 h-1 bg-green-400 rounded-full bottom-0.5" />}
              </div>
            )
          })}
        </div>

        {/* Month summary */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
          <div className="text-center">
            <p className="text-green-400 font-semibold">{daysPresent}</p>
            <p className="text-white/35 text-xs">Present</p>
          </div>
          <div className="text-center">
            <p className="text-red-400 font-semibold">{daysAbsent}</p>
            <p className="text-white/35 text-xs">Absent</p>
          </div>
          <div className="text-center">
            <p className="text-primary font-semibold">{rate}%</p>
            <p className="text-white/35 text-xs">Rate</p>
          </div>
        </div>
      </div>

      {/* Recent history */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-white font-semibold text-sm">Recent History</h3>
        </div>
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <CalendarCheck className="w-7 h-7 text-white/15" />
            <p className="text-white/25 text-sm">No attendance records yet</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
              <span>Date</span><span>Check In</span><span>Check Out</span>
            </div>
            <div className="divide-y divide-white/4">
              {records.map((r: any) => (
                <div key={r.id} className="grid grid-cols-3 px-5 py-3.5 text-sm">
                  <span className="text-white/60">
                    {new Date(r.checkInTime).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </span>
                  <span className="text-white/70">
                    {new Date(r.checkInTime).toLocaleTimeString("en-IN", { timeStyle: "short" })}
                  </span>
                  <span className="text-white/50">
                    {r.checkOutTime
                      ? new Date(r.checkOutTime).toLocaleTimeString("en-IN", { timeStyle: "short" })
                      : <span className="text-green-400 text-xs">In gym</span>}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

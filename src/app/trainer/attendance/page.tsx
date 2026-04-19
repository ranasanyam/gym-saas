// src/app/trainer/attendance/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { CalendarCheck, Clock, Building2, Users, CheckCircle2, LogIn, LogOut } from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

// ── Trainer self check-in via localStorage ────────────────────────────────────
const TODAY = new Date().toISOString().split("T")[0]
const LS_KEY = `trainer_checkin_${TODAY}`

interface SelfCheckin { checkInTime: string; checkOutTime: string | null }

function getSelfCheckin(): SelfCheckin | null {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "null") } catch { return null }
}
function setSelfCheckin(data: SelfCheckin | null) {
  if (data) localStorage.setItem(LS_KEY, JSON.stringify(data))
  else localStorage.removeItem(LS_KEY)
}

function dur(ci: string, co: string | null) {
  if (!co) return null
  const m = Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 60000)
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`
}

function getMonthLabel() {
  return new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })
}

export default function TrainerAttendancePage() {
  const { toast } = useToast()

  // Trainer self check-in
  const [selfCheckin, setSelf] = useState<SelfCheckin | null>(null)
  useEffect(() => { setSelf(getSelfCheckin()) }, [])

  // Members attendance
  const [records, setRecords]   = useState<any[]>([])
  const [members, setMembers]   = useState<any[]>([])
  const [date, setDate]         = useState(TODAY)
  const [loading, setLoading]   = useState(true)
  const [monthlySummary, setMonthlySummary] = useState<Record<string, number>>({})

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/trainer/attendance?date=${date}`)
      .then(r => r.json())
      .then(d => { setRecords(d.records ?? []); setMembers(d.members ?? []) })
      .finally(() => setLoading(false))
  }, [date])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!members.length) return
    const now  = new Date()
    const y    = now.getFullYear()
    const m    = String(now.getMonth() + 1).padStart(2, "0")
    const days = new Date(y, now.getMonth() + 1, 0).getDate()
    fetch(`/api/trainer/attendance?date=${y}-${m}-01&endDate=${y}-${m}-${String(days).padStart(2,"0")}`)
      .then(r => r.json())
      .then(d => {
        const summary: Record<string, number> = {}
        ;(d.records ?? []).forEach((r: any) => { summary[r.memberId] = (summary[r.memberId] ?? 0) + 1 })
        setMonthlySummary(summary)
      })
      .catch(() => {})
  }, [members])

  // Trainer self check-in handlers
  const handleCheckIn = () => {
    const data: SelfCheckin = { checkInTime: new Date().toISOString(), checkOutTime: null }
    setSelfCheckin(data); setSelf(data)
    toast({ variant: "success", title: "Checked in!", description: `Welcome — ${new Date().toLocaleTimeString("en-IN", { timeStyle: "short" })}` })
  }
  const handleCheckOut = () => {
    if (!selfCheckin) return
    const data: SelfCheckin = { ...selfCheckin, checkOutTime: new Date().toISOString() }
    setSelfCheckin(data); setSelf(data)
    const d = dur(data.checkInTime, data.checkOutTime)
    toast({ variant: "success", title: "Checked out!", description: d ? `Session: ${d}` : undefined })
  }
  const handleReset = () => { setSelfCheckin(null); setSelf(null) }

  const checkedInIds = new Set(records.map(r => r.memberId))
  const isToday      = date === TODAY

  return (
    <div className="max-w-5xl space-y-5">
      {/* ── My Attendance card ───────────────────────────────────────────── */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-4">
          <CalendarCheck className="w-4 h-4 text-primary" /> My Attendance Today
        </h3>
        {!selfCheckin ? (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-white/50 text-sm">You haven't checked in yet today.</p>
              <p className="text-white/25 text-xs mt-0.5">{new Date().toLocaleDateString("en-IN", { dateStyle: "full" })}</p>
            </div>
            <Button onClick={handleCheckIn}
              className="bg-gradient-primary hover:opacity-90 text-white h-10 gap-2 shrink-0">
              <LogIn className="w-4 h-4" /> Check In
            </Button>
          </div>
        ) : selfCheckin.checkOutTime ? (
          <div className="flex items-center gap-4">
            <CheckCircle2 className="w-8 h-8 text-green-400 shrink-0" />
            <div className="flex-1">
              <p className="text-white font-medium text-sm">Session complete</p>
              <p className="text-white/40 text-xs mt-0.5">
                In: {new Date(selfCheckin.checkInTime).toLocaleTimeString("en-IN", { timeStyle: "short" })}
                {" · "}Out: {new Date(selfCheckin.checkOutTime).toLocaleTimeString("en-IN", { timeStyle: "short" })}
                {dur(selfCheckin.checkInTime, selfCheckin.checkOutTime) && ` · ${dur(selfCheckin.checkInTime, selfCheckin.checkOutTime)}`}
              </p>
            </div>
            <button onClick={handleReset} className="text-white/25 hover:text-white/60 text-xs underline transition-colors shrink-0">Reset</button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
              <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">You're checked in</p>
              <p className="text-white/40 text-xs mt-0.5">
                Since {new Date(selfCheckin.checkInTime).toLocaleTimeString("en-IN", { timeStyle: "short" })}
              </p>
            </div>
            <Button onClick={handleCheckOut} variant="outline"
              className="border-white/10 text-white/70 hover:text-white bg-transparent h-10 gap-2 shrink-0">
              <LogOut className="w-4 h-4" /> Check Out
            </Button>
          </div>
        )}
      </div>

      {/* ── Members section header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-white">Members Attendance</h2>
          <p className="text-white/35 text-sm mt-0.5">
            {records.length} check-in{records.length !== 1 ? "s" : ""} · {isToday ? "Today" : date}
          </p>
        </div>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="bg-[hsl(220_25%_9%)] border-white/10 text-white focus:border-primary focus-visible:ring-0 h-10 w-40" />
      </div>

      {/* ── No members empty state ─────────────────────────────────────────── */}
      {!loading && members.length === 0 ? (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white/20" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">No clients yet</h3>
            <p className="text-white/40 text-sm mt-1.5 max-w-xs mx-auto">
              You don't have any assigned members. Join a gym to start tracking client attendance.
            </p>
          </div>
          <Link href="/trainer/discover"
            className="flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
            <Building2 className="w-4 h-4" /> Discover Gyms
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Date's check-ins */}
          <div className="lg:col-span-2 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-primary" />
              <h3 className="text-white font-semibold text-sm">
                {isToday ? "Today's Check-Ins" : `Check-Ins · ${date}`}
              </h3>
              <span className="ml-auto bg-white/8 text-white/50 text-xs px-2 py-0.5 rounded-full">{records.length}</span>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-white/5 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-36 bg-white/5 rounded" />
                      <div className="h-3 w-24 bg-white/5 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-2">
                <Clock className="w-9 h-9 text-white/15" />
                <p className="text-white/30 text-sm">No member check-ins for this date</p>
              </div>
            ) : (
              <div className="divide-y divide-white/4">
                {records.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-4 px-5 py-4">
                    <Avatar name={r.member.profile.fullName} url={r.member.profile.avatarUrl} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{r.member.profile.fullName}</p>
                      <p className="text-white/40 text-xs mt-0.5">
                        In: {new Date(r.checkInTime).toLocaleTimeString("en-IN", { timeStyle: "short" })}
                        {r.checkOutTime && ` · Out: ${new Date(r.checkOutTime).toLocaleTimeString("en-IN", { timeStyle: "short" })}`}
                      </p>
                    </div>
                    {r.checkOutTime ? (
                      <span className="text-white/40 text-xs shrink-0 bg-white/5 px-2.5 py-1 rounded-full">
                        {dur(r.checkInTime, r.checkOutTime)}
                      </span>
                    ) : (
                      <span className="text-green-400 text-xs shrink-0 bg-green-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        In gym
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly summary */}
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="text-white font-semibold text-sm">This Month</h3>
              <span className="ml-auto text-white/30 text-[10px]">{getMonthLabel()}</span>
            </div>
            <div className="divide-y divide-white/4 max-h-80 overflow-y-auto">
              {members.map((m: any) => {
                const count       = monthlySummary[m.id] ?? 0
                const checkedToday = checkedInIds.has(m.id)
                return (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={m.profile.fullName} url={m.profile.avatarUrl} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{m.profile.fullName}</p>
                      <p className="text-white/35 text-xs">{count} day{count !== 1 ? "s" : ""}</p>
                    </div>
                    {checkedToday ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-white/15 shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

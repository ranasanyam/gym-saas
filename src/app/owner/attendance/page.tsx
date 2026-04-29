// src/app/owner/attendance/page.tsx
"use client"

import { useSubscription } from "@/contexts/SubscriptionContext"
import { PlanGate } from "@/components/owner/PlanGate"
import { PageHeader } from "@/components/owner/PageHeader"
import { AppSelect } from "@/components/ui/AppSelect"
import { useEffect, useState, useCallback, useMemo } from "react"
import { CalendarCheck, Loader2, Search, Clock, ChevronLeft, ChevronRight } from "lucide-react"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface AttendanceRecord {
  id: string; checkInTime: string; checkOutTime: string | null
  method: string
  member: { profile: { fullName: string; avatarUrl: string | null } }
  gym: { name: string }
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

function AttendanceContent() {
  const now = new Date()
  const [gyms, setGyms]     = useState<{ id: string; name: string }[]>([])
  const [gymId, setGymId]   = useState("")
  const [search, setSearch] = useState("")

  // Calendar state
  const [calYear,  setCalYear]  = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [selDate,  setSelDate]  = useState(toDateStr(now))

  // Month range records (for day counts)
  const [monthData,  setMonthData]  = useState<{ id: string; checkInTime: string }[]>([])
  // Day records (for the list)
  const [dayRecords, setDayRecords] = useState<AttendanceRecord[]>([])
  const [dayTotal,   setDayTotal]   = useState(0)
  const [loading,    setLoading]    = useState(false)

  useEffect(() => {
    fetch("/api/owner/gyms").then(r => r.json()).then(g => { if (Array.isArray(g)) setGyms(g) })
  }, [])

  // Fetch month data for calendar counts
  useEffect(() => {
    const start = toDateStr(new Date(calYear, calMonth, 1))
    const end   = toDateStr(new Date(calYear, calMonth + 1, 0))
    const p = new URLSearchParams({ startDate: start, endDate: end })
    if (gymId) p.set("gymId", gymId)
    fetch(`/api/owner/attendance?${p}`).then(r => r.json()).then(d => {
      setMonthData(Array.isArray(d) ? d : (d.records ?? []))
    }).catch(() => {})
  }, [calYear, calMonth, gymId])

  // Fetch day records for the list
  const loadDay = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams({ date: selDate })
    if (gymId)  p.set("gymId", gymId)
    if (search) p.set("search", search)
    fetch(`/api/owner/attendance?${p}`).then(r => r.json()).then(d => {
      setDayRecords(Array.isArray(d) ? d : (d.records ?? []))
      setDayTotal(d.total ?? 0)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [selDate, gymId, search])

  useEffect(() => { loadDay() }, [loadDay])

  // Day counts map
  const dayCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of monthData) {
      const d = toDateStr(new Date(r.checkInTime))
      map[d] = (map[d] ?? 0) + 1
    }
    return map
  }, [monthData])

  // Calendar grid
  const calendarCells = useMemo(() => {
    const firstDay    = new Date(calYear, calMonth, 1).getDay()
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
    const cells: (number | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [calYear, calMonth])

  const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
  const todayStr   = toDateStr(now)

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const selDateObj = new Date(selDate)
  const selLabel   = selDate === todayStr
    ? "Today"
    : selDateObj.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })

  return (
    <div className="space-y-5">
      {/* Gym filter */}
      {gyms.length > 1 && (
        <AppSelect
          value={gymId} onChange={setGymId}
          placeholder="All Gyms"
          options={[{ value: "", label: "All Gyms" }, ...gyms.map(g => ({ value: g.id, label: g.name }))]}
          className="w-44"
        />
      )}

      <div className="grid lg:grid-cols-[340px_1fr] gap-5">
        {/* Calendar */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/8 rounded-2xl p-5 self-start">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 text-white/50 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white text-sm font-semibold">{monthLabel}</span>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 text-white/50 hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-center text-[10px] text-white/25 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {calendarCells.map((day, i) => {
              if (!day) return <div key={i} />
              const dateStr  = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const count    = dayCounts[dateStr] ?? 0
              const isToday  = dateStr === todayStr
              const isSel    = dateStr === selDate
              const isFuture = dateStr > todayStr
              return (
                <button
                  key={i}
                  onClick={() => { if (!isFuture) setSelDate(dateStr) }}
                  disabled={isFuture}
                  className={`relative flex flex-col items-center justify-center rounded-xl py-1.5 text-xs font-medium transition-all
                    ${isSel    ? "bg-primary text-white" :
                      isToday  ? "bg-primary/20 text-primary border border-primary/30" :
                      isFuture ? "opacity-20 cursor-not-allowed text-white/30" :
                                 "hover:bg-white/8 text-white/70 hover:text-white"}
                  `}
                >
                  <span>{day}</span>
                  {count > 0 && !isSel && (
                    <span className={`text-[9px] font-bold mt-0.5 ${isToday ? "text-primary" : "text-primary/70"}`}>
                      {count}
                    </span>
                  )}
                  {count > 0 && isSel && (
                    <span className="text-[9px] font-bold mt-0.5 text-white/70">{count}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Day records */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <p className="text-white font-semibold text-sm">{selLabel}</p>
              <p className="text-white/35 text-xs">{dayTotal} check-in{dayTotal !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 h-9 flex-1 max-w-xs ml-auto">
              <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search member..."
                className="bg-transparent text-sm text-white placeholder:text-white/25 outline-none w-full" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
          ) : dayRecords.length === 0 ? (
            <div className="text-center py-14 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl">
              <CalendarCheck className="w-9 h-9 mx-auto mb-2 text-white/15" />
              <p className="text-white/30 text-sm">No check-ins for {selLabel.toLowerCase()}</p>
            </div>
          ) : (
            <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Member", "Gym", "Check-in", "Check-out", "Duration", "Method"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-white/30 text-xs font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4">
                    {dayRecords.map(r => {
                      const cin  = new Date(r.checkInTime)
                      const cout = r.checkOutTime ? new Date(r.checkOutTime) : null
                      const dur  = cout ? Math.round((cout.getTime() - cin.getTime()) / 60000) : null
                      return (
                        <tr key={r.id} className="hover:bg-white/2">
                          <td className="px-4 py-3 text-white font-medium">{r.member.profile.fullName}</td>
                          <td className="px-4 py-3 text-white/50">{r.gym.name}</td>
                          <td className="px-4 py-3 text-white/60">
                            {cin.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-4 py-3 text-white/50">
                            {cout
                              ? cout.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                              : <span className="text-green-400 text-xs">Active</span>}
                          </td>
                          <td className="px-4 py-3 text-white/50">
                            {dur ? <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{dur}m</span> : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-white/5 border border-white/8 text-white/40 px-2 py-0.5 rounded-full">{r.method}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AttendancePage() {
  const { hasAttendance, isExpired } = useSubscription()
  return (
    <div className="max-w-6xl space-y-6">
      <PageHeader title="Attendance" subtitle="View and manage member check-ins" />
      <PlanGate allowed={hasAttendance && !isExpired} featureLabel="Attendance Tracking">
        <AttendanceContent />
      </PlanGate>
    </div>
  )
}
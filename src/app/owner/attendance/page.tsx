"use client"

import { useEffect, useState, useCallback } from "react"
import { PageHeader } from "@/components/owner/PageHeader"
import { CalendarCheck, Clock } from "lucide-react"

interface Record {
  id: string; checkInTime: string; checkOutTime: string | null
  member: { profile: { fullName: string; avatarUrl: string | null } }
  gym: { name: string }
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

function dur(checkIn: string, checkOut: string | null) {
  if (!checkOut) return "In gym"
  const mins = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export default function AttendancePage() {
  const [records, setRecords] = useState<Record[]>([])
  const [total, setTotal] = useState(0)
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/owner/attendance?date=${date}`)
      .then(r => r.json())
      .then(d => { setRecords(d.records); setTotal(d.total) })
      .finally(() => setLoading(false))
  }, [date])

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-5xl">
      <PageHeader title="Attendance" subtitle="Track member check-ins" />

      {/* Date picker + stat */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-7">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="bg-white/5 border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary" />
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">
          <CalendarCheck className="w-4 h-4 text-primary" />
          <span className="text-white text-sm font-semibold">{total}</span>
          <span className="text-white/50 text-sm">check-ins</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white/3 rounded-xl animate-pulse" />)}</div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <CalendarCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No check-ins for this date</p>
        </div>
      ) : (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
            <span>Member</span><span>Gym</span><span>Check In</span><span>Duration</span>
          </div>
          <div className="divide-y divide-white/4">
            {records.map(r => (
              <div key={r.id} className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 px-5 py-4 items-center hover:bg-white/2 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {getInitials(r.member.profile.fullName)}
                  </div>
                  <span className="text-white text-sm font-medium truncate">{r.member.profile.fullName}</span>
                </div>
                <span className="text-white/50 text-sm truncate">{r.gym.name}</span>
                <span className="text-white/60 text-sm flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {new Date(r.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className={`text-sm font-medium ${r.checkOutTime ? "text-white/50" : "text-green-400"}`}>
                  {dur(r.checkInTime, r.checkOutTime)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
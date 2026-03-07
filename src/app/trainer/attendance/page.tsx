// src/app/trainer/attendance/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { CalendarCheck, Clock, Plus, X, Loader2, Search, CheckCircle2 } from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

function dur(ci: string, co: string | null) {
  if (!co) return "In gym"
  const m = Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 60000)
  return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`
}

export default function TrainerAttendancePage() {
  const { toast }    = useToast()
  const [records, setRecords]   = useState<any[]>([])
  const [members, setMembers]   = useState<any[]>([])
  const [date, setDate]         = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [memberSearch, setMemberSearch] = useState("")
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [markForm, setMarkForm] = useState({
    checkInTime:  `${new Date().toISOString().split("T")[0]}T${new Date().toTimeString().slice(0,5)}`,
    checkOutTime: "",
  })

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/trainer/attendance?date=${date}`)
      .then(r => r.json())
      .then(d => { setRecords(d.records ?? []); setMembers(d.members ?? []) })
      .finally(() => setLoading(false))
  }, [date])
  useEffect(() => { load() }, [load])

  const filteredMembers = members.filter(m =>
    m.profile.fullName.toLowerCase().includes(memberSearch.toLowerCase())
  )
  const checkedInIds = new Set(records.map(r => r.memberId))

  const submit = async () => {
    if (!selectedMember) { toast({ variant: "destructive", title: "Select a member" }); return }
    setSaving(true)
    const res = await fetch("/api/trainer/attendance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId:     selectedMember.id,
        checkInTime:  markForm.checkInTime  || undefined,
        checkOutTime: markForm.checkOutTime || undefined,
      }),
    })
    if (res.ok) {
      toast({ variant: "success", title: "Attendance marked!", description: `${selectedMember.profile.fullName} checked in` })
      setShowForm(false); setSelectedMember(null); setMemberSearch(""); load()
    } else {
      const d = await res.json()
      toast({ variant: "destructive", title: d.error ?? "Failed" })
    }
    setSaving(false)
  }

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Attendance</h2>
          <p className="text-white/35 text-sm mt-0.5">{records.length} check-in{records.length !== 1 ? "s" : ""} today</p>
        </div>
        <div className="flex items-center gap-3">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="bg-[hsl(220_25%_9%)] border-white/10 text-white focus:border-primary focus-visible:ring-0 h-10 w-40" />
          <Button onClick={() => setShowForm(true)}
            className="bg-gradient-primary hover:opacity-90 text-white h-10 gap-2">
            <Plus className="w-4 h-4" /> Mark Attendance
          </Button>
        </div>
      </div>

      {/* Mark form */}
      {showForm && (
        <div className="bg-[hsl(220_25%_9%)] border border-primary/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">Mark Attendance</h3>
            <button onClick={() => { setShowForm(false); setSelectedMember(null); setMemberSearch("") }}
              className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          {/* Member search */}
          <div className="space-y-2">
            <Label className="text-white/55 text-xs">Select Member</Label>
            {selectedMember ? (
              <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-xl">
                <Avatar name={selectedMember.profile.fullName} url={selectedMember.profile.avatarUrl} size={32} />
                <span className="text-white text-sm font-medium flex-1">{selectedMember.profile.fullName}</span>
                <button onClick={() => { setSelectedMember(null); setMemberSearch("") }} className="text-white/30 hover:text-white"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <Input value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                  placeholder="Search member..."
                  className="bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 pl-9" />
                {memberSearch && filteredMembers.length > 0 && (
                  <div className="absolute top-full mt-1 w-full bg-[hsl(220_25%_12%)] border border-white/10 rounded-xl z-10 max-h-48 overflow-y-auto">
                    {filteredMembers.map(m => (
                      <button key={m.id} type="button"
                        onClick={() => { setSelectedMember(m); setMemberSearch(m.profile.fullName) }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left">
                        <Avatar name={m.profile.fullName} url={m.profile.avatarUrl} size={28} />
                        <div>
                          <p className="text-white text-sm">{m.profile.fullName}</p>
                          {checkedInIds.has(m.id) && <p className="text-green-400 text-xs">Already checked in</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Time inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white/55 text-xs">Check-in Time</Label>
              <Input type="datetime-local" value={markForm.checkInTime}
                onChange={e => setMarkForm(p => ({ ...p, checkInTime: e.target.value }))}
                className="bg-[hsl(220_25%_11%)] border-white/10 text-white focus:border-primary focus-visible:ring-0 h-10 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/55 text-xs">Check-out Time (optional)</Label>
              <Input type="datetime-local" value={markForm.checkOutTime}
                onChange={e => setMarkForm(p => ({ ...p, checkOutTime: e.target.value }))}
                className="bg-[hsl(220_25%_11%)] border-white/10 text-white focus:border-primary focus-visible:ring-0 h-10 text-sm" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={submit} disabled={saving || !selectedMember}
              className="bg-gradient-primary hover:opacity-90 text-white h-10 px-6">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" />Mark Attendance</>}
            </Button>
          </div>
        </div>
      )}

      {/* Records */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl">
          <CalendarCheck className="w-10 h-10 text-white/15" />
          <p className="text-white/30 text-sm">No attendance records for {new Date(date + "T00:00:00").toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
        </div>
      ) : (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
            <span>Member</span><span>Check In</span><span>Check Out</span><span>Duration</span>
          </div>
          <div className="divide-y divide-white/4">
            {records.map(r => (
              <div key={r.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={r.member.profile.fullName} url={r.member.profile.avatarUrl} size={32} />
                  <span className="text-white/80 truncate">{r.member.profile.fullName}</span>
                </div>
                <span className="text-white/55 whitespace-nowrap">{new Date(r.checkInTime).toLocaleTimeString("en-IN", { timeStyle: "short" })}</span>
                <span className="text-white/40 whitespace-nowrap">
                  {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString("en-IN", { timeStyle: "short" }) : <span className="text-green-400">In gym</span>}
                </span>
                <span className="text-white/35 whitespace-nowrap">{dur(r.checkInTime, r.checkOutTime)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
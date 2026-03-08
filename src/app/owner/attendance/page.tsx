// "use client"

// import { useEffect, useState, useCallback } from "react"
// import { PageHeader } from "@/components/owner/PageHeader"
// import { CalendarCheck, Clock } from "lucide-react"

// interface Record {
//   id: string; checkInTime: string; checkOutTime: string | null
//   member: { profile: { fullName: string; avatarUrl: string | null } }
//   gym: { name: string }
// }

// function getInitials(name: string) {
//   return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
// }

// function dur(checkIn: string, checkOut: string | null) {
//   if (!checkOut) return "In gym"
//   const mins = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000)
//   if (mins < 60) return `${mins}m`
//   return `${Math.floor(mins / 60)}h ${mins % 60}m`
// }

// export default function AttendancePage() {
//   const [records, setRecords] = useState<Record[]>([])
//   const [total, setTotal] = useState(0)
//   const [date, setDate] = useState(new Date().toISOString().split("T")[0])
//   const [loading, setLoading] = useState(true)

//   const load = useCallback(() => {
//     setLoading(true)
//     fetch(`/api/owner/attendance?date=${date}`)
//       .then(r => r.json())
//       .then(d => { setRecords(d.records); setTotal(d.total) })
//       .finally(() => setLoading(false))
//   }, [date])

//   useEffect(() => { load() }, [load])

//   return (
//     <div className="max-w-5xl">
//       <PageHeader title="Attendance" subtitle="Track member check-ins" />

//       {/* Date picker + stat */}
//       <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-7">
//         <input type="date" value={date} onChange={e => setDate(e.target.value)}
//           className="bg-white/5 border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary" />
//         <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">
//           <CalendarCheck className="w-4 h-4 text-primary" />
//           <span className="text-white text-sm font-semibold">{total}</span>
//           <span className="text-white/50 text-sm">check-ins</span>
//         </div>
//       </div>

//       {loading ? (
//         <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white/3 rounded-xl animate-pulse" />)}</div>
//       ) : records.length === 0 ? (
//         <div className="text-center py-16 text-white/30">
//           <CalendarCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
//           <p>No check-ins for this date</p>
//         </div>
//       ) : (
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
//           <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
//             <span>Member</span><span>Gym</span><span>Check In</span><span>Duration</span>
//           </div>
//           <div className="divide-y divide-white/4">
//             {records.map(r => (
//               <div key={r.id} className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 px-5 py-4 items-center hover:bg-white/2 transition-colors">
//                 <div className="flex items-center gap-3">
//                   <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
//                     {getInitials(r.member.profile.fullName)}
//                   </div>
//                   <span className="text-white text-sm font-medium truncate">{r.member.profile.fullName}</span>
//                 </div>
//                 <span className="text-white/50 text-sm truncate">{r.gym.name}</span>
//                 <span className="text-white/60 text-sm flex items-center gap-1.5">
//                   <Clock className="w-3 h-3" />
//                   {new Date(r.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
//                 </span>
//                 <span className={`text-sm font-medium ${r.checkOutTime ? "text-white/50" : "text-green-400"}`}>
//                   {dur(r.checkInTime, r.checkOutTime)}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }


// src/app/owner/attendance/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { PageHeader } from "@/components/owner/PageHeader"
import { useToast } from "@/hooks/use-toast"
import { CalendarCheck, Clock, Plus, X, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/Avatar"

interface AttendanceRecord {
  id: string; checkInTime: string; checkOutTime: string | null
  member: { profile: { fullName: string; avatarUrl: string | null } }
  gym: { name: string }
}
interface GymMember {
  id: string; gymId: string
  profile: { fullName: string; avatarUrl: string | null }
  gym: { name: string }
}

function dur(ci: string, co: string | null) {
  if (!co) return "In gym"
  const m = Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 60000)
  return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`
}


export default function AttendancePage() {
  const { toast } = useToast()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [total, setTotal]     = useState(0)
  const [date, setDate]       = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(true)

  // Mark attendance modal
  const [showModal, setShowModal] = useState(false)
  const [members, setMembers]     = useState<GymMember[]>([])
  const [memberSearch, setMemberSearch] = useState("")
  const [selectedMember, setSelectedMember] = useState<GymMember | null>(null)
  const [markForm, setMarkForm] = useState({
    checkInDate: new Date().toISOString().split("T")[0],
    checkInTime: "09:00",
    checkOutTime: "",
  })
  const [marking, setMarking] = useState(false)

  const today = new Date().toISOString().split("T")[0]

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/owner/attendance?date=${date}`)
      .then(r => r.json())
      .then(d => { setRecords(d.records ?? []); setTotal(d.total ?? 0) })
      .finally(() => setLoading(false))
  }, [date])

  useEffect(() => { load() }, [load])

  const openModal = () => {
    setShowModal(true)
    setSelectedMember(null)
    setMemberSearch("")
    setMarkForm({ checkInDate: today, checkInTime: "09:00", checkOutTime: "" })
    if (members.length === 0) {
      fetch("/api/owner/members?page=1&limit=200")
        .then(r => r.json())
        .then(d => setMembers(Array.isArray(d.members) ? d.members : []))
    }
  }

  const markAttendance = async () => {
    if (!selectedMember) { toast({ variant: "destructive", title: "Please select a member" }); return }
    setMarking(true)
    const checkInTime  = `${markForm.checkInDate}T${markForm.checkInTime}:00`
    const checkOutTime = markForm.checkOutTime ? `${markForm.checkInDate}T${markForm.checkOutTime}:00` : null

    const res = await fetch("/api/owner/attendance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gymId:        selectedMember.gymId,
        memberId:     selectedMember.id,
        checkInTime,
        checkOutTime,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      toast({ variant: "success", title: "Attendance marked!", description: `${selectedMember.profile.fullName} checked in at ${markForm.checkInTime}` })
      setShowModal(false)
      load()
    } else {
      toast({ variant: "destructive", title: data.error ?? "Failed to mark attendance" })
    }
    setMarking(false)
  }

  const filtered = members.filter(m =>
    m.profile.fullName.toLowerCase().includes(memberSearch.toLowerCase())
  )

  const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl"

  return (
    <div className="max-w-5xl">
      <PageHeader title="Attendance" subtitle="Track member check-ins" />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-7">
        <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)}
          className="bg-white/5 border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary" />
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">
          <CalendarCheck className="w-4 h-4 text-primary" />
          <span className="text-white text-sm font-semibold">{total}</span>
          <span className="text-white/50 text-sm">check-ins</span>
        </div>
        <button onClick={openModal} className="ml-auto flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Mark Attendance
        </button>
      </div>

      {/* Records */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_,i) => <div key={i} className="h-14 bg-white/3 rounded-xl animate-pulse" />)}</div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <CalendarCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No check-ins for {date === today ? "today" : date}</p>
        </div>
      ) : (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-4 gap-4 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
            <span>Member</span><span>Gym</span><span>Check In</span><span>Duration</span>
          </div>
          <div className="divide-y divide-white/4">
            {records.map(r => (
              <div key={r.id} className="grid grid-cols-4 gap-4 px-5 py-4 items-center">
                <div className="flex items-center gap-3">
                  <Avatar name={r.member.profile.fullName} url={r.member.profile.avatarUrl} />
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

      {/* Mark Attendance Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[hsl(220_25%_10%)] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-display font-bold text-lg">Mark Attendance</h3>
              <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Member search */}
            <div className="space-y-2">
              <Label className="text-white/55 text-sm">Member</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <Input value={memberSearch} onChange={e => { setMemberSearch(e.target.value); setSelectedMember(null) }}
                  placeholder="Search member name..." className={`${inp} pl-9`} />
              </div>
              {memberSearch && !selectedMember && filtered.length > 0 && (
                <div className="bg-[hsl(220_25%_13%)] border border-white/10 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                  {filtered.slice(0, 8).map(m => (
                    <button key={m.id} type="button"
                      onClick={() => { setSelectedMember(m); setMemberSearch(m.profile.fullName) }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left">
                      <Avatar name={m.profile.fullName} url={m.profile.avatarUrl} />
                      <div>
                        <p className="text-white text-sm font-medium">{m.profile.fullName}</p>
                        <p className="text-white/35 text-xs">{m.gym.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedMember && (
                <div className="flex items-center gap-3 p-3 bg-primary/8 border border-primary/20 rounded-xl">
                  <Avatar name={selectedMember.profile.fullName} url={selectedMember.profile.avatarUrl} />
                  <div>
                    <p className="text-white text-sm font-medium">{selectedMember.profile.fullName}</p>
                    <p className="text-primary/70 text-xs">{selectedMember.gym.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Date + time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Date</Label>
                <Input type="date" max={today} value={markForm.checkInDate}
                  onChange={e => setMarkForm(p => ({ ...p, checkInDate: e.target.value }))} className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Check-in Time</Label>
                <Input type="time" value={markForm.checkInTime}
                  onChange={e => setMarkForm(p => ({ ...p, checkInTime: e.target.value }))} className={inp} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/55 text-sm">Check-out Time <span className="text-white/30">(optional)</span></Label>
              <Input type="time" value={markForm.checkOutTime}
                onChange={e => setMarkForm(p => ({ ...p, checkOutTime: e.target.value }))} className={inp} />
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 border-white/10 text-white/60 hover:text-white h-11">Cancel</Button>
              <Button onClick={markAttendance} disabled={marking || !selectedMember} className="flex-1 bg-gradient-primary hover:opacity-90 text-white h-11">
                {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark Attendance"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
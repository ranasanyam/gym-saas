

// // src/app/owner/attendance/page.tsx
// "use client"

// import { useEffect, useState, useCallback } from "react"
// import { PageHeader } from "@/components/owner/PageHeader"
// import { useToast } from "@/hooks/use-toast"
// import { CalendarCheck, Clock, Plus, X, Loader2, Search } from "lucide-react"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Button } from "@/components/ui/button"
// import { Avatar } from "@/components/ui/Avatar"

// interface AttendanceRecord {
//   id: string; checkInTime: string; checkOutTime: string | null
//   member: { profile: { fullName: string; avatarUrl: string | null } }
//   gym: { name: string }
// }
// interface GymMember {
//   id: string; gymId: string
//   profile: { fullName: string; avatarUrl: string | null }
//   gym: { name: string }
// }

// function dur(ci: string, co: string | null) {
//   if (!co) return "In gym"
//   const m = Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 60000)
//   return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`
// }


// export default function AttendancePage() {
//   const { toast } = useToast()
//   const [records, setRecords] = useState<AttendanceRecord[]>([])
//   const [total, setTotal]     = useState(0)
//   const [date, setDate]       = useState(new Date().toISOString().split("T")[0])
//   const [loading, setLoading] = useState(true)

//   // Mark attendance modal
//   const [showModal, setShowModal] = useState(false)
//   const [members, setMembers]     = useState<GymMember[]>([])
//   const [memberSearch, setMemberSearch] = useState("")
//   const [selectedMember, setSelectedMember] = useState<GymMember | null>(null)
//   const [markForm, setMarkForm] = useState({
//     checkInDate: new Date().toISOString().split("T")[0],
//     checkInTime: "09:00",
//     checkOutTime: "",
//   })
//   const [marking, setMarking] = useState(false)

//   const today = new Date().toISOString().split("T")[0]

//   const load = useCallback(() => {
//     setLoading(true)
//     fetch(`/api/owner/attendance?date=${date}`)
//       .then(r => r.json())
//       .then(d => { setRecords(d.records ?? []); setTotal(d.total ?? 0) })
//       .finally(() => setLoading(false))
//   }, [date])

//   useEffect(() => { load() }, [load])

//   const openModal = () => {
//     setShowModal(true)
//     setSelectedMember(null)
//     setMemberSearch("")
//     setMarkForm({ checkInDate: today, checkInTime: "09:00", checkOutTime: "" })
//     if (members.length === 0) {
//       fetch("/api/owner/members?page=1&limit=200")
//         .then(r => r.json())
//         .then(d => setMembers(Array.isArray(d.members) ? d.members : []))
//     }
//   }

//   const markAttendance = async () => {
//     if (!selectedMember) { toast({ variant: "destructive", title: "Please select a member" }); return }
//     setMarking(true)
//     const checkInTime  = `${markForm.checkInDate}T${markForm.checkInTime}:00`
//     const checkOutTime = markForm.checkOutTime ? `${markForm.checkInDate}T${markForm.checkOutTime}:00` : null

//     const res = await fetch("/api/owner/attendance", {
//       method: "POST", headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         gymId:        selectedMember.gymId,
//         memberId:     selectedMember.id,
//         checkInTime,
//         checkOutTime,
//       }),
//     })
//     const data = await res.json()
//     if (res.ok) {
//       toast({ variant: "success", title: "Attendance marked!", description: `${selectedMember.profile.fullName} checked in at ${markForm.checkInTime}` })
//       setShowModal(false)
//       load()
//     } else {
//       toast({ variant: "destructive", title: data.error ?? "Failed to mark attendance" })
//     }
//     setMarking(false)
//   }

//   const filtered = members.filter(m =>
//     m.profile.fullName.toLowerCase().includes(memberSearch.toLowerCase())
//   )

//   const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl"

//   return (
//     <div className="max-w-5xl">
//       <PageHeader title="Attendance" subtitle="Track member check-ins" />

//       {/* Controls */}
//       <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-7">
//         <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)}
//           className="bg-white/5 border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary" />
//         <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">
//           <CalendarCheck className="w-4 h-4 text-primary" />
//           <span className="text-white text-sm font-semibold">{total}</span>
//           <span className="text-white/50 text-sm">check-ins</span>
//         </div>
//         <button onClick={openModal} className="ml-auto flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
//           <Plus className="w-4 h-4" /> Mark Attendance
//         </button>
//       </div>

//       {/* Records */}
//       {loading ? (
//         <div className="space-y-3">{[...Array(5)].map((_,i) => <div key={i} className="h-14 bg-white/3 rounded-xl animate-pulse" />)}</div>
//       ) : records.length === 0 ? (
//         <div className="text-center py-16 text-white/30">
//           <CalendarCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
//           <p>No check-ins for {date === today ? "today" : date}</p>
//         </div>
//       ) : (
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
//           <div className="grid grid-cols-4 gap-4 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
//             <span>Member</span><span>Gym</span><span>Check In</span><span>Duration</span>
//           </div>
//           <div className="divide-y divide-white/4">
//             {records.map(r => (
//               <div key={r.id} className="grid grid-cols-4 gap-4 px-5 py-4 items-center">
//                 <div className="flex items-center gap-3">
//                   <Avatar name={r.member.profile.fullName} url={r.member.profile.avatarUrl} />
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

//       {/* Mark Attendance Modal */}
//       {showModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
//           <div className="bg-[hsl(220_25%_10%)] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl">
//             <div className="flex items-center justify-between">
//               <h3 className="text-white font-display font-bold text-lg">Mark Attendance</h3>
//               <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
//             </div>

//             {/* Member search */}
//             <div className="space-y-2">
//               <Label className="text-white/55 text-sm">Member</Label>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
//                 <Input value={memberSearch} onChange={e => { setMemberSearch(e.target.value); setSelectedMember(null) }}
//                   placeholder="Search member name..." className={`${inp} pl-9`} />
//               </div>
//               {memberSearch && !selectedMember && filtered.length > 0 && (
//                 <div className="bg-[hsl(220_25%_13%)] border border-white/10 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
//                   {filtered.slice(0, 8).map(m => (
//                     <button key={m.id} type="button"
//                       onClick={() => { setSelectedMember(m); setMemberSearch(m.profile.fullName) }}
//                       className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left">
//                       <Avatar name={m.profile.fullName} url={m.profile.avatarUrl} />
//                       <div>
//                         <p className="text-white text-sm font-medium">{m.profile.fullName}</p>
//                         <p className="text-white/35 text-xs">{m.gym.name}</p>
//                       </div>
//                     </button>
//                   ))}
//                 </div>
//               )}
//               {selectedMember && (
//                 <div className="flex items-center gap-3 p-3 bg-primary/8 border border-primary/20 rounded-xl">
//                   <Avatar name={selectedMember.profile.fullName} url={selectedMember.profile.avatarUrl} />
//                   <div>
//                     <p className="text-white text-sm font-medium">{selectedMember.profile.fullName}</p>
//                     <p className="text-primary/70 text-xs">{selectedMember.gym.name}</p>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Date + time */}
//             <div className="grid grid-cols-2 gap-3">
//               <div className="space-y-1.5">
//                 <Label className="text-white/55 text-sm">Date</Label>
//                 <Input type="date" max={today} value={markForm.checkInDate}
//                   onChange={e => setMarkForm(p => ({ ...p, checkInDate: e.target.value }))} className={inp} />
//               </div>
//               <div className="space-y-1.5">
//                 <Label className="text-white/55 text-sm">Check-in Time</Label>
//                 <Input type="time" value={markForm.checkInTime}
//                   onChange={e => setMarkForm(p => ({ ...p, checkInTime: e.target.value }))} className={inp} />
//               </div>
//             </div>
//             <div className="space-y-1.5">
//               <Label className="text-white/55 text-sm">Check-out Time <span className="text-white/30">(optional)</span></Label>
//               <Input type="time" value={markForm.checkOutTime}
//                 onChange={e => setMarkForm(p => ({ ...p, checkOutTime: e.target.value }))} className={inp} />
//             </div>

//             <div className="flex gap-3 pt-1">
//               <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 border-white/10 text-white/60 hover:text-white h-11">Cancel</Button>
//               <Button onClick={markAttendance} disabled={marking || !selectedMember} className="flex-1 bg-gradient-primary hover:opacity-90 text-white h-11">
//                 {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark Attendance"}
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// src/app/owner/attendance/page.tsx
"use client"

import { useSubscription } from "@/contexts/SubscriptionContext"
import { PlanGate } from "@/components/owner/PlanGate"
import { PageHeader } from "@/components/owner/PageHeader"
import { AppSelect } from "@/components/ui/AppSelect"
import { useEffect, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { CalendarCheck, Loader2, Search, Clock } from "lucide-react"

interface AttendanceRecord {
  id: string; checkInTime: string; checkOutTime: string | null
  method: string
  member: { profile: { fullName: string; avatarUrl: string | null } }
  gym: { name: string }
}

function AttendanceContent() {
  const { toast } = useToast()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [gyms, setGyms] = useState<{ id: string; name: string }[]>([])
  const [gymId, setGymId] = useState("")
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const load = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (gymId) p.set("gymId", gymId)
    if (search) p.set("search", search)
    fetch(`/api/owner/attendance?${p}`).then(r => r.json()).then(d => {
      setRecords(Array.isArray(d) ? d : (d.records ?? []))
      setTotal(d.total ?? 0)
    }).catch(() => { }).finally(() => setLoading(false))
  }, [gymId, search])

  useEffect(() => {
    fetch("/api/owner/gyms").then(r => r.json()).then(g => { if (Array.isArray(g)) setGyms(g) })
  }, [])
  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        {gyms.length > 1 && (
          <AppSelect
            value={gymId}
            onChange={setGymId}
            placeholder="All Gyms"
            options={[{ value: "", label: "All Gyms" }, ...gyms.map(g => ({ value: g.id, label: g.name }))]}
            className="w-40"
          />
        )}
        <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 h-10 flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search member..."
            className="bg-transparent text-sm text-white placeholder:text-white/25 outline-none w-full" />
        </div>
        <span className="text-white/35 text-xs ml-auto">{total} total check-ins</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <CalendarCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No attendance records yet.</p>
        </div>
      ) : (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Member", "Gym", "Check-in", "Check-out", "Duration", "Method"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-white/30 text-xs font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {records.map(r => {
                const cin = new Date(r.checkInTime)
                const cout = r.checkOutTime ? new Date(r.checkOutTime) : null
                const dur = cout ? Math.round((cout.getTime() - cin.getTime()) / 60000) : null
                const today = cin.toDateString() === new Date().toDateString()
                return (
                  <tr key={r.id} className="hover:bg-white/2">
                    <td className="px-4 py-3 text-white font-medium">{r.member.profile.fullName}</td>
                    <td className="px-4 py-3 text-white/50">{r.gym.name}</td>
                    <td className="px-4 py-3 text-white/60">
                      <span className={today ? "text-green-400 font-medium" : ""}>
                        {today ? "Today" : cin.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                      {" · "}{cin.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-white/50">
                      {cout ? cout.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : (
                        <span className="text-green-400 text-xs">Active</span>
                      )}
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
      )}
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
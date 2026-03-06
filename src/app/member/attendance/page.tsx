// // src/app/member/attendance/page.tsx
// "use client"

// import { useEffect, useState } from "react"
// import { CalendarCheck, Clock, CheckCircle2, Loader2, TrendingUp } from "lucide-react"

// export default function MemberAttendancePage() {
//   const [records, setRecords] = useState<any[]>([])
//   const [total, setTotal]     = useState(0)
//   const [page, setPage]       = useState(1)
//   const [pages, setPages]     = useState(1)
//   const [loading, setLoading] = useState(true)

//   const load = (p: number) => {
//     setLoading(true)
//     fetch(`/api/member/attendance?page=${p}`)
//       .then(r => r.json())
//       .then(d => { setRecords(d.records ?? []); setTotal(d.total ?? 0); setPages(d.pages ?? 1) })
//       .finally(() => setLoading(false))
//   }

//   useEffect(() => { load(page) }, [page])

//   // Group by month
//   const grouped: Record<string, any[]> = {}
//   records.forEach(r => {
//     const key = new Date(r.checkInTime).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
//     if (!grouped[key]) grouped[key] = []
//     grouped[key].push(r)
//   })

//   return (
//     <div className="max-w-2xl space-y-5">
//       <div className="flex items-center justify-between">
//         <h2 className="text-2xl font-display font-bold text-white">Attendance History</h2>
//         <div className="flex items-center gap-2 bg-[hsl(220_25%_9%)] border border-white/6 rounded-xl px-4 py-2">
//           <TrendingUp className="w-4 h-4 text-primary" />
//           <span className="text-white font-semibold text-sm">{total}</span>
//           <span className="text-white/40 text-xs">total check-ins</span>
//         </div>
//       </div>

//       {loading && records.length === 0 ? (
//         <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
//       ) : records.length === 0 ? (
//         <div className="flex flex-col items-center justify-center h-48 space-y-3">
//           <CalendarCheck className="w-10 h-10 text-white/15" />
//           <p className="text-white/30 text-sm">No check-ins recorded yet</p>
//         </div>
//       ) : (
//         <>
//           {Object.entries(grouped).map(([month, recs]) => (
//             <div key={month}>
//               <div className="flex items-center gap-3 mb-3">
//                 <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">{month}</p>
//                 <span className="text-white/20 text-xs">{recs.length} visit{recs.length !== 1 ? "s" : ""}</span>
//               </div>
//               <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl divide-y divide-white/4 overflow-hidden">
//                 {recs.map(r => {
//                   const checkIn  = new Date(r.checkInTime)
//                   const checkOut = r.checkOutTime ? new Date(r.checkOutTime) : null
//                   const durationMin = checkOut
//                     ? Math.round((checkOut.getTime() - checkIn.getTime()) / 60000)
//                     : null
//                   return (
//                     <div key={r.id} className="flex items-center gap-4 px-5 py-4">
//                       <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
//                         <CheckCircle2 className="w-4.5 h-4.5 text-green-400" />
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <p className="text-white text-sm font-medium">{r.gym?.name}</p>
//                         <p className="text-white/35 text-xs mt-0.5">
//                           {checkIn.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
//                           {" · "}
//                           {checkIn.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
//                           {checkOut && ` → ${checkOut.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
//                         </p>
//                       </div>
//                       {durationMin !== null && (
//                         <span className="text-white/30 text-xs flex items-center gap-1 shrink-0">
//                           <Clock className="w-3 h-3" />
//                           {durationMin >= 60 ? `${Math.floor(durationMin/60)}h ${durationMin%60}m` : `${durationMin}m`}
//                         </span>
//                       )}
//                     </div>
//                   )
//                 })}
//               </div>
//             </div>
//           ))}

//           {pages > 1 && (
//             <div className="flex items-center justify-center gap-3 pt-2">
//               <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
//                 className="px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white disabled:opacity-30 text-sm transition-colors">
//                 Previous
//               </button>
//               <span className="text-white/30 text-sm">{page} / {pages}</span>
//               <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
//                 className="px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white disabled:opacity-30 text-sm transition-colors">
//                 Next
//               </button>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   )
// }


// src/app/member/attendance/page.tsx
"use client"

import { useEffect, useState } from "react"
import { CalendarCheck, Clock, CheckCircle2, Loader2, TrendingUp, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function MemberAttendancePage() {
  const { toast } = useToast()
  const [records, setRecords]         = useState<any[]>([])
  const [total, setTotal]             = useState(0)
  const [page, setPage]               = useState(1)
  const [pages, setPages]             = useState(1)
  const [loading, setLoading]         = useState(true)
  const [checkingIn, setCheckingIn]   = useState(false)
  const [checkedInToday, setCheckedInToday] = useState(false)

  const todayStr = new Date().toDateString() // e.g. "Fri Mar 06 2026"

  const load = (p: number) => {
    setLoading(true)
    fetch(`/api/member/attendance?page=${p}`)
      .then(r => r.json())
      .then(d => {
        const recs = d.records ?? []
        setRecords(recs)
        setTotal(d.total ?? 0)
        setPages(d.pages ?? 1)
        // Check if first record (most recent) is from today
        if (recs.length > 0) {
          const latest = new Date(recs[0].checkInTime).toDateString()
          setCheckedInToday(latest === todayStr)
        } else {
          setCheckedInToday(false)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page) }, [page])

  const checkIn = async () => {
    setCheckingIn(true)
    const res  = await fetch("/api/member/attendance", { method: "POST" })
    const data = await res.json()
    if (res.ok) {
      toast({ variant: "success", title: "Checked in!", description: "Your attendance has been recorded for today." })
      load(1)
    } else {
      toast({ variant: "destructive", title: data.error ?? "Could not check in" })
    }
    setCheckingIn(false)
  }

  // Group records by month label
  const grouped: Record<string, any[]> = {}
  records.forEach(r => {
    const key = new Date(r.checkInTime).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(r)
  })

  return (
    <div className="max-w-2xl space-y-5">

      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-display font-bold text-white">Attendance History</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[hsl(220_25%_9%)] border border-white/6 rounded-xl px-4 py-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-white font-semibold text-sm">{total}</span>
            <span className="text-white/40 text-xs">total</span>
          </div>

          {checkedInToday ? (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold px-4 py-2.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
              Checked In Today
            </div>
          ) : (
            <button
              onClick={checkIn}
              disabled={checkingIn}
              className="flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {checkingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Check In Today
            </button>
          )}
        </div>
      </div>

      {loading && records.length === 0 ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-3">
          <CalendarCheck className="w-10 h-10 text-white/15" />
          <p className="text-white/30 text-sm">No check-ins recorded yet</p>
          <p className="text-white/20 text-xs">Tap "Check In Today" to record today's visit</p>
        </div>
      ) : (
        <>
          {Object.entries(grouped).map(([month, recs]) => (
            <div key={month}>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">{month}</p>
                <span className="text-white/20 text-xs">{recs.length} visit{recs.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl divide-y divide-white/4 overflow-hidden">
                {recs.map((r: any) => {
                  const ci  = new Date(r.checkInTime)
                  const co  = r.checkOutTime ? new Date(r.checkOutTime) : null
                  const dur = co ? Math.round((co.getTime() - ci.getTime()) / 60000) : null
                  const isToday = ci.toDateString() === todayStr
                  return (
                    <div key={r.id} className="flex items-center gap-4 px-5 py-4">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isToday ? "bg-primary/15" : "bg-green-500/10"}`}>
                        <CheckCircle2 className={`w-4 h-4 ${isToday ? "text-primary" : "text-green-400"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white/80 text-sm font-medium">{r.gym?.name}</p>
                          {isToday && <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">Today</span>}
                        </div>
                        <p className="text-white/35 text-xs">
                          {ci.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                          {" · "}
                          {ci.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          {co && ` → ${co.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
                        </p>
                      </div>
                      {dur !== null && (
                        <span className="text-white/30 text-xs flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {dur >= 60 ? `${Math.floor(dur/60)}h ${dur%60}m` : `${dur}m`}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white disabled:opacity-30 text-sm">Previous</button>
              <span className="text-white/30 text-sm">{page} / {pages}</span>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white disabled:opacity-30 text-sm">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
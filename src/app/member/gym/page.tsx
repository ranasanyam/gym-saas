// // src/app/member/gym/page.tsx
// "use client"

// import { useEffect, useState } from "react"
// import Link from "next/link"
// import { Building2, MapPin, Phone, Users, Dumbbell, Wifi, Star, UserCheck, Calendar, CreditCard, Loader2, Compass, ChevronRight } from "lucide-react"

// export default function MyGymPage() {
//   const [data, setData]   = useState<any>(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     fetch("/api/member/dashboard").then(r => r.json()).then(setData).finally(() => setLoading(false))
//   }, [])

//   if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>

//   const m = data?.activeMembership
//   if (!m) return (
//     <div className="max-w-xl mx-auto text-center py-20 space-y-4">
//       <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
//         <Building2 className="w-8 h-8 text-white/20" />
//       </div>
//       <h2 className="text-white font-display font-bold text-xl">Not enrolled in any gym</h2>
//       <p className="text-white/40 text-sm">Browse and join a gym in your city to get started.</p>
//       <Link href="/member/discover" className="inline-flex items-center gap-2 bg-gradient-primary text-white font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
//         <Compass className="w-4 h-4" /> Discover Gyms
//       </Link>
//     </div>
//   )

//   const gym  = m.gym
//   const plan = m.membershipPlan

//   return (
//     <div className="max-w-4xl space-y-5">
//       <h2 className="text-2xl font-display font-bold text-white">My Gym</h2>

//       {/* Gym header card */}
//       <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
//         <div className="flex items-start gap-4">
//           <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
//             <Building2 className="w-7 h-7 text-primary" />
//           </div>
//           <div className="flex-1 min-w-0">
//             <div className="flex items-center gap-3 flex-wrap">
//               <h3 className="text-white text-xl font-display font-bold">{gym.name}</h3>
//               <span className="text-xs bg-green-500/15 text-green-400 px-3 py-1 rounded-full font-medium">Active</span>
//             </div>
//             {gym.address && (
//               <p className="text-white/40 text-sm mt-1 flex items-center gap-1.5">
//                 <MapPin className="w-3.5 h-3.5 shrink-0" />
//                 {gym.address}{gym.city ? `, ${gym.city}` : ""}
//               </p>
//             )}
//           </div>
//         </div>
//       </div>

//       <div className="grid md:grid-cols-2 gap-5">
//         {/* Membership details */}
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
//           <h4 className="text-white font-semibold text-sm flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Membership</h4>
//           {plan ? (
//             <>
//               <div className="p-4 bg-primary/8 border border-primary/15 rounded-xl">
//                 <p className="text-primary font-semibold">{plan.name}</p>
//                 <p className="text-white/50 text-xs mt-0.5">{plan.durationMonths} month{plan.durationMonths > 1 ? "s" : ""} plan</p>
//               </div>
//               {plan.features?.length > 0 && (
//                 <ul className="space-y-2">
//                   {plan.features.map((f: string) => (
//                     <li key={f} className="flex items-center gap-2 text-sm text-white/55">
//                       <Star className="w-3 h-3 text-primary/60 shrink-0" /> {f}
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </>
//           ) : <p className="text-white/30 text-sm">No plan assigned</p>}
//           <div className="pt-3 border-t border-white/6 grid grid-cols-2 gap-3 text-xs">
//             <div>
//               <p className="text-white/35">Start Date</p>
//               <p className="text-white/80 font-medium mt-0.5">{new Date(m.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
//             </div>
//             <div>
//               <p className="text-white/35">Expires</p>
//               <p className="text-white/80 font-medium mt-0.5">
//                 {m.endDate ? new Date(m.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No expiry"}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Trainer */}
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
//           <h4 className="text-white font-semibold text-sm flex items-center gap-2"><UserCheck className="w-4 h-4 text-primary" /> Assigned Trainer</h4>
//           {m.assignedTrainer ? (
//             <div className="flex items-center gap-3">
//               <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
//                 {m.assignedTrainer.profile.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
//               </div>
//               <div>
//                 <p className="text-white font-semibold">{m.assignedTrainer.profile.fullName}</p>
//                 {m.assignedTrainer.specializations?.length > 0 && (
//                   <p className="text-white/40 text-xs mt-0.5">{m.assignedTrainer.specializations.slice(0, 2).join(", ")}</p>
//                 )}
//               </div>
//             </div>
//           ) : (
//             <div className="text-center py-6">
//               <UserCheck className="w-8 h-8 text-white/15 mx-auto mb-2" />
//               <p className="text-white/30 text-sm">No trainer assigned yet</p>
//             </div>
//           )}

//           <div className="pt-4 border-t border-white/6 space-y-3 text-xs">
//             {m.heightCm && <div className="flex justify-between"><span className="text-white/35">Height</span><span className="text-white/70">{Number(m.heightCm)} cm</span></div>}
//             {m.weightKg && <div className="flex justify-between"><span className="text-white/35">Weight</span><span className="text-white/70">{Number(m.weightKg)} kg</span></div>}
//           </div>
//         </div>
//       </div>

//       {/* Services & Facilities */}
//       {(gym.services?.length > 0) && (
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
//           <h4 className="text-white font-semibold text-sm flex items-center gap-2"><Dumbbell className="w-4 h-4 text-primary" /> Services</h4>
//           <div className="flex flex-wrap gap-2">
//             {gym.services.map((s: string) => (
//               <span key={s} className="text-xs bg-primary/10 border border-primary/15 text-primary/80 px-3 py-1.5 rounded-full">{s}</span>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }


// src/app/member/gym/page.tsx
"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import {
  Building2, MapPin, Phone, Star, UserCheck,
  CreditCard, Loader2, Compass, ChevronLeft, ChevronRight,
  Image as ImageIcon, Clock, CheckCircle2, XCircle
} from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"

function GymImageCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setIdx(i => (i + 1) % images.length)
    }, 3500)
  }

  useEffect(() => {
    if (images.length < 2) return
    start()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [images.length])

  const go = (dir: 1 | -1) => {
    setIdx(i => (i + dir + images.length) % images.length)
    start() // reset auto-advance on manual nav
  }

  if (images.length === 0) return (
    <div className="h-48 bg-[hsl(220_25%_6%)] rounded-t-2xl flex flex-col items-center justify-center gap-2">
      <ImageIcon className="w-8 h-8 text-white/10" />
      <span className="text-white/20 text-xs">No gym photos</span>
    </div>
  )

  return (
    <div className="relative h-48 rounded-t-2xl overflow-hidden bg-black">
      <img src={images[idx]} alt="Gym" className="w-full h-full object-cover transition-opacity duration-500" />
      {images.length > 1 && (
        <>
          <button onClick={() => go(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => go(1)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button key={i} onClick={() => { setIdx(i); start() }}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "bg-white w-4" : "bg-white/40 w-1.5"}`} />
            ))}
          </div>
          <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">{idx + 1}/{images.length}</div>
        </>
      )}
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:    "bg-green-500/15 text-green-400 border-green-500/20",
  EXPIRED:   "bg-white/8 text-white/40 border-white/10",
  SUSPENDED: "bg-red-500/15 text-red-400 border-red-500/20",
  PENDING:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
}
const STATUS_ICONS: Record<string, React.ReactNode> = {
  ACTIVE:    <CheckCircle2 className="w-3 h-3" />,
  EXPIRED:   <Clock className="w-3 h-3" />,
  SUSPENDED: <XCircle className="w-3 h-3" />,
  PENDING:   <Clock className="w-3 h-3" />,
}

export default function MyGymPage() {
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/member/dashboard").then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  )

  const allMemberships: any[] = data?.memberships ?? []
  const active = allMemberships.find((m: any) => m.status === "ACTIVE")

  if (allMemberships.length === 0) return (
    <div className="max-w-xl mx-auto text-center py-20 space-y-4">
      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
        <Building2 className="w-8 h-8 text-white/20" />
      </div>
      <h2 className="text-white font-display font-bold text-xl">Not enrolled in any gym</h2>
      <p className="text-white/40 text-sm">Browse and join a gym in your city to get started.</p>
      <Link href="/member/discover"
        className="inline-flex items-center gap-2 bg-gradient-primary text-white font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
        <Compass className="w-4 h-4" /> Discover Gyms
      </Link>
    </div>
  )

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-white">My Gyms</h2>
        <span className="text-white/35 text-sm">{allMemberships.length} gym{allMemberships.length !== 1 ? "s" : ""} joined</span>
      </div>

      {allMemberships.map((m: any) => {
        const gym   = m.gym
        const plan  = m.membershipPlan
        const isAct = m.status === "ACTIVE"
        const images: string[] = gym.gymImages ?? []

        return (
          <div key={m.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
            {/* Gym image carousel */}
            <GymImageCarousel images={images} />

            {/* Gym header */}
            <div className="p-5 border-b border-white/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white text-lg font-display font-bold">{gym.name}</h3>
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium border ${STATUS_STYLES[m.status] ?? STATUS_STYLES.EXPIRED}`}>
                      {STATUS_ICONS[m.status]}
                      {m.status.charAt(0) + m.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  {gym.address && (
                    <p className="text-white/40 text-sm mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {gym.address}{gym.city ? `, ${gym.city}` : ""}
                    </p>
                  )}
                  {gym.contactNumber && (
                    <a href={`tel:${gym.contactNumber}`}
                      className="inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 mt-1 transition-colors">
                      <Phone className="w-3 h-3" /> {gym.contactNumber}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Membership + trainer info */}
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
              {/* Membership details */}
              <div className="p-5 space-y-3">
                <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Membership
                </h4>
                {plan ? (
                  <div className="p-3 bg-primary/8 border border-primary/15 rounded-xl">
                    <p className="text-primary font-semibold text-sm">{plan.name}</p>
                    <p className="text-white/40 text-xs mt-0.5">{plan.durationMonths} month{plan.durationMonths > 1 ? "s" : ""} plan</p>
                  </div>
                ) : (
                  <p className="text-white/30 text-sm">No plan assigned</p>
                )}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-white/35">Joined</p>
                    <p className="text-white/80 font-medium mt-0.5">
                      {new Date(m.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/35">Expires</p>
                    <p className={`font-medium mt-0.5 ${isAct && m.endDate && new Date(m.endDate).getTime() - Date.now() < 7 * 86400000 ? "text-red-400" : "text-white/80"}`}>
                      {m.endDate
                        ? new Date(m.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "No expiry"}
                    </p>
                  </div>
                </div>
                {plan?.features?.length > 0 && (
                  <ul className="space-y-1.5 pt-1">
                    {plan.features.slice(0, 4).map((f: string) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-white/45">
                        <Star className="w-3 h-3 text-primary/50 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Trainer */}
              <div className="p-5 space-y-3">
                <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> Assigned Trainer
                </h4>
                {m.assignedTrainer ? (
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={m.assignedTrainer.profile.fullName}
                      url={m.assignedTrainer.profile.avatarUrl}
                      size={44}
                    />
                    <div>
                      <p className="text-white font-semibold text-sm">{m.assignedTrainer.profile.fullName}</p>
                      {m.assignedTrainer.specializations?.length > 0 && (
                        <p className="text-white/40 text-xs mt-0.5">
                          {m.assignedTrainer.specializations.slice(0, 2).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4">
                    <UserCheck className="w-7 h-7 text-white/15 mb-2" />
                    <p className="text-white/30 text-sm">No trainer assigned</p>
                  </div>
                )}

                {/* Gym owner contact */}
                {gym.owner && (
                  <div className="pt-3 border-t border-white/5 flex items-center gap-3">
                    <Avatar name={gym.owner.fullName} url={gym.owner.avatarUrl} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/40 text-[10px]">Gym Owner</p>
                      <p className="text-white/70 text-xs font-medium truncate">{gym.owner.fullName}</p>
                    </div>
                    {gym.owner.mobileNumber && (
                      <a href={`tel:${gym.owner.mobileNumber}`}
                        className="text-green-400 hover:text-green-300 transition-colors">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Services */}
            {gym.services?.length > 0 && (
              <div className="px-5 pb-5 pt-2 border-t border-white/5">
                <div className="flex flex-wrap gap-1.5">
                  {gym.services.map((s: string) => (
                    <span key={s} className="text-xs bg-primary/10 border border-primary/15 text-primary/80 px-2.5 py-1 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      <div className="text-center pt-2">
        <Link href="/member/discover"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors">
          <Compass className="w-4 h-4" /> Discover more gyms
        </Link>
      </div>
    </div>
  )
}
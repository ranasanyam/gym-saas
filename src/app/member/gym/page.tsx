// src/app/member/gym/page.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Building2, MapPin, Phone, Users, Dumbbell, Wifi, Star, UserCheck, Calendar, CreditCard, Loader2, Compass, ChevronRight } from "lucide-react"

export default function MyGymPage() {
  const [data, setData]   = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/member/dashboard").then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>

  const m = data?.activeMembership
  if (!m) return (
    <div className="max-w-xl mx-auto text-center py-20 space-y-4">
      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
        <Building2 className="w-8 h-8 text-white/20" />
      </div>
      <h2 className="text-white font-display font-bold text-xl">Not enrolled in any gym</h2>
      <p className="text-white/40 text-sm">Browse and join a gym in your city to get started.</p>
      <Link href="/member/discover" className="inline-flex items-center gap-2 bg-gradient-primary text-white font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
        <Compass className="w-4 h-4" /> Discover Gyms
      </Link>
    </div>
  )

  const gym  = m.gym
  const plan = m.membershipPlan

  return (
    <div className="max-w-4xl space-y-5">
      <h2 className="text-2xl font-display font-bold text-white">My Gym</h2>

      {/* Gym header card */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-white text-xl font-display font-bold">{gym.name}</h3>
              <span className="text-xs bg-green-500/15 text-green-400 px-3 py-1 rounded-full font-medium">Active</span>
            </div>
            {gym.address && (
              <p className="text-white/40 text-sm mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {gym.address}{gym.city ? `, ${gym.city}` : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Membership details */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
          <h4 className="text-white font-semibold text-sm flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Membership</h4>
          {plan ? (
            <>
              <div className="p-4 bg-primary/8 border border-primary/15 rounded-xl">
                <p className="text-primary font-semibold">{plan.name}</p>
                <p className="text-white/50 text-xs mt-0.5">{plan.durationMonths} month{plan.durationMonths > 1 ? "s" : ""} plan</p>
              </div>
              {plan.features?.length > 0 && (
                <ul className="space-y-2">
                  {plan.features.map((f: string) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/55">
                      <Star className="w-3 h-3 text-primary/60 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : <p className="text-white/30 text-sm">No plan assigned</p>}
          <div className="pt-3 border-t border-white/6 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-white/35">Start Date</p>
              <p className="text-white/80 font-medium mt-0.5">{new Date(m.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
            <div>
              <p className="text-white/35">Expires</p>
              <p className="text-white/80 font-medium mt-0.5">
                {m.endDate ? new Date(m.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No expiry"}
              </p>
            </div>
          </div>
        </div>

        {/* Trainer */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
          <h4 className="text-white font-semibold text-sm flex items-center gap-2"><UserCheck className="w-4 h-4 text-primary" /> Assigned Trainer</h4>
          {m.assignedTrainer ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                {m.assignedTrainer.profile.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div>
                <p className="text-white font-semibold">{m.assignedTrainer.profile.fullName}</p>
                {m.assignedTrainer.specializations?.length > 0 && (
                  <p className="text-white/40 text-xs mt-0.5">{m.assignedTrainer.specializations.slice(0, 2).join(", ")}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <UserCheck className="w-8 h-8 text-white/15 mx-auto mb-2" />
              <p className="text-white/30 text-sm">No trainer assigned yet</p>
            </div>
          )}

          <div className="pt-4 border-t border-white/6 space-y-3 text-xs">
            {m.heightCm && <div className="flex justify-between"><span className="text-white/35">Height</span><span className="text-white/70">{Number(m.heightCm)} cm</span></div>}
            {m.weightKg && <div className="flex justify-between"><span className="text-white/35">Weight</span><span className="text-white/70">{Number(m.weightKg)} kg</span></div>}
          </div>
        </div>
      </div>

      {/* Services & Facilities */}
      {(gym.services?.length > 0) && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
          <h4 className="text-white font-semibold text-sm flex items-center gap-2"><Dumbbell className="w-4 h-4 text-primary" /> Services</h4>
          <div className="flex flex-wrap gap-2">
            {gym.services.map((s: string) => (
              <span key={s} className="text-xs bg-primary/10 border border-primary/15 text-primary/80 px-3 py-1.5 rounded-full">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
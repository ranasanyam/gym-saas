// src/app/member/gym/page.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Building2, MapPin, Phone, UserCheck,
  CreditCard, Compass, ChevronLeft, ChevronRight, QrCode,
  CheckCircle2, MessageCircle,
} from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"
import { NoGymState } from "@/components/member/NoGymState"

const STATUS_STYLE: Record<string, string> = {
  ACTIVE:    "bg-green-500/15 text-green-400 border-green-500/20",
  EXPIRED:   "bg-red-500/15 text-red-400 border-red-500/20",
  SUSPENDED: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
}

function ImageCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0)
  if (images.length === 0) return null
  return (
    <div className="relative rounded-2xl overflow-hidden h-52 bg-white/5">
      <img src={images[idx]} alt="Gym" className="w-full h-full object-cover" />
      {images.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setIdx(i => (i + 1) % images.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-white w-3" : "bg-white/40"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function GymCard({ m }: { m: any }) {
  const gym    = m.gym
  const plan   = m.membershipPlan
  const trainer = m.assignedTrainer

  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <ImageCarousel images={gym?.gymImages ?? []} />

        {/* Gym info */}
        <div className={`flex items-start gap-4 ${gym?.gymImages?.length ? "mt-4" : ""}`}>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            {gym?.logoUrl
              ? <img src={gym.logoUrl} alt={gym.name} className="w-full h-full object-cover rounded-2xl" />
              : <Building2 className="w-7 h-7 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-white text-lg font-display font-bold">{gym?.name}</h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${STATUS_STYLE[m.status] ?? "bg-white/8 text-white/40 border-white/10"}`}>
                {m.status}
              </span>
            </div>
            {gym?.address && (
              <p className="text-white/40 text-sm mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {gym.address}{gym.city ? `, ${gym.city}` : ""}
                {gym.state ? `, ${gym.state}` : ""}
                {gym.pincode ? ` - ${gym.pincode}` : ""}
              </p>
            )}
            {gym?.contactNumber && (
              <p className="text-white/40 text-sm mt-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 shrink-0" /> {gym.contactNumber}
              </p>
            )}
            {gym?.whatsappNumber && (
              <a href={`https://wa.me/${gym.whatsappNumber.replace(/\D/g, "")}`}
                target="_blank" rel="noreferrer"
                className="text-green-400/70 text-sm mt-1 flex items-center gap-1.5 hover:text-green-400 transition-colors">
                <MessageCircle className="w-3.5 h-3.5 shrink-0" /> WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Services */}
        <div  className="flex flex-row items-center gap-5 mt-4 mb-4">
          <div className="text-lg text-white">Services:</div>
          {gym?.services?.length > 0 && (
            <div className="flex flex-wrap gap-1.5border-t border-white/5">
              {gym.services.map((s: string) => (
                <span key={s} className="text-xs bg-primary/10 border border-primary/15 text-primary/80 px-2.5 py-1 rounded-full">{s}</span>
              ))}
            </div>
          )}
        </div>

        {/* Facilities */}
        <div className="flex flex-row items-center gap-5 my-2">
          <div className="text-lg text-white">
            Facilities:
          </div>
          {gym?.facilities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {gym.facilities.map((f: string) => (
              <span key={f} className="text-xs bg-white/5 border border-white/8 text-white/50 px-2.5 py-1 rounded-full">{f}</span>
            ))}
          </div>
        )}
        </div>
        
      </div>

      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5 border-t border-white/5">
        {/* Membership plan */}
        <div className="p-5 space-y-3">
          <h4 className="text-white font-semibold text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" /> Membership
          </h4>
          {plan ? (
            <>
              <div className="space-y-2">
                {[
                  ["Plan",       plan.name],
                  ["Duration",   `${plan.durationMonths} month${plan.durationMonths !== 1 ? "s" : ""}`],
                  ["Price",      `₹${Number(plan.price).toLocaleString("en-IN")}`],
                  ["Start",      m.startDate ? new Date(m.startDate).toLocaleDateString("en-IN") : "—"],
                  ["Expires",    m.endDate   ? new Date(m.endDate).toLocaleDateString("en-IN")   : "No expiry"],
                  ...(m.daysRemaining !== null && m.status === "ACTIVE"
                    ? [["Days left", m.daysRemaining === 0 ? "Expires today" : `${m.daysRemaining} days`]]
                    : []),
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-white/40">{label}</span>
                    <span className="text-white font-medium">{val}</span>
                  </div>
                ))}
              </div>
              {plan.description && (
                <p className="text-white/35 text-xs pt-1">{plan.description}</p>
              )}
              {plan.features?.length > 0 && (
                <div className="space-y-1 pt-1">
                  {plan.features.map((f: string) => (
                    <div key={f} className="flex items-center gap-1.5 text-xs text-white/50">
                      <CheckCircle2 className="w-3 h-3 text-primary shrink-0" /> {f}
                    </div>
                  ))}
                </div>
              )}
              {/* Member ID */}
              {/* <div className="bg-white/3 border border-white/8 rounded-xl p-3 text-center mt-2">
                <QrCode className="w-5 h-5 text-white/30 mx-auto mb-1" />
                <p className="text-white/40 text-[10px] mb-0.5">Member ID</p>
                <p className="text-white font-mono text-xs tracking-wider break-all">{m.id}</p>
              </div> */}
            </>
          ) : (
            <p className="text-white/30 text-sm">No plan info</p>
          )}
        </div>

        {/* Trainer + stats */}
        <div className="p-5 space-y-4">
          <h4 className="text-white font-semibold text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" /> Trainer
          </h4>
          {trainer ? (
            <div className="flex items-center gap-3">
              <Avatar name={trainer.fullName} url={trainer.avatarUrl} size={48} rounded="lg" />
              <div>
                <p className="text-white font-semibold text-sm">{trainer.fullName}</p>
                <p className="text-white/40 text-xs">Personal Trainer</p>
                {trainer.mobileNumber && (
                  <p className="text-white/35 text-xs mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {trainer.mobileNumber}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-3 gap-1.5">
              <UserCheck className="w-6 h-6 text-white/15" />
              <p className="text-white/30 text-xs">No trainer assigned</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
            <div className="bg-white/3 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg leading-none">{m.totalCheckins}</p>
              <p className="text-white/40 text-[10px] mt-1">Total Check-ins</p>
            </div>
            <div className="bg-white/3 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg leading-none">{m.currentStreak}</p>
              <p className="text-white/40 text-[10px] mt-1">Current Streak</p>
            </div>
            <div className="bg-white/3 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg leading-none">{m.longestStreak}</p>
              <p className="text-white/40 text-[10px] mt-1">Best Streak</p>
            </div>
            {m.membershipType && (
              <div className="bg-white/3 rounded-xl p-3 text-center">
                <p className="text-white font-bold text-sm leading-none truncate">{m.membershipType}</p>
                <p className="text-white/40 text-[10px] mt-1">Type</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MyGymPage() {
  const [memberships, setMemberships] = useState<any[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    fetch("/api/member/gyms")
      .then(r => r.json())
      .then(d => setMemberships(d.memberships ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="max-w-4xl space-y-5 animate-pulse">
      <div className="h-8 w-40 bg-white/5 rounded" />
      <div className="h-64 bg-white/5 rounded-2xl" />
      <div className="h-64 bg-white/5 rounded-2xl" />
    </div>
  )

  if (memberships.length === 0) return <NoGymState pageName="My Gym" />

  const active  = memberships.filter(m => m.status === "ACTIVE")
  const others  = memberships.filter(m => m.status !== "ACTIVE")

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-white">My Gyms</h2>
        <span className="text-white/40 text-sm">{memberships.length} enrollment{memberships.length !== 1 ? "s" : ""}</span>
      </div>

      {active.length > 0 && (
        <div className="space-y-4">
          {active.length > 1 && (
            <p className="text-white/40 text-xs uppercase tracking-widest font-medium">Active</p>
          )}
          {active.map(m => <GymCard key={m.id} m={m} />)}
        </div>
      )}

      {others.length > 0 && (
        <div className="space-y-4">
          <p className="text-white/40 text-xs uppercase tracking-widest font-medium">Past Enrollments</p>
          {others.map(m => <GymCard key={m.id} m={m} />)}
        </div>
      )}

      <div className="text-center pt-2">
        <Link href="/member/discover"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors">
          <Compass className="w-4 h-4" /> Discover more gyms
        </Link>
      </div>
    </div>
  )
}

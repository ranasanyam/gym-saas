// src/app/trainer/gyms/page.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Building2, MapPin, Phone, Users, Loader2,
  ChevronRight, Image as ImageIcon, Dumbbell, Calendar
} from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"

export default function TrainerMyGymsPage() {
  const [gyms, setGyms]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/trainer/gyms")
      .then(r => r.json())
      .then(d => setGyms(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="max-w-4xl space-y-5 animate-pulse">
      <div className="h-8 w-40 bg-white/5 rounded" />
      <div className="h-48 bg-white/5 rounded-2xl" />
    </div>
  )

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">My Gym</h2>
        <p className="text-white/40 text-sm mt-1">The gym you're currently working at</p>
      </div>

      {gyms.length === 0 ? (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white/20" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">You haven't joined any gym yet</h3>
            <p className="text-white/40 text-sm mt-1.5 max-w-xs mx-auto">
              Discover gyms near you and request to join as a trainer to start working with clients.
            </p>
          </div>
          <Link href="/trainer/discover"
            className="mt-2 flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
            <Building2 className="w-4 h-4" /> Discover Gyms
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {gyms.map(gym => {
            const coverImage    = gym.gymImages?.[0] ?? null
            const contactNumber = gym.contactNumber || gym.owner?.mobileNumber
            return (
              <div key={gym.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
                {/* Cover image */}
                {coverImage && (
                  <div className="h-48 overflow-hidden">
                    <img src={coverImage} alt={gym.name} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-white text-xl font-display font-bold">{gym.name}</h3>
                        <span className="text-xs bg-green-500/15 text-green-400 px-2.5 py-0.5 rounded-full font-medium">Active</span>
                      </div>
                      <p className="text-white/40 text-sm flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {[gym.address, gym.city, gym.state].filter(Boolean).join(", ") || "Location not provided"}
                      </p>
                    </div>
                    {contactNumber && (
                      <a href={`tel:${contactNumber}`}
                        className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/15 px-4 py-2 rounded-xl hover:bg-green-500/15 transition-colors">
                        <Phone className="w-4 h-4" /> Call Gym
                      </a>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mt-5 p-4 bg-white/4 rounded-xl">
                    <div className="text-center">
                      <p className="text-white font-semibold text-base">{gym._count?.members ?? 0}</p>
                      <p className="text-white/35 text-xs mt-0.5">Members</p>
                    </div>
                    <div className="w-px bg-white/10 mx-auto" />
                    <div className="text-center">
                      <p className="text-white font-semibold text-base">{gym._count?.trainers ?? 0}</p>
                      <p className="text-white/35 text-xs mt-0.5">Trainers</p>
                    </div>
                  </div>

                  {/* Joined date + specializations */}
                  <div className="mt-4 flex items-center gap-4 flex-wrap">
                    {gym.joinedAt && (
                      <span className="flex items-center gap-1.5 text-xs text-white/35">
                        <Calendar className="w-3.5 h-3.5" />
                        Joined {new Date(gym.joinedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </span>
                    )}
                    {gym.specializations?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {gym.specializations.map((s: string) => (
                          <span key={s} className="text-[10px] bg-primary/10 text-primary/80 px-2.5 py-1 rounded-full border border-primary/15">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Owner info */}
                  {gym.owner && (
                    <div className="mt-4 pt-4 border-t border-white/6 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={gym.owner.fullName} url={gym.owner.avatarUrl} size={36} />
                        <div>
                          <p className="text-white/35 text-xs">Gym Owner</p>
                          <p className="text-white text-sm font-medium">{gym.owner.fullName}</p>
                        </div>
                      </div>
                      {gym.owner.mobileNumber && (
                        <a href={`tel:${gym.owner.mobileNumber}`}
                          className="text-green-400 text-xs hover:text-green-300 flex items-center gap-1 transition-colors">
                          <Phone className="w-3.5 h-3.5" /> {gym.owner.mobileNumber}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

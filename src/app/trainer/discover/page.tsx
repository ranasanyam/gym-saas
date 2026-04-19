// src/app/trainer/discover/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search, MapPin, Building2, ChevronRight, Loader2,
  CheckCircle2, Image as ImageIcon, Users
} from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"

export default function TrainerDiscoverGymsPage() {
  const router = useRouter()
  const [gyms, setGyms]         = useState<any[]>([])
  const [trainerCity, setTrainerCity] = useState("")
  const [search, setSearch]     = useState("")
  const [city, setCity]         = useState("")
  const [loading, setLoading]   = useState(true)

  const load = (s: string, c: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (s) params.set("search", s)
    if (c) params.set("city", c)
    fetch(`/api/trainer/discover?${params}`)
      .then(r => r.json())
      .then(d => {
        setGyms(d.gyms ?? [])
        if (d.trainerCity && !city) setCity(d.trainerCity ?? "")
        setTrainerCity(d.trainerCity ?? "")
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load("", "") }, [])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(search, city) }

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">Discover Gyms</h2>
        <p className="text-white/40 text-sm mt-1">Find gyms to join as a trainer</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search gyms by name..."
            className="w-full bg-[hsl(220_25%_9%)] border border-white/10 text-white text-sm rounded-xl pl-10 pr-4 h-11 focus:outline-none focus:border-primary/50 placeholder:text-white/20" />
        </div>
        <div className="relative w-40">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
          <input value={city} onChange={e => setCity(e.target.value)}
            placeholder={trainerCity || "City"}
            className="w-full bg-[hsl(220_25%_9%)] border border-white/10 text-white text-sm rounded-xl pl-9 pr-4 h-11 focus:outline-none focus:border-primary/50 placeholder:text-white/20" />
        </div>
        <button type="submit"
          className="bg-gradient-primary text-white text-sm font-semibold px-5 h-11 rounded-xl hover:opacity-90 transition-opacity">
          Search
        </button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : gyms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-3">
          <Building2 className="w-10 h-10 text-white/15" />
          <p className="text-white/30 text-sm">No gyms found{city ? ` in ${city}` : ""}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-white/35 text-sm">{gyms.length} gym{gyms.length !== 1 ? "s" : ""} found{city ? ` in ${city}` : ""}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {gyms.map(gym => {
              const coverImage = gym.gymImages?.[0] ?? null
              return (
                <div
                  key={gym.id}
                  onClick={() => router.push(`/trainer/discover/${gym.id}`)}
                  className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden hover:border-primary/30 cursor-pointer transition-all group"
                >
                  {/* Gym image */}
                  <div className="relative h-40 bg-[hsl(220_25%_6%)] overflow-hidden">
                    {coverImage ? (
                      <img src={coverImage} alt={gym.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <ImageIcon className="w-7 h-7 text-white/10" />
                        <span className="text-white/15 text-xs">No photos</span>
                      </div>
                    )}
                    {gym.gymImages?.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ImageIcon className="w-2.5 h-2.5" /> {gym.gymImages.length}
                      </div>
                    )}
                    {gym.isJoined && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/80 text-white">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Joined
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-white font-semibold group-hover:text-primary transition-colors truncate pr-2">{gym.name}</h3>
                      <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                    </div>
                    <p className="text-white/40 text-xs flex items-center gap-1 mb-3">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {[gym.address, gym.city].filter(Boolean).join(", ") || "Location not listed"}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-white/35 mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />{gym._count?.trainers ?? 0} trainers
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />{gym._count?.members ?? 0} members
                      </span>
                    </div>

                    {/* Owner info */}
                    {gym.owner && (
                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        <Avatar name={gym.owner.fullName} url={gym.owner.avatarUrl} size={22} />
                        <span className="text-white/35 text-xs truncate">{gym.owner.fullName}</span>
                      </div>
                    )}

                    {/* Services preview */}
                    {gym.services?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {gym.services.slice(0, 3).map((s: string) => (
                          <span key={s} className="text-[10px] bg-white/5 text-white/35 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                        {gym.services.length > 3 && (
                          <span className="text-[10px] text-white/20 px-1">+{gym.services.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

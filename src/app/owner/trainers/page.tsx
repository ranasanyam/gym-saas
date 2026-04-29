"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/owner/PageHeader"
import { EmptyState } from "@/components/owner/EmptyState"
import { UserCheck, Star, Users, Plus, ChevronDown } from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"

interface Trainer {
  id: string; specializations: string[]; rating: number; isAvailable: boolean
  experienceYears: number; _count: { assignedMembers: number }
  profile: { fullName: string; email: string; avatarUrl: string | null }
  gym: { name: string }
}

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [gyms, setGyms] = useState<{ id: string; name: string }[]>([])
  const [gymId, setGymId] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/owner/gyms").then(r => r.json()).then(g => { if (Array.isArray(g)) setGyms(g) })
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (gymId) p.set("gymId", gymId)
    fetch(`/api/owner/trainers${p.toString() ? `?${p}` : ""}`)
      .then(r => r.json()).then(setTrainers).finally(() => setLoading(false))
  }, [gymId])

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-6xl">
      <PageHeader title="Trainers" subtitle={`${trainers.length} trainer${trainers.length !== 1 ? "s" : ""}${gymId ? "" : " across your gyms"}`}
        action={{ label: "Add Trainer", href: "/owner/trainers/new", icon: Plus }} style="flex-row items-start" />

      {gyms.length > 1 && (
        <div className="flex items-center gap-3 mb-5">
          <div className="relative">
            <select value={gymId} onChange={e => setGymId(e.target.value)}
              className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white/70 rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none cursor-pointer">
              <option value="">All Gyms</option>
              {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="h-44 bg-white/3 rounded-2xl animate-pulse" />)}
        </div>
      ) : trainers.length === 0 ? (
        <EmptyState icon={UserCheck} title="No trainers yet"
          description="Add trainers to assign them to members and manage their schedules."
          action={{ label: "Add Trainer", href: "/owner/trainers/new" }} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {trainers.map(t => (
            <Link key={t.id} href={`/owner/trainers/${t.id}`}
              className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 hover:border-white/12 transition-all group">
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={t.profile.fullName} url={t.profile.avatarUrl} size={44} />
                <div className="min-w-0">
                  <p className="text-white font-semibold group-hover:text-primary transition-colors truncate">{t.profile.fullName}</p>
                  <p className="text-white/35 text-xs truncate">{t.gym.name}</p>
                </div>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${t.isAvailable ? "bg-green-500/15 text-green-400" : "bg-white/8 text-white/40"}`}>
                  {t.isAvailable ? "Available" : "Busy"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {t.specializations.slice(0, 3).map(s => (
                  <span key={s} className="text-xs bg-primary/10 border border-primary/20 text-primary/80 px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-white/40">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {t._count.assignedMembers} members</span>
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-primary" /> {Number(t.rating).toFixed(1)}</span>
                <span>{t.experienceYears}y exp</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
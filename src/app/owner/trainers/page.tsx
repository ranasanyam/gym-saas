"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/owner/PageHeader"
import { EmptyState } from "@/components/owner/EmptyState"
import { UserCheck, Star, Users, Plus } from "lucide-react"

interface Trainer {
  id: string; specializations: string[]; rating: number; isAvailable: boolean
  experienceYears: number; _count: { assignedMembers: number }
  profile: { fullName: string; email: string; avatarUrl: string | null }
  gym: { name: string }
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/owner/trainers").then(r => r.json()).then(setTrainers).finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-6xl">
      <PageHeader title="Trainers" subtitle={`${trainers.length} trainers across your gyms`}
        action={{ label: "Add Trainer", href: "/owner/trainers/new", icon: Plus }} />

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
                <div className="w-11 h-11 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold shrink-0">
                  {getInitials(t.profile.fullName)}
                </div>
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
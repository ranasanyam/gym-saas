"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/owner/PageHeader"
import { EmptyState } from "@/components/owner/EmptyState"
import { Building2, Users, UserCheck, MapPin, Plus, ToggleLeft, ToggleRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Gym {
  id: string; name: string; city: string | null; address: string | null
  isActive: boolean; contactNumber: string | null
  _count: { members: number; trainers: number }
  membershipPlans: { id: string; name: string; price: number }[]
}

export default function GymsPage() {
  const { toast } = useToast()
  const [gyms, setGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => fetch("/api/owner/gyms").then(r => r.json()).then(setGyms).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const toggleActive = async (gym: Gym) => {
    await fetch(`/api/owner/gyms/${gym.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !gym.isActive }),
    })
    toast({ title: `Gym ${!gym.isActive ? "activated" : "deactivated"}` })
    load()
  }

  return (
    <div className="max-w-6xl">
      <PageHeader title="My Gyms" subtitle="Manage all your gym locations"
        action={{ label: "Add New Gym", href: "/owner/gyms/new", icon: Plus }} />

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="h-52 bg-white/3 rounded-2xl animate-pulse" />)}
        </div>
      ) : gyms.length === 0 ? (
        <EmptyState icon={Building2} title="No gyms yet"
          description="Add your first gym to start managing members and trainers."
          action={{ label: "Add Your First Gym", href: "/owner/gyms/new" }} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {gyms.map((gym) => (
            <div key={gym.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 hover:border-white/12 transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <button onClick={() => toggleActive(gym)} className="text-white/30 hover:text-white/60 transition-colors">
                  {gym.isActive ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
              </div>
              <Link href={`/owner/gyms/${gym.id}`}>
                <h3 className="text-white font-display font-bold mb-1 group-hover:text-primary transition-colors">{gym.name}</h3>
              </Link>
              {gym.city && (
                <div className="flex items-center gap-1.5 text-white/40 text-xs mb-4">
                  <MapPin className="w-3 h-3" /> {gym.city}
                </div>
              )}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-white/50 text-xs">
                  <Users className="w-3.5 h-3.5" /> {gym._count.members} members
                </div>
                <div className="flex items-center gap-1.5 text-white/50 text-xs">
                  <UserCheck className="w-3.5 h-3.5" /> {gym._count.trainers} trainers
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {gym.membershipPlans.slice(0, 3).map(p => (
                  <span key={p.id} className="text-xs bg-white/5 border border-white/8 text-white/50 px-2 py-0.5 rounded-full">
                    {p.name}
                  </span>
                ))}
                {gym.membershipPlans.length === 0 && (
                  <Link href={`/owner/gyms/${gym.id}?tab=plans`} className="text-xs text-primary hover:underline">+ Add plan</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
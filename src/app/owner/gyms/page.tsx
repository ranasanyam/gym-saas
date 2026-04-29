

// src/app/owner/gyms/page.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/owner/PageHeader"
import { EmptyState } from "@/components/owner/EmptyState"
import { UpgradeButton } from "@/components/owner/PlanGate"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { Building2, Users, UserCheck, MapPin, Plus, Image as ImageIcon, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Gym {
  id: string; name: string; city: string | null; address: string | null
  isActive: boolean; contactNumber: string | null
  gymImages: string[]
  _count: { members: number; trainers: number }
  membershipPlans: { id: string; name: string; price: number }[]
}

export default function GymsPage() {
  const { toast } = useToast()
  const { canAddGym, isExpired, limits, usage } = useSubscription()
  const [gyms, setGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState(true)

  const load = () =>
    fetch("/api/owner/gyms").then(r => r.json()).then(setGyms).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  // const toggleActive = async (gym: Gym) => {
  //   await fetch(`/api/owner/gyms/${gym.id}`, {
  //     method: "PATCH", headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ isActive: !gym.isActive }),
  //   })
  //   toast({ title: `Gym ${!gym.isActive ? "activated" : "deactivated"}` })
  //   load()
  // }

  const atLimit = !canAddGym

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">My Gyms</h2>
          <p className="text-white/40 text-sm mt-0.5">Manage all your gym locations</p>
        </div>
        {atLimit ? (
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2 text-white/30 text-xs bg-white/5 border border-white/8 rounded-xl px-3 py-2">
              <Lock className="w-3.5 h-3.5" />
              Gym limit reached ({usage?.gyms ?? 0}/{limits?.maxGyms})
            </div>
            <UpgradeButton label="Upgrade to add more gyms" />
          </div>
        ) : (
          <Link href="/owner/gyms/new"
            className="flex items-center gap-2 bg-linear-to-r from-primary to-orange-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Add New Gym
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-white/3 rounded-2xl animate-pulse" />)}
        </div>
      ) : gyms.length === 0 ? (
        <EmptyState icon={Building2} title="No gyms yet"
          description="Add your first gym to start managing members and trainers."
          action={!atLimit ? { label: "Add Your First Gym", href: "/owner/gyms/new" } : undefined} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {gyms?.map((gym) => {
            const coverImage = gym.gymImages?.[0] ?? null
            return (
              <div key={gym.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden hover:border-white/12 transition-colors group">
                <Link href={`/owner/gyms/${gym.id}`} className="block relative h-40 bg-[hsl(220_25%_6%)] overflow-hidden">
                  {coverImage ? (
                    <img src={coverImage} alt={gym.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="w-8 h-8 text-white/10" />
                      <span className="text-white/20 text-xs">No photos yet</span>
                    </div>
                  )}
                  {gym.gymImages?.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ImageIcon className="w-2.5 h-2.5" /> {gym.gymImages.length}
                    </div>
                  )}
                  <div className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${gym.isActive ? "bg-green-500/80 text-white" : "bg-white/20 text-white/60"
                    }`}>
                    {gym.isActive ? "Active" : "Inactive"}
                  </div>
                </Link>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <Link href={`/owner/gyms/${gym.id}`}>
                      <h3 className="text-white font-display font-bold group-hover:text-primary transition-colors">{gym.name}</h3>
                    </Link>
                    {/* <button onClick={() => toggleActive(gym)} className="text-white/30 hover:text-white/60 transition-colors ml-2 shrink-0">
                      {gym.isActive ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5" />}
                    </button> */}
                  </div>
                  {gym.city && (
                    <div className="flex items-center gap-1.5 text-white/40 text-xs mb-3">
                      <MapPin className="w-3 h-3" /> {gym.city}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1.5 text-white/50 text-xs">
                      <Users className="w-3.5 h-3.5" /> {gym._count.members} members
                    </div>
                    <div className="flex items-center gap-1.5 text-white/50 text-xs">
                      <UserCheck className="w-3.5 h-3.5" /> {gym._count.trainers} trainers
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {gym.membershipPlans.slice(0, 3).map(p => (
                      <span key={p.id} className="text-xs bg-white/5 border border-white/8 text-white/50 px-2 py-0.5 rounded-full">{p.name}</span>
                    ))}
                    {gym.membershipPlans.length === 0 && (
                      <Link href={`/owner/gyms/${gym.id}?tab=plans`} className="text-xs text-primary hover:underline">+ Add plan</Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
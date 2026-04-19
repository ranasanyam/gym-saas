// src/app/member/diet/page.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { UtensilsCrossed, Flame, Users } from "lucide-react"
import { useMemberGym } from "@/contexts/MemberGymContext"
import { NoGymState } from "@/components/member/NoGymState"

export default function MemberDietPage() {
  const { hasGym, gymLoading } = useMemberGym()
  const [plans, setPlans]      = useState<any[]>([])
  const [loading, setLoading]  = useState(true)

  useEffect(() => {
    fetch("/api/member/diet")
      .then(r => r.json())
      .then(d => setPlans(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [])

  if (loading || gymLoading) return (
    <div className="max-w-4xl space-y-5">
      <div className="h-8 w-40 bg-white/5 rounded animate-pulse" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  )

  if (!hasGym) return <NoGymState pageName="Diet Plans" />

  if (plans.length === 0) return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-display font-bold text-white mb-6">Diet Plans</h2>
      <div className="flex flex-col items-center justify-center py-20 gap-4 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
          <UtensilsCrossed className="w-8 h-8 text-white/20" />
        </div>
        <h3 className="text-white font-semibold text-lg">No diet plan yet</h3>
        <p className="text-white/35 text-sm text-center max-w-xs">
          Your trainer hasn't assigned a diet plan yet. Check back soon!
        </p>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">Diet Plans</h2>
        <p className="text-white/35 text-sm mt-0.5">{plans.length} plan{plans.length !== 1 ? "s" : ""} assigned</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(p => {
          const allSlots    = Object.keys(p.planData ?? {})
          const totalItems  = Object.values(p.planData ?? {}).reduce((s: number, arr: any) => s + arr.length, 0)
          const daysWithData = [...new Set(allSlots.map((k: string) => k.split("__")[0]))].length
          return (
            <Link key={p.id} href={`/member/diet/${p.id}`}
              className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 hover:border-primary/30 hover:bg-[hsl(220_25%_10%)] transition-all flex flex-col group">
              <div className="flex items-start justify-between mb-3">
                {p.isGlobal && (
                  <span className="text-xs bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full">All Members</span>
                )}
                {p.caloriesTarget && (
                  <span className="text-xs bg-orange-500/15 text-orange-400 px-2.5 py-1 rounded-full flex items-center gap-1 ml-auto">
                    <Flame className="w-3 h-3" /> {p.caloriesTarget} kcal
                  </span>
                )}
              </div>
              <h3 className="text-white font-semibold mb-1 flex-1 line-clamp-2 group-hover:text-primary/90 transition-colors">
                {p.title}
              </h3>
              {p.goal && <p className="text-primary/70 text-xs mb-2">🎯 {p.goal}</p>}
              {(p.proteinG || p.carbsG || p.fatG) && (
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {p.proteinG && <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">P: {p.proteinG}g</span>}
                  {p.carbsG   && <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full">C: {p.carbsG}g</span>}
                  {p.fatG     && <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">F: {p.fatG}g</span>}
                </div>
              )}
              <p className="text-white/25 text-xs mb-3">
                {totalItems} food item{totalItems !== 1 ? "s" : ""} · {daysWithData} day{daysWithData !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center justify-between text-xs text-white/35 border-t border-white/5 pt-3">
                <span className="truncate">{p.gym?.name}</span>
                {p.creator && (
                  <span className="flex items-center gap-1 shrink-0 ml-2">
                    <Users className="w-3 h-3" /> {p.creator.fullName}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

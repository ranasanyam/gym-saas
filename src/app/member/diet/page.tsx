// src/app/member/diet/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { UtensilsCrossed, Flame, Users, CheckCircle2, Loader2, Zap } from "lucide-react"
import { useMemberGym } from "@/contexts/MemberGymContext"
import { NoGymState } from "@/components/member/NoGymState"
import { AIPlanModal } from "@/components/member/AIPlanModal"

export default function MemberDietPage() {
  const { hasGym, gymLoading } = useMemberGym()
  const [plans, setPlans]             = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [settingActive, setSettingActive] = useState<string | null>(null)
  const [showAI, setShowAI]           = useState(false)

  const fetchPlans = useCallback(async () => {
    const res = await fetch("/api/member/diet")
    const data = await res.json()
    setPlans(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    fetchPlans().finally(() => setLoading(false))
  }, [fetchPlans])

  const setAsActive = async (planId: string) => {
    setSettingActive(planId)
    try {
      const res = await fetch(`/api/member/diet-plan/${planId}/set-active`, { method: "PATCH" })
      if (res.ok) {
        const updated = await res.json()
        setPlans(Array.isArray(updated) ? updated : plans.map(p => ({
          ...p,
          isActive: p.id === planId ? true : p.isGlobal ? p.isActive : false,
        })))
      }
    } finally {
      setSettingActive(null)
    }
  }

  if (loading || gymLoading) return (
    <div className="max-w-4xl space-y-5">
      <div className="h-8 w-40 bg-white/5 rounded animate-pulse" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-44 bg-white/5 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  )

  if (!hasGym) return <NoGymState pageName="Diet Plans" />

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Diet Plans</h2>
          <p className="text-white/35 text-sm mt-0.5">{plans.length} plan{plans.length !== 1 ? "s" : ""} assigned</p>
        </div>
        <button
          onClick={() => setShowAI(true)}
          className="inline-flex items-center gap-2 bg-green-500/15 hover:bg-green-500/20 text-green-400 border border-green-500/25 font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
        >
          <Zap className="w-4 h-4" /> Generate with AI
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
            <UtensilsCrossed className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-white font-semibold text-lg">No diet plan yet</h3>
          <p className="text-white/35 text-sm text-center max-w-xs">
            Your trainer hasn't assigned a plan yet, or generate a personalized one with AI.
          </p>
          <button
            onClick={() => setShowAI(true)}
            className="inline-flex items-center gap-2 bg-green-500/15 hover:bg-green-500/20 text-green-400 border border-green-500/25 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            <Zap className="w-4 h-4" /> Generate AI Plan
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(p => {
            const allSlots     = Object.keys(p.planData ?? {})
            const totalItems   = Object.values(p.planData ?? {}).reduce((s: number, arr: any) => s + arr.length, 0)
            const daysWithData = [...new Set(allSlots.map((k: string) => k.split("__")[0]))].length
            const isAssigned   = !p.isGlobal
            const isActive     = isAssigned && p.isActive

            return (
              <div key={p.id} className={`group flex flex-col bg-[hsl(220_25%_9%)] border rounded-2xl hover:bg-[hsl(220_25%_10%)] transition-all overflow-hidden ${
                isActive ? "border-green-500/30 hover:border-green-500/40" : "border-white/6 hover:border-primary/30"
              }`}>
                <Link href={`/member/diet/${p.id}`} className="flex flex-col p-5 flex-1">
                  <div className="flex items-start gap-2 mb-3 flex-wrap">
                    {p.isGlobal && (
                      <span className="text-xs bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full">All Members</span>
                    )}
                    {p.caloriesTarget && (
                      <span className="text-xs bg-orange-500/15 text-orange-400 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                        <Flame className="w-3 h-3" /> {p.caloriesTarget} kcal
                      </span>
                    )}
                    {isActive && (
                      <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/25 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium ml-auto">
                        <CheckCircle2 className="w-3 h-3" /> Active
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

                  <p className="text-white/25 text-xs">
                    {totalItems} food item{totalItems !== 1 ? "s" : ""} · {daysWithData} day{daysWithData !== 1 ? "s" : ""}
                  </p>
                </Link>

                <div className="flex items-center justify-between text-xs text-white/35 border-t border-white/5 px-5 py-3">
                  <span className="truncate">{p.gym?.name}</span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {p.creator && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {p.creator.fullName}
                      </span>
                    )}
                    {isAssigned && !isActive && (
                      <button
                        onClick={() => setAsActive(p.id)}
                        disabled={settingActive === p.id}
                        className="text-xs bg-white/5 hover:bg-primary/15 text-white/40 hover:text-primary border border-white/8 hover:border-primary/30 px-2.5 py-1 rounded-lg transition-all disabled:opacity-50"
                      >
                        {settingActive === p.id
                          ? <Loader2 className="w-3 h-3 animate-spin inline" />
                          : "Set Active"
                        }
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AIPlanModal
        planType="diet"
        isOpen={showAI}
        onClose={() => setShowAI(false)}
        onSuccess={() => { fetchPlans(); setShowAI(false) }}
      />
    </div>
  )
}

// src/app/member/workouts/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Dumbbell, Users, CheckCircle2, Loader2, Zap } from "lucide-react"
import { useMemberGym } from "@/contexts/MemberGymContext"
import { NoGymState } from "@/components/member/NoGymState"
import { AIPlanModal } from "@/components/member/AIPlanModal"

const DIFF_COLOR: Record<string, string> = {
  BEGINNER:     "bg-green-500/15 text-green-400",
  INTERMEDIATE: "bg-yellow-500/15 text-yellow-400",
  ADVANCED:     "bg-red-500/15 text-red-400",
}

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]

export default function MemberWorkoutsPage() {
  const { hasGym, gymLoading } = useMemberGym()
  const [plans, setPlans]           = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [settingActive, setSettingActive] = useState<string | null>(null)
  const [showAI, setShowAI]         = useState(false)

  const fetchPlans = useCallback(async () => {
    const res = await fetch("/api/member/workouts")
    const data = await res.json()
    setPlans(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    fetchPlans().finally(() => setLoading(false))
  }, [fetchPlans])

  const setAsActive = async (planId: string) => {
    setSettingActive(planId)
    try {
      const res = await fetch(`/api/member/workout-plan/${planId}/set-active`, { method: "PATCH" })
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
      <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-44 bg-white/5 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  )

  if (!hasGym) return <NoGymState pageName="Workouts" />

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Workout Plans</h2>
          <p className="text-white/35 text-sm mt-0.5">{plans.length} plan{plans.length !== 1 ? "s" : ""} assigned</p>
        </div>
        <button
          onClick={() => setShowAI(true)}
          className="inline-flex items-center gap-2 bg-purple-500/15 hover:bg-purple-500/20 text-purple-400 border border-purple-500/25 font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
        >
          <Zap className="w-4 h-4" /> Generate with AI
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-white font-semibold text-lg">No workout plan yet</h3>
          <p className="text-white/35 text-sm text-center max-w-xs">
            Your trainer hasn't assigned a plan yet, or generate a personalized one with AI.
          </p>
          <button
            onClick={() => setShowAI(true)}
            className="inline-flex items-center gap-2 bg-purple-500/15 hover:bg-purple-500/20 text-purple-400 border border-purple-500/25 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            <Zap className="w-4 h-4" /> Generate AI Plan
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(p => {
            const totalEx    = DAYS.reduce((s, d) => s + ((p.planData?.[d])?.length ?? 0), 0)
            const activeDays = DAYS.filter(d => (p.planData?.[d]?.length ?? 0) > 0).length
            const isAssigned = !p.isGlobal
            const isActive   = isAssigned && p.isActive

            return (
              <div key={p.id} className={`group flex flex-col bg-[hsl(220_25%_9%)] border rounded-2xl hover:bg-[hsl(220_25%_10%)] transition-all overflow-hidden ${
                isActive ? "border-green-500/30 hover:border-green-500/40" : "border-white/6 hover:border-primary/30"
              }`}>
                <Link href={`/member/workouts/${p.id}`} className="flex flex-col p-5 flex-1">
                  {/* Top row: badges */}
                  <div className="flex items-start gap-2 mb-3 flex-wrap">
                    {p.difficulty && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${DIFF_COLOR[p.difficulty] ?? "bg-white/8 text-white/40"}`}>
                        {p.difficulty}
                      </span>
                    )}
                    {isActive && (
                      <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/25 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium ml-auto">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    )}
                    {p.isGlobal && (
                      <span className="text-xs bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full ml-auto">
                        All Members
                      </span>
                    )}
                  </div>

                  <h3 className="text-white font-semibold mb-1 flex-1 line-clamp-2 group-hover:text-primary/90 transition-colors">
                    {p.title}
                  </h3>
                  {p.goal && <p className="text-primary/70 text-xs mb-2">🎯 {p.goal}</p>}
                  <p className="text-white/25 text-xs">
                    {totalEx} exercise{totalEx !== 1 ? "s" : ""} · {activeDays} active day{activeDays !== 1 ? "s" : ""}
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
        planType="workout"
        isOpen={showAI}
        onClose={() => setShowAI(false)}
        onSuccess={() => { fetchPlans(); setShowAI(false) }}
      />
    </div>
  )
}

// src/app/member/workouts/page.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Dumbbell, Users } from "lucide-react"
import { useMemberGym } from "@/contexts/MemberGymContext"
import { NoGymState } from "@/components/member/NoGymState"

const DIFF_COLOR: Record<string, string> = {
  BEGINNER:     "bg-green-500/15 text-green-400",
  INTERMEDIATE: "bg-yellow-500/15 text-yellow-400",
  ADVANCED:     "bg-red-500/15 text-red-400",
}

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]

export default function MemberWorkoutsPage() {
  const { hasGym, gymLoading } = useMemberGym()
  const [plans, setPlans]      = useState<any[]>([])
  const [loading, setLoading]  = useState(true)

  useEffect(() => {
    fetch("/api/member/workouts")
      .then(r => r.json())
      .then(d => setPlans(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [])

  if (loading || gymLoading) return (
    <div className="max-w-4xl space-y-5">
      <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  )

  if (!hasGym) return <NoGymState pageName="Workouts" />

  if (plans.length === 0) return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-display font-bold text-white mb-6">Workout Plans</h2>
      <div className="flex flex-col items-center justify-center py-20 gap-4 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
          <Dumbbell className="w-8 h-8 text-white/20" />
        </div>
        <h3 className="text-white font-semibold text-lg">No workout plan yet</h3>
        <p className="text-white/35 text-sm text-center max-w-xs">
          Your trainer hasn't assigned a workout plan yet. Check back soon!
        </p>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">Workout Plans</h2>
        <p className="text-white/35 text-sm mt-0.5">{plans.length} plan{plans.length !== 1 ? "s" : ""} assigned</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(p => {
          const totalEx   = DAYS.reduce((s, d) => s + ((p.planData?.[d])?.length ?? 0), 0)
          const activeDays = DAYS.filter(d => (p.planData?.[d]?.length ?? 0) > 0).length
          return (
            <Link key={p.id} href={`/member/workouts/${p.id}`}
              className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 hover:border-primary/30 hover:bg-[hsl(220_25%_10%)] transition-all flex flex-col group">
              <div className="flex items-start justify-between mb-3">
                {p.difficulty && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${DIFF_COLOR[p.difficulty] ?? "bg-white/8 text-white/40"}`}>
                    {p.difficulty}
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
              <p className="text-white/25 text-xs mb-3">
                {totalEx} exercise{totalEx !== 1 ? "s" : ""} · {activeDays} active day{activeDays !== 1 ? "s" : ""}
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

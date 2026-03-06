// src/app/member/workouts/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Dumbbell, ChevronDown, ChevronUp, Loader2, Calendar, Target, Flame } from "lucide-react"

const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"]
const DAY_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
const DIFF_COLOR: Record<string,string> = {
  BEGINNER: "bg-green-500/15 text-green-400",
  INTERMEDIATE: "bg-yellow-500/15 text-yellow-400",
  ADVANCED: "bg-red-500/15 text-red-400",
}

export default function MemberWorkoutsPage() {
  const [plans, setPlans]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [activeDay, setActiveDay] = useState<Record<string,string>>({})

  useEffect(() => {
    fetch("/api/member/workouts").then(r => r.json()).then(d => {
      setPlans(Array.isArray(d) ? d : [])
      if (d.length > 0) {
        const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
        const initial: Record<string,string> = {}
        d.forEach((p: any) => { initial[p.id] = today })
        setActiveDay(initial)
        setExpanded(d[0].id)
      }
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>

  if (plans.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 space-y-3">
      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
        <Dumbbell className="w-8 h-8 text-white/20" />
      </div>
      <p className="text-white font-semibold">No workout plans yet</p>
      <p className="text-white/35 text-sm">Your trainer or gym will assign plans here</p>
    </div>
  )

  return (
    <div className="max-w-3xl space-y-5">
      <h2 className="text-2xl font-display font-bold text-white">Workout Plans</h2>

      {plans.map(plan => {
        const isOpen     = expanded === plan.id
        const planData   = plan.planData ?? {}
        const currentDay = activeDay[plan.id] ?? DAYS[0]
        const exercises  = planData[currentDay] ?? []

        return (
          <div key={plan.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
            {/* Plan header */}
            <button onClick={() => setExpanded(isOpen ? null : plan.id)}
              className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/2 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Dumbbell className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-semibold">{plan.title ?? "Workout Plan"}</p>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${DIFF_COLOR[plan.difficulty] ?? "bg-white/10 text-white/50"}`}>
                    {plan.difficulty}
                  </span>
                  {plan.isGlobal && <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">Gym Plan</span>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-white/35 text-xs">
                  {plan.goal && <span className="flex items-center gap-1"><Target className="w-3 h-3" />{plan.goal}</span>}
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{plan.durationWeeks}w</span>
                  <span>by {plan.creator.fullName}</span>
                </div>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-white/30 shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/30 shrink-0" />}
            </button>

            {isOpen && (
              <div className="border-t border-white/6">
                {/* Day tabs */}
                <div className="flex gap-1 p-3 overflow-x-auto">
                  {DAYS.map((day, i) => {
                    const hasExercises = (planData[day]?.length ?? 0) > 0
                    return (
                      <button key={day}
                        onClick={() => setActiveDay(p => ({ ...p, [plan.id]: day }))}
                        className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                          currentDay === day
                            ? "bg-primary text-white"
                            : "text-white/40 hover:text-white/70 hover:bg-white/5"
                        }`}>
                        {DAY_SHORT[i]}
                        {hasExercises && <span className={`ml-1 w-1.5 h-1.5 rounded-full inline-block ${currentDay === day ? "bg-white" : "bg-primary"}`} />}
                      </button>
                    )
                  })}
                </div>

                {/* Exercises */}
                <div className="px-5 pb-5 space-y-3">
                  {exercises.length === 0 ? (
                    <div className="text-center py-8">
                      <Flame className="w-6 h-6 text-white/15 mx-auto mb-2" />
                      <p className="text-white/30 text-sm">Rest day</p>
                    </div>
                  ) : (
                    exercises.map((ex: any, i: number) => (
                      <div key={i} className="bg-[hsl(220_25%_12%)] rounded-xl p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-white font-medium text-sm">{ex.name}</p>
                            {ex.notes && <p className="text-white/40 text-xs mt-1">{ex.notes}</p>}
                          </div>
                          <div className="flex gap-3 text-xs shrink-0">
                            {ex.sets     && <span className="text-center"><span className="block text-white font-bold">{ex.sets}</span><span className="text-white/35">sets</span></span>}
                            {ex.reps     && <span className="text-center"><span className="block text-white font-bold">{ex.reps}</span><span className="text-white/35">reps</span></span>}
                            {ex.duration && <span className="text-center"><span className="block text-white font-bold">{ex.duration}</span><span className="text-white/35">sec</span></span>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
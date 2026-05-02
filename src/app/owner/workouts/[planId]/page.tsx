// src/app/owner/workouts/[planId]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Dumbbell, Users, Edit, Trash2, Loader2 } from "lucide-react"

const DAYS      = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
const FULL_DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
const DIFF_COLOR: Record<string,string> = {
  BEGINNER:     "bg-green-500/15 text-green-400",
  INTERMEDIATE: "bg-yellow-500/15 text-yellow-400",
  ADVANCED:     "bg-red-500/15 text-red-400",
}

function todayShort() {
  const i = new Date().getDay()
  return DAYS[i === 0 ? 6 : i - 1]
}

export default function OwnerWorkoutDetailPage() {
  const { planId } = useParams<{ planId: string }>()
  const router     = useRouter()
  const { toast }  = useToast()

  const [plan, setPlan]         = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [activeDay, setActiveDay] = useState(todayShort())
  const [archiving, setArchiving] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetch(`/api/owner/workouts/${planId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setPlan)
      .catch(() => router.replace("/owner/workouts"))
      .finally(() => setLoading(false))
  }, [planId, router])

  const archive = async () => {
    
    setArchiving(true)
    const res = await fetch(`/api/owner/workouts/${planId}`, { method: "DELETE" })
    setShowConfirmModal(false);
    if (res.ok) {
      toast({ variant: "success", title: "Plan archived" })
      router.push("/owner/workouts")
    } else {
      toast({ variant: "destructive", title: "Failed to archive" })
      setArchiving(false)
    }
  }

  if (loading) return (
    <div className="max-w-3xl space-y-5 animate-pulse">
      <div className="h-8 w-56 bg-white/5 rounded" />
      <div className="h-28 bg-white/5 rounded-2xl" />
      <div className="h-12 bg-white/5 rounded-xl" />
      <div className="h-64 bg-white/5 rounded-2xl" />
    </div>
  )
  if (!plan) return null

  const planData: Record<string, any[]> = plan.planData ?? {}
  const exercises = planData[activeDay] ?? []

  return (
    <div className="max-w-3xl space-y-5">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(`/owner/workouts?edit=${planId}`)}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/15 border border-primary/20 rounded-lg px-3 py-1.5 transition-all">
            <Edit className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={() => setShowConfirmModal(true)} disabled={archiving}
            className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 bg-red-500/8 hover:bg-red-500/12 border border-red-500/15 rounded-lg px-3 py-1.5 transition-all disabled:opacity-40">
            {archiving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Archive
          </button>
        </div>
      </div>
                  {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[hsl(220_25%_9%)] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-white font-semibold text-base">Archive Plan?</h3>
            <p className="text-white/50 text-sm">This plan will be hidden from members. You can restore it later.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm transition-colors">
                Cancel
              </button>
              <button onClick={() => archive()}
                className="flex-1 py-2.5 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/25 text-sm font-semibold transition-colors">
                Archive
              </button>
            </div>
          </div>
        </div>
)}

      {/* Header card */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-xl">{plan.title}</h2>
            {plan.goal && <p className="text-primary/70 text-sm mt-1">🎯 {plan.goal}</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {plan.difficulty && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${DIFF_COLOR[plan.difficulty] ?? ""}`}>
                {plan.difficulty}
              </span>
            )}
            {plan.isGlobal && (
              <span className="text-xs bg-purple-500/15 text-purple-400 px-2.5 py-1 rounded-full">All Members</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/6 text-center">
          <div>
            <p className="text-white font-semibold text-sm">{plan.gym?.name ?? "—"}</p>
            <p className="text-white/30 text-xs mt-0.5">Gym</p>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              {plan.assignedMember?.profile.fullName ?? (plan.isGlobal ? "All members" : "—")}
            </p>
            <p className="text-white/30 text-xs mt-0.5">Assigned to</p>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{plan.creator?.fullName ?? "—"}</p>
            <p className="text-white/30 text-xs mt-0.5">Created by</p>
          </div>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1 bg-white/4 rounded-xl p-1 overflow-x-auto">
        {DAYS.map((day, i) => {
          const hasEx  = (planData[day]?.length ?? 0) > 0
          const isToday = day === todayShort()
          return (
            <button key={day} onClick={() => setActiveDay(day)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all relative min-w-10 ${
                activeDay === day ? "bg-[hsl(220_25%_13%)] text-white shadow" : "text-white/40 hover:text-white/70"
              }`}>
              {day}
              {isToday && <span className="absolute top-0.5 right-0.5 w-1 h-1 bg-primary rounded-full" />}
              {hasEx && activeDay !== day && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/25 rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Exercises */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-primary" />
          <h3 className="text-white font-semibold text-sm">
            {FULL_DAYS[DAYS.indexOf(activeDay)]}{activeDay === todayShort() ? " (Today)" : ""}
          </h3>
          <span className="ml-auto text-white/30 text-xs">{exercises.length} exercise{exercises.length !== 1 ? "s" : ""}</span>
        </div>

        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <Dumbbell className="w-8 h-8 text-white/10" />
            <p className="text-white/25 text-sm">Rest day — no exercises for {FULL_DAYS[DAYS.indexOf(activeDay)]}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/4">
            {exercises.map((ex: any, i: number) => (
              <div key={i} className="px-5 py-4 flex items-start gap-4">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary text-xs font-bold">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{ex.name}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {ex.sets && ex.reps && (
                      <span className="text-white/50 text-xs bg-white/5 px-2 py-0.5 rounded-full">
                        {ex.sets} sets × {ex.reps} reps
                      </span>
                    )}
                    {ex.duration && (
                      <span className="text-white/50 text-xs bg-white/5 px-2 py-0.5 rounded-full">
                        {ex.duration}
                      </span>
                    )}
                  </div>
                  {ex.notes && <p className="text-white/35 text-xs mt-1.5 italic">{ex.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

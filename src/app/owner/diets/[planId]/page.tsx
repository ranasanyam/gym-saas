// src/app/owner/diets/[planId]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, UtensilsCrossed, Flame, Edit, Trash2, Loader2 } from "lucide-react"

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]

function todayName() {
  return DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
}

function timeToMinutes(t: string): number {
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!m) return 0
  let h = parseInt(m[1]); const min = parseInt(m[2]); const p = m[3].toUpperCase()
  if (p === "AM" && h === 12) h = 0
  if (p === "PM" && h !== 12) h += 12
  return h * 60 + min
}

function getSlotsForDay(planData: Record<string, any[]>, day: string) {
  const prefix = `${day}__`
  return Object.keys(planData)
    .filter(k => k.startsWith(prefix))
    .map(k => k.slice(prefix.length))
    .sort((a, b) => {
      const aMin = timeToMinutes(a); const bMin = timeToMinutes(b)
      if (aMin || bMin) return aMin - bMin
      return a.localeCompare(b)
    })
}

export default function OwnerDietDetailPage() {
  const { planId } = useParams<{ planId: string }>()
  const router     = useRouter()
  const { toast }  = useToast()

  const [plan, setPlan]           = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [activeDay, setActiveDay] = useState(todayName())
  const [archiving, setArchiving] = useState(false)

  useEffect(() => {
    fetch(`/api/owner/diets/${planId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setPlan)
      .catch(() => router.replace("/owner/diets"))
      .finally(() => setLoading(false))
  }, [planId, router])

  const archive = async () => {
    if (!confirm("Archive this diet plan?")) return
    setArchiving(true)
    const res = await fetch(`/api/owner/diets/${planId}`, { method: "DELETE" })
    if (res.ok) {
      toast({ variant: "success", title: "Plan archived" })
      router.push("/owner/diets")
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
  const slots   = getSlotsForDay(planData, activeDay)
  const allItems = slots.flatMap(s => planData[`${activeDay}__${s}`] ?? [])
  const totals   = allItems.reduce(
    (acc, item) => ({
      calories: acc.calories + (Number(item.calories) || 0),
      protein:  acc.protein  + (Number(item.protein)  || 0),
      carbs:    acc.carbs    + (Number(item.carbs)     || 0),
      fat:      acc.fat      + (Number(item.fat)       || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  return (
    <div className="max-w-3xl space-y-5">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(`/owner/diets?edit=${planId}`)}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/15 border border-primary/20 rounded-lg px-3 py-1.5 transition-all">
            <Edit className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={archive} disabled={archiving}
            className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 bg-red-500/8 hover:bg-red-500/12 border border-red-500/15 rounded-lg px-3 py-1.5 transition-all disabled:opacity-40">
            {archiving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Archive
          </button>
        </div>
      </div>

      {/* Header card */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-xl">{plan.title}</h2>
            {plan.goal && <p className="text-primary/70 text-sm mt-1">🎯 {plan.goal}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {plan.caloriesTarget && (
              <span className="flex items-center gap-1 text-orange-400 bg-orange-500/10 border border-orange-500/15 px-3 py-1.5 rounded-full text-sm font-semibold">
                <Flame className="w-3.5 h-3.5" /> {plan.caloriesTarget} kcal/day
              </span>
            )}
          </div>
        </div>
        {(plan.proteinG || plan.carbsG || plan.fatG) && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {plan.proteinG && <span className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg">Protein {plan.proteinG}g</span>}
            {plan.carbsG   && <span className="text-xs bg-yellow-500/10 text-yellow-400 px-3 py-1.5 rounded-lg">Carbs {plan.carbsG}g</span>}
            {plan.fatG     && <span className="text-xs bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg">Fat {plan.fatG}g</span>}
          </div>
        )}
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
        {DAYS.map(day => {
          const daySlots = getSlotsForDay(planData, day)
          const hasData  = daySlots.some(s => (planData[`${day}__${s}`]?.length ?? 0) > 0)
          const isToday  = day === todayName()
          return (
            <button key={day} onClick={() => setActiveDay(day)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all relative min-w-12 ${
                activeDay === day ? "bg-[hsl(220_25%_13%)] text-white shadow" : "text-white/40 hover:text-white/70"
              }`}>
              {day.slice(0, 3)}
              {isToday && <span className="absolute top-0.5 right-0.5 w-1 h-1 bg-primary rounded-full" />}
              {hasData && activeDay !== day && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/25 rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Daily macro summary */}
      {slots.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "kcal",    value: totals.calories, color: "bg-orange-500/8 border-orange-500/15 text-orange-400" },
            { label: "protein", value: `${totals.protein}g`, color: "bg-blue-500/8 border-blue-500/15 text-blue-400" },
            { label: "carbs",   value: `${totals.carbs}g`,   color: "bg-yellow-500/8 border-yellow-500/15 text-yellow-400" },
            { label: "fat",     value: `${totals.fat}g`,     color: "bg-red-500/8 border-red-500/15 text-red-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`border rounded-xl p-3 text-center ${color}`}>
              <p className="font-bold text-sm">{value}</p>
              <p className="text-[10px] opacity-60 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Meal slots */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-primary" />
          <h3 className="text-white font-semibold text-sm">
            {activeDay}{activeDay === todayName() ? " (Today)" : ""}
          </h3>
          <span className="ml-auto text-white/30 text-xs">{slots.length} meal{slots.length !== 1 ? "s" : ""}</span>
        </div>

        {slots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <UtensilsCrossed className="w-8 h-8 text-white/10" />
            <p className="text-white/25 text-sm">No meals planned for {activeDay}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/4">
            {slots.map(slot => {
              const items = planData[`${activeDay}__${slot}`] ?? []
              return (
                <div key={slot} className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-mono bg-primary/15 text-primary px-2.5 py-1 rounded-lg font-semibold">{slot}</span>
                    <span className="text-white/30 text-xs">{items.length} item{items.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-white/3 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{item.name}</p>
                          {item.quantity && <p className="text-white/35 text-xs mt-0.5">{item.quantity}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                          {item.calories && <span className="text-orange-400/80 text-xs bg-orange-500/8 px-2 py-0.5 rounded-full">{item.calories} kcal</span>}
                          {item.protein  && <span className="text-blue-400/70 text-xs">P:{item.protein}g</span>}
                          {item.carbs    && <span className="text-yellow-400/70 text-xs">C:{item.carbs}g</span>}
                          {item.fat      && <span className="text-red-400/70 text-xs">F:{item.fat}g</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

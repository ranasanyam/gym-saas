// src/app/owner/diets/page.tsx
"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/owner/PageHeader"
import { EmptyState } from "@/components/owner/EmptyState"
import { useToast } from "@/hooks/use-toast"
import { UtensilsCrossed, Plus, X, Loader2, Flame, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface DietPlan {
  id: string; title: string; description: string | null; goal: string | null
  caloriesTarget: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null
  isTemplate: boolean; isGlobal: boolean; createdAt: string
  assignedMember: { profile: { fullName: string } } | null
  creator: { fullName: string }
}

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
const MEAL_TIMES = ["Breakfast","Mid-Morning Snack","Lunch","Evening Snack","Dinner","Post-Workout"]

interface MealItem { name: string; quantity: string; calories: string; protein: string; carbs: string; fat: string }
type DayMeals = Record<string, MealItem[]>

const emptyMeal = (): MealItem => ({ name: "", quantity: "", calories: "", protein: "", carbs: "", fat: "" })

export default function DietsPage() {
  const { toast } = useToast()
  const [plans, setPlans]   = useState<DietPlan[]>([])
  const [gyms, setGyms]     = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [activeDay, setActiveDay] = useState("Monday")
  const [activeMeal, setActiveMeal] = useState("Breakfast")
  const [dayMeals, setDayMeals] = useState<DayMeals>({})

  const [form, setForm] = useState({
    gymId: "", allGyms: false,
    memberId: "", freeForAll: false,
    title: "", description: "", goal: "",
    caloriesTarget: "", proteinG: "", carbsG: "", fatG: "",
    isTemplate: false,
    weekStartDate: new Date().toISOString().split("T")[0],
  })

  const load = () => {
    Promise.all([
      fetch("/api/owner/diets").then(r => r.json()),
      fetch("/api/owner/gyms").then(r => r.json()),
    ]).then(([p, g]) => {
      setPlans(Array.isArray(p) ? p : [])
      setGyms(g)
      if (g.length > 0) setForm(prev => ({ ...prev, gymId: g[0].id }))
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!form.gymId || form.allGyms) { setMembers([]); return }
    fetch(`/api/owner/members?gymId=${form.gymId}&page=1`)
      .then(r => r.json())
      .then(d => setMembers(Array.isArray(d.members) ? d.members : []))
  }, [form.gymId, form.allGyms])

  const mealKey = `${activeDay}__${activeMeal}`

  const addMealItem = () =>
    setDayMeals(p => ({ ...p, [mealKey]: [...(p[mealKey] ?? []), emptyMeal()] }))

  const removeMealItem = (idx: number) =>
    setDayMeals(p => ({ ...p, [mealKey]: (p[mealKey] ?? []).filter((_, i) => i !== idx) }))

  const updateMealItem = (idx: number, field: keyof MealItem, val: string) =>
    setDayMeals(p => {
      const updated = [...(p[mealKey] ?? [])]
      updated[idx] = { ...updated[idx], [field]: val }
      return { ...p, [mealKey]: updated }
    })

  const totalItemsForDay = MEAL_TIMES.reduce((acc, mt) => acc + (dayMeals[`${activeDay}__${mt}`]?.length ?? 0), 0)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast({ variant: "destructive", title: "Plan title is required" }); return }
    setSaving(true)
    const res = await fetch("/api/owner/diets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gymId: form.allGyms ? gyms[0]?.id : form.gymId,
        title: form.title, description: form.description, goal: form.goal,
        caloriesTarget: form.caloriesTarget || null,
        proteinG: form.proteinG || null,
        carbsG: form.carbsG || null,
        fatG: form.fatG || null,
        isTemplate: form.isTemplate,
        isGlobal: form.allGyms || form.freeForAll,
        assignedToMemberId: (!form.freeForAll && !form.allGyms && form.memberId) ? form.memberId : null,
        planData: { weekStartDate: form.weekStartDate, meals: dayMeals },
      }),
    })
    if (res.ok) {
      toast({ variant: "success", title: "Diet plan created!" })
      setShowForm(false); setDayMeals({})
      setForm(p => ({ ...p, title: "", description: "", goal: "", memberId: "", caloriesTarget: "", proteinG: "", carbsG: "", fatG: "", freeForAll: false, allGyms: false, isTemplate: false }))
      load()
    } else toast({ variant: "destructive", title: "Failed to create plan" })
    setSaving(false)
  }

  const macroBar = (val: number | null, total: number, color: string) => {
    if (!val || !total) return null
    const pct = Math.min(Math.round((val * 4 / total) * 100), 100)
    return <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
  }

  const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl text-sm"

  return (
    <div className="max-w-6xl">
      <PageHeader title="Diet Plans" subtitle={`${plans.length} plan${plans.length !== 1 ? "s" : ""} created`}
        action={{ label: "Create Plan", onClick: () => setShowForm(true), icon: Plus }} />

      {showForm && (
        <div className="bg-[hsl(220_25%_9%)] border border-primary/20 rounded-2xl p-6 mb-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-white font-semibold text-base">Create Diet Plan</h3>
              <p className="text-white/40 text-xs mt-0.5">Create a daily nutrition plan with meals</p>
            </div>
            <button onClick={() => { setShowForm(false); setDayMeals({}) }} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          <form onSubmit={submit} className="space-y-5">

            {/* Free for all toggle */}
            <div className="flex items-center justify-between p-4 bg-white/4 rounded-xl border border-white/6">
              <div>
                <p className="text-white text-sm font-medium">Free Plan for All Members</p>
                <p className="text-white/40 text-xs mt-0.5">Make this plan available to all gym members</p>
              </div>
              <button type="button" onClick={() => setForm(p => ({ ...p, freeForAll: !p.freeForAll, memberId: "" }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.freeForAll ? "bg-primary" : "bg-white/15"}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.freeForAll ? "left-6" : "left-1"}`} />
              </button>
            </div>

            {/* Gym + Member row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-white/55 text-sm">Target Gym</Label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-white/40 text-xs">All Gyms</span>
                    <button type="button" onClick={() => setForm(p => ({ ...p, allGyms: !p.allGyms, memberId: "" }))}
                      className={`relative w-9 h-5 rounded-full transition-colors ${form.allGyms ? "bg-primary" : "bg-white/15"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.allGyms ? "left-4" : "left-0.5"}`} />
                    </button>
                  </label>
                </div>
                <select value={form.gymId} disabled={form.allGyms}
                  onChange={e => setForm(p => ({ ...p, gymId: e.target.value, memberId: "" }))}
                  className={`w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary ${form.allGyms ? "opacity-40 cursor-not-allowed" : ""}`}>
                  {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Member</Label>
                <select value={form.memberId} disabled={form.freeForAll || form.allGyms}
                  onChange={e => setForm(p => ({ ...p, memberId: e.target.value }))}
                  className={`w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary ${(form.freeForAll || form.allGyms) ? "opacity-40 cursor-not-allowed" : ""}`}>
                  <option value="">Select member</option>
                  {members.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.profile?.fullName ?? m.id}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Plan info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Plan Title <span className="text-primary">*</span></Label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. High Protein Bulk" className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Goal</Label>
                <Input value={form.goal} onChange={e => setForm(p => ({ ...p, goal: e.target.value }))}
                  placeholder="e.g. Muscle gain, Fat loss" className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Daily Calories (kcal)</Label>
                <Input type="number" value={form.caloriesTarget} onChange={e => setForm(p => ({ ...p, caloriesTarget: e.target.value }))}
                  placeholder="2000" className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Week Starting</Label>
                <Input type="date" value={form.weekStartDate} onChange={e => setForm(p => ({ ...p, weekStartDate: e.target.value }))} className={inp} />
              </div>
            </div>

            {/* Macros row */}
            <div className="grid grid-cols-3 gap-4">
              {[["proteinG","Protein (g)"],["carbsG","Carbs (g)"],["fatG","Fat (g)"]].map(([field, label]) => (
                <div key={field} className="space-y-1.5">
                  <Label className="text-white/55 text-sm">{label}</Label>
                  <Input type="number" value={(form as any)[field]}
                    onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} className={inp} />
                </div>
              ))}
            </div>

            {/* Day tabs */}
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <div className="flex gap-1 border-b border-white/8 min-w-max">
                  {DAYS.map(d => (
                    <button key={d} type="button" onClick={() => setActiveDay(d)}
                      className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                        activeDay === d ? "border-primary text-primary" : "border-transparent text-white/40 hover:text-white/70"
                      }`}>{d.slice(0, 3)}</button>
                  ))}
                </div>
              </div>

              {/* Meal time tabs */}
              <div className="flex flex-wrap gap-2">
                {MEAL_TIMES.map(mt => {
                  const key = `${activeDay}__${mt}`
                  const count = dayMeals[key]?.length ?? 0
                  return (
                    <button key={mt} type="button" onClick={() => setActiveMeal(mt)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        activeMeal === mt
                          ? "bg-primary/15 border-primary/40 text-primary font-medium"
                          : "bg-white/4 border-white/8 text-white/45 hover:border-white/20"
                      }`}>
                      {mt}{count > 0 && <span className="ml-1.5 bg-primary/25 text-primary text-[10px] px-1.5 py-0.5 rounded-full">{count}</span>}
                    </button>
                  )
                })}
              </div>

              {/* Meal items */}
              <div className="space-y-2">
                {(dayMeals[mealKey] ?? []).length === 0 ? (
                  <div className="text-center py-8 text-white/25">
                    <UtensilsCrossed className="w-7 h-7 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No items for {activeMeal} on {activeDay}</p>
                  </div>
                ) : (
                  (dayMeals[mealKey] ?? []).map((item, idx) => (
                    <div key={idx} className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Input value={item.name} onChange={e => updateMealItem(idx, "name", e.target.value)}
                          placeholder="Food item (e.g. Chicken Breast)"
                          className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-9 rounded-xl text-sm" />
                        <button type="button" onClick={() => removeMealItem(idx)}
                          className="text-white/20 hover:text-red-400 transition-colors shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {[["quantity","Qty"],["calories","Kcal"],["protein","Protein"],["carbs","Carbs"],["fat","Fat"]].map(([field, label]) => (
                          <div key={field} className="space-y-1">
                            <p className="text-white/35 text-[10px]">{label}</p>
                            <Input value={(item as any)[field]}
                              onChange={e => updateMealItem(idx, field as keyof MealItem, e.target.value)}
                              placeholder={field === "quantity" ? "100g" : "—"}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-8 rounded-lg text-xs" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button type="button" onClick={addMealItem}
                className="w-full py-3 rounded-xl border border-dashed border-white/15 text-white/40 hover:border-primary/40 hover:text-primary/70 transition-all text-sm flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Food Item
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isTemplate} onChange={e => setForm(p => ({ ...p, isTemplate: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
              <span className="text-white/60 text-sm">Save as Template</span>
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setDayMeals({}) }}
                className="border-white/10 text-white/60 hover:text-white h-10 text-sm">Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-10 text-sm px-7">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create Plan"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Plan cards */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-white/3 rounded-2xl animate-pulse" />)}
        </div>
      ) : plans.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="No diet plans yet"
          description="Create nutrition plans for your gym members." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(p => (
            <div key={p.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 hover:border-white/12 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1.5 flex-wrap">
                  {p.isTemplate && <span className="text-xs bg-blue-500/15 text-blue-400 px-2.5 py-1 rounded-full">Template</span>}
                  {p.isGlobal && <span className="text-xs bg-purple-500/15 text-purple-400 px-2.5 py-1 rounded-full">All Members</span>}
                </div>
                {p.caloriesTarget && (
                  <span className="flex items-center gap-1 text-xs text-primary/80 ml-auto">
                    <Flame className="w-3 h-3" /> {p.caloriesTarget} kcal
                  </span>
                )}
              </div>
              <h3 className="text-white font-semibold mb-1">{p.title}</h3>
              {p.goal && <p className="text-primary/70 text-xs mb-3">Goal: {p.goal}</p>}
              {p.caloriesTarget && (
                <div className="space-y-1.5 mb-3">
                  {[
                    { label: "Protein", val: p.proteinG, color: "bg-blue-400" },
                    { label: "Carbs", val: p.carbsG, color: "bg-yellow-400" },
                    { label: "Fat", val: p.fatG, color: "bg-red-400" },
                  ].map(m => m.val ? (
                    <div key={m.label}>
                      <div className="flex justify-between text-xs text-white/40 mb-0.5">
                        <span>{m.label}</span><span>{Number(m.val)}g</span>
                      </div>
                      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                        {macroBar(Number(m.val), p.caloriesTarget!, m.color)}
                      </div>
                    </div>
                  ) : null)}
                </div>
              )}
              <div className="text-xs text-white/35 border-t border-white/5 pt-3 mt-3">
                {p.assignedMember
                  ? <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.assignedMember.profile.fullName}</span>
                  : <span>Unassigned</span>
                }
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
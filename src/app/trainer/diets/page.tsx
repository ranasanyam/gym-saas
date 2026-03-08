// src/app/trainer/diets/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { UtensilsCrossed, Plus, X, Loader2, Flame, Users, Edit, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface DietPlan {
  id: string; title: string; description: string | null; goal: string | null
  caloriesTarget: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null
  isGlobal: boolean; createdAt: string; planData: any
  assignedMember: { id: string; profile: { fullName: string; avatarUrl: string | null } } | null
  creator: { fullName: string }
  gym: { name: string }
}

const DAYS      = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
const MEAL_TIMES = ["Breakfast","Mid-Morning Snack","Lunch","Evening Snack","Dinner","Post-Workout"]

interface MealItem { name: string; quantity: string; calories: string; protein: string; carbs: string; fat: string }
type DayMeals = Record<string, MealItem[]>
const emptyMeal = (): MealItem => ({ name: "", quantity: "", calories: "", protein: "", carbs: "", fat: "" })

export default function TrainerDietsPage() {
  const { toast } = useToast()
  const [plans,   setPlans]   = useState<DietPlan[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formMode, setFormMode]       = useState<"create"|"edit"|null>(null)
  const [editingPlan, setEditingPlan] = useState<DietPlan | null>(null)
  const [saving, setSaving]     = useState(false)
  const [activeDay, setActiveDay]   = useState("Monday")
  const [activeMeal, setActiveMeal] = useState("Breakfast")
  const [dayMeals, setDayMeals]     = useState<DayMeals>({})
  const [mealTimes, setMealTimes]   = useState<Record<string, string>>({}) // key: mealName → "HH:MM" 

  const blankForm = {
    memberId: "", freeForAll: false,
    title: "", description: "", goal: "",
    caloriesTarget: "", proteinG: "", carbsG: "", fatG: "",
    weekStartDate: new Date().toISOString().split("T")[0],
  }
  const [form, setForm] = useState(blankForm)
  const mealKey = `${activeDay}__${activeMeal}`

  const load = () => {
    Promise.all([
      fetch("/api/trainer/diets").then(r => r.json()),
      fetch("/api/trainer/members").then(r => r.json()),
    ]).then(([p, m]) => {
      setPlans(Array.isArray(p) ? p : [])
      setMembers(Array.isArray(m) ? m : [])
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const addMealItem    = () => setDayMeals(p => ({ ...p, [mealKey]: [...(p[mealKey] ?? []), emptyMeal()] }))
  const removeMealItem = (idx: number) => setDayMeals(p => ({ ...p, [mealKey]: (p[mealKey] ?? []).filter((_: any, i: number) => i !== idx) }))
  const updateMealItem = (idx: number, field: keyof MealItem, val: string) =>
    setDayMeals(p => { const u = [...(p[mealKey] ?? [])]; u[idx] = { ...u[idx], [field]: val }; return { ...p, [mealKey]: u } })

  const openCreate = () => {
    setEditingPlan(null); setForm(blankForm); setDayMeals({})
    setMealTimes({}); setActiveDay("Monday"); setActiveMeal("Breakfast"); setFormMode("create")
  }

  const openEdit = (plan: DietPlan) => {
    setEditingPlan(plan)
    setForm({
      memberId:      plan.assignedMember?.id ?? "",
      freeForAll:    plan.isGlobal,
      title:         plan.title,
      description:   plan.description ?? "",
      goal:          plan.goal ?? "",
      caloriesTarget: plan.caloriesTarget ? String(plan.caloriesTarget) : "",
      proteinG: plan.proteinG ? String(plan.proteinG) : "",
      carbsG:   plan.carbsG   ? String(plan.carbsG)   : "",
      fatG:     plan.fatG     ? String(plan.fatG)     : "",
      weekStartDate: plan.planData?.weekStartDate ?? new Date().toISOString().split("T")[0],
    })
    setDayMeals(plan.planData?.meals ?? {})
    setMealTimes(plan.planData?.mealTimes ?? {})
    setActiveDay("Monday"); setActiveMeal("Breakfast"); setFormMode("edit")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCancel = () => { setFormMode(null); setEditingPlan(null); setDayMeals({}); setMealTimes({}); setForm(blankForm) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast({ variant: "destructive", title: "Plan title is required" }); return }
    setSaving(true)
    const payload = {
      title: form.title, description: form.description, goal: form.goal,
      caloriesTarget: form.caloriesTarget || null,
      proteinG: form.proteinG || null, carbsG: form.carbsG || null, fatG: form.fatG || null,
      isGlobal: form.freeForAll,
      assignedToMemberId: (!form.freeForAll && form.memberId) ? form.memberId : null,
      planData: { weekStartDate: form.weekStartDate, meals: dayMeals, mealTimes },
    }
    const isEdit = formMode === "edit" && editingPlan
    const res = await fetch(
      isEdit ? `/api/trainer/diets/${editingPlan.id}` : "/api/trainer/diets",
      { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
    )
    if (res.ok) {
      toast({ variant: "success", title: isEdit ? "Diet plan updated!" : "Diet plan created!" })
      handleCancel(); load()
    } else toast({ variant: "destructive", title: "Failed to save plan" })
    setSaving(false)
  }

  const deletePlan = async (id: string) => {
    if (!confirm("Archive this diet plan?")) return
    await fetch(`/api/trainer/diets/${id}`, { method: "DELETE" })
    toast({ variant: "success", title: "Plan archived" }); load()
  }

  const macroBar = (val: number | null, total: number, color: string) => {
    if (!val || !total) return null
    return <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(Math.round((val * 4 / total) * 100), 100)}%` }} />
  }

  const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl text-sm"

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Diet Plans</h2>
          <p className="text-white/35 text-sm mt-0.5">{plans.length} plan{plans.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-primary hover:opacity-90 text-white h-10 gap-2">
          <Plus className="w-4 h-4" /> Create Plan
        </Button>
      </div>

      {/* Create / Edit form */}
      {formMode && (
        <div className="bg-[hsl(220_25%_9%)] border border-primary/20 rounded-2xl p-6 mb-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-white font-semibold text-base">{formMode === "edit" ? "Edit Diet Plan" : "Create Diet Plan"}</h3>
              <p className="text-white/40 text-xs mt-0.5">Build a daily nutrition plan with meals</p>
            </div>
            <button onClick={handleCancel} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {/* Free for all */}
            <div className="flex items-center justify-between p-4 bg-white/4 rounded-xl border border-white/6">
              <div>
                <p className="text-white text-sm font-medium">Free Plan for All Members</p>
                <p className="text-white/40 text-xs mt-0.5">Make available to all members in your gym</p>
              </div>
              <button type="button" onClick={() => setForm(p => ({ ...p, freeForAll: !p.freeForAll, memberId: "" }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.freeForAll ? "bg-primary" : "bg-white/15"}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.freeForAll ? "left-6" : "left-1"}`} />
              </button>
            </div>

            {/* Member */}
            <div className="space-y-1.5">
              <Label className="text-white/55 text-sm">Assign to Member</Label>
              <select value={form.memberId} disabled={form.freeForAll}
                onChange={e => setForm(p => ({ ...p, memberId: e.target.value }))}
                className={`w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary ${form.freeForAll ? "opacity-40 cursor-not-allowed" : ""}`}>
                <option value="">— No specific member —</option>
                {members.map((m: any) => <option key={m.id} value={m.id}>{m.profile?.fullName ?? m.id}</option>)}
              </select>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Plan Title <span className="text-primary">*</span></Label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. High Protein Bulk" className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Goal</Label>
                <Input value={form.goal} onChange={e => setForm(p => ({ ...p, goal: e.target.value }))} placeholder="e.g. Muscle gain" className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Daily Calories (kcal)</Label>
                <Input type="number" value={form.caloriesTarget} onChange={e => setForm(p => ({ ...p, caloriesTarget: e.target.value }))} placeholder="2000" className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Week Starting</Label>
                <Input type="date" value={form.weekStartDate} onChange={e => setForm(p => ({ ...p, weekStartDate: e.target.value }))} className={inp} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {(["proteinG","carbsG","fatG"] as const).map(field => (
                <div key={field} className="space-y-1.5">
                  <Label className="text-white/55 text-sm">
                    {field === "proteinG" ? "Protein (g)" : field === "carbsG" ? "Carbs (g)" : "Fat (g)"}
                  </Label>
                  <Input type="number" value={(form as any)[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} className={inp} />
                </div>
              ))}
            </div>

            {/* Day + Meal tabs */}
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <div className="flex gap-1 border-b border-white/8 min-w-max">
                  {DAYS.map(d => (
                    <button key={d} type="button" onClick={() => setActiveDay(d)}
                      className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${activeDay === d ? "border-primary text-primary" : "border-transparent text-white/40 hover:text-white/70"}`}>
                      {d.slice(0,3)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {MEAL_TIMES.map(mt => {
                  const count = dayMeals[`${activeDay}__${mt}`]?.length ?? 0
                  return (
                    <button key={mt} type="button" onClick={() => setActiveMeal(mt)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${activeMeal === mt ? "bg-primary/15 border-primary/40 text-primary font-medium" : "bg-white/4 border-white/8 text-white/45 hover:border-white/20"}`}>
                      {mt}{count > 0 && <span className="ml-1.5 bg-primary/25 text-primary text-[10px] px-1.5 py-0.5 rounded-full">{count}</span>}
                    </button>
                  )
                })}
              </div>
              <div className="space-y-2">
                {(dayMeals[mealKey] ?? []).length === 0 ? (
                  <div className="text-center py-8 text-white/25">
                    <UtensilsCrossed className="w-7 h-7 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No items for {activeMeal} on {activeDay}</p>
                  </div>
                ) : (dayMeals[mealKey] ?? []).map((item: MealItem, idx: number) => (
                  <div key={idx} className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input value={item.name} onChange={e => updateMealItem(idx, "name", e.target.value)}
                        placeholder="Food item (e.g. Chicken Breast)"
                        className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-9 rounded-xl text-sm" />
                      <button type="button" onClick={() => removeMealItem(idx)} className="text-white/20 hover:text-red-400 shrink-0"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {(["quantity","calories","protein","carbs","fat"] as (keyof MealItem)[]).map(f => (
                        <div key={f} className="space-y-1">
                          <p className="text-white/35 text-[10px] capitalize">{f}</p>
                          <Input value={item[f]} onChange={e => updateMealItem(idx, f, e.target.value)}
                            placeholder={f === "quantity" ? "100g" : "—"}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-8 rounded-lg text-xs" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addMealItem}
                className="w-full py-3 rounded-xl border border-dashed border-white/15 text-white/40 hover:border-primary/40 hover:text-primary/70 transition-all text-sm flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Food Item
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleCancel}
                className="border-white/10 text-white/60 hover:text-white h-10 text-sm">Cancel</Button>
              <Button type="submit" disabled={saving}
                className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-10 text-sm px-7">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : formMode === "edit" ? "Save Changes" : "Create Plan"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Plan cards */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-white/3 rounded-2xl animate-pulse" />)}
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl">
          <UtensilsCrossed className="w-10 h-10 text-white/15" />
          <p className="text-white/30 text-sm">No diet plans yet — create your first one</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(p => (
            <div key={p.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 hover:border-white/12 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1.5">
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
                    { label: "Carbs",   val: p.carbsG,   color: "bg-yellow-400" },
                    { label: "Fat",     val: p.fatG,     color: "bg-red-400" },
                  ].map(m => m.val ? (
                    <div key={m.label}>
                      <div className="flex justify-between text-xs text-white/40 mb-0.5"><span>{m.label}</span><span>{Number(m.val)}g</span></div>
                      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">{macroBar(Number(m.val), p.caloriesTarget!, m.color)}</div>
                    </div>
                  ) : null)}
                </div>
              )}
              <div className="border-t border-white/5 pt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-white/35">
                  <span className="flex items-center gap-1">🏋️ {p.gym?.name ?? "—"}</span>
                  {p.assignedMember ? <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.assignedMember.profile.fullName}</span> : <span>Unassigned</span>}
                </div>
                <p className="text-xs text-white/25">By {p.creator.fullName}</p>
              </div>
              <div className="flex gap-2 pt-3 mt-1 border-t border-white/5">
                <button onClick={() => openEdit(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs text-primary hover:text-primary/80 py-1.5 transition-colors">
                  <Edit className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => deletePlan(p.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 py-1.5 transition-colors">
                  <Trash2 className="w-3 h-3" /> Archive
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
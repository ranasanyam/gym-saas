// src/app/owner/diets/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { PageHeader } from "@/components/owner/PageHeader"
import { EmptyState } from "@/components/owner/EmptyState"
import { useToast } from "@/hooks/use-toast"
import {
  UtensilsCrossed, Plus, X, Loader2, Flame, Users, Edit, Trash2,
  Sparkles, Search, Save, Copy, ChevronRight
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
const MEAL_TIMES = ["Breakfast","Mid-Morning","Lunch","Evening Snack","Dinner","Post-Workout"]

interface MealItem { name: string; quantity: string; calories: string; protein: string; carbs: string; fat: string }
type DayMeals = Record<string, MealItem[]>
const emptyMeal = (): MealItem => ({ name: "", quantity: "", calories: "", protein: "", carbs: "", fat: "" })

interface DietPlan {
  id: string; title: string; description: string | null; goal: string | null
  caloriesTarget: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null
  isTemplate: boolean; isGlobal: boolean; createdAt: string; planData: any
  assignedMember: { id: string; profile: { fullName: string; avatarUrl: string | null } } | null
  creator: { fullName: string }; gym: { name: string }
}

interface Template {
  id: string; title: string; goal: string | null; planData: any
  isGlobal: boolean; usageCount: number; createdBy: { fullName: string }
}

const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl text-sm"

function TemplatePicker({ onSelect, onClose }: { onSelect: (t: Template) => void; onClose: () => void }) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState("")

  useEffect(() => {
    fetch("/api/owner/plan-templates?type=DIET")
      .then(r => r.json()).then(d => setTemplates(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = templates.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) || (t.goal ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[hsl(220_25%_8%)] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-white font-semibold text-sm">Diet Plan Templates</h3>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-4 py-3 border-b border-white/6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className="w-full bg-white/4 border border-white/8 rounded-xl pl-9 pr-4 h-9 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-primary" />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white/3 rounded-xl animate-pulse" />) :
           filtered.length === 0 ? <div className="text-center py-10 text-white/25 text-sm">No templates found</div> :
           filtered.map(t => (
            <button key={t.id} onClick={() => onSelect(t)}
              className="w-full text-left p-4 rounded-xl bg-white/3 border border-white/6 hover:border-primary/30 hover:bg-primary/5 transition-all group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white text-sm font-medium group-hover:text-primary transition-colors">{t.title}</p>
                  {t.goal && <p className="text-white/40 text-xs mt-0.5">🎯 {t.goal}</p>}
                  <p className="text-white/25 text-xs mt-1">by {t.createdBy.fullName} · {t.usageCount} uses</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-primary mt-1 shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}



export default function DietsPage() {
  const { toast } = useToast()
  const [plans,   setPlans]   = useState<DietPlan[]>([])
  const [gyms,    setGyms]    = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formMode, setFormMode]     = useState<"create"|"edit"|null>(null)
  const [editingPlan, setEditingPlan] = useState<DietPlan | null>(null)
  const [saving, setSaving]         = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [searchQ, setSearchQ]       = useState("")
  const [activeDay, setActiveDay]   = useState("Monday")
  const [activeMeal, setActiveMeal] = useState("Breakfast")
  const [dayMeals, setDayMeals]     = useState<DayMeals>({})

  const blankForm = {
    gymId: "", memberId: "", freeForAll: false, isTemplate: false,
    title: "", description: "", goal: "", caloriesTarget: "", proteinG: "", carbsG: "", fatG: "",
    weekStartDate: new Date().toISOString().split("T")[0],
  }
  const [form, setForm] = useState(blankForm)

  const mealKey = `${activeDay}__${activeMeal}`

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/owner/diets").then(r => r.json()),
      fetch("/api/owner/gyms").then(r => r.json()),
    ]).then(([p, g]) => {
      setPlans(Array.isArray(p) ? p : [])
      setGyms(g)
      if (g.length > 0) setForm(prev => ({ ...prev, gymId: g[0].id }))
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!form.gymId || form.freeForAll) { setMembers([]); return }
    fetch(`/api/owner/members?gymId=${form.gymId}&page=1`)
      .then(r => r.json()).then(d => setMembers(Array.isArray(d.members) ? d.members : []))
  }, [form.gymId, form.freeForAll])

  const addMealItem    = () => setDayMeals(p => ({ ...p, [mealKey]: [...(p[mealKey] ?? []), emptyMeal()] }))
  const removeMealItem = (idx: number) => setDayMeals(p => ({ ...p, [mealKey]: p[mealKey].filter((_: any, i: number) => i !== idx) }))
  const updateMealItem = (idx: number, field: keyof MealItem, val: string) =>
    setDayMeals(p => { const u = [...(p[mealKey] ?? [])]; u[idx] = { ...u[idx], [field]: val }; return { ...p, [mealKey]: u } })

  const openCreate = () => {
    setEditingPlan(null)
    setForm({ ...blankForm, gymId: gyms[0]?.id ?? "" })
    setDayMeals({})
    setActiveDay("Monday"); setActiveMeal("Breakfast")
    setFormMode("create")
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50)
  }

  const openEdit = (plan: DietPlan) => {
    setEditingPlan(plan)
    setForm({
      gymId: gyms[0]?.id ?? "", memberId: plan.assignedMember?.id ?? "",
      freeForAll: plan.isGlobal, isTemplate: plan.isTemplate,
      title: plan.title, description: plan.description ?? "", goal: plan.goal ?? "",
      caloriesTarget: String(plan.caloriesTarget ?? ""), proteinG: String(plan.proteinG ?? ""),
      carbsG: String(plan.carbsG ?? ""), fatG: String(plan.fatG ?? ""),
      weekStartDate: new Date().toISOString().split("T")[0],
    })
    setDayMeals(plan.planData ?? {})
    setActiveDay("Monday"); setActiveMeal("Breakfast")
    setFormMode("edit")
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50)
  }

  const handleCancel = () => {
    setFormMode(null); setEditingPlan(null); setDayMeals({})
    setForm({ ...blankForm, gymId: gyms[0]?.id ?? "" })
  }

  const applyTemplate = (t: Template) => {
    setDayMeals(t.planData ?? {})
    setForm((p: any) => ({ ...p, title: p.title || t.title, goal: p.goal || (t.goal ?? "") }))
    setShowTemplates(false)
    toast({ variant: "success", title: `Template "${t.title}" applied!` })
    fetch("/api/owner/plan-templates/use-count", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateId: t.id })
    }).catch(() => {})
  }

  const saveAsTemplate = async () => {
    if (!form.title.trim()) { toast({ variant: "destructive", title: "Add a plan title first" }); return }
    const res = await fetch("/api/owner/plan-templates", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gymId: form.gymId || null, type: "DIET", title: form.title, goal: form.goal, planData: dayMeals }),
    })
    if (res.ok) toast({ variant: "success", title: "Saved as template!" })
    else        toast({ variant: "destructive", title: "Failed to save template" })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast({ variant: "destructive", title: "Plan title is required" }); return }
    setSaving(true)
    const isEdit = formMode === "edit" && editingPlan
    const res = await fetch(
      isEdit ? `/api/owner/diets/${editingPlan.id}` : "/api/owner/diets",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gymId: form.gymId, title: form.title, description: form.description, goal: form.goal,
          caloriesTarget: form.caloriesTarget ? Number(form.caloriesTarget) : null,
          proteinG: form.proteinG ? Number(form.proteinG) : null,
          carbsG:   form.carbsG   ? Number(form.carbsG)   : null,
          fatG:     form.fatG     ? Number(form.fatG)     : null,
          isGlobal: form.freeForAll, isTemplate: form.isTemplate,
          assignedToMemberId: (!form.freeForAll && form.memberId) ? form.memberId : null,
          planData: dayMeals,
        }),
      }
    )
    if (res.ok) {
      toast({ variant: "success", title: isEdit ? "Plan updated!" : "Diet plan created!" })
      handleCancel(); load()
    } else {
      toast({ variant: "destructive", title: "Failed to save plan" })
    }
    setSaving(false)
  }

  const deletePlan = async (id: string) => {
    if (!confirm("Archive this diet plan?")) return
    const res = await fetch(`/api/owner/diets/${id}`, { method: "DELETE" })
    if (res.ok) { toast({ variant: "success", title: "Plan archived" }); load() }
  }

  const currentItems = dayMeals[mealKey] ?? []
  const totalMeals   = Object.values(dayMeals).reduce((s, arr) => s + arr.length, 0)

  const filtered = plans.filter(p =>
    p.title.toLowerCase().includes(searchQ.toLowerCase()) || (p.goal ?? "").toLowerCase().includes(searchQ.toLowerCase())
  )

  return (
    <div className="max-w-6xl">
      <PageHeader title="Diet Plans" subtitle={`${plans.length} plan${plans.length !== 1 ? "s" : ""}`}
        action={{ label: "Create Plan", onClick: openCreate, icon: Plus }} />

      {showTemplates && <TemplatePicker onSelect={applyTemplate} onClose={() => setShowTemplates(false)} />}

      {formMode && (
        <div className="bg-[hsl(220_25%_9%)] border border-primary/20 rounded-2xl p-6 mb-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-white font-semibold text-base">{formMode === "edit" ? "Edit Diet Plan" : "Create Diet Plan"}</h3>
              <p className="text-white/40 text-xs mt-0.5">{totalMeals} food item{totalMeals !== 1 ? "s" : ""} added</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowTemplates(true)} type="button"
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-1.5 transition-all">
                <Sparkles className="w-3 h-3" /> Use Template
              </button>
              <button onClick={handleCancel} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {/* Toggles */}
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { key: "freeForAll",  label: "Free for All Members", sub: "Visible to all gym members" },
                { key: "isTemplate",  label: "Save as Template",     sub: "Reuse this plan later" },
              ].map(({ key, label, sub }) => (
                <div key={key} className="flex items-center justify-between p-3.5 bg-white/4 rounded-xl border border-white/6">
                  <div>
                    <p className="text-white text-xs font-medium">{label}</p>
                    <p className="text-white/40 text-[11px] mt-0.5">{sub}</p>
                  </div>
                  <button type="button" onClick={() => setForm((p: any) => ({ ...p, [key]: !p[key] }))}
                    className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${(form as any)[key] ? "bg-primary" : "bg-white/15"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${(form as any)[key] ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-white/55 text-xs">Gym</Label>
                <select value={form.gymId} onChange={e => setForm(p => ({ ...p, gymId: e.target.value, memberId: "" }))}
                  className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary">
                  {gyms.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/55 text-xs">Assign to Member</Label>
                <select value={form.memberId} disabled={form.freeForAll}
                  onChange={e => setForm(p => ({ ...p, memberId: e.target.value }))}
                  className={`w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary ${form.freeForAll ? "opacity-40 cursor-not-allowed" : ""}`}>
                  <option value="">All / No assignment</option>
                  {members.map((m: any) => <option key={m.id} value={m.id}>{m.profile?.fullName}</option>)}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-white/55 text-xs">Plan Title *</Label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. High-Protein Bulk Plan" className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/55 text-xs">Goal</Label>
                <Input value={form.goal} onChange={e => setForm(p => ({ ...p, goal: e.target.value }))} placeholder="e.g. Muscle gain" className={inp} />
              </div>
            </div>

            {/* Macro targets */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { key: "caloriesTarget", label: "Calories (kcal)", placeholder: "2200" },
                { key: "proteinG",       label: "Protein (g)",     placeholder: "180" },
                { key: "carbsG",         label: "Carbs (g)",       placeholder: "250" },
                { key: "fatG",           label: "Fat (g)",         placeholder: "70" },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-white/55 text-xs">{label}</Label>
                  <Input type="number" value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder} className={inp} />
                </div>
              ))}
            </div>

            {/* Day + Meal tabs */}
            <div className="space-y-3">
              <div className="flex gap-1 overflow-x-auto pb-1">
                {DAYS.map(d => {
                  const count = MEAL_TIMES.reduce((s, m) => s + (dayMeals[`${d}__${m}`]?.length ?? 0), 0)
                  return (
                    <button key={d} type="button" onClick={() => setActiveDay(d)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all relative shrink-0 ${
                        activeDay === d ? "bg-primary text-white" : "bg-white/5 text-white/50 hover:text-white"
                      }`}>
                      {d.slice(0, 3)}
                      {count > 0 && <span className="ml-1 text-[10px] opacity-70">({count})</span>}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {MEAL_TIMES.map(m => (
                  <button key={m} type="button" onClick={() => setActiveMeal(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all shrink-0 ${
                      activeMeal === m ? "bg-white/12 text-white border border-white/15" : "text-white/40 hover:text-white/70"
                    }`}>{m}</button>
                ))}
              </div>

              <p className="text-white/25 text-xs">{activeDay} → {activeMeal}</p>

              <div className="space-y-3 min-h-15">
                {currentItems.length === 0 ? (
                  <div className="text-center py-8 text-white/25">
                    <UtensilsCrossed className="w-7 h-7 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No items for {activeMeal} on {activeDay}</p>
                  </div>
                ) : currentItems.map((item, idx) => (
                  <div key={idx} className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white/25 text-xs font-mono w-5">{idx + 1}.</span>
                      <Input value={item.name} onChange={e => updateMealItem(idx, "name", e.target.value)} placeholder="Food name (e.g. Chicken Breast)"
                        className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-9 rounded-xl text-sm" />
                      <button type="button" onClick={() => removeMealItem(idx)} className="text-white/20 hover:text-red-400"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {(["quantity","calories","protein","carbs","fat"] as (keyof MealItem)[]).map(f => (
                        <div key={f} className="space-y-1">
                          <p className="text-white/35 text-[10px] capitalize">{f === "quantity" ? "Qty" : f}</p>
                          <Input value={item[f]} onChange={e => updateMealItem(idx, f, e.target.value)}
                            placeholder={f === "quantity" ? "100g" : f === "calories" ? "165" : "30g"}
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

            <div className="flex flex-wrap justify-between gap-3 pt-2">
              <button type="button" onClick={saveAsTemplate}
                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors">
                <Save className="w-3.5 h-3.5" /> Save as Template
              </button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={handleCancel} className="border-white/10 text-white/60 hover:text-white h-10 text-sm">Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-linear-to-r from-primary to-orange-400 hover:opacity-90 text-white font-semibold h-10 text-sm px-7">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : formMode === "edit" ? "Save Changes" : "Create Plan"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {!formMode && (
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search diet plans..."
            className="w-full bg-[hsl(220_25%_9%)] border border-white/8 rounded-xl pl-10 pr-4 h-10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-primary" />
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-white/3 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="No diet plans yet"
          description="Create nutrition plans for your members or load a template."
          action={{ label: "Create Plan", href: "#" }} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
            const totalItems = Object.values(p.planData ?? {}).reduce((s: number, arr: any) => s + arr.length, 0)
            return (
              <div key={p.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 hover:border-white/12 transition-all flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {p.isGlobal    && <span className="text-xs bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full">All Members</span>}
                    {p.isTemplate  && <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">Template</span>}
                  </div>
                  {p.caloriesTarget && (
                    <span className="text-xs bg-orange-500/15 text-orange-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Flame className="w-3 h-3" /> {p.caloriesTarget} kcal
                    </span>
                  )}
                </div>
                <h3 className="text-white font-semibold mb-1 flex-1">{p.title}</h3>
                {p.goal && <p className="text-primary/70 text-xs mb-2">🎯 {p.goal}</p>}
                {(p.proteinG || p.carbsG || p.fatG) && (
                  <div className="flex gap-2 mb-3">
                    {p.proteinG && <MacroBadge label="Protein" value={`${p.proteinG}g`} color="bg-blue-500/10 text-blue-400" />}
                    {p.carbsG   && <MacroBadge label="Carbs"   value={`${p.carbsG}g`}   color="bg-yellow-500/10 text-yellow-400" />}
                    {p.fatG     && <MacroBadge label="Fat"     value={`${p.fatG}g`}     color="bg-red-500/10 text-red-400" />}
                  </div>
                )}
                <p className="text-white/25 text-xs mb-3">{totalItems} food item{totalItems !== 1 ? "s" : ""}</p>
                <div className="flex items-center justify-between text-xs text-white/35 border-t border-white/5 pt-3">
                  <span>{p.gym?.name}</span>
                  {p.assignedMember
                    ? <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.assignedMember.profile.fullName}</span>
                    : <span className="text-white/25">Unassigned</span>
                  }
                </div>
                <div className="flex gap-2 pt-3 mt-1 border-t border-white/5">
                  <button onClick={() => openEdit(p)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-primary hover:text-primary/80 py-1.5 transition-colors">
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => {
                    setForm({ ...blankForm, gymId: gyms[0]?.id ?? "", title: `${p.title} (copy)`, goal: p.goal ?? "" })
                    setDayMeals(p.planData ?? {})
                    setFormMode("create")
                  }} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white/40 hover:text-white/70 py-1.5 transition-colors">
                    <Copy className="w-3 h-3" /> Duplicate
                  </button>
                  <button onClick={() => deletePlan(p.id)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 py-1.5 transition-colors">
                    <Trash2 className="w-3 h-3" /> Archive
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MacroBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`flex flex-col items-center px-2.5 py-1.5 rounded-lg ${color}`}>
      <span className="text-xs font-semibold">{value}</span>
      <span className="text-[10px] opacity-70 mt-0.5">{label}</span>
    </div>
  )
}


// src/app/owner/diets/page.tsx
// "use client"

// import { useEffect, useState } from "react"
// import { PageHeader } from "@/components/owner/PageHeader"
// import { EmptyState } from "@/components/owner/EmptyState"
// import { useToast } from "@/hooks/use-toast"
// import { UtensilsCrossed, Plus, X, Loader2, Flame, Users, Edit, Trash2 } from "lucide-react"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Button } from "@/components/ui/button"

// interface DietPlan {
//   id: string; title: string; description: string | null; goal: string | null
//   caloriesTarget: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null
//   isTemplate: boolean; isGlobal: boolean; createdAt: string; planData: any
//   assignedMember: { id: string; profile: { fullName: string; avatarUrl: string | null } } | null
//   creator: { fullName: string }
//   gym: { name: string }
// }

// const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
// const MEAL_TIMES = ["Breakfast","Mid-Morning Snack","Lunch","Evening Snack","Dinner","Post-Workout"]

// interface MealItem { name: string; quantity: string; calories: string; protein: string; carbs: string; fat: string }
// type DayMeals = Record<string, MealItem[]>
// const emptyMeal = (): MealItem => ({ name: "", quantity: "", calories: "", protein: "", carbs: "", fat: "" })

// export default function DietsPage() {
//   const { toast } = useToast()
//   const [plans, setPlans]     = useState<DietPlan[]>([])
//   const [gyms, setGyms]       = useState<any[]>([])
//   const [members, setMembers] = useState<any[]>([])
//   const [loading, setLoading] = useState(true)
//   const [formMode, setFormMode] = useState<"create"|"edit"|null>(null)
//   const [editingPlan, setEditingPlan] = useState<DietPlan | null>(null)
//   const [saving, setSaving]   = useState(false)
//   const [activeDay, setActiveDay]   = useState("Monday")
//   const [activeMeal, setActiveMeal] = useState("Breakfast")
//   const [dayMeals, setDayMeals]     = useState<DayMeals>({})
//   const [mealTimes, setMealTimes]   = useState<Record<string, string>>({})

//   const blankForm = { gymId: "", allGyms: false, memberId: "", freeForAll: false, title: "", description: "", goal: "", caloriesTarget: "", proteinG: "", carbsG: "", fatG: "", isTemplate: false, weekStartDate: new Date().toISOString().split("T")[0] }
//   const [form, setForm] = useState(blankForm)

//   const mealKey = `${activeDay}__${activeMeal}`

//   const load = () => {
//     Promise.all([
//       fetch("/api/owner/diets").then(r => r.json()),
//       fetch("/api/owner/gyms").then(r => r.json()),
//     ]).then(([p, g]) => {
//       setPlans(Array.isArray(p) ? p : [])
//       setGyms(g)
//       if (g.length > 0) setForm(prev => ({ ...prev, gymId: g[0].id }))
//     }).finally(() => setLoading(false))
//   }
//   useEffect(() => { load() }, [])

//   useEffect(() => {
//     if (!form.gymId || form.allGyms) { setMembers([]); return }
//     fetch(`/api/owner/members?gymId=${form.gymId}&page=1`)
//       .then(r => r.json()).then(d => setMembers(Array.isArray(d.members) ? d.members : []))
//   }, [form.gymId, form.allGyms])

//   const addMealItem    = () => setDayMeals(p => ({ ...p, [mealKey]: [...(p[mealKey] ?? []), emptyMeal()] }))
//   const removeMealItem = (idx: number) => setDayMeals(p => ({ ...p, [mealKey]: (p[mealKey] ?? []).filter((_: any, i: number) => i !== idx) }))
//   const updateMealItem = (idx: number, field: keyof MealItem, val: string) =>
//     setDayMeals(p => { const u = [...(p[mealKey] ?? [])]; u[idx] = { ...u[idx], [field]: val }; return { ...p, [mealKey]: u } })

//   const openCreate = () => {
//     setEditingPlan(null)
//     setForm({ ...blankForm, gymId: gyms[0]?.id ?? "" })
//     setDayMeals({})
//     setActiveDay("Monday"); setActiveMeal("Breakfast")
//     setFormMode("create")
//   }

//   const openEdit = (plan: DietPlan) => {
//     setEditingPlan(plan)
//     setForm({
//       gymId: gyms[0]?.id ?? "",
//       allGyms: false,
//       memberId: plan.assignedMember?.id ?? "",
//       freeForAll: plan.isGlobal,
//       title: plan.title,
//       description: plan.description ?? "",
//       goal: plan.goal ?? "",
//       caloriesTarget: plan.caloriesTarget ? String(plan.caloriesTarget) : "",
//       proteinG: plan.proteinG ? String(plan.proteinG) : "",
//       carbsG: plan.carbsG ? String(plan.carbsG) : "",
//       fatG: plan.fatG ? String(plan.fatG) : "",
//       isTemplate: plan.isTemplate,
//       weekStartDate: plan.planData?.weekStartDate ?? new Date().toISOString().split("T")[0],
//     })
//     setDayMeals(plan.planData?.meals ?? {})
//     setMealTimes(plan.planData?.mealTimes ?? {})
//     setActiveDay("Monday"); setActiveMeal("Breakfast")
//     setFormMode("edit")
//     window.scrollTo({ top: 0, behavior: "smooth" })
//   }

//   const handleCancel = () => {
//     setFormMode(null); setEditingPlan(null); setDayMeals({})
//     setForm({ ...blankForm, gymId: gyms[0]?.id ?? "" })
//   }

//   const submit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!form.title.trim()) { toast({ variant: "destructive", title: "Plan title is required" }); return }
//     setSaving(true)
//     const payload = {
//       gymId: form.allGyms ? gyms[0]?.id : form.gymId,
//       title: form.title, description: form.description, goal: form.goal,
//       caloriesTarget: form.caloriesTarget || null,
//       proteinG: form.proteinG || null, carbsG: form.carbsG || null, fatG: form.fatG || null,
//       isTemplate: form.isTemplate,
//       isGlobal: form.allGyms || form.freeForAll,
//       assignedToMemberId: (!form.freeForAll && !form.allGyms && form.memberId) ? form.memberId : null,
//       planData: { weekStartDate: form.weekStartDate, meals: dayMeals, mealTimes },
//     }
//     const isEdit = formMode === "edit" && editingPlan
//     const res = await fetch(
//       isEdit ? `/api/owner/diets/${editingPlan.id}` : "/api/owner/diets",
//       { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
//     )
//     if (res.ok) {
//       toast({ variant: "success", title: isEdit ? "Diet plan updated!" : "Diet plan created!" })
//       handleCancel(); load()
//     } else toast({ variant: "destructive", title: isEdit ? "Failed to update plan" : "Failed to create plan" })
//     setSaving(false)
//   }

//   const deletePlan = async (id: string) => {
//     if (!confirm("Archive this diet plan?")) return
//     const res = await fetch(`/api/owner/diets/${id}`, { method: "DELETE" })
//     if (res.ok) { toast({ variant: "success", title: "Plan archived" }); load() }
//   }

//   const macroBar = (val: number | null, total: number, color: string) => {
//     if (!val || !total) return null
//     return <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(Math.round((val * 4 / total) * 100), 100)}%` }} />
//   }

//   const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl text-sm"

//   return (
//     <div className="max-w-6xl">
//       <PageHeader title="Diet Plans" subtitle={`${plans.length} plan${plans.length !== 1 ? "s" : ""} created`}
//         action={{ label: "Create Plan", onClick: openCreate, icon: Plus }} />

//       {/* ── Form (create or edit) ── */}
//       {formMode && (
//         <div className="bg-[hsl(220_25%_9%)] border border-primary/20 rounded-2xl p-6 mb-6 space-y-5">
//           <div className="flex items-start justify-between">
//             <div>
//               <h3 className="text-white font-semibold text-base">{formMode === "edit" ? "Edit Diet Plan" : "Create Diet Plan"}</h3>
//               <p className="text-white/40 text-xs mt-0.5">Build a daily nutrition plan with meals</p>
//             </div>
//             <button onClick={handleCancel} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
//           </div>

//           <form onSubmit={submit} className="space-y-5">

//             {/* Free for all toggle */}
//             <div className="flex items-center justify-between p-4 bg-white/4 rounded-xl border border-white/6">
//               <div>
//                 <p className="text-white text-sm font-medium">Free Plan for All Members</p>
//                 <p className="text-white/40 text-xs mt-0.5">Make this plan available to all gym members</p>
//               </div>
//               <button type="button" onClick={() => setForm(p => ({ ...p, freeForAll: !p.freeForAll, memberId: "" }))}
//                 className={`relative w-11 h-6 rounded-full transition-colors ${form.freeForAll ? "bg-primary" : "bg-white/15"}`}>
//                 <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.freeForAll ? "left-6" : "left-1"}`} />
//               </button>
//             </div>

//             {/* Gym + Member */}
//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-1.5">
//                 <div className="flex items-center justify-between">
//                   <Label className="text-white/55 text-sm">Target Gym</Label>
//                   <label className="flex items-center gap-2 cursor-pointer">
//                     <span className="text-white/40 text-xs">All Gyms</span>
//                     <button type="button" onClick={() => setForm(p => ({ ...p, allGyms: !p.allGyms, memberId: "" }))}
//                       className={`relative w-9 h-5 rounded-full transition-colors ${form.allGyms ? "bg-primary" : "bg-white/15"}`}>
//                       <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.allGyms ? "left-4" : "left-0.5"}`} />
//                     </button>
//                   </label>
//                 </div>
//                 <select value={form.gymId} disabled={form.allGyms} onChange={e => setForm(p => ({ ...p, gymId: e.target.value, memberId: "" }))}
//                   className={`w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary ${form.allGyms ? "opacity-40 cursor-not-allowed" : ""}`}>
//                   {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
//                 </select>
//               </div>
//               <div className="space-y-1.5">
//                 <Label className="text-white/55 text-sm">Member</Label>
//                 <select value={form.memberId} disabled={form.freeForAll || form.allGyms}
//                   onChange={e => setForm(p => ({ ...p, memberId: e.target.value }))}
//                   className={`w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary ${(form.freeForAll || form.allGyms) ? "opacity-40 cursor-not-allowed" : ""}`}>
//                   <option value="">Select member</option>
//                   {members.map((m: any) => <option key={m.id} value={m.id}>{m.profile?.fullName ?? m.id}</option>)}
//                 </select>
//               </div>
//             </div>

//             {/* Plan details */}
//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-1.5">
//                 <Label className="text-white/55 text-sm">Plan Title <span className="text-primary">*</span></Label>
//                 <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. High Protein Bulk" className={inp} />
//               </div>
//               <div className="space-y-1.5">
//                 <Label className="text-white/55 text-sm">Goal</Label>
//                 <Input value={form.goal} onChange={e => setForm(p => ({ ...p, goal: e.target.value }))} placeholder="e.g. Muscle gain" className={inp} />
//               </div>
//               <div className="space-y-1.5">
//                 <Label className="text-white/55 text-sm">Daily Calories (kcal)</Label>
//                 <Input type="number" value={form.caloriesTarget} onChange={e => setForm(p => ({ ...p, caloriesTarget: e.target.value }))} placeholder="2000" className={inp} />
//               </div>
//               <div className="space-y-1.5">
//                 <Label className="text-white/55 text-sm">Week Starting</Label>
//                 <Input type="date" value={form.weekStartDate} onChange={e => setForm(p => ({ ...p, weekStartDate: e.target.value }))} className={inp} />
//               </div>
//             </div>

//             <div className="grid grid-cols-3 gap-4">
//               {(["proteinG","carbsG","fatG"] as const).map(field => (
//                 <div key={field} className="space-y-1.5">
//                   <Label className="text-white/55 text-sm">{field === "proteinG" ? "Protein (g)" : field === "carbsG" ? "Carbs (g)" : "Fat (g)"}</Label>
//                   <Input type="number" value={(form as any)[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} className={inp} />
//                 </div>
//               ))}
//             </div>

//             {/* Day + Meal tabs */}
//             <div className="space-y-3">
//               <div className="overflow-x-auto">
//                 <div className="flex gap-1 border-b border-white/8 min-w-max">
//                   {DAYS.map(d => (
//                     <button key={d} type="button" onClick={() => setActiveDay(d)}
//                       className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${activeDay === d ? "border-primary text-primary" : "border-transparent text-white/40 hover:text-white/70"}`}>
//                       {d.slice(0, 3)}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//               <div className="flex flex-wrap gap-2">
//                 {MEAL_TIMES.map(mt => {
//                   const count = dayMeals[`${activeDay}__${mt}`]?.length ?? 0
//                   return (
//                     <button key={mt} type="button" onClick={() => setActiveMeal(mt)}
//                       className={`text-xs px-3 py-1.5 rounded-full border transition-all ${activeMeal === mt ? "bg-primary/15 border-primary/40 text-primary font-medium" : "bg-white/4 border-white/8 text-white/45 hover:border-white/20"}`}>
//                       {mt}{count > 0 && <span className="ml-1.5 bg-primary/25 text-primary text-[10px] px-1.5 py-0.5 rounded-full">{count}</span>}
//                     </button>
//                   )
//                 })}
//               </div>
//               {/* Meal time picker */}
//               <div className="flex items-center gap-3 p-3 bg-white/4 rounded-xl border border-white/6">
//                 <span className="text-white/50 text-xs shrink-0">⏰ {activeMeal} time:</span>
//                 <input type="time" value={mealTimes[activeMeal] ?? ""}
//                   onChange={e => setMealTimes(p => ({ ...p, [activeMeal]: e.target.value }))}
//                   className="bg-transparent border-none text-white/80 text-sm focus:outline-none focus:text-white" />
//                 {mealTimes[activeMeal] && (
//                   <button type="button" onClick={() => setMealTimes(p => { const n = {...p}; delete n[activeMeal]; return n })}
//                     className="text-white/25 hover:text-white/60 text-xs ml-auto">Clear</button>
//                 )}
//               </div>
//               <div className="space-y-2">
//                 {(dayMeals[mealKey] ?? []).length === 0 ? (
//                   <div className="text-center py-8 text-white/25">
//                     <UtensilsCrossed className="w-7 h-7 mx-auto mb-2 opacity-30" />
//                     <p className="text-sm">No items for {activeMeal} on {activeDay}</p>
//                   </div>
//                 ) : (dayMeals[mealKey] ?? []).map((item: MealItem, idx: number) => (
//                   <div key={idx} className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-3">
//                     <div className="flex items-center gap-2">
//                       <Input value={item.name} onChange={e => updateMealItem(idx, "name", e.target.value)} placeholder="Food item (e.g. Chicken Breast)"
//                         className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-9 rounded-xl text-sm" />
//                       <button type="button" onClick={() => removeMealItem(idx)} className="text-white/20 hover:text-red-400 shrink-0"><X className="w-4 h-4" /></button>
//                     </div>
//                     <div className="grid grid-cols-5 gap-2">
//                       {(["quantity","calories","protein","carbs","fat"] as (keyof MealItem)[]).map(f => (
//                         <div key={f} className="space-y-1">
//                           <p className="text-white/35 text-[10px] capitalize">{f}</p>
//                           <Input value={item[f]} onChange={e => updateMealItem(idx, f, e.target.value)}
//                             placeholder={f === "quantity" ? "100g" : "—"}
//                             className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-8 rounded-lg text-xs" />
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//               <button type="button" onClick={addMealItem}
//                 className="w-full py-3 rounded-xl border border-dashed border-white/15 text-white/40 hover:border-primary/40 hover:text-primary/70 transition-all text-sm flex items-center justify-center gap-2">
//                 <Plus className="w-4 h-4" /> Add Food Item
//               </button>
//             </div>

//             <label className="flex items-center gap-2 cursor-pointer">
//               <input type="checkbox" checked={form.isTemplate} onChange={e => setForm(p => ({ ...p, isTemplate: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
//               <span className="text-white/60 text-sm">Save as Template</span>
//             </label>

//             <div className="flex justify-end gap-3 pt-2">
//               <Button type="button" variant="outline" onClick={handleCancel} className="border-white/10 text-white/60 hover:text-white h-10 text-sm">Cancel</Button>
//               <Button type="submit" disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-10 text-sm px-7">
//                 {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : formMode === "edit" ? "Save Changes" : "Create Plan"}
//               </Button>
//             </div>
//           </form>
//         </div>
//       )}

//       {/* Plan cards */}
//       {loading ? (
//         <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-white/3 rounded-2xl animate-pulse" />)}
//         </div>
//       ) : plans.length === 0 ? (
//         <EmptyState icon={UtensilsCrossed} title="No diet plans yet" description="Create nutrition plans for your gym members." />
//       ) : (
//         <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           {plans.map(p => (
//             <div key={p.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 hover:border-white/12 transition-colors">
//               <div className="flex items-center justify-between mb-3">
//                 <div className="flex gap-1.5 flex-wrap">
//                   {p.isTemplate && <span className="text-xs bg-blue-500/15 text-blue-400 px-2.5 py-1 rounded-full">Template</span>}
//                   {p.isGlobal && <span className="text-xs bg-purple-500/15 text-purple-400 px-2.5 py-1 rounded-full">All Members</span>}
//                 </div>
//                 {p.caloriesTarget && (
//                   <span className="flex items-center gap-1 text-xs text-primary/80 ml-auto">
//                     <Flame className="w-3 h-3" /> {p.caloriesTarget} kcal
//                   </span>
//                 )}
//               </div>
//               <h3 className="text-white font-semibold mb-1">{p.title}</h3>
//               {p.goal && <p className="text-primary/70 text-xs mb-3">Goal: {p.goal}</p>}
//               {p.caloriesTarget && (
//                 <div className="space-y-1.5 mb-3">
//                   {[
//                     { label: "Protein", val: p.proteinG, color: "bg-blue-400" },
//                     { label: "Carbs",   val: p.carbsG,   color: "bg-yellow-400" },
//                     { label: "Fat",     val: p.fatG,     color: "bg-red-400" },
//                   ].map(m => m.val ? (
//                     <div key={m.label}>
//                       <div className="flex justify-between text-xs text-white/40 mb-0.5"><span>{m.label}</span><span>{Number(m.val)}g</span></div>
//                       <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">{macroBar(Number(m.val), p.caloriesTarget!, m.color)}</div>
//                     </div>
//                   ) : null)}
//                 </div>
//               )}
//               <div className="border-t border-white/5 pt-3 space-y-1.5">
//                 <div className="flex items-center justify-between text-xs text-white/35">
//                   <span className="flex items-center gap-1">🏋️ {p.gym?.name ?? "—"}</span>
//                   {p.assignedMember ? <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.assignedMember.profile.fullName}</span> : <span>Unassigned</span>}
//                 </div>
//                 <p className="text-xs text-white/25">By {p.creator.fullName}</p>
//               </div>
//               {/* Edit / Archive */}
//               <div className="flex gap-2 pt-3 mt-1 border-t border-white/5">
//                 <button onClick={() => openEdit(p)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-primary hover:text-primary/80 py-1.5 transition-colors">
//                   <Edit className="w-3 h-3" /> Edit
//                 </button>
//                 <button onClick={() => deletePlan(p.id)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 py-1.5 transition-colors">
//                   <Trash2 className="w-3 h-3" /> Archive
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   )
// }
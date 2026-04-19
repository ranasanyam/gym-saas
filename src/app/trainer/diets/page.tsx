// src/app/trainer/diets/page.tsx
"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  UtensilsCrossed, Plus, X, Loader2, Flame, Users, Edit, Trash2, Search, Copy, Building2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]

interface MealItem { name: string; quantity: string; calories: string; protein: string; carbs: string; fat: string }
type PlanData = Record<string, MealItem[]>
const emptyMeal = (): MealItem => ({ name: "", quantity: "", calories: "", protein: "", carbs: "", fat: "" })

interface DietPlan {
  id: string; title: string; goal: string | null; caloriesTarget: number | null
  proteinG: number | null; carbsG: number | null; fatG: number | null
  isGlobal: boolean; createdAt: string; planData: any
  assignedMember: { id: string; profile: { fullName: string } } | null
  gym: { name: string }
}

const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl text-sm"

function timeToMinutes(t: string): number {
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!m) return 0
  let h = parseInt(m[1]); const min = parseInt(m[2]); const p = m[3].toUpperCase()
  if (p === "AM" && h === 12) h = 0
  if (p === "PM" && h !== 12) h += 12
  return h * 60 + min
}

function getSlotsForDay(planData: PlanData, day: string): string[] {
  return Object.keys(planData)
    .filter(k => k.startsWith(`${day}__`))
    .map(k => k.slice(`${day}__`.length))
    .sort((a, b) => timeToMinutes(a) - timeToMinutes(b))
}

function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parse = (v: string) => {
    const m = v.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (m) return { h: m[1].padStart(2,"0"), min: m[2], period: m[3].toUpperCase() as "AM"|"PM" }
    return { h: "08", min: "00", period: "AM" as const }
  }
  const { h, min, period } = parse(value)
  const emit = (nh: string, nm: string, np: string) => onChange(`${nh}:${nm} ${np}`)
  const sel = "bg-[hsl(220_25%_13%)] border border-white/10 text-white rounded-lg px-2 h-9 text-sm focus:outline-none focus:border-primary cursor-pointer"
  return (
    <div className="flex items-center gap-1.5">
      <select value={h} onChange={e => emit(e.target.value, min, period)} className={sel}>
        {Array.from({length:12},(_,i)=>String(i+1).padStart(2,"0")).map(v => <option key={v} value={v}>{v}</option>)}
      </select>
      <span className="text-white/40 text-sm">:</span>
      <select value={min} onChange={e => emit(h, e.target.value, period)} className={sel}>
        {["00","15","30","45"].map(v => <option key={v} value={v}>{v}</option>)}
      </select>
      <select value={period} onChange={e => emit(h, min, e.target.value)} className={sel}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}

function AddTimeSlot({ day, existingSlots, onAdd }: { day: string; existingSlots: string[]; onAdd: (slot: string) => void }) {
  const [show, setShow]     = useState(false)
  const [newTime, setNewTime] = useState("08:00 AM")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setShow(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handle = () => {
    if (existingSlots.includes(newTime)) return
    onAdd(newTime); setShow(false); setNewTime("08:00 AM")
  }

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setShow(s => !s)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/15 transition-all">
        <Plus className="w-3 h-3" /> Add Meal Time
      </button>
      {show && (
        <div className="absolute top-full mt-2 left-0 z-20 bg-[hsl(220_25%_12%)] border border-white/12 rounded-xl shadow-xl p-4 space-y-3 min-w-64">
          <p className="text-white/60 text-xs font-medium">Select meal time for {day}</p>
          <TimePicker value={newTime} onChange={setNewTime} />
          {existingSlots.includes(newTime) && <p className="text-red-400 text-xs">This slot already exists</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setShow(false)}
              className="flex-1 py-1.5 text-xs text-white/40 hover:text-white border border-white/10 rounded-lg transition-colors">Cancel</button>
            <button type="button" onClick={handle} disabled={existingSlots.includes(newTime)}
              className="flex-1 py-1.5 text-xs bg-primary text-white rounded-lg font-medium disabled:opacity-40 hover:opacity-90 transition-all">Add Slot</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TrainerDietsPage() {
  const { toast }      = useToast()
  const searchParams   = useSearchParams()
  const preselMemberId = searchParams.get("memberId") ?? ""

  const [plans,   setPlans]   = useState<DietPlan[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState("")
  const [formMode, setFormMode]       = useState<"create"|"edit"|null>(preselMemberId ? "create" : null)
  const [editingPlan, setEditingPlan] = useState<DietPlan | null>(null)
  const [saving, setSaving]           = useState(false)
  const [deletingId, setDeletingId]   = useState<string | null>(null)
  const [activeDay, setActiveDay]     = useState("Monday")
  const [planData, setPlanData]       = useState<PlanData>({})

  const blankForm = (mId = "") => ({
    memberId: mId, freeForAll: false,
    title: "", goal: "", caloriesTarget: "", proteinG: "", carbsG: "", fatG: "",
  })
  const [form, setForm] = useState(blankForm(preselMemberId))

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/trainer/diets").then(r => r.json()),
      fetch("/api/trainer/members").then(r => r.json()),
    ]).then(([p, m]) => {
      setPlans(Array.isArray(p) ? p : [])
      setMembers(Array.isArray(m) ? m : [])
    }).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const slots    = getSlotsForDay(planData, activeDay)
  const addSlot  = (time: string) => { if (!planData[`${activeDay}__${time}`]) setPlanData(p => ({ ...p, [`${activeDay}__${time}`]: [] })) }
  const removeSlot = (time: string) => setPlanData(p => { const n = { ...p }; delete n[`${activeDay}__${time}`]; return n })
  const addMealItem    = (time: string) => setPlanData(p => ({ ...p, [`${activeDay}__${time}`]: [...(p[`${activeDay}__${time}`] ?? []), emptyMeal()] }))
  const removeMealItem = (time: string, idx: number) => setPlanData(p => ({ ...p, [`${activeDay}__${time}`]: p[`${activeDay}__${time}`].filter((_,i) => i !== idx) }))
  const updateMealItem = (time: string, idx: number, field: keyof MealItem, val: string) =>
    setPlanData(p => { const u = [...(p[`${activeDay}__${time}`] ?? [])]; u[idx] = { ...u[idx], [field]: val }; return { ...p, [`${activeDay}__${time}`]: u } })

  const openCreate = () => {
    setEditingPlan(null)
    setForm(blankForm(preselMemberId))
    setPlanData({})
    setActiveDay("Monday")
    setFormMode("create")
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50)
  }

  const openEdit = (plan: DietPlan) => {
    setEditingPlan(plan)
    setForm({
      memberId:      plan.assignedMember?.id ?? "",
      freeForAll:    plan.isGlobal,
      title:         plan.title,
      goal:          plan.goal ?? "",
      caloriesTarget: plan.caloriesTarget?.toString() ?? "",
      proteinG:       plan.proteinG?.toString()       ?? "",
      carbsG:         plan.carbsG?.toString()         ?? "",
      fatG:           plan.fatG?.toString()            ?? "",
    } as any)
    setPlanData(plan.planData ?? {})
    setActiveDay("Monday")
    setFormMode("edit")
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50)
  }

  const handleCancel = () => { setFormMode(null); setEditingPlan(null) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast({ variant: "destructive", title: "Title is required" }); return }
    setSaving(true)
    const payload = {
      ...form, planData,
      caloriesTarget: form.caloriesTarget ? Number(form.caloriesTarget) : null,
      proteinG:       form.proteinG       ? Number(form.proteinG)       : null,
      carbsG:         form.carbsG         ? Number(form.carbsG)         : null,
      fatG:           form.fatG           ? Number(form.fatG)           : null,
      isGlobal:       form.freeForAll,
    }
    const url    = formMode === "edit" ? `/api/trainer/diets/${editingPlan!.id}` : "/api/trainer/diets"
    const method = formMode === "edit" ? "PATCH" : "POST"
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    if (res.ok) {
      toast({ variant: "success", title: formMode === "edit" ? "Plan updated!" : "Plan created!" })
      handleCancel(); load()
    } else {
      const d = await res.json()
      toast({ variant: "destructive", title: d.error ?? "Failed to save" })
    }
    setSaving(false)
  }

  const deletePlan = async (id: string) => {
    setDeletingId(id)
    const res = await fetch(`/api/trainer/diets/${id}`, { method: "DELETE" })
    if (res.ok) { toast({ variant: "success", title: "Plan archived" }); load() }
    else toast({ variant: "destructive", title: "Failed to archive" })
    setDeletingId(null)
  }

  const filtered = plans.filter(p =>
    p.title.toLowerCase().includes(searchQ.toLowerCase()) ||
    (p.goal ?? "").toLowerCase().includes(searchQ.toLowerCase())
  )

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Diet Plans</h2>
          <p className="text-white/35 text-sm mt-0.5">{plans.length} plan{plans.length !== 1 ? "s" : ""}</p>
        </div>
        {!formMode && (
          <Button onClick={openCreate} className="bg-linear-to-r from-primary to-orange-400 text-white h-10 gap-2">
            <Plus className="w-4 h-4" /> Create Plan
          </Button>
        )}
      </div>

      {/* Form */}
      {formMode && (
        <div className="bg-[hsl(220_25%_9%)] border border-primary/20 rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between">
            <h3 className="text-white font-semibold">{formMode === "edit" ? "Edit Diet Plan" : "Create Diet Plan"}</h3>
            <button onClick={handleCancel} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Global toggle */}
            <div className="flex items-center justify-between p-4 bg-white/4 rounded-xl border border-white/6">
              <div>
                <p className="text-white text-sm font-medium">Make available to all members</p>
                <p className="text-white/40 text-xs mt-0.5">Share this plan with your entire gym</p>
              </div>
              <button type="button"
                onClick={() => setForm(p => ({ ...p, freeForAll: !p.freeForAll, memberId: p.freeForAll ? p.memberId : "" }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${(form as any).freeForAll ? "bg-primary" : "bg-white/15"}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${(form as any).freeForAll ? "left-6" : "left-1"}`} />
              </button>
            </div>

            {/* Assign to member */}
            <div className="space-y-1.5">
              <Label className="text-white/55 text-sm">Assign to Member</Label>
              <select value={(form as any).memberId} disabled={(form as any).freeForAll}
                onChange={e => setForm(p => ({ ...p, memberId: e.target.value }))}
                className={`w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary ${(form as any).freeForAll ? "opacity-40 cursor-not-allowed" : ""}`}>
                <option value="">— No specific member —</option>
                {members.map((m: any) => <option key={m.id} value={m.id}>{m.profile?.fullName}</option>)}
              </select>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-white/55 text-sm">Plan Title <span className="text-primary">*</span></Label>
                <Input value={(form as any).title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. High Protein Fat Loss" className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Goal</Label>
                <Input value={(form as any).goal} onChange={e => setForm(p => ({ ...p, goal: e.target.value }))}
                  placeholder="e.g. Fat loss" className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Calories Target (kcal/day)</Label>
                <Input type="number" value={(form as any).caloriesTarget}
                  onChange={e => setForm(p => ({ ...p, caloriesTarget: e.target.value }))}
                  placeholder="e.g. 2200" className={inp} />
              </div>
              {([["proteinG","Protein (g)"],["carbsG","Carbs (g)"],["fatG","Fat (g)"]] as [string,string][]).map(([field, label]) => (
                <div key={field} className="space-y-1.5">
                  <Label className="text-white/55 text-sm">{label}</Label>
                  <Input type="number" value={(form as any)[field]}
                    onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                    placeholder="g" className={inp} />
                </div>
              ))}
            </div>

            {/* Day tabs */}
            <div>
              <Label className="text-white/55 text-sm mb-2 block">Meal Schedule</Label>
              <div className="flex gap-1 bg-white/4 rounded-xl p-1 mb-4 overflow-x-auto">
                {DAYS.map(d => {
                  const daySlots = getSlotsForDay(planData, d)
                  const itemCount = daySlots.reduce((s, t) => s + (planData[`${d}__${t}`]?.length ?? 0), 0)
                  return (
                    <button key={d} type="button" onClick={() => setActiveDay(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all relative ${
                        activeDay === d ? "bg-[hsl(220_25%_13%)] text-white shadow" : "text-white/40 hover:text-white/70"
                      }`}>
                      {d.slice(0,3)}
                      {itemCount > 0 && <span className="ml-1 text-primary text-[9px]">({itemCount})</span>}
                    </button>
                  )
                })}
              </div>

              {/* Time slots for active day */}
              <div className="space-y-3">
                {slots.length === 0 && (
                  <div className="text-center py-6 text-white/25 text-sm border border-dashed border-white/10 rounded-xl">
                    No meal times added for {activeDay}
                  </div>
                )}
                {slots.map(time => {
                  const key   = `${activeDay}__${time}`
                  const items = planData[key] ?? []
                  return (
                    <div key={key} className="bg-[hsl(220_25%_11%)] border border-white/8 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 bg-white/3 border-b border-white/6">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono bg-primary/15 text-primary px-2 py-0.5 rounded-lg">{time}</span>
                          <span className="text-white/40 text-xs">{items.length} item{items.length !== 1 ? "s" : ""}</span>
                        </div>
                        <button type="button" onClick={() => removeSlot(time)} className="text-white/25 hover:text-red-400 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-3 space-y-2">
                        {items.map((item, idx) => (
                          <div key={idx} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-xl p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-white/25 text-xs w-4 shrink-0">{idx+1}.</span>
                              <Input value={item.name} onChange={e => updateMealItem(time, idx, "name", e.target.value)}
                                placeholder="Food name (e.g. Chicken Breast)"
                                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-9 rounded-xl text-sm" />
                              <button type="button" onClick={() => removeMealItem(time, idx)} className="text-white/20 hover:text-red-400 transition-colors shrink-0">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                              {(["quantity","calories","protein","carbs","fat"] as (keyof MealItem)[]).map(f => (
                                <div key={f} className="space-y-1">
                                  <p className="text-white/30 text-[10px] capitalize">{f === "quantity" ? "Qty" : f}</p>
                                  <Input value={item[f]} onChange={e => updateMealItem(time, idx, f, e.target.value)}
                                    placeholder={f === "quantity" ? "100g" : f === "calories" ? "165" : "30g"}
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-8 rounded-lg text-xs" />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => addMealItem(time)}
                          className="w-full py-2 rounded-xl border border-dashed border-white/10 text-white/35 hover:border-primary/30 hover:text-primary/60 transition-all text-xs flex items-center justify-center gap-1.5">
                          <Plus className="w-3.5 h-3.5" /> Add Food Item
                        </button>
                      </div>
                    </div>
                  )
                })}
                <AddTimeSlot day={activeDay} existingSlots={slots} onAdd={addSlot} />
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-white/6">
              <Button type="button" variant="outline" onClick={handleCancel}
                className="border-white/10 text-white/60 hover:text-white bg-transparent h-10 flex-1">Cancel</Button>
              <Button type="submit" disabled={saving}
                className="bg-linear-to-r from-primary to-orange-400 text-white font-semibold h-10 flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : formMode === "edit" ? "Save Changes" : "Create Plan"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      {!formMode && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search diet plans…"
            className="w-full bg-[hsl(220_25%_9%)] border border-white/8 rounded-xl pl-10 pr-4 h-10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-primary" />
        </div>
      )}

      {/* Plan cards */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 bg-white/3 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        !searchQ && members.length === 0 ? (
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white/20" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">No clients yet</h3>
              <p className="text-white/40 text-sm mt-1.5 max-w-xs mx-auto">
                Join a gym and get assigned members before you can create diet plans for them.
              </p>
            </div>
            <Link href="/trainer/discover"
              className="flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
              <Building2 className="w-4 h-4" /> Discover Gyms
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <UtensilsCrossed className="w-10 h-10 text-white/15" />
            <p className="text-white/30 text-sm">{searchQ ? "No plans match your search" : "No diet plans yet"}</p>
            {!searchQ && <button onClick={openCreate} className="text-primary text-sm hover:underline">Create your first plan</button>}
          </div>
        )
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(plan => {
            const allSlots   = Object.keys(plan.planData ?? {})
            const totalItems = Object.values(plan.planData ?? {}).reduce((s: number, arr: any) => s + arr.length, 0)
            const daysWithData = [...new Set(allSlots.map(k => k.split("__")[0]))].length
            const isDeleting = deletingId === plan.id
            return (
              <div key={plan.id}
                className={`bg-[hsl(220_25%_9%)] border rounded-2xl p-5 hover:border-white/12 transition-all flex flex-col ${isDeleting ? "border-red-500/20 opacity-60" : "border-white/6"}`}>
                <Link href={`/trainer/diets/${plan.id}`} className="flex flex-col flex-1 mb-3">
                  <div className="flex items-start justify-between mb-3">
                    {plan.isGlobal && <span className="text-xs bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full">All Members</span>}
                    {plan.caloriesTarget && (
                      <span className="text-xs bg-orange-500/15 text-orange-400 px-2.5 py-1 rounded-full flex items-center gap-1 ml-auto">
                        <Flame className="w-3 h-3" /> {plan.caloriesTarget} kcal
                      </span>
                    )}
                  </div>
                  <h3 className="text-white font-semibold mb-1 line-clamp-1">{plan.title}</h3>
                  {plan.goal && <p className="text-primary/70 text-xs mb-2">🎯 {plan.goal}</p>}
                  {(plan.proteinG || plan.carbsG || plan.fatG) && (
                    <div className="flex gap-1.5 mb-3 flex-wrap">
                      {plan.proteinG && <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">P: {plan.proteinG}g</span>}
                      {plan.carbsG   && <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full">C: {plan.carbsG}g</span>}
                      {plan.fatG     && <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">F: {plan.fatG}g</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3 text-xs text-white/25">
                    <span>{totalItems} food item{totalItems !== 1 ? "s" : ""}</span>
                    {daysWithData > 0 && <span>· {daysWithData} day{daysWithData !== 1 ? "s" : ""}</span>}
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/35 border-t border-white/5 pt-3">
                    <span className="truncate">{plan.gym?.name}</span>
                    {plan.assignedMember
                      ? <span className="flex items-center gap-1 shrink-0"><Users className="w-3 h-3" /> {plan.assignedMember.profile.fullName}</span>
                      : <span className="text-white/20">Unassigned</span>}
                  </div>
                </Link>
                <div className="flex gap-1 pt-2 border-t border-white/5">
                  <button onClick={() => openEdit(plan)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs text-primary hover:text-primary/80 py-2 transition-colors rounded-lg hover:bg-primary/5">
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => { setForm({ ...blankForm(), title: `${plan.title} (copy)`, goal: plan.goal ?? "" } as any); setPlanData(plan.planData ?? {}); setFormMode("create"); setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50) }}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white/40 hover:text-white/70 py-2 transition-colors rounded-lg hover:bg-white/5">
                    <Copy className="w-3 h-3" /> Duplicate
                  </button>
                  <button onClick={() => deletePlan(plan.id)} disabled={isDeleting}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 py-2 transition-colors rounded-lg hover:bg-red-500/5 disabled:opacity-40">
                    {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    {isDeleting ? "Archiving…" : "Archive"}
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

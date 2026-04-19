// src/app/trainer/workouts/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ClipboardList, Plus, Users, X, Loader2, Dumbbell, Edit, Trash2, Building2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface Plan {
  id: string; title: string; description: string | null; goal: string | null
  difficulty: string; durationWeeks: number; isGlobal: boolean
  weekStartDate: string | null; createdAt: string; planData: any
  assignedMember: { id: string; profile: { fullName: string } } | null
  creator: { fullName: string }
  gym: { name: string }
}

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
const DIFF_COLORS: Record<string,string> = {
  BEGINNER:     "bg-green-500/15 text-green-400",
  INTERMEDIATE: "bg-yellow-500/15 text-yellow-400",
  ADVANCED:     "bg-red-500/15 text-red-400",
}

interface Exercise { name: string; sets: string; reps: string; duration: string; notes: string }
type WeekPlan = Record<string, Exercise[]>
const emptyExercise = (): Exercise => ({ name: "", sets: "", reps: "", duration: "", notes: "" })

const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl text-sm"

// ── Plan Form — defined outside component to prevent focus loss ───────────────
const PlanForm = ({
  mode, form, setForm, weekPlan, setWeekPlan, members, activeDay, setActiveDay,
  onSubmit, onCancel, saving,
}: any) => {
  const addExercise    = () => setWeekPlan((p: WeekPlan) => ({ ...p, [activeDay]: [...(p[activeDay] ?? []), emptyExercise()] }))
  const removeExercise = (day: string, idx: number) =>
    setWeekPlan((p: WeekPlan) => ({ ...p, [day]: (p[day] ?? []).filter((_: any, i: number) => i !== idx) }))
  const updateExercise = (day: string, idx: number, field: keyof Exercise, val: string) =>
    setWeekPlan((p: WeekPlan) => { const u = [...(p[day] ?? [])]; u[idx] = { ...u[idx], [field]: val }; return { ...p, [day]: u } })

  return (
    <div className="bg-[hsl(220_25%_9%)] border border-primary/20 rounded-2xl p-6 mb-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-white font-semibold text-base">{mode === "edit" ? "Edit Workout Plan" : "Create Workout Plan"}</h3>
          <p className="text-white/40 text-xs mt-0.5">Build a weekly workout schedule for your members</p>
        </div>
        <button onClick={onCancel} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Free for all toggle */}
        <div className="flex items-center justify-between p-4 bg-white/4 rounded-xl border border-white/6">
          <div>
            <p className="text-white text-sm font-medium">Free Plan for All Members</p>
            <p className="text-white/40 text-xs mt-0.5">Make available to all members in your gym</p>
          </div>
          <button type="button" onClick={() => setForm((p: any) => ({ ...p, freeForAll: !p.freeForAll, memberId: "" }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.freeForAll ? "bg-primary" : "bg-white/15"}`}>
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.freeForAll ? "left-6" : "left-1"}`} />
          </button>
        </div>

        {/* Member selector */}
        <div className="space-y-1.5">
          <Label className="text-white/55 text-sm">Assign to Member</Label>
          <select value={form.memberId} disabled={form.freeForAll}
            onChange={e => setForm((p: any) => ({ ...p, memberId: e.target.value }))}
            className={`w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary ${form.freeForAll ? "opacity-40 cursor-not-allowed" : ""}`}>
            <option value="">— No specific member —</option>
            {members.map((m: any) => <option key={m.id} value={m.id}>{m.profile?.fullName ?? m.id}</option>)}
          </select>
        </div>

        {/* Plan metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-white/55 text-sm">Plan Title <span className="text-primary">*</span></Label>
            <Input value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. 4-Week Fat Loss" className={inp} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/55 text-sm">Goal</Label>
            <Input value={form.goal} onChange={e => setForm((p: any) => ({ ...p, goal: e.target.value }))}
              placeholder="e.g. Weight loss" className={inp} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/55 text-sm">Difficulty</Label>
            <select value={form.difficulty} onChange={e => setForm((p: any) => ({ ...p, difficulty: e.target.value }))}
              className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary">
              {["BEGINNER","INTERMEDIATE","ADVANCED"].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/55 text-sm">Week Starting</Label>
            <Input type="date" value={form.weekStartDate}
              onChange={e => setForm((p: any) => ({ ...p, weekStartDate: e.target.value }))} className={inp} />
          </div>
        </div>

        {/* Day tabs + exercises */}
        <div className="space-y-3">
          <div className="grid grid-cols-7 border-b border-white/8">
            {DAYS.map(d => {
              const exCount = (weekPlan[d] ?? []).length
              return (
                <button key={d} type="button" onClick={() => setActiveDay(d)}
                  className={`py-2.5 text-sm font-medium transition-all border-b-2 relative ${activeDay === d ? "border-primary text-primary" : "border-transparent text-white/40 hover:text-white/70"}`}>
                  {d}
                  {exCount > 0 && <span className="absolute top-0.5 right-1 text-[9px] text-primary">{exCount}</span>}
                </button>
              )
            })}
          </div>
          <div className="space-y-3 min-h-20">
            {(weekPlan[activeDay] ?? []).length === 0 ? (
              <div className="text-center py-8 text-white/25">
                <Dumbbell className="w-7 h-7 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No exercises for {activeDay}</p>
              </div>
            ) : (weekPlan[activeDay] ?? []).map((ex: Exercise, idx: number) => (
              <div key={idx} className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Input value={ex.name} onChange={e => updateExercise(activeDay, idx, "name", e.target.value)}
                    placeholder="Exercise name"
                    className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-9 rounded-xl text-sm" />
                  <button type="button" onClick={() => removeExercise(activeDay, idx)}
                    className="text-white/20 hover:text-red-400 shrink-0"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["sets","reps","duration"] as (keyof Exercise)[]).map(f => (
                    <div key={f} className="space-y-1">
                      <p className="text-white/35 text-xs capitalize">{f}</p>
                      <Input value={ex[f]} onChange={e => updateExercise(activeDay, idx, f, e.target.value)}
                        placeholder={f === "duration" ? "30s" : "3"}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-8 rounded-lg text-xs" />
                    </div>
                  ))}
                </div>
                <Input value={ex.notes} onChange={e => updateExercise(activeDay, idx, "notes", e.target.value)}
                  placeholder="Notes (optional)"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-8 rounded-xl text-xs" />
              </div>
            ))}
          </div>
          <button type="button" onClick={addExercise}
            className="w-full py-3 rounded-xl border border-dashed border-white/15 text-white/40 hover:border-primary/40 hover:text-primary/70 transition-all text-sm flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Exercise for {activeDay}
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
          <Button type="button" variant="outline" onClick={onCancel}
            className="border-white/10 text-white/60 hover:text-white h-10 text-sm bg-transparent">Cancel</Button>
          <Button type="submit" disabled={saving}
            className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-10 text-sm px-7">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : mode === "edit" ? "Save Changes" : "Create Plan"}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TrainerWorkoutsPage() {
  const { toast }      = useToast()
  const searchParams   = useSearchParams()
  const preselMemberId = searchParams.get("memberId") ?? ""

  const [plans,   setPlans]   = useState<Plan[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formMode, setFormMode]       = useState<"create"|"edit"|null>(preselMemberId ? "create" : null)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [saving, setSaving]           = useState(false)
  const [deletingId, setDeletingId]   = useState<string | null>(null)
  const [activeDay, setActiveDay]     = useState("Mon")
  const [weekPlan, setWeekPlan]       = useState<WeekPlan>({})

  const blankForm = (mId = "") => ({
    memberId: mId, freeForAll: false,
    title: "", description: "", goal: "", difficulty: "BEGINNER",
    weekStartDate: new Date().toISOString().split("T")[0],
  })
  const [form, setForm] = useState(blankForm(preselMemberId))

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/trainer/workouts").then(r => r.json()),
      fetch("/api/trainer/members").then(r => r.json()),
    ]).then(([p, m]) => {
      setPlans(Array.isArray(p) ? p : [])
      setMembers(Array.isArray(m) ? m : [])
    }).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditingPlan(null)
    setForm(blankForm(preselMemberId))
    setWeekPlan({})
    setActiveDay("Mon")
    setFormMode("create")
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50)
  }

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setForm({
      memberId:      plan.assignedMember?.id ?? "",
      freeForAll:    plan.isGlobal,
      title:         plan.title,
      description:   plan.description ?? "",
      goal:          plan.goal ?? "",
      difficulty:    plan.difficulty,
      weekStartDate: plan.weekStartDate ? plan.weekStartDate.split("T")[0] : new Date().toISOString().split("T")[0],
    })
    const wp: WeekPlan = {}
    DAYS.forEach(d => { if (plan.planData?.[d]) wp[d] = plan.planData[d] })
    setWeekPlan(wp)
    setActiveDay("Mon")
    setFormMode("edit")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCancel = () => { setFormMode(null); setEditingPlan(null); setWeekPlan({}); setForm(blankForm()) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast({ variant: "destructive", title: "Plan title is required" }); return }
    setSaving(true)
    const payload = {
      title: form.title, description: (form as any).description, goal: form.goal,
      difficulty: form.difficulty, durationWeeks: 1,
      isGlobal: form.freeForAll,
      assignedToMemberId: (!form.freeForAll && form.memberId) ? form.memberId : null,
      weekStartDate: (form as any).weekStartDate,
      planData: weekPlan,
    }
    const isEdit = formMode === "edit" && editingPlan
    const res = await fetch(
      isEdit ? `/api/trainer/workouts/${editingPlan.id}` : "/api/trainer/workouts",
      { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
    )
    if (res.ok) {
      toast({ variant: "success", title: isEdit ? "Plan updated!" : "Workout plan created!" })
      handleCancel(); load()
    } else {
      toast({ variant: "destructive", title: "Failed to save plan" })
    }
    setSaving(false)
  }

  const deletePlan = async (id: string) => {
    setDeletingId(id)
    const res = await fetch(`/api/trainer/workouts/${id}`, { method: "DELETE" })
    if (res.ok) { toast({ variant: "success", title: "Plan archived" }); load() }
    else toast({ variant: "destructive", title: "Failed to archive plan" })
    setDeletingId(null)
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Workout Plans</h2>
          <p className="text-white/35 text-sm mt-0.5">{plans.length} plan{plans.length !== 1 ? "s" : ""}</p>
        </div>
        {!formMode && (
          <Button onClick={openCreate} className="bg-gradient-primary hover:opacity-90 text-white h-10 gap-2">
            <Plus className="w-4 h-4" /> Create Plan
          </Button>
        )}
      </div>

      {formMode && (
        <PlanForm
          mode={formMode} form={form} setForm={setForm}
          weekPlan={weekPlan} setWeekPlan={setWeekPlan}
          members={members} activeDay={activeDay} setActiveDay={setActiveDay}
          onSubmit={submit} onCancel={handleCancel} saving={saving}
        />
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 bg-white/3 rounded-2xl animate-pulse" />)}
        </div>
      ) : plans.length === 0 ? (
        members.length === 0 ? (
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white/20" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">No clients yet</h3>
              <p className="text-white/40 text-sm mt-1.5 max-w-xs mx-auto">
                Join a gym and get assigned members before you can create workout plans for them.
              </p>
            </div>
            <Link href="/trainer/discover"
              className="flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
              <Building2 className="w-4 h-4" /> Discover Gyms
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 gap-3 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl">
            <ClipboardList className="w-10 h-10 text-white/15" />
            <p className="text-white/30 text-sm">No workout plans yet</p>
            <button onClick={openCreate} className="text-primary text-sm hover:underline">Create your first plan</button>
          </div>
        )
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(p => {
            const isDeleting = deletingId === p.id
            return (
              <div key={p.id}
                className={`bg-[hsl(220_25%_9%)] border rounded-2xl p-5 hover:border-white/12 transition-all flex flex-col ${isDeleting ? "border-red-500/20 opacity-60" : "border-white/6"}`}>
                <Link href={`/trainer/workouts/${p.id}`} className="flex flex-col flex-1 mb-3">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${DIFF_COLORS[p.difficulty] ?? ""}`}>{p.difficulty}</span>
                    {p.isGlobal && <span className="text-xs bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full">All Members</span>}
                  </div>
                  <h3 className="text-white font-semibold mb-1 flex-1 line-clamp-1">{p.title}</h3>
                  {p.goal && <p className="text-primary/70 text-xs mb-2">🎯 {p.goal}</p>}
                  {p.planData && (
                    <div className="flex gap-1 flex-wrap mb-3">
                      {Object.entries(p.planData as Record<string,any[]>)
                        .filter(([,exs]) => exs.length > 0)
                        .map(([day, exs]) => (
                          <span key={day} className="text-[10px] bg-white/5 text-white/35 px-1.5 py-0.5 rounded-full">
                            {day} ({exs.length})
                          </span>
                        ))
                      }
                    </div>
                  )}
                  <div className="border-t border-white/5 pt-3 mt-auto">
                    <div className="flex items-center justify-between text-xs text-white/35">
                      <span className="truncate">{p.gym?.name ?? "—"}</span>
                      {p.assignedMember
                        ? <span className="flex items-center gap-1 shrink-0"><Users className="w-3 h-3" /> {p.assignedMember.profile.fullName}</span>
                        : <span className="text-white/20">Unassigned</span>}
                    </div>
                  </div>
                </Link>
                <div className="flex gap-1 pt-2 border-t border-white/5">
                  <button onClick={() => openEdit(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs text-primary hover:text-primary/80 py-2 transition-colors rounded-lg hover:bg-primary/5">
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => deletePlan(p.id)} disabled={isDeleting}
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

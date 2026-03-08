// src/app/trainer/workouts/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { ClipboardList, Plus, Users, X, Loader2, Dumbbell, Edit, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface Plan {
  id: string; title: string; description: string | null; goal: string | null
  difficulty: string; durationWeeks: number; isGlobal: boolean
  weekStartDate: string | null; createdAt: string; planData: any
  assignedMember: { id: string; profile: { fullName: string; avatarUrl: string | null } } | null
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

// Defined outside component to prevent focus-loss on re-render
const PlanForm = ({
  mode, form, setForm, weekPlan, setWeekPlan, members, activeDay, setActiveDay,
  onSubmit, onCancel, saving,
}: any) => {
  const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl text-sm"

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
          <div className="space-y-1.5">
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
            {DAYS.map(d => (
              <button key={d} type="button" onClick={() => setActiveDay(d)}
                className={`py-2.5 text-sm font-medium transition-all border-b-2 ${activeDay === d ? "border-primary text-primary" : "border-transparent text-white/40 hover:text-white/70"}`}>
                {d}
              </button>
            ))}
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
            <Plus className="w-4 h-4" /> Add Exercise
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}
            className="border-white/10 text-white/60 hover:text-white h-10 text-sm">Cancel</Button>
          <Button type="submit" disabled={saving}
            className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-10 text-sm px-7">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : mode === "edit" ? "Save Changes" : "Create Plan"}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function TrainerWorkoutsPage() {
  const { toast } = useToast()
  const [plans,   setPlans]   = useState<Plan[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formMode, setFormMode]       = useState<"create"|"edit"|null>(null)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [saving, setSaving]   = useState(false)
  const [activeDay, setActiveDay] = useState("Mon")
  const [weekPlan, setWeekPlan]   = useState<WeekPlan>({})

  const blankForm = {
    memberId: "", freeForAll: false,
    title: "", description: "", goal: "", difficulty: "BEGINNER",
    weekStartDate: new Date().toISOString().split("T")[0],
  }
  const [form, setForm] = useState(blankForm)

  const load = () => {
    Promise.all([
      fetch("/api/trainer/workouts").then(r => r.json()),
      fetch("/api/trainer/members").then(r => r.json()),
    ]).then(([p, m]) => {
      setPlans(Array.isArray(p) ? p : [])
      setMembers(Array.isArray(m) ? m : [])
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditingPlan(null); setForm(blankForm); setWeekPlan({}); setActiveDay("Mon"); setFormMode("create")
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
    setWeekPlan(wp); setActiveDay("Mon"); setFormMode("edit")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCancel = () => { setFormMode(null); setEditingPlan(null); setWeekPlan({}); setForm(blankForm) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast({ variant: "destructive", title: "Plan title is required" }); return }
    setSaving(true)
    const payload = {
      title: form.title, description: form.description, goal: form.goal,
      difficulty: form.difficulty, durationWeeks: 1,
      isGlobal: form.freeForAll,
      assignedToMemberId: (!form.freeForAll && form.memberId) ? form.memberId : null,
      weekStartDate: form.weekStartDate,
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
    if (!confirm("Archive this workout plan?")) return
    await fetch(`/api/trainer/workouts/${id}`, { method: "DELETE" })
    toast({ variant: "success", title: "Plan archived" }); load()
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Workout Plans</h2>
          <p className="text-white/35 text-sm mt-0.5">{plans.length} plan{plans.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-primary hover:opacity-90 text-white h-10 gap-2">
          <Plus className="w-4 h-4" /> Create Plan
        </Button>
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
          {[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-white/3 rounded-2xl animate-pulse" />)}
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl">
          <ClipboardList className="w-10 h-10 text-white/15" />
          <p className="text-white/30 text-sm">No workout plans yet — create your first one</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(p => (
            <div key={p.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 hover:border-white/12 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${DIFF_COLORS[p.difficulty] ?? ""}`}>{p.difficulty}</span>
                {p.isGlobal && <span className="text-xs bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full">All Members</span>}
              </div>
              <h3 className="text-white font-semibold mb-1">{p.title}</h3>
              {p.goal && <p className="text-primary/70 text-xs mb-2">Goal: {p.goal}</p>}
              {p.weekStartDate && <p className="text-white/30 text-xs mb-2">Week of {new Date(p.weekStartDate).toLocaleDateString("en-IN")}</p>}
              <div className="border-t border-white/5 pt-3 mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-white/35">
                  <span className="flex items-center gap-1">🏋️ {p.gym?.name ?? "—"}</span>
                  {p.assignedMember
                    ? <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.assignedMember.profile.fullName}</span>
                    : <span className="text-white/25">Unassigned</span>
                  }
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
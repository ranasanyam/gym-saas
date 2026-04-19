// src/app/owner/workouts/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { PageHeader } from "@/components/owner/PageHeader"
import { EmptyState } from "@/components/owner/EmptyState"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  ClipboardList, Plus, Users, X, Loader2, Dumbbell, Edit, Trash2,
  BookOpen, Save, ChevronRight, Sparkles, Search, Copy
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface Exercise { name: string; sets: string; reps: string; duration: string; notes: string }
type WeekPlan = Record<string, Exercise[]>

interface Plan {
  id: string; title: string; description: string | null; goal: string | null
  difficulty: string; durationWeeks: number; isTemplate: boolean; isGlobal: boolean
  weekStartDate: string | null; createdAt: string; planData: any
  assignedMember: { id: string; profile: { fullName: string; avatarUrl: string | null } } | null
  creator: { fullName: string }; gym: { name: string }
}

interface Template {
  id: string; title: string; description: string | null; goal: string | null
  difficulty: string | null; planData: any; isGlobal: boolean; usageCount: number
  createdBy: { fullName: string }; gym: { name: string } | null
}

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
const FULL_DAYS: Record<string,string> = { Mon:"Monday", Tue:"Tuesday", Wed:"Wednesday", Thu:"Thursday", Fri:"Friday", Sat:"Saturday", Sun:"Sunday" }
const DIFF_COLORS: Record<string, string> = {
  BEGINNER: "bg-green-500/15 text-green-400",
  INTERMEDIATE: "bg-yellow-500/15 text-yellow-400",
  ADVANCED: "bg-red-500/15 text-red-400",
}
const emptyExercise = (): Exercise => ({ name: "", sets: "", reps: "", duration: "", notes: "" })
const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl text-sm"

// ── Template picker modal ─────────────────────────────────────────────────────
function TemplatePicker({ onSelect, onClose }: { onSelect: (t: Template) => void; onClose: () => void }) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState("")

  useEffect(() => {
    fetch("/api/owner/plan-templates?type=WORKOUT")
      .then(r => r.json()).then(d => setTemplates(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = templates.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.goal ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[hsl(220_25%_8%)] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-white font-semibold text-sm">Choose a Template</h3>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-4 py-3 border-b border-white/6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
              className="w-full bg-white/4 border border-white/8 rounded-xl pl-9 pr-4 h-9 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-primary" />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white/3 rounded-xl animate-pulse" />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-white/25 text-sm">No templates found</div>
          ) : filtered.map(t => (
            <button key={t.id} onClick={() => onSelect(t)}
              className="w-full text-left p-4 rounded-xl bg-white/3 border border-white/6 hover:border-primary/30 hover:bg-primary/5 transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium group-hover:text-primary transition-colors">{t.title}</p>
                  {t.goal && <p className="text-white/40 text-xs mt-0.5">🎯 {t.goal}</p>}
                  <p className="text-white/25 text-xs mt-1">by {t.createdBy.fullName} · {t.usageCount} uses</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {t.difficulty && <span className={`text-xs px-2 py-0.5 rounded-full ${DIFF_COLORS[t.difficulty] ?? ""}`}>{t.difficulty}</span>}
                  {t.isGlobal && <span className="text-xs bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full">Global</span>}
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Plan form ─────────────────────────────────────────────────────────────────
function PlanForm({ mode, form, setForm, weekPlan, setWeekPlan, gyms, members, activeDay, setActiveDay, onSubmit, onCancel, saving, onOpenTemplates, onSaveTemplate }: any) {
  const addExercise    = () => setWeekPlan((p: WeekPlan) => ({ ...p, [activeDay]: [...(p[activeDay] ?? []), emptyExercise()] }))
  const removeExercise = (day: string, idx: number) => setWeekPlan((p: WeekPlan) => ({ ...p, [day]: p[day].filter((_: any, i: number) => i !== idx) }))
  const updateExercise = (day: string, idx: number, field: keyof Exercise, val: string) =>
    setWeekPlan((p: WeekPlan) => { const u = [...(p[day] ?? [])]; u[idx] = { ...u[idx], [field]: val }; return { ...p, [day]: u } })

  const totalExercises = DAYS.reduce((s, d) => s + (weekPlan[d]?.length ?? 0), 0)

  return (
    <div className="bg-[hsl(220_25%_9%)] border border-primary/20 rounded-2xl p-6 mb-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-white font-semibold text-base">{mode === "edit" ? "Edit Workout Plan" : "Create Workout Plan"}</h3>
          <p className="text-white/40 text-xs mt-0.5">{totalExercises} exercise{totalExercises !== 1 ? "s" : ""} added across the week</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onOpenTemplates} type="button"
            className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-1.5 transition-all">
            <Sparkles className="w-3 h-3" /> Use Template
          </button>
          <button onClick={onCancel} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Toggles */}
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { key: "freeForAll", label: "Free for All Members", sub: "Visible to all gym members" },
            { key: "isTemplate", label: "Save as Template", sub: "Reuse this plan later" },
          ].map(({ key, label, sub }) => (
            <div key={key} className="flex items-center justify-between p-3.5 bg-white/4 rounded-xl border border-white/6">
              <div>
                <p className="text-white text-xs font-medium">{label}</p>
                <p className="text-white/40 text-[11px] mt-0.5">{sub}</p>
              </div>
              <button type="button" onClick={() => setForm((p: any) => ({ ...p, [key]: !p[key] }))}
                className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${form[key] ? "bg-primary" : "bg-white/15"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form[key] ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-white/55 text-xs">Gym</Label>
            <select value={form.gymId} onChange={e => setForm((p: any) => ({ ...p, gymId: e.target.value, memberId: "" }))}
              className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary">
              {gyms.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/55 text-xs">Assign to Member</Label>
            <select value={form.memberId} disabled={form.freeForAll}
              onChange={e => setForm((p: any) => ({ ...p, memberId: e.target.value }))}
              className={`w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary ${form.freeForAll ? "opacity-40 cursor-not-allowed" : ""}`}>
              <option value="">All members / No assignment</option>
              {members.map((m: any) => <option key={m.id} value={m.id}>{m.profile?.fullName ?? m.id}</option>)}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: "title", label: "Plan Title *", placeholder: "e.g. 4-Week Fat Loss" },
            { key: "goal",  label: "Goal",          placeholder: "e.g. Weight loss" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1.5 sm:col-span-1">
              <Label className="text-white/55 text-xs">{label}</Label>
              <Input value={form[key]} onChange={e => setForm((p: any) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className={inp} />
            </div>
          ))}
          <div className="space-y-1.5">
            <Label className="text-white/55 text-xs">Difficulty</Label>
            <select value={form.difficulty} onChange={e => setForm((p: any) => ({ ...p, difficulty: e.target.value }))}
              className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary">
              {["BEGINNER","INTERMEDIATE","ADVANCED"].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/55 text-xs">Week Starting</Label>
            <Input type="date" value={form.weekStartDate} onChange={e => setForm((p: any) => ({ ...p, weekStartDate: e.target.value }))} className={inp} />
          </div>
        </div>

        {/* Day tabs */}
        <div className="space-y-3">
          <div className="grid grid-cols-7 border-b border-white/8">
            {DAYS.map(d => {
              const count = weekPlan[d]?.length ?? 0
              return (
                <button key={d} type="button" onClick={() => setActiveDay(d)}
                  className={`py-2.5 text-sm font-medium transition-all border-b-2 relative ${activeDay === d ? "border-primary text-primary" : "border-transparent text-white/40 hover:text-white/70"}`}>
                  {d}
                  {count > 0 && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />}
                </button>
              )
            })}
          </div>
          <p className="text-white/25 text-xs">{FULL_DAYS[activeDay]} exercises</p>
          <div className="space-y-3 min-h-20">
            {(weekPlan[activeDay] ?? []).length === 0 ? (
              <div className="text-center py-8 text-white/25">
                <Dumbbell className="w-7 h-7 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No exercises for {FULL_DAYS[activeDay]}</p>
                <p className="text-xs mt-1 text-white/15">Click "+ Add Exercise" below</p>
              </div>
            ) : (weekPlan[activeDay] ?? []).map((ex: Exercise, idx: number) => (
              <div key={idx} className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-white/25 text-xs font-mono w-5">{idx + 1}.</span>
                  <Input value={ex.name} onChange={e => updateExercise(activeDay, idx, "name", e.target.value)} placeholder="Exercise name (e.g. Bench Press)"
                    className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-9 rounded-xl text-sm" />
                  <button type="button" onClick={() => removeExercise(activeDay, idx)} className="text-white/20 hover:text-red-400 shrink-0 transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(["sets","reps","duration","notes"] as (keyof Exercise)[]).map(f => (
                    <div key={f} className="space-y-1">
                      <p className="text-white/35 text-xs capitalize">{f === "duration" ? "Duration" : f}</p>
                      <Input value={ex[f]} onChange={e => updateExercise(activeDay, idx, f, e.target.value)}
                        placeholder={f === "duration" ? "30s" : f === "notes" ? "e.g. squeeze at top" : "3"}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-8 rounded-lg text-xs" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addExercise}
            className="w-full py-3 rounded-xl border border-dashed border-white/15 text-white/40 hover:border-primary/40 hover:text-primary/70 transition-all text-sm flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Exercise to {FULL_DAYS[activeDay]}
          </button>
        </div>

        <div className="flex flex-wrap justify-between gap-3 pt-2">
          <button type="button" onClick={onSaveTemplate}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors">
            <Save className="w-3.5 h-3.5" /> Save as Template
          </button>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onCancel} className="border-white/10 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 h-10 text-sm">Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-linear-to-r from-primary to-orange-400 hover:opacity-90 text-white font-semibold h-10 text-sm px-7">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : mode === "edit" ? "Save Changes" : "Create Plan"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WorkoutsPage() {
  const { toast } = useToast()
  const [plans, setPlans]     = useState<Plan[]>([])
  const [gyms, setGyms]       = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formMode, setFormMode]     = useState<"create"|"edit"|null>(null)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [saving, setSaving]         = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [activeDay, setActiveDay]   = useState("Mon")
  const [weekPlan, setWeekPlan]     = useState<WeekPlan>({})
  const [searchQ, setSearchQ]       = useState("")

  const blankForm = { gymId: "", allGyms: false, memberId: "", freeForAll: false, isTemplate: false, title: "", description: "", goal: "", difficulty: "BEGINNER", weekStartDate: new Date().toISOString().split("T")[0] }
  const [form, setForm] = useState(blankForm)

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/owner/workouts").then(r => r.json()),
      fetch("/api/owner/gyms").then(r => r.json()),
    ]).then(([p, g]) => {
      setPlans(Array.isArray(p) ? p : [])
      setGyms(g)
      if (g.length > 0) setForm(prev => ({ ...prev, gymId: g[0].id }))
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!form.gymId || form.allGyms) { setMembers([]); return }
    fetch(`/api/owner/members?gymId=${form.gymId}&status=ACTIVE`)
      .then(r => r.json()).then(d => setMembers(Array.isArray(d.members) ? d.members : []))
  }, [form.gymId, form.allGyms])

  const openCreate = () => {
    setEditingPlan(null)
    setForm({ ...blankForm, gymId: gyms[0]?.id ?? "" })
    setWeekPlan({})
    setActiveDay("Mon")
    setFormMode("create")
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50)
  }

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan)

    setForm({
      gymId: gyms[0]?.id ?? "", 
      allGyms: false,
      memberId: plan.assignedMember?.id ?? "", 
      freeForAll: plan.isGlobal,
      isTemplate: plan.isTemplate, 
      title: plan.title, 
      description: plan.description ?? "",
      goal: plan.goal ?? "", 
      difficulty: plan.difficulty,
      weekStartDate: plan.weekStartDate?.split("T")[0] ?? new Date().toISOString().split("T")[0],
    })
    const wp: WeekPlan = {}
    DAYS.forEach(d => { if (plan.planData?.[d]) wp[d] = plan.planData[d] })
    setWeekPlan(wp)
    setActiveDay("Mon")
    setFormMode("edit")
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50)
  }

  const handleCancel = () => {
    setFormMode(null); 
    setEditingPlan(null); 
    setWeekPlan({})
    setForm({ ...blankForm, gymId: gyms[0]?.id ?? "" })
  }

  // Apply template data to the current form
  const applyTemplate = (t: Template) => {
    setWeekPlan(t.planData ?? {})
    setForm((p: any) => ({
      ...p,
      title:      p.title || t.title,
      goal:       p.goal  || (t.goal ?? ""),
      difficulty: t.difficulty ?? p.difficulty,
    }))
    setShowTemplates(false)
    toast({ variant: "success", title: `Template "${t.title}" applied!`, description: "Exercises loaded — customise as needed." })
    // Increment usage count
    fetch("/api/owner/plan-templates/use-count", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateId: t.id })
    }).catch(() => {})
  }

  const saveAsTemplate = async () => {
    if (!form.title.trim()) { toast({ variant: "destructive", title: "Add a plan title first" }); return }
    const res = await fetch("/api/owner/plan-templates", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gymId: form.gymId || null, type: "WORKOUT",
        title: form.title, goal: form.goal, difficulty: form.difficulty, planData: weekPlan,
      }),
    })
    if (res.ok) toast({ variant: "success", title: "Saved as template!", description: "You can reuse this plan anytime." })
    else        toast({ variant: "destructive", title: "Failed to save template" })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast({ variant: "destructive", title: "Plan title is required" }); return }
    setSaving(true)
    const isEdit = formMode === "edit" && editingPlan
    const res = await fetch(
      isEdit ? `/api/owner/workouts/${editingPlan.id}` : "/api/owner/workouts",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gymId: form.gymId, title: form.title, description: form.description,
          goal: form.goal, difficulty: form.difficulty, durationWeeks: 1,
          isGlobal: form.freeForAll, isTemplate: form.isTemplate,
          assignedToMemberId: (!form.freeForAll && form.memberId) ? form.memberId : null,
          weekStartDate: form.weekStartDate, planData: weekPlan,
        }),
      }
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
    const res = await fetch(`/api/owner/workouts/${id}`, { method: "DELETE" })
    if (res.ok) { toast({ variant: "success", title: "Plan archived" }); load() }
  }

  const filtered = plans.filter(p =>
    p.title.toLowerCase().includes(searchQ.toLowerCase()) ||
    (p.goal ?? "").toLowerCase().includes(searchQ.toLowerCase())
  )

  return (
    <div className="max-w-6xl">
      <PageHeader title="Workout Plans" subtitle={`${plans.length} plan${plans.length !== 1 ? "s" : ""}`}
        action={{ label: "Create Plan", onClick: openCreate, icon: Plus }} />

      {showTemplates && <TemplatePicker onSelect={applyTemplate} onClose={() => setShowTemplates(false)} />}

      {formMode && (
        <PlanForm
          mode={formMode} form={form} setForm={setForm}
          weekPlan={weekPlan} setWeekPlan={setWeekPlan}
          gyms={gyms} members={members}
          activeDay={activeDay} setActiveDay={setActiveDay}
          onSubmit={submit} onCancel={handleCancel} saving={saving}
          onOpenTemplates={() => setShowTemplates(true)}
          onSaveTemplate={saveAsTemplate}
        />
      )}

      {!formMode && (
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search plans by title or goal..."
            className="w-full bg-[hsl(220_25%_9%)] border border-white/8 rounded-xl pl-10 pr-4 h-10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-primary" />
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-white/3 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No workout plans yet"
          description="Create plans and assign to members, or use a template to get started quickly."
          action={{ label: "Create Plan", href: "#" }} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
            const totalEx = DAYS.reduce((s, d) => s + ((p.planData?.[d])?.length ?? 0), 0)
            return (
              <div key={p.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 hover:border-white/12 transition-all flex flex-col">
                <Link href={`/owner/workouts/${p.id}`} className="flex flex-col flex-1 mb-3">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${DIFF_COLORS[p.difficulty] ?? "bg-white/8 text-white/40"}`}>{p.difficulty}</span>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {p.isGlobal && <span className="text-xs bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full">All Members</span>}
                      {p.isTemplate && <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">Template</span>}
                    </div>
                  </div>
                  <h3 className="text-white font-semibold mb-1 flex-1">{p.title}</h3>
                  {p.goal && <p className="text-primary/70 text-xs mb-1">🎯 {p.goal}</p>}
                  <p className="text-white/25 text-xs mb-3">{totalEx} exercise{totalEx !== 1 ? "s" : ""} · {DAYS.filter(d => p.planData?.[d]?.length > 0).length} active days</p>
                  <div className="flex items-center justify-between text-xs text-white/35 border-t border-white/5 pt-3">
                    <span>{p.gym?.name}</span>
                    {p.assignedMember
                      ? <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.assignedMember.profile.fullName}</span>
                      : <span className="text-white/25">Unassigned</span>
                    }
                  </div>
                </Link>
                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <button onClick={() => openEdit(p)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-primary hover:text-primary/80 py-1.5 transition-colors">
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => {
                    setForm({ ...blankForm, gymId: gyms[0]?.id ?? "", title: `${p.title} (copy)`, goal: p.goal ?? "", difficulty: p.difficulty })
                    setWeekPlan(p.planData ?? {})
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


// src/app/owner/workouts/page.tsx
// "use client"

// import { useEffect, useState } from "react"
// import { PageHeader } from "@/components/owner/PageHeader"
// import { EmptyState } from "@/components/owner/EmptyState"
// import { useToast } from "@/hooks/use-toast"
// import { ClipboardList, Plus, Users, X, Loader2, Dumbbell, Edit, Trash2 } from "lucide-react"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Button } from "@/components/ui/button"

// interface Plan {
//   id: string; title: string; description: string | null; goal: string | null
//   difficulty: string; durationWeeks: number; isTemplate: boolean; isGlobal: boolean
//   weekStartDate: string | null; createdAt: string; planData: any
//   assignedMember: { id: string; profile: { fullName: string; avatarUrl: string | null } } | null
//   creator: { fullName: string }
//   gym: { name: string }
// }

// const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
// const DIFF_COLORS: Record<string, string> = {
//   BEGINNER: "bg-green-500/15 text-green-400",
//   INTERMEDIATE: "bg-yellow-500/15 text-yellow-400",
//   ADVANCED: "bg-red-500/15 text-red-400",
// }

// interface Exercise { name: string; sets: string; reps: string; duration: string; notes: string }
// type WeekPlan = Record<string, Exercise[]>

// const emptyExercise = (): Exercise => ({ name: "", sets: "", reps: "", duration: "", notes: "" })

// // Defined outside component to prevent re-renders
// const PlanForm = ({
//   mode, form, setForm, weekPlan, setWeekPlan, gyms, members, activeDay, setActiveDay,
//   onSubmit, onCancel, saving
// }: any) => {
//   const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl text-sm"

//   const addExercise = () => setWeekPlan((p: WeekPlan) => ({ ...p, [activeDay]: [...(p[activeDay] ?? []), emptyExercise()] }))
//   const removeExercise = (day: string, idx: number) => setWeekPlan((p: WeekPlan) => ({ ...p, [day]: (p[day] ?? []).filter((_: any, i: number) => i !== idx) }))
//   const updateExercise = (day: string, idx: number, field: keyof Exercise, val: string) =>
//     setWeekPlan((p: WeekPlan) => { const u = [...(p[day] ?? [])]; u[idx] = { ...u[idx], [field]: val }; return { ...p, [day]: u } })

//   return (
//     <div className="bg-[hsl(220_25%_9%)] border border-primary/20 rounded-2xl p-6 mb-6 space-y-5">
//       <div className="flex items-start justify-between">
//         <div>
//           <h3 className="text-white font-semibold text-base">{mode === "edit" ? "Edit Workout Plan" : "Create Workout Plan"}</h3>
//           <p className="text-white/40 text-xs mt-0.5">Build a weekly workout schedule</p>
//         </div>
//         <button onClick={onCancel} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
//       </div>

//       <form onSubmit={onSubmit} className="space-y-5">
//         {/* Free for all toggle */}
//         <div className="flex items-center justify-between p-4 bg-white/4 rounded-xl border border-white/6">
//           <div>
//             <p className="text-white text-sm font-medium">Free Plan for All Members</p>
//             <p className="text-white/40 text-xs mt-0.5">Make this plan available to all gym members</p>
//           </div>
//           <button type="button" onClick={() => setForm((p: any) => ({ ...p, freeForAll: !p.freeForAll, memberId: "" }))}
//             className={`relative w-11 h-6 rounded-full transition-colors ${form.freeForAll ? "bg-primary" : "bg-white/15"}`}>
//             <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.freeForAll ? "left-6" : "left-1"}`} />
//           </button>
//         </div>

//         <div className="grid grid-cols-2 gap-4 items-end">
//           <div className="space-y-1.5">
//             <div className="flex items-center justify-between">
//               <Label className="text-white/55 text-sm">Target Gym</Label>
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <span className="text-white/40 text-xs">All Gyms</span>
//                 <button type="button" onClick={() => setForm((p: any) => ({ ...p, allGyms: !p.allGyms, memberId: "" }))}
//                   className={`relative w-9 h-5 rounded-full transition-colors ${form.allGyms ? "bg-primary" : "bg-white/15"}`}>
//                   <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.allGyms ? "left-4" : "left-0.5"}`} />
//                 </button>
//               </label>
//             </div>
//             <select value={form.gymId} disabled={form.allGyms} onChange={e => setForm((p: any) => ({ ...p, gymId: e.target.value, memberId: "" }))}
//               className={`w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary ${form.allGyms ? "opacity-40 cursor-not-allowed" : ""}`}>
//               {gyms.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
//             </select>
//           </div>
//           <div className="space-y-1.5">
//             <Label className="text-white/55 text-sm">Member</Label>
//             <select value={form.memberId} disabled={form.freeForAll || form.allGyms}
//               onChange={e => setForm((p: any) => ({ ...p, memberId: e.target.value }))}
//               className={`w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary ${(form.freeForAll || form.allGyms) ? "opacity-40 cursor-not-allowed" : ""}`}>
//               <option value="">Select member</option>
//               {members.map((m: any) => <option key={m.id} value={m.id}>{m.profile?.fullName ?? m.id}</option>)}
//             </select>
//           </div>
//         </div>

//         <div className="grid grid-cols-2 gap-4">
//           <div className="space-y-1.5">
//             <Label className="text-white/55 text-sm">Plan Title <span className="text-primary">*</span></Label>
//             <Input value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))} placeholder="e.g. 4-Week Fat Loss" className={inp} />
//           </div>
//           <div className="space-y-1.5">
//             <Label className="text-white/55 text-sm">Goal</Label>
//             <Input value={form.goal} onChange={e => setForm((p: any) => ({ ...p, goal: e.target.value }))} placeholder="e.g. Weight loss" className={inp} />
//           </div>
//           <div className="space-y-1.5">
//             <Label className="text-white/55 text-sm">Difficulty</Label>
//             <select value={form.difficulty} onChange={e => setForm((p: any) => ({ ...p, difficulty: e.target.value }))}
//               className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary">
//               {["BEGINNER","INTERMEDIATE","ADVANCED"].map(d => <option key={d} value={d}>{d}</option>)}
//             </select>
//           </div>
//           <div className="space-y-1.5">
//             <Label className="text-white/55 text-sm">Week Starting</Label>
//             <Input type="date" value={form.weekStartDate} onChange={e => setForm((p: any) => ({ ...p, weekStartDate: e.target.value }))} className={inp} />
//           </div>
//         </div>

//         {/* Day tabs */}
//         <div className="space-y-3">
//           <div className="grid grid-cols-7 border-b border-white/8">
//             {DAYS.map(d => (
//               <button key={d} type="button" onClick={() => setActiveDay(d)}
//                 className={`py-2.5 text-sm font-medium transition-all border-b-2 ${activeDay === d ? "border-primary text-primary" : "border-transparent text-white/40 hover:text-white/70"}`}>{d}</button>
//             ))}
//           </div>
//           <div className="space-y-3 min-h-20">
//             {(weekPlan[activeDay] ?? []).length === 0 ? (
//               <div className="text-center py-8 text-white/25"><Dumbbell className="w-7 h-7 mx-auto mb-2 opacity-40" /><p className="text-sm">No exercises for {activeDay}</p></div>
//             ) : (weekPlan[activeDay] ?? []).map((ex: Exercise, idx: number) => (
//               <div key={idx} className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-3">
//                 <div className="flex items-center gap-2">
//                   <Input value={ex.name} onChange={e => updateExercise(activeDay, idx, "name", e.target.value)} placeholder="Exercise name"
//                     className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-9 rounded-xl text-sm" />
//                   <button type="button" onClick={() => removeExercise(activeDay, idx)} className="text-white/20 hover:text-red-400 shrink-0"><X className="w-4 h-4" /></button>
//                 </div>
//                 <div className="grid grid-cols-3 gap-2">
//                   {(["sets","reps","duration"] as (keyof Exercise)[]).map(f => (
//                     <div key={f} className="space-y-1">
//                       <p className="text-white/35 text-xs capitalize">{f}</p>
//                       <Input value={ex[f]} onChange={e => updateExercise(activeDay, idx, f, e.target.value)}
//                         placeholder={f === "duration" ? "30s" : "3"}
//                         className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-8 rounded-lg text-xs" />
//                     </div>
//                   ))}
//                 </div>
//                 <Input value={ex.notes} onChange={e => updateExercise(activeDay, idx, "notes", e.target.value)} placeholder="Notes (optional)"
//                   className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-8 rounded-xl text-xs" />
//               </div>
//             ))}
//           </div>
//           <button type="button" onClick={addExercise}
//             className="w-full py-3 rounded-xl border border-dashed border-white/15 text-white/40 hover:border-primary/40 hover:text-primary/70 transition-all text-sm flex items-center justify-center gap-2">
//             <Plus className="w-4 h-4" /> Add Exercise
//           </button>
//         </div>

//         <div className="flex justify-end gap-3 pt-2">
//           <Button type="button" variant="outline" onClick={onCancel} className="border-white/10 text-white/60 hover:text-white h-10 text-sm">Cancel</Button>
//           <Button type="submit" disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-10 text-sm px-7">
//             {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : mode === "edit" ? "Save Changes" : "Create Plan"}
//           </Button>
//         </div>
//       </form>
//     </div>
//   )
// }

// export default function WorkoutsPage() {
//   const { toast } = useToast()
//   const [plans, setPlans]     = useState<Plan[]>([])
//   const [gyms, setGyms]       = useState<any[]>([])
//   const [members, setMembers] = useState<any[]>([])
//   const [loading, setLoading] = useState(true)
//   const [formMode, setFormMode] = useState<"create"|"edit"|null>(null)
//   const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
//   const [saving, setSaving]   = useState(false)
//   const [activeDay, setActiveDay] = useState("Mon")
//   const [weekPlan, setWeekPlan] = useState<WeekPlan>({})

//   const blankForm = { gymId: "", allGyms: false, memberId: "", freeForAll: false, title: "", description: "", goal: "", difficulty: "BEGINNER", weekStartDate: new Date().toISOString().split("T")[0] }
//   const [form, setForm] = useState(blankForm)

//   const load = () => {
//     Promise.all([
//       fetch("/api/owner/workouts").then(r => r.json()),
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

//   const openCreate = () => {
//     setEditingPlan(null)
//     setForm({ ...blankForm, gymId: gyms[0]?.id ?? "" })
//     setWeekPlan({})
//     setActiveDay("Mon")
//     setFormMode("create")
//   }

//   const openEdit = (plan: Plan) => {
//     setEditingPlan(plan)
//     // Reconstruct form state from plan
//     const isGlobal = plan.isGlobal
//     const memberId = plan.assignedMember?.id ?? ""
//     setForm({
//       gymId: gyms[0]?.id ?? "",
//       allGyms: false,
//       memberId,
//       freeForAll: isGlobal,
//       title: plan.title,
//       description: plan.description ?? "",
//       goal: plan.goal ?? "",
//       difficulty: plan.difficulty,
//       weekStartDate: plan.weekStartDate ? plan.weekStartDate.split("T")[0] : new Date().toISOString().split("T")[0],
//     })
//     // Restore week plan from planData
//     const pd = plan.planData ?? {}
//     const wp: WeekPlan = {}
//     DAYS.forEach(d => { if (pd[d]) wp[d] = pd[d] })
//     setWeekPlan(wp)
//     setActiveDay("Mon")
//     setFormMode("edit")
//     window.scrollTo({ top: 0, behavior: "smooth" })
//   }

//   const handleCancel = () => {
//     setFormMode(null)
//     setEditingPlan(null)
//     setWeekPlan({})
//     setForm({ ...blankForm, gymId: gyms[0]?.id ?? "" })
//   }

//   const submit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!form.title.trim()) { toast({ variant: "destructive", title: "Plan title is required" }); return }
//     setSaving(true)

//     const payload = {
//       gymId: form.allGyms ? gyms[0]?.id : form.gymId,
//       title: form.title, description: form.description, goal: form.goal,
//       difficulty: form.difficulty, durationWeeks: 1,
//       isGlobal: form.allGyms || form.freeForAll,
//       isTemplate: false,
//       assignedToMemberId: (!form.freeForAll && !form.allGyms && form.memberId) ? form.memberId : null,
//       weekStartDate: form.weekStartDate,
//       planData: weekPlan,
//     }

//     const isEdit = formMode === "edit" && editingPlan
//     const res = await fetch(
//       isEdit ? `/api/owner/workouts/${editingPlan.id}` : "/api/owner/workouts",
//       { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
//     )

//     if (res.ok) {
//       toast({ variant: "success", title: isEdit ? "Plan updated!" : "Workout plan created!" })
//       handleCancel()
//       load()
//     } else {
//       toast({ variant: "destructive", title: isEdit ? "Failed to update plan" : "Failed to create plan" })
//     }
//     setSaving(false)
//   }

//   const deletePlan = async (id: string) => {
//     if (!confirm("Archive this workout plan? Members won't be able to see it.")) return
//     const res = await fetch(`/api/owner/workouts/${id}`, { method: "DELETE" })
//     if (res.ok) { toast({ variant: "success", title: "Plan archived" }); load() }
//   }

//   return (
//     <div className="max-w-6xl">
//       <PageHeader title="Workout Plans" subtitle={`${plans.length} plan${plans.length !== 1 ? "s" : ""} created`}
//         action={{ label: "Create Plan", onClick: openCreate, icon: Plus }} />

//       {formMode && (
//         <PlanForm
//           mode={formMode} form={form} setForm={setForm}
//           weekPlan={weekPlan} setWeekPlan={setWeekPlan}
//           gyms={gyms} members={members}
//           activeDay={activeDay} setActiveDay={setActiveDay}
//           onSubmit={submit} onCancel={handleCancel} saving={saving}
//         />
//       )}

//       {loading ? (
//         <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-white/3 rounded-2xl animate-pulse" />)}
//         </div>
//       ) : plans.length === 0 ? (
//         <EmptyState icon={ClipboardList} title="No workout plans yet"
//           description="Create your first workout plan and assign it to members."
//           action={{ label: "Create Plan", href: "#" }} />
//       ) : (
//         <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           {plans.map(p => (
//             <div key={p.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 hover:border-white/12 transition-colors">
//               <div className="flex items-start justify-between mb-3">
//                 <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${DIFF_COLORS[p.difficulty] ?? ""}`}>{p.difficulty}</span>
//                 <div className="flex gap-1.5 flex-wrap justify-end">
//                   {p.isGlobal && <span className="text-xs bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full">All Members</span>}
//                 </div>
//               </div>
//               <h3 className="text-white font-semibold mb-1">{p.title}</h3>
//               {p.goal && <p className="text-primary/70 text-xs mb-2">Goal: {p.goal}</p>}
//               {p.weekStartDate && <p className="text-white/30 text-xs mb-2">Week of {new Date(p.weekStartDate).toLocaleDateString("en-IN")}</p>}
//               <div className="flex items-center justify-between text-xs text-white/35 border-t border-white/5 pt-3 mt-3">
//                 <span>{p.durationWeeks}w plan</span>
//                 {p.assignedMember
//                   ? <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.assignedMember.profile.fullName}</span>
//                   : <span className="text-white/25">Unassigned</span>
//                 }
//               </div>
//               {/* Edit / Delete */}
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
//}


// src/app/owner/workouts/page.tsx
// "use client"

// import { useSubscription } from "@/contexts/SubscriptionContext"
// import { PlanGate } from "@/components/owner/PlanGate"
// import { PageHeader } from "@/components/owner/PageHeader"
// import { useEffect, useState } from "react"
// import { useToast } from "@/hooks/use-toast"
// import { ClipboardList, Plus, Loader2, Users, ChevronDown } from "lucide-react"

// interface Plan { id: string; title: string; goal: string | null; difficulty: string; durationWeeks: number; isGlobal: boolean; gym: { name: string }; assignedMember: { profile: { fullName: string } } | null }

// function WorkoutsContent() {
//   const { toast } = useToast()
//   const [plans, setPlans] = useState<Plan[]>([])
//   const [gyms, setGyms] = useState<{ id: string; name: string }[]>([])
//   const [gymId, setGymId] = useState("")
//   const [loading, setLoading] = useState(true)
//   const [showForm, setShowForm] = useState(false)
//   const [saving, setSaving] = useState(false)
//   const [form, setForm] = useState({ gymId: "", title: "", goal: "", difficulty: "BEGINNER", durationWeeks: "4", isGlobal: false })

//   const load = () => {
//     setLoading(true)
//     const p = new URLSearchParams()
//     if (gymId) p.set("gymId", gymId)
//     fetch(`/api/owner/workouts?${p}`).then(r => r.json()).then(setPlans).catch(() => { }).finally(() => setLoading(false))
//   }
//   useEffect(() => {
//     fetch("/api/owner/gyms").then(r => r.json()).then(g => { if (Array.isArray(g)) { setGyms(g); if (g[0]) setGymId(g[0].id) } })
//   }, [])
//   useEffect(() => { load() }, [gymId])

//   const save = async () => {
//     if (!form.gymId || !form.title.trim()) { toast({ variant: "destructive", title: "Gym and title required" }); return }
//     setSaving(true)
//     const res = await fetch("/api/owner/workouts", {
//       method: "POST", headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ ...form, durationWeeks: parseInt(form.durationWeeks) }),
//     })
//     const d = await res.json()
//     if (res.ok) { toast({ variant: "success", title: "Workout plan created!" }); setShowForm(false); load() }
//     else toast({ variant: "destructive", title: d.error ?? "Failed" })
//     setSaving(false)
//   }

//   return (
//     <div className="space-y-5">
//       <div className="flex flex-wrap items-center gap-3">
//         {gyms.length > 1 && (
//           <div className="relative">
//             <select value={gymId} onChange={e => setGymId(e.target.value)}
//               className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white/70 rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none cursor-pointer">
//               {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
//             </select>
//             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
//           </div>
//         )}
//         <button onClick={() => { setForm(f => ({ ...f, gymId: gymId || gyms[0]?.id || "" })); setShowForm(true) }}
//           className="ml-auto flex items-center gap-2 bg-gradient-to-r from-primary to-orange-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90">
//           <Plus className="w-4 h-4" /> New Plan
//         </button>
//       </div>

//       {showForm && (
//         <div className="bg-[hsl(220_25%_9%)] border border-white/8 rounded-2xl p-5 space-y-4">
//           <h3 className="text-white font-semibold text-sm">New Workout Plan</h3>
//           <div className="grid sm:grid-cols-2 gap-4">
//             <div>
//               <label className="text-white/50 text-xs mb-1 block">Gym *</label>
//               <select value={form.gymId} onChange={e => setForm(f => ({ ...f, gymId: e.target.value }))}
//                 className="w-full appearance-none bg-[hsl(220_25%_13%)] border border-white/10 text-white rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary/50">
//                 <option value="">Select gym</option>
//                 {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
//               </select>
//             </div>
//             <div>
//               <label className="text-white/50 text-xs mb-1 block">Title *</label>
//               <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
//                 className="w-full bg-[hsl(220_25%_13%)] border border-white/10 text-white rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary/50" />
//             </div>
//             <div>
//               <label className="text-white/50 text-xs mb-1 block">Goal</label>
//               <input value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
//                 placeholder="e.g. Weight loss, Muscle gain"
//                 className="w-full bg-[hsl(220_25%_13%)] border border-white/10 text-white rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary/50" />
//             </div>
//             <div>
//               <label className="text-white/50 text-xs mb-1 block">Difficulty</label>
//               <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
//                 className="w-full appearance-none bg-[hsl(220_25%_13%)] border border-white/10 text-white rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary/50">
//                 {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map(d => <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>)}
//               </select>
//             </div>
//             <div>
//               <label className="text-white/50 text-xs mb-1 block">Duration (weeks)</label>
//               <input type="number" min="1" value={form.durationWeeks} onChange={e => setForm(f => ({ ...f, durationWeeks: e.target.value }))}
//                 className="w-full bg-[hsl(220_25%_13%)] border border-white/10 text-white rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary/50" />
//             </div>
//             <div className="flex items-center gap-3 pt-5">
//               <input type="checkbox" id="isGlobal" checked={form.isGlobal} onChange={e => setForm(f => ({ ...f, isGlobal: e.target.checked }))}
//                 className="w-4 h-4 accent-primary" />
//               <label htmlFor="isGlobal" className="text-white/60 text-sm">Make visible to all members</label>
//             </div>
//           </div>
//           <div className="flex gap-3">
//             <button onClick={save} disabled={saving}
//               className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50">
//               {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Plan
//             </button>
//             <button onClick={() => setShowForm(false)} className="text-white/40 text-sm px-4 py-2.5 rounded-xl hover:bg-white/5">Cancel</button>
//           </div>
//         </div>
//       )}

//       {loading ? (
//         <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
//       ) : plans.length === 0 ? (
//         <div className="text-center py-16 text-white/30">
//           <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
//           <p>No workout plans yet. Create your first one.</p>
//         </div>
//       ) : (
//         <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           {plans.map(p => (
//             <div key={p.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4 space-y-3">
//               <div className="flex items-start justify-between">
//                 <div>
//                   <p className="text-white font-semibold text-sm">{p.title ?? "Untitled Plan"}</p>
//                   <p className="text-white/40 text-xs">{p.gym.name}</p>
//                 </div>
//                 <span className={`text-[10px] px-2 py-0.5 rounded-full border ${p.difficulty === "ADVANCED" ? "bg-red-500/10 text-red-400 border-red-500/20"
//                     : p.difficulty === "INTERMEDIATE" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
//                       : "bg-green-500/10 text-green-400 border-green-500/20"
//                   }`}>{p.difficulty}</span>
//               </div>
//               {p.goal && <p className="text-white/50 text-xs">{p.goal}</p>}
//               <div className="flex items-center justify-between text-xs text-white/35">
//                 <span>{p.durationWeeks} weeks</span>
//                 {p.assignedMember ? (
//                   <span className="flex items-center gap-1"><Users className="w-3 h-3" />{p.assignedMember.profile.fullName}</span>
//                 ) : p.isGlobal ? (
//                   <span className="text-primary/70">Global</span>
//                 ) : null}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   )
// }

// export default function WorkoutsPage() {
//   const { hasWorkoutPlans, isExpired } = useSubscription()
//   return (
//     <div className="max-w-5xl space-y-6">
//       <PageHeader title="Workout Plans" subtitle="Create and assign workout programmes to members" />
//       <PlanGate allowed={hasWorkoutPlans && !isExpired} featureLabel="Workout Plan Creation">
//         <WorkoutsContent />
//       </PlanGate>
//     </div>
//   )
// }
// // src/app/owner/workouts/page.tsx
// "use client"

// import { useEffect, useState } from "react"
// import { PageHeader } from "@/components/owner/PageHeader"
// import { EmptyState } from "@/components/owner/EmptyState"
// import { useToast } from "@/hooks/use-toast"
// import { ClipboardList, Plus, Users, X, Loader2, Dumbbell, ChevronDown } from "lucide-react"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Button } from "@/components/ui/button"

// interface Plan {
//   id: string; title: string; description: string | null; goal: string | null
//   difficulty: string; durationWeeks: number; isTemplate: boolean; isGlobal: boolean
//   weekStartDate: string | null; createdAt: string
//   assignedMember: { profile: { fullName: string } } | null
//   creator: { fullName: string }
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

// export default function WorkoutsPage() {
//   const { toast } = useToast()
//   const [plans, setPlans]   = useState<Plan[]>([])
//   const [gyms, setGyms]     = useState<any[]>([])
//   const [members, setMembers] = useState<any[]>([])
//   const [loading, setLoading] = useState(true)
//   const [showForm, setShowForm] = useState(false)
//   const [saving, setSaving]   = useState(false)
//   const [activeDay, setActiveDay] = useState("Mon")
//   const [weekPlan, setWeekPlan] = useState<WeekPlan>({})

//   const [form, setForm] = useState({
//     gymId: "", allGyms: false,
//     memberId: "", freeForAll: false,
//     title: "", description: "", goal: "",
//     difficulty: "BEGINNER", weekStartDate: new Date().toISOString().split("T")[0],
//   })

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

//   // Load members when gym changes
//   useEffect(() => {
//     if (!form.gymId || form.allGyms) { setMembers([]); return }
//     fetch(`/api/owner/members?gymId=${form.gymId}&page=1`)
//       .then(r => r.json())
//       .then(d => setMembers(Array.isArray(d.members) ? d.members : []))
//   }, [form.gymId, form.allGyms])

//   const addExercise = () => {
//     setWeekPlan(p => ({ ...p, [activeDay]: [...(p[activeDay] ?? []), emptyExercise()] }))
//   }

//   const removeExercise = (day: string, idx: number) => {
//     setWeekPlan(p => ({ ...p, [day]: (p[day] ?? []).filter((_, i) => i !== idx) }))
//   }

//   const updateExercise = (day: string, idx: number, field: keyof Exercise, val: string) => {
//     setWeekPlan(p => {
//       const updated = [...(p[day] ?? [])]
//       updated[idx] = { ...updated[idx], [field]: val }
//       return { ...p, [day]: updated }
//     })
//   }

//   const submit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!form.title.trim()) { toast({ variant: "destructive", title: "Plan title is required" }); return }
//     if (!form.allGyms && !form.gymId) { toast({ variant: "destructive", title: "Please select a gym" }); return }

//     setSaving(true)
//     const planData = weekPlan // Store day-keyed exercises in planData JSON
//     const res = await fetch("/api/owner/workouts", {
//       method: "POST", headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         gymId: form.allGyms ? gyms[0]?.id : form.gymId,
//         title: form.title, description: form.description, goal: form.goal,
//         difficulty: form.difficulty,
//         durationWeeks: 1,
//         isGlobal: form.allGyms || form.freeForAll,
//         isTemplate: false,
//         assignedToMemberId: (!form.freeForAll && !form.allGyms && form.memberId) ? form.memberId : null,
//         weekStartDate: form.weekStartDate,
//         planData,
//       }),
//     })
//     if (res.ok) {
//       toast({ variant: "success", title: "Workout plan created!" })
//       setShowForm(false)
//       setWeekPlan({})
//       setForm(p => ({ ...p, title: "", description: "", goal: "", memberId: "", freeForAll: false, allGyms: false }))
//       load()
//     } else toast({ variant: "destructive", title: "Failed to create plan" })
//     setSaving(false)
//   }

//   const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl text-sm"

//   return (
//     <div className="max-w-6xl">
//       <PageHeader title="Workout Plans" subtitle={`${plans.length} plan${plans.length !== 1 ? "s" : ""} created`}
//         action={{ label: "Create Plan", onClick: () => setShowForm(true), icon: Plus }} />

//       {/* ── Create Form ── */}
//       {showForm && (
//         <div className="bg-[hsl(220_25%_9%)] border border-primary/20 rounded-2xl p-6 mb-6 space-y-5">
//           <div className="flex items-start justify-between">
//             <div>
//               <h3 className="text-white font-semibold text-base">Create Workout Plan</h3>
//               <p className="text-white/40 text-xs mt-0.5">Create a weekly workout plan</p>
//             </div>
//             <button onClick={() => { setShowForm(false); setWeekPlan({}) }} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
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

//             {/* Gym row */}
//             <div className="grid grid-cols-2 gap-4 items-end">
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
//                 <select value={form.gymId} disabled={form.allGyms}
//                   onChange={e => setForm(p => ({ ...p, gymId: e.target.value, memberId: "" }))}
//                   className={`w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary ${form.allGyms ? "opacity-40 cursor-not-allowed" : ""}`}>
//                   {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
//                 </select>
//               </div>
//               <div className="space-y-1.5">
//                 <Label className="text-white/55 text-sm">Member</Label>
//                 <select value={form.memberId}
//                   disabled={form.freeForAll || form.allGyms}
//                   onChange={e => setForm(p => ({ ...p, memberId: e.target.value }))}
//                   className={`w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary ${(form.freeForAll || form.allGyms) ? "opacity-40 cursor-not-allowed" : ""}`}>
//                   <option value="">Select member</option>
//                   {members.map((m: any) => (
//                     <option key={m.id} value={m.id}>{m.profile?.fullName ?? m.id}</option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             {/* Plan details */}
//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-1.5">
//                 <Label className="text-white/55 text-sm">Plan Title <span className="text-primary">*</span></Label>
//                 <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
//                   placeholder="e.g. 4-Week Fat Loss" className={inp} />
//               </div>
//               <div className="space-y-1.5">
//                 <Label className="text-white/55 text-sm">Goal</Label>
//                 <Input value={form.goal} onChange={e => setForm(p => ({ ...p, goal: e.target.value }))}
//                   placeholder="e.g. Weight loss, Muscle gain" className={inp} />
//               </div>
//               <div className="space-y-1.5">
//                 <Label className="text-white/55 text-sm">Difficulty</Label>
//                 <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
//                   className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary">
//                   {["BEGINNER","INTERMEDIATE","ADVANCED"].map(d => <option key={d} value={d}>{d}</option>)}
//                 </select>
//               </div>
//               <div className="space-y-1.5">
//                 <Label className="text-white/55 text-sm">Week Starting</Label>
//                 <Input type="date" value={form.weekStartDate} onChange={e => setForm(p => ({ ...p, weekStartDate: e.target.value }))} className={inp} />
//               </div>
//             </div>

//             {/* Day tabs */}
//             <div className="space-y-3">
//               <div className="grid grid-cols-7 border-b border-white/8">
//                 {DAYS.map(d => (
//                   <button key={d} type="button" onClick={() => setActiveDay(d)}
//                     className={`py-2.5 text-sm font-medium transition-all border-b-2 ${
//                       activeDay === d
//                         ? "border-primary text-primary"
//                         : "border-transparent text-white/40 hover:text-white/70"
//                     }`}>{d}</button>
//                 ))}
//               </div>

//               {/* Exercises for active day */}
//               <div className="space-y-3 min-h-20">
//                 {(weekPlan[activeDay] ?? []).length === 0 ? (
//                   <div className="text-center py-8 text-white/25">
//                     <Dumbbell className="w-7 h-7 mx-auto mb-2 opacity-40" />
//                     <p className="text-sm">No exercises for {activeDay}</p>
//                   </div>
//                 ) : (
//                   (weekPlan[activeDay] ?? []).map((ex, idx) => (
//                     <div key={idx} className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-3">
//                       <div className="flex items-center gap-2">
//                         <Input value={ex.name} onChange={e => updateExercise(activeDay, idx, "name", e.target.value)}
//                           placeholder="Exercise name (e.g. Bench Press)"
//                           className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-9 rounded-xl text-sm" />
//                         <button type="button" onClick={() => removeExercise(activeDay, idx)}
//                           className="text-white/20 hover:text-red-400 transition-colors shrink-0">
//                           <X className="w-4 h-4" />
//                         </button>
//                       </div>
//                       <div className="grid grid-cols-3 gap-2">
//                         {[["sets","Sets"],["reps","Reps"],["duration","Duration"]].map(([field, label]) => (
//                           <div key={field} className="space-y-1">
//                             <p className="text-white/35 text-xs">{label}</p>
//                             <Input value={(ex as any)[field]}
//                               onChange={e => updateExercise(activeDay, idx, field as keyof Exercise, e.target.value)}
//                               placeholder={field === "duration" ? "e.g. 30s" : "e.g. 3"}
//                               className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-8 rounded-lg text-xs" />
//                           </div>
//                         ))}
//                       </div>
//                       <Input value={ex.notes} onChange={e => updateExercise(activeDay, idx, "notes", e.target.value)}
//                         placeholder="Notes (optional)"
//                         className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-8 rounded-xl text-xs" />
//                     </div>
//                   ))
//                 )}
//               </div>

//               {/* Add exercise button */}
//               <button type="button" onClick={addExercise}
//                 className="w-full py-3 rounded-xl border border-dashed border-white/15 text-white/40 hover:border-primary/40 hover:text-primary/70 transition-all text-sm flex items-center justify-center gap-2">
//                 <Plus className="w-4 h-4" /> Add Exercise
//               </button>
//             </div>

//             <div className="flex justify-end gap-3 pt-2">
//               <Button type="button" variant="outline" onClick={() => { setShowForm(false); setWeekPlan({}) }}
//                 className="border-white/10 text-white/60 hover:text-white h-10 text-sm">Cancel</Button>
//               <Button type="submit" disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-10 text-sm px-7">
//                 {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create Plan"}
//               </Button>
//             </div>
//           </form>
//         </div>
//       )}

//       {/* ── Plan Cards ── */}
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
//                   {p.isTemplate && <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">Template</span>}
//                   {p.isGlobal && <span className="text-xs bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full">All Members</span>}
//                 </div>
//               </div>
//               <h3 className="text-white font-semibold mb-1">{p.title}</h3>
//               {p.goal && <p className="text-primary/70 text-xs mb-2">Goal: {p.goal}</p>}
//               {p.description && <p className="text-white/40 text-xs mb-3 line-clamp-2">{p.description}</p>}
//               {p.weekStartDate && <p className="text-white/30 text-xs mb-2">Week of {new Date(p.weekStartDate).toLocaleDateString("en-IN")}</p>}
//               <div className="flex items-center justify-between text-xs text-white/35 border-t border-white/5 pt-3 mt-3">
//                 <span>{p.durationWeeks}w plan</span>
//                 {p.assignedMember
//                   ? <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.assignedMember.profile.fullName}</span>
//                   : <span className="text-white/25">Unassigned</span>
//                 }
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   )
// }


// src/app/owner/workouts/page.tsx
"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/owner/PageHeader"
import { EmptyState } from "@/components/owner/EmptyState"
import { useToast } from "@/hooks/use-toast"
import { ClipboardList, Plus, Users, X, Loader2, Dumbbell, Edit, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface Plan {
  id: string; title: string; description: string | null; goal: string | null
  difficulty: string; durationWeeks: number; isTemplate: boolean; isGlobal: boolean
  weekStartDate: string | null; createdAt: string; planData: any
  assignedMember: { id: string; profile: { fullName: string; avatarUrl: string | null } } | null
  creator: { fullName: string }
  gym: { name: string }
}

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
const DIFF_COLORS: Record<string, string> = {
  BEGINNER: "bg-green-500/15 text-green-400",
  INTERMEDIATE: "bg-yellow-500/15 text-yellow-400",
  ADVANCED: "bg-red-500/15 text-red-400",
}

interface Exercise { name: string; sets: string; reps: string; duration: string; notes: string }
type WeekPlan = Record<string, Exercise[]>

const emptyExercise = (): Exercise => ({ name: "", sets: "", reps: "", duration: "", notes: "" })

// Defined outside component to prevent re-renders
const PlanForm = ({
  mode, form, setForm, weekPlan, setWeekPlan, gyms, members, activeDay, setActiveDay,
  onSubmit, onCancel, saving
}: any) => {
  const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl text-sm"

  const addExercise = () => setWeekPlan((p: WeekPlan) => ({ ...p, [activeDay]: [...(p[activeDay] ?? []), emptyExercise()] }))
  const removeExercise = (day: string, idx: number) => setWeekPlan((p: WeekPlan) => ({ ...p, [day]: (p[day] ?? []).filter((_: any, i: number) => i !== idx) }))
  const updateExercise = (day: string, idx: number, field: keyof Exercise, val: string) =>
    setWeekPlan((p: WeekPlan) => { const u = [...(p[day] ?? [])]; u[idx] = { ...u[idx], [field]: val }; return { ...p, [day]: u } })

  return (
    <div className="bg-[hsl(220_25%_9%)] border border-primary/20 rounded-2xl p-6 mb-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-white font-semibold text-base">{mode === "edit" ? "Edit Workout Plan" : "Create Workout Plan"}</h3>
          <p className="text-white/40 text-xs mt-0.5">Build a weekly workout schedule</p>
        </div>
        <button onClick={onCancel} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Free for all toggle */}
        <div className="flex items-center justify-between p-4 bg-white/4 rounded-xl border border-white/6">
          <div>
            <p className="text-white text-sm font-medium">Free Plan for All Members</p>
            <p className="text-white/40 text-xs mt-0.5">Make this plan available to all gym members</p>
          </div>
          <button type="button" onClick={() => setForm((p: any) => ({ ...p, freeForAll: !p.freeForAll, memberId: "" }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.freeForAll ? "bg-primary" : "bg-white/15"}`}>
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.freeForAll ? "left-6" : "left-1"}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 items-end">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-white/55 text-sm">Target Gym</Label>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-white/40 text-xs">All Gyms</span>
                <button type="button" onClick={() => setForm((p: any) => ({ ...p, allGyms: !p.allGyms, memberId: "" }))}
                  className={`relative w-9 h-5 rounded-full transition-colors ${form.allGyms ? "bg-primary" : "bg-white/15"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.allGyms ? "left-4" : "left-0.5"}`} />
                </button>
              </label>
            </div>
            <select value={form.gymId} disabled={form.allGyms} onChange={e => setForm((p: any) => ({ ...p, gymId: e.target.value, memberId: "" }))}
              className={`w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary ${form.allGyms ? "opacity-40 cursor-not-allowed" : ""}`}>
              {gyms.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/55 text-sm">Member</Label>
            <select value={form.memberId} disabled={form.freeForAll || form.allGyms}
              onChange={e => setForm((p: any) => ({ ...p, memberId: e.target.value }))}
              className={`w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary ${(form.freeForAll || form.allGyms) ? "opacity-40 cursor-not-allowed" : ""}`}>
              <option value="">Select member</option>
              {members.map((m: any) => <option key={m.id} value={m.id}>{m.profile?.fullName ?? m.id}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-white/55 text-sm">Plan Title <span className="text-primary">*</span></Label>
            <Input value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))} placeholder="e.g. 4-Week Fat Loss" className={inp} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/55 text-sm">Goal</Label>
            <Input value={form.goal} onChange={e => setForm((p: any) => ({ ...p, goal: e.target.value }))} placeholder="e.g. Weight loss" className={inp} />
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
            <Input type="date" value={form.weekStartDate} onChange={e => setForm((p: any) => ({ ...p, weekStartDate: e.target.value }))} className={inp} />
          </div>
        </div>

        {/* Day tabs */}
        <div className="space-y-3">
          <div className="grid grid-cols-7 border-b border-white/8">
            {DAYS.map(d => (
              <button key={d} type="button" onClick={() => setActiveDay(d)}
                className={`py-2.5 text-sm font-medium transition-all border-b-2 ${activeDay === d ? "border-primary text-primary" : "border-transparent text-white/40 hover:text-white/70"}`}>{d}</button>
            ))}
          </div>
          <div className="space-y-3 min-h-20">
            {(weekPlan[activeDay] ?? []).length === 0 ? (
              <div className="text-center py-8 text-white/25"><Dumbbell className="w-7 h-7 mx-auto mb-2 opacity-40" /><p className="text-sm">No exercises for {activeDay}</p></div>
            ) : (weekPlan[activeDay] ?? []).map((ex: Exercise, idx: number) => (
              <div key={idx} className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Input value={ex.name} onChange={e => updateExercise(activeDay, idx, "name", e.target.value)} placeholder="Exercise name"
                    className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-9 rounded-xl text-sm" />
                  <button type="button" onClick={() => removeExercise(activeDay, idx)} className="text-white/20 hover:text-red-400 shrink-0"><X className="w-4 h-4" /></button>
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
                <Input value={ex.notes} onChange={e => updateExercise(activeDay, idx, "notes", e.target.value)} placeholder="Notes (optional)"
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
          <Button type="button" variant="outline" onClick={onCancel} className="border-white/10 text-white/60 hover:text-white h-10 text-sm">Cancel</Button>
          <Button type="submit" disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-10 text-sm px-7">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : mode === "edit" ? "Save Changes" : "Create Plan"}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function WorkoutsPage() {
  const { toast } = useToast()
  const [plans, setPlans]     = useState<Plan[]>([])
  const [gyms, setGyms]       = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formMode, setFormMode] = useState<"create"|"edit"|null>(null)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [saving, setSaving]   = useState(false)
  const [activeDay, setActiveDay] = useState("Mon")
  const [weekPlan, setWeekPlan] = useState<WeekPlan>({})

  const blankForm = { gymId: "", allGyms: false, memberId: "", freeForAll: false, title: "", description: "", goal: "", difficulty: "BEGINNER", weekStartDate: new Date().toISOString().split("T")[0] }
  const [form, setForm] = useState(blankForm)

  const load = () => {
    Promise.all([
      fetch("/api/owner/workouts").then(r => r.json()),
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
      .then(r => r.json()).then(d => setMembers(Array.isArray(d.members) ? d.members : []))
  }, [form.gymId, form.allGyms])

  const openCreate = () => {
    setEditingPlan(null)
    setForm({ ...blankForm, gymId: gyms[0]?.id ?? "" })
    setWeekPlan({})
    setActiveDay("Mon")
    setFormMode("create")
  }

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan)
    // Reconstruct form state from plan
    const isGlobal = plan.isGlobal
    const memberId = plan.assignedMember?.id ?? ""
    setForm({
      gymId: gyms[0]?.id ?? "",
      allGyms: false,
      memberId,
      freeForAll: isGlobal,
      title: plan.title,
      description: plan.description ?? "",
      goal: plan.goal ?? "",
      difficulty: plan.difficulty,
      weekStartDate: plan.weekStartDate ? plan.weekStartDate.split("T")[0] : new Date().toISOString().split("T")[0],
    })
    // Restore week plan from planData
    const pd = plan.planData ?? {}
    const wp: WeekPlan = {}
    DAYS.forEach(d => { if (pd[d]) wp[d] = pd[d] })
    setWeekPlan(wp)
    setActiveDay("Mon")
    setFormMode("edit")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCancel = () => {
    setFormMode(null)
    setEditingPlan(null)
    setWeekPlan({})
    setForm({ ...blankForm, gymId: gyms[0]?.id ?? "" })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast({ variant: "destructive", title: "Plan title is required" }); return }
    setSaving(true)

    const payload = {
      gymId: form.allGyms ? gyms[0]?.id : form.gymId,
      title: form.title, description: form.description, goal: form.goal,
      difficulty: form.difficulty, durationWeeks: 1,
      isGlobal: form.allGyms || form.freeForAll,
      isTemplate: false,
      assignedToMemberId: (!form.freeForAll && !form.allGyms && form.memberId) ? form.memberId : null,
      weekStartDate: form.weekStartDate,
      planData: weekPlan,
    }

    const isEdit = formMode === "edit" && editingPlan
    const res = await fetch(
      isEdit ? `/api/owner/workouts/${editingPlan.id}` : "/api/owner/workouts",
      { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
    )

    if (res.ok) {
      toast({ variant: "success", title: isEdit ? "Plan updated!" : "Workout plan created!" })
      handleCancel()
      load()
    } else {
      toast({ variant: "destructive", title: isEdit ? "Failed to update plan" : "Failed to create plan" })
    }
    setSaving(false)
  }

  const deletePlan = async (id: string) => {
    if (!confirm("Archive this workout plan? Members won't be able to see it.")) return
    const res = await fetch(`/api/owner/workouts/${id}`, { method: "DELETE" })
    if (res.ok) { toast({ variant: "success", title: "Plan archived" }); load() }
  }

  return (
    <div className="max-w-6xl">
      <PageHeader title="Workout Plans" subtitle={`${plans.length} plan${plans.length !== 1 ? "s" : ""} created`}
        action={{ label: "Create Plan", onClick: openCreate, icon: Plus }} />

      {formMode && (
        <PlanForm
          mode={formMode} form={form} setForm={setForm}
          weekPlan={weekPlan} setWeekPlan={setWeekPlan}
          gyms={gyms} members={members}
          activeDay={activeDay} setActiveDay={setActiveDay}
          onSubmit={submit} onCancel={handleCancel} saving={saving}
        />
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-white/3 rounded-2xl animate-pulse" />)}
        </div>
      ) : plans.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No workout plans yet"
          description="Create your first workout plan and assign it to members."
          action={{ label: "Create Plan", href: "#" }} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(p => (
            <div key={p.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 hover:border-white/12 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${DIFF_COLORS[p.difficulty] ?? ""}`}>{p.difficulty}</span>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {p.isGlobal && <span className="text-xs bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full">All Members</span>}
                </div>
              </div>
              <h3 className="text-white font-semibold mb-1">{p.title}</h3>
              {p.goal && <p className="text-primary/70 text-xs mb-2">Goal: {p.goal}</p>}
              {p.weekStartDate && <p className="text-white/30 text-xs mb-2">Week of {new Date(p.weekStartDate).toLocaleDateString("en-IN")}</p>}
              <div className="flex items-center justify-between text-xs text-white/35 border-t border-white/5 pt-3 mt-3">
                <span>{p.durationWeeks}w plan</span>
                {p.assignedMember
                  ? <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.assignedMember.profile.fullName}</span>
                  : <span className="text-white/25">Unassigned</span>
                }
              </div>
              {/* Edit / Delete */}
              <div className="flex gap-2 pt-3 mt-1 border-t border-white/5">
                <button onClick={() => openEdit(p)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-primary hover:text-primary/80 py-1.5 transition-colors">
                  <Edit className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => deletePlan(p.id)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 py-1.5 transition-colors">
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
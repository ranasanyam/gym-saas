// src/app/trainer/members/[memberId]/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Phone, Calendar, Weight, Ruler, Clock,
  Loader2, X, Plus, Activity,
  TrendingUp, TrendingDown, Minus, User2, MapPin,
  Dumbbell, UtensilsCrossed, Flame,
} from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

const TABS = ["Profile", "Body Metrics", "Attendance", "Workout Plans", "Diet Plans"]

const STATUS_STYLE: Record<string, string> = {
  ACTIVE:    "bg-green-500/15 text-green-400",
  EXPIRED:   "bg-red-500/15 text-red-400",
  SUSPENDED: "bg-yellow-500/15 text-yellow-400",
}

const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white focus:border-primary focus-visible:ring-0 h-10 rounded-xl text-sm"

function BodyMetricsTab({ memberId }: { memberId: string }) {
  const { toast } = useToast()
  const [metrics,   setMetrics]   = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [form, setForm] = useState({
    recordedAt: new Date().toISOString().split("T")[0],
    weightKg: "", bodyFatPct: "", muscleMassKg: "", bmi: "",
    chestCm: "", waistCm: "", hipsCm: "", notes: "",
  })

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/trainer/members/${memberId}/body-metrics`)
      .then(r => r.json())
      .then(d => setMetrics(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [memberId])
  useEffect(() => { load() }, [load])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/trainer/members/${memberId}/body-metrics`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    })
    if (res.ok) {
      toast({ variant: "success", title: "Body metric added!" })
      setShowForm(false)
      setForm({ recordedAt: new Date().toISOString().split("T")[0], weightKg: "", bodyFatPct: "", muscleMassKg: "", bmi: "", chestCm: "", waistCm: "", hipsCm: "", notes: "" })
      load()
    } else toast({ variant: "destructive", title: "Failed to save metric" })
    setSaving(false)
  }

  const trendIcon = (curr: number | null, prev: number | null, lowerIsBetter = false) => {
    if (curr == null || prev == null) return null
    const diff = curr - prev
    if (Math.abs(diff) < 0.01) return { Icon: Minus, color: "text-white/40", label: "—" }
    const improving = lowerIsBetter ? diff < 0 : diff > 0
    return improving
      ? { Icon: TrendingUp,   color: "text-green-400", label: `${diff > 0 ? "+" : ""}${diff.toFixed(1)}` }
      : { Icon: TrendingDown, color: "text-red-400",   label: `${diff > 0 ? "+" : ""}${diff.toFixed(1)}` }
  }

  const latest = metrics[0]
  const prev   = metrics[1]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Body Metrics</h3>
        <Button onClick={() => setShowForm(s => !s)} size="sm"
          className="bg-gradient-primary text-white h-9 px-4 text-sm gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Entry
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-[hsl(220_25%_9%)] border border-primary/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-semibold text-sm">New Body Metric Entry</h4>
            <button type="button" onClick={() => setShowForm(false)} className="text-white/30 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-white/55 text-xs">Date <span className="text-primary">*</span></Label>
              <Input type="date" value={form.recordedAt}
                onChange={e => setForm(p => ({ ...p, recordedAt: e.target.value }))}
                className={inp} required />
            </div>
            {([
              ["weightKg","Weight (kg)"],["bodyFatPct","Body Fat (%)"],
              ["muscleMassKg","Muscle Mass (kg)"],["bmi","BMI"],
              ["chestCm","Chest (cm)"],["waistCm","Waist (cm)"],["hipsCm","Hips (cm)"],
            ] as [keyof typeof form, string][]).map(([field, label]) => (
              <div key={field} className="space-y-1.5">
                <Label className="text-white/55 text-xs">{label}</Label>
                <Input type="number" step="0.01" value={form[field]}
                  onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                  placeholder="—" className={inp} />
              </div>
            ))}
            <div className="col-span-2 space-y-1.5">
              <Label className="text-white/55 text-xs">Notes</Label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={2} placeholder="Optional notes…"
                className="w-full bg-[hsl(220_25%_11%)] border border-white/10 rounded-xl text-white text-sm p-3 focus:outline-none focus:border-primary resize-none placeholder:text-white/20" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}
              className="border-white/10 text-white/60 hover:text-white bg-transparent flex-1 h-10">Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-gradient-primary text-white flex-1 h-10">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Entry"}
            </Button>
          </div>
        </form>
      )}

      {latest && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <p className="text-white/40 text-xs mb-3">
            Latest — {new Date(latest.recordedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              ["Weight",      latest.weightKg,    prev?.weightKg,    "kg", true ],
              ["Body Fat",    latest.bodyFatPct,   prev?.bodyFatPct,  "%",  true ],
              ["Muscle Mass", latest.muscleMassKg, prev?.muscleMassKg,"kg", false],
              ["BMI",         latest.bmi,          prev?.bmi,         "",   true ],
              ["Chest",       latest.chestCm,      prev?.chestCm,     "cm", false],
              ["Waist",       latest.waistCm,      prev?.waistCm,     "cm", true ],
              ["Hips",        latest.hipsCm,       prev?.hipsCm,      "cm", false],
            ] as [string, number|null, number|null, string, boolean][]).map(([label, curr, prevVal, unit, lb]) => {
              if (curr == null) return null
              const t = trendIcon(curr, prevVal, lb)
              return (
                <div key={label} className="bg-white/3 rounded-xl p-3">
                  <p className="text-white/40 text-[10px] mb-1">{label}</p>
                  <p className="text-white font-semibold text-lg">
                    {Number(curr).toFixed(1)}<span className="text-white/40 text-xs ml-0.5">{unit}</span>
                  </p>
                  {t && (
                    <div className={`flex items-center gap-1 mt-1 ${t.color}`}>
                      <t.Icon className="w-3 h-3" /><span className="text-[10px]">{t.label}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-white/3 rounded-xl animate-pulse" />)}</div>
      ) : metrics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl">
          <Activity className="w-8 h-8 text-white/15" />
          <p className="text-white/30 text-sm">No body metrics recorded yet</p>
          <button onClick={() => setShowForm(true)} className="text-primary text-sm hover:underline">Add first entry</button>
        </div>
      ) : (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-5 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
            <span>Date</span><span>Weight</span><span>Body Fat</span><span>Muscle</span><span>BMI</span>
          </div>
          <div className="divide-y divide-white/4">
            {metrics.map((m: any) => (
              <div key={m.id} className="grid grid-cols-5 px-5 py-3.5 text-sm">
                <span className="text-white/50 text-xs">{new Date(m.recordedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                <span className="text-white/70">{m.weightKg != null ? `${Number(m.weightKg).toFixed(1)} kg` : "—"}</span>
                <span className="text-white/70">{m.bodyFatPct != null ? `${Number(m.bodyFatPct).toFixed(1)}%` : "—"}</span>
                <span className="text-white/70">{m.muscleMassKg != null ? `${Number(m.muscleMassKg).toFixed(1)} kg` : "—"}</span>
                <span className="text-white/70">{m.bmi != null ? Number(m.bmi).toFixed(1) : "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function TrainerMemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const router       = useRouter()
  const { toast }    = useToast()

  const [member,  setMember]  = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState("Profile")

  const load = useCallback(() => {
    fetch(`/api/trainer/members/${memberId}`)
      .then(r => r.json())
      .then(setMember)
      .finally(() => setLoading(false))
  }, [memberId])
  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  )
  if (!member) return <div className="text-white/40 text-center py-20">Member not found</div>

  const daysLeft  = member.endDate ? Math.ceil((new Date(member.endDate).getTime() - Date.now()) / 86400000) : null
  const isExpired = member.status === "EXPIRED" || (daysLeft !== null && daysLeft < 0)

  return (
    <div className="max-w-5xl">
      {/* Back */}
      <div className="flex items-center gap-4 mb-5">
        <button onClick={() => router.push("/trainer/members")}
          className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-all shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-display font-bold text-white">{member.profile.fullName}</h2>
          <p className="text-white/40 text-sm mt-0.5">Member at {member.gym.name}</p>
        </div>
      </div>

      {/* Hero card */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 mb-5">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-5">
            <Avatar name={member.profile.fullName} url={member.profile.avatarUrl} size={80} />
            <div>
              <h3 className="text-white font-semibold text-lg">{member.profile.fullName}</h3>
              <p className="text-white/40 text-sm">{member.profile.email}</p>
              {member.profile.mobileNumber && <p className="text-white/40 text-sm">{member.profile.mobileNumber}</p>}
            </div>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_STYLE[member.status] ?? STATUS_STYLE.EXPIRED}`}>
            {member.status}
          </span>
        </div>

        <div className="bg-white/4 rounded-xl px-5 py-3 grid grid-cols-3 text-center gap-2">
          <div>
            <p className="text-white/35 text-xs mb-1">Plan</p>
            <p className="text-white/80 text-sm truncate">{member.membershipPlan?.name ?? "—"}</p>
          </div>
          <div className="border-x border-white/10">
            <p className="text-white/35 text-xs mb-1">Joined</p>
            <p className="text-white/80 text-sm">{new Date(member.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
          <div>
            <p className="text-white/35 text-xs mb-1">Expires</p>
            <p className={`text-sm ${isExpired ? "text-red-400" : daysLeft !== null && daysLeft <= 7 ? "text-yellow-400" : "text-white/80"}`}>
              {member.endDate ? (isExpired ? "Expired" : `${daysLeft}d left`) : "No expiry"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/4 rounded-full p-1 w-full mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-xs w-full font-medium transition-all ${tab === t ? "bg-gradient-primary text-white shadow" : "text-white/40 hover:text-white/70"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ───────────────────────────────────────────────────── */}
      {tab === "Profile" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
          <div className="space-y-0">
            {[
              [Phone,    "text-green-400",  "Phone Number",  member.profile.mobileNumber],
              [User2,    "text-blue-400",   "Gender",        member.profile.gender?.toUpperCase()],
              [Calendar, "text-primary",    "Date of Birth", member.profile.dateOfBirth ? new Date(member.profile.dateOfBirth).toLocaleDateString("en-IN", { dateStyle: "medium" }) : null],
              [MapPin,   "text-blue-400",   "City",          member.profile.city],
              [Ruler,    "text-blue-400",   "Height",        member.heightCm ? `${Number(member.heightCm)} cm` : null],
              [Weight,   "text-blue-400",   "Weight",        member.weightKg ? `${Number(member.weightKg)} kg` : null],
            ].filter(([,,, v]) => v).map(([Icon, color, label, value]: any) => (
              <div key={label} className="flex items-start gap-3 py-4 border-b border-white/6 last:border-0">
                <Icon className={`w-4 h-4 ${color} mt-0.5 shrink-0`} />
                <div className="flex justify-between w-full">
                  <p className="text-white/35 text-xs">{label}</p>
                  <p className="text-white/80 text-sm">{value}</p>
                </div>
              </div>
            ))}
            {member.medicalNotes && (
              <div className="pt-4 mt-2">
                <p className="text-white/35 text-xs mb-1">Medical Notes</p>
                <p className="text-white/60 text-sm">{member.medicalNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Body Metrics Tab ─────────────────────────────────────────────── */}
      {tab === "Body Metrics" && <BodyMetricsTab memberId={memberId} />}

      {/* ── Attendance Tab ───────────────────────────────────────────────── */}
      {tab === "Attendance" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
          {member.attendance.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-8 h-8 mx-auto mb-2 text-white/15" />
              <p className="text-white/30 text-sm">No attendance records yet</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
                <span>Check In</span><span>Check Out</span><span>Duration</span>
              </div>
              <div className="divide-y divide-white/4">
                {member.attendance.map((a: any) => {
                  const d = a.checkOutTime ? Math.round((new Date(a.checkOutTime).getTime() - new Date(a.checkInTime).getTime()) / 60000) : null
                  return (
                    <div key={a.id} className="grid grid-cols-3 px-5 py-4 text-sm">
                      <span className="text-white/70">{new Date(a.checkInTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                      <span className="text-white/50">{a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString("en-IN", { timeStyle: "short" }) : <span className="text-green-400">In gym</span>}</span>
                      <span className="text-white/50">{d ? `${Math.floor(d/60)}h ${d%60}m` : "—"}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Workout Plans Tab ────────────────────────────────────────────── */}
      {tab === "Workout Plans" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link href={`/trainer/workouts?memberId=${memberId}`}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">
              <Plus className="w-4 h-4" /> Create Workout Plan
            </Link>
          </div>
          {member.workoutPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl">
              <Dumbbell className="w-8 h-8 text-white/15" />
              <p className="text-white/30 text-sm">No workout plans from you yet</p>
              <Link href={`/trainer/workouts?memberId=${memberId}`} className="text-primary text-sm hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Create one now
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {member.workoutPlans.map((p: any) => (
                <Link key={p.id} href={`/trainer/workouts/${p.id}`}
                  className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 hover:border-white/12 transition-all group">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-white font-semibold group-hover:text-primary transition-colors">{p.title}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      p.difficulty === "BEGINNER"     ? "bg-green-500/15 text-green-400"
                      : p.difficulty === "INTERMEDIATE" ? "bg-yellow-500/15 text-yellow-400"
                      : "bg-red-500/15 text-red-400"
                    }`}>{p.difficulty}</span>
                  </div>
                  {p.goal && <p className="text-white/40 text-sm">🎯 {p.goal}</p>}
                  <p className="text-white/25 text-xs mt-2">{new Date(p.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Diet Plans Tab ───────────────────────────────────────────────── */}
      {tab === "Diet Plans" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link href={`/trainer/diets?memberId=${memberId}`}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">
              <Plus className="w-4 h-4" /> Create Diet Plan
            </Link>
          </div>
          {member.dietPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl">
              <UtensilsCrossed className="w-8 h-8 text-white/15" />
              <p className="text-white/30 text-sm">No diet plans from you yet</p>
              <Link href={`/trainer/diets?memberId=${memberId}`} className="text-primary text-sm hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Create one now
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {member.dietPlans.map((p: any) => (
                <Link key={p.id} href={`/trainer/diets/${p.id}`}
                  className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 hover:border-white/12 transition-all group">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-white font-semibold group-hover:text-primary transition-colors">{p.title}</h4>
                    {p.caloriesTarget && (
                      <span className="flex items-center gap-1 text-orange-400 text-xs shrink-0 font-semibold">
                        <Flame className="w-3 h-3" />{p.caloriesTarget} kcal
                      </span>
                    )}
                  </div>
                  {p.goal && <p className="text-white/40 text-sm">🎯 {p.goal}</p>}
                  {(p.proteinG || p.carbsG || p.fatG) && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {p.proteinG && <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">P {p.proteinG}g</span>}
                      {p.carbsG   && <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full">C {p.carbsG}g</span>}
                      {p.fatG     && <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">F {p.fatG}g</span>}
                    </div>
                  )}
                  <p className="text-white/25 text-xs mt-2">{new Date(p.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

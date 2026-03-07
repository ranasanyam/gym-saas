// src/app/trainer/members/[memberId]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Phone, Mail, Calendar, Weight, Ruler,
  ClipboardList, Clock, Edit, Save, X, Loader2,
  UtensilsCrossed, CheckCircle2, TrendingUp
} from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

const TABS = ["Profile", "Attendance", "Workout Plans", "Diet Plans"]

const STATUS_STYLE: Record<string, string> = {
  ACTIVE:    "bg-green-500/15 text-green-400",
  EXPIRED:   "bg-red-500/15 text-red-400",
  SUSPENDED: "bg-yellow-500/15 text-yellow-400",
}

export default function TrainerMemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const router       = useRouter()
  const { toast }    = useToast()

  const [member, setMember]   = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState("Profile")
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [editForm, setEditForm] = useState<any>({})

  const load = () => {
    fetch(`/api/trainer/members/${memberId}`)
      .then(r => r.json())
      .then(d => {
        setMember(d)
        setEditForm({
          heightCm:              d.heightCm              ?? "",
          weightKg:              d.weightKg              ?? "",
          medicalNotes:          d.medicalNotes          ?? "",
          emergencyContactName:  d.emergencyContactName  ?? "",
          emergencyContactPhone: d.emergencyContactPhone ?? "",
        })
      })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [memberId])

  const save = async () => {
    setSaving(true)
    const res = await fetch(`/api/trainer/members/${memberId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    })
    if (res.ok) { toast({ variant: "success", title: "Member updated" }); setEditing(false); load() }
    else toast({ variant: "destructive", title: "Failed to save" })
    setSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
  if (!member) return <div className="text-white/40 text-center py-20">Member not found</div>

  const daysLeft = member.endDate
    ? Math.ceil((new Date(member.endDate).getTime() - Date.now()) / 86400000)
    : null
  const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white focus:border-primary focus-visible:ring-0 h-10 rounded-xl text-sm"

  return (
    <div className="max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.back()} className="text-white/40 hover:text-white transition-colors mt-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-start gap-4">
          <Avatar name={member.profile.fullName} url={member.profile.avatarUrl} size={52} rounded="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-display font-bold text-white">{member.profile.fullName}</h2>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_STYLE[member.status] ?? STATUS_STYLE.EXPIRED}`}>
                {member.status}
              </span>
              {daysLeft !== null && daysLeft <= 7 && member.status === "ACTIVE" && (
                <span className="text-xs bg-yellow-500/15 text-yellow-400 px-2.5 py-0.5 rounded-full font-medium">
                  ⚠ {daysLeft === 0 ? "Expires today" : `${daysLeft}d left`}
                </span>
              )}
            </div>
            <p className="text-white/40 text-sm mt-0.5">{member.gym.name}</p>
          </div>
          {editing ? (
            <div className="flex items-center gap-2">
              <Button onClick={save} disabled={saving} size="sm" className="bg-gradient-primary text-white h-9 px-4 text-sm">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Save className="w-3.5 h-3.5 mr-1.5" />Save</>}
              </Button>
              <button onClick={() => setEditing(false)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button onClick={() => setEditing(true)} variant="outline" size="sm"
              className="border-white/10 text-white/60 hover:text-white h-9 text-sm gap-1.5">
              <Edit className="w-3.5 h-3.5" /> Edit
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/4 rounded-xl p-1 w-fit overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tab === t ? "bg-[hsl(220_25%_12%)] text-white shadow" : "text-white/40 hover:text-white/70"
            }`}>{t}</button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === "Profile" && (
        <div className="grid md:grid-cols-2 gap-5">
          {/* Contact */}
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 space-y-4">
            <h3 className="text-white font-semibold text-sm">Contact & Membership</h3>
            <div className="space-y-3">
              {[
                [Mail,     "Email",   member.profile.email],
                [Phone,    "Mobile",  member.profile.mobileNumber],
                [Calendar, "Joined",  new Date(member.startDate).toLocaleDateString("en-IN")],
                [Calendar, "Expires", member.endDate ? new Date(member.endDate).toLocaleDateString("en-IN") : "No expiry"],
              ].map(([Icon, label, value]: any) => value && (
                <div key={label} className="flex items-start gap-3">
                  <Icon className="w-4 h-4 text-white/25 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-white/35 text-[10px]">{label}</p>
                    <p className="text-white/75 text-sm">{value}</p>
                  </div>
                </div>
              ))}
              {member.membershipPlan && (
                <div className="mt-2 p-3 bg-primary/8 border border-primary/15 rounded-xl">
                  <p className="text-primary font-semibold text-sm">{member.membershipPlan.name}</p>
                  <p className="text-white/40 text-xs mt-0.5">{member.membershipPlan.durationMonths} month plan · ₹{Number(member.membershipPlan.price).toLocaleString("en-IN")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Health */}
          <div className="space-y-4">
            <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Health Info</h3>
              {editing ? (
                <div className="grid grid-cols-2 gap-3">
                  {[["heightCm","Height (cm)"],["weightKg","Weight (kg)"]].map(([field, label]) => (
                    <div key={field} className="space-y-1.5">
                      <Label className="text-white/50 text-xs">{label}</Label>
                      <Input type="number" value={editForm[field]}
                        onChange={e => setEditForm((p: any) => ({ ...p, [field]: e.target.value }))}
                        className={inp} />
                    </div>
                  ))}
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-white/50 text-xs">Medical Notes</Label>
                    <textarea value={editForm.medicalNotes}
                      onChange={e => setEditForm((p: any) => ({ ...p, medicalNotes: e.target.value }))}
                      rows={2} className="w-full bg-[hsl(220_25%_11%)] border border-white/10 rounded-xl text-white text-sm p-3 focus:outline-none focus:border-primary resize-none" />
                  </div>
                </div>
              ) : (
                <div className="flex gap-6">
                  <div className="flex items-center gap-2"><Ruler className="w-4 h-4 text-white/25" /><span className="text-white/60 text-sm">{member.heightCm ? `${Number(member.heightCm)} cm` : "—"}</span></div>
                  <div className="flex items-center gap-2"><Weight className="w-4 h-4 text-white/25" /><span className="text-white/60 text-sm">{member.weightKg ? `${Number(member.weightKg)} kg` : "—"}</span></div>
                </div>
              )}
              {!editing && member.medicalNotes && <p className="text-white/50 text-sm mt-3 pt-3 border-t border-white/5">{member.medicalNotes}</p>}
            </div>

            <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Emergency Contact</h3>
              {editing ? (
                <div className="space-y-3">
                  {[["emergencyContactName","Name"],["emergencyContactPhone","Phone"]].map(([field, label]) => (
                    <div key={field} className="space-y-1.5">
                      <Label className="text-white/50 text-xs">{label}</Label>
                      <Input value={editForm[field]}
                        onChange={e => setEditForm((p: any) => ({ ...p, [field]: e.target.value }))}
                        className={inp} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {member.emergencyContactName
                    ? <><p className="text-white/70">{member.emergencyContactName}</p><p className="text-white/40">{member.emergencyContactPhone}</p></>
                    : <p className="text-white/30">No emergency contact</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {tab === "Attendance" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
          {member.attendance.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No attendance records</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
                <span>Check In</span><span>Check Out</span><span>Duration</span>
              </div>
              <div className="divide-y divide-white/4">
                {member.attendance.map((a: any) => {
                  const dur = a.checkOutTime ? Math.round((new Date(a.checkOutTime).getTime() - new Date(a.checkInTime).getTime()) / 60000) : null
                  return (
                    <div key={a.id} className="grid grid-cols-3 px-5 py-4 text-sm">
                      <span className="text-white/70">{new Date(a.checkInTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                      <span className="text-white/50">{a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString("en-IN", { timeStyle: "short" }) : <span className="text-green-400">In gym</span>}</span>
                      <span className="text-white/50">{dur ? `${Math.floor(dur/60)}h ${dur%60}m` : "—"}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Workout Plans Tab */}
      {tab === "Workout Plans" && (
        <div className="space-y-3">
          {member.workoutPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl">
              <ClipboardList className="w-8 h-8 text-white/15" />
              <p className="text-white/30 text-sm">No workout plans assigned</p>
            </div>
          ) : member.workoutPlans.map((p: any) => (
            <div key={p.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-white font-semibold">{p.title}</h4>
                  {p.goal && <p className="text-white/40 text-sm mt-0.5">{p.goal}</p>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  p.difficulty === "BEGINNER" ? "bg-green-500/15 text-green-400"
                  : p.difficulty === "INTERMEDIATE" ? "bg-yellow-500/15 text-yellow-400"
                  : "bg-red-500/15 text-red-400"
                }`}>{p.difficulty}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Diet Plans Tab */}
      {tab === "Diet Plans" && (
        <div className="space-y-3">
          {member.dietPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl">
              <UtensilsCrossed className="w-8 h-8 text-white/15" />
              <p className="text-white/30 text-sm">No diet plans assigned</p>
            </div>
          ) : member.dietPlans.map((p: any) => (
            <div key={p.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
              <h4 className="text-white font-semibold">{p.title}</h4>
              {p.goal && <p className="text-white/40 text-sm mt-0.5">{p.goal}</p>}
              {p.caloriesTarget && (
                <p className="text-primary text-sm mt-2">{p.caloriesTarget} kcal / day</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
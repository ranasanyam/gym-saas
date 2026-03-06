"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/owner/PageHeader"
import { useToast } from "@/hooks/use-toast"
import {
  User, Phone, Mail, Calendar, Weight, Ruler,
  ClipboardList, CreditCard, Clock, Edit, Save, X,
  Loader2, AlertTriangle, CheckCircle
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface Member {
  id: string; status: string; startDate: string; endDate: string | null
  heightCm: number | null; weightKg: number | null
  medicalNotes: string | null; emergencyContactName: string | null; emergencyContactPhone: string | null
  profile: { fullName: string; email: string; mobileNumber: string | null; city: string | null; gender: string | null; dateOfBirth: string | null }
  gym: { id: string; name: string }
  membershipPlan: { name: string; durationMonths: number; price: number } | null
  assignedTrainer: { profile: { fullName: string } } | null
  attendance: { id: string; checkInTime: string; checkOutTime: string | null }[]
  payments: { id: string; amount: number; status: string; createdAt: string }[]
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

function InfoRow({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: any }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />}
      <div>
        <p className="text-white/35 text-xs">{label}</p>
        <p className="text-white/80 text-sm">{value}</p>
      </div>
    </div>
  )
}

const TABS = ["Profile", "Attendance", "Payments"]

export default function MemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("Profile")
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<any>({})

  const load = () => {
    fetch(`/api/owner/members/${memberId}`)
      .then(r => r.json())
      .then(d => { setMember(d); setEditForm({ status: d.status, heightCm: d.heightCm ?? "", weightKg: d.weightKg ?? "", medicalNotes: d.medicalNotes ?? "", emergencyContactName: d.emergencyContactName ?? "", emergencyContactPhone: d.emergencyContactPhone ?? "" }) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [memberId])

  const save = async () => {
    setSaving(true)
    const res = await fetch(`/api/owner/members/${memberId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm),
    })
    if (res.ok) { toast({ variant: "success", title: "Member updated" }); setEditing(false); load() }
    else toast({ variant: "destructive", title: "Failed to update" })
    setSaving(false)
  }

  const suspend = async () => {
    if (!confirm("Suspend this member?")) return
    await fetch(`/api/owner/members/${memberId}`, { method: "DELETE" })
    toast({ title: "Member suspended" })
    router.push("/owner/members")
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
  if (!member) return <div className="text-white/40 text-center py-20">Member not found</div>

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={member.profile.fullName}
        subtitle={`Member at ${member.gym.name}`}
        breadcrumb={[{ label: "Members", href: "/owner/members" }]}
        action={editing
          ? { label: saving ? "Saving..." : "Save", onClick: save, icon: Save }
          : { label: "Edit", onClick: () => setEditing(true), icon: Edit }
        }
      />

      {/* Status row */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
          member.status === "ACTIVE" ? "bg-green-500/15 text-green-400"
          : member.status === "EXPIRED" ? "bg-red-500/15 text-red-400"
          : "bg-yellow-500/15 text-yellow-400"
        }`}>{member.status}</span>
        {member.membershipPlan && (
          <span className="text-xs bg-primary/10 border border-primary/20 text-primary/80 px-3 py-1 rounded-full">
            {member.membershipPlan.name}
          </span>
        )}
        {editing && (
          <select value={editForm.status} onChange={e => setEditForm((p: any) => ({...p, status: e.target.value}))}
            className="text-xs bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1 focus:outline-none focus:border-primary">
            {["ACTIVE","EXPIRED","SUSPENDED"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <button onClick={suspend} className="ml-auto flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 transition-colors">
          <AlertTriangle className="w-3 h-3" /> Suspend
        </button>
        {editing && <button onClick={() => setEditing(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/4 rounded-xl p-1 w-fit mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-[hsl(220_25%_12%)] text-white shadow" : "text-white/40 hover:text-white/70"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === "Profile" && (
        <div className="grid md:grid-cols-2 gap-5">
          {/* Avatar + contact */}
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-bold text-xl">
                {getInitials(member.profile.fullName)}
              </div>
              <div>
                <h3 className="text-white font-semibold">{member.profile.fullName}</h3>
                <p className="text-white/40 text-sm">{member.profile.gender ?? "—"} · {member.profile.city ?? "—"}</p>
              </div>
            </div>
            <div className="space-y-3">
              <InfoRow icon={Mail} label="Email" value={member.profile.email} />
              <InfoRow icon={Phone} label="Mobile" value={member.profile.mobileNumber} />
              <InfoRow icon={Calendar} label="Start Date" value={new Date(member.startDate).toLocaleDateString("en-IN")} />
              <InfoRow icon={Calendar} label="Expiry Date" value={member.endDate ? new Date(member.endDate).toLocaleDateString("en-IN") : "No expiry"} />
              <InfoRow icon={User} label="Trainer" value={member.assignedTrainer?.profile.fullName ?? "Not assigned"} />
            </div>
          </div>

          {/* Health + emergency */}
          <div className="space-y-4">
            <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Health Info</h3>
              {editing ? (
                <div className="grid grid-cols-2 gap-3">
                  {[["heightCm","Height (cm)"],["weightKg","Weight (kg)"]].map(([field, label]) => (
                    <div key={field} className="space-y-1">
                      <Label className="text-white/50 text-xs">{label}</Label>
                      <Input type="number" value={editForm[field]} onChange={e => setEditForm((p: any)=>({...p,[field]:e.target.value}))}
                        className="bg-white/5 border-white/10 text-white focus:border-primary focus-visible:ring-0 h-9 text-sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-6">
                  <div className="flex items-center gap-2"><Ruler className="w-4 h-4 text-white/30" /><span className="text-white/60 text-sm">{member.heightCm ? `${member.heightCm} cm` : "—"}</span></div>
                  <div className="flex items-center gap-2"><Weight className="w-4 h-4 text-white/30" /><span className="text-white/60 text-sm">{member.weightKg ? `${member.weightKg} kg` : "—"}</span></div>
                </div>
              )}
              {editing ? (
                <div className="mt-3 space-y-1">
                  <Label className="text-white/50 text-xs">Medical Notes</Label>
                  <textarea value={editForm.medicalNotes} onChange={e => setEditForm((p: any)=>({...p,medicalNotes:e.target.value}))} rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-sm p-3 focus:outline-none focus:border-primary resize-none" />
                </div>
              ) : member.medicalNotes ? (
                <div className="mt-3">
                  <p className="text-white/35 text-xs mb-1">Medical Notes</p>
                  <p className="text-white/60 text-sm">{member.medicalNotes}</p>
                </div>
              ) : null}
            </div>

            <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Emergency Contact</h3>
              {editing ? (
                <div className="space-y-3">
                  {[["emergencyContactName","Name"],["emergencyContactPhone","Phone"]].map(([field, label]) => (
                    <div key={field} className="space-y-1">
                      <Label className="text-white/50 text-xs">{label}</Label>
                      <Input value={editForm[field]} onChange={e => setEditForm((p: any)=>({...p,[field]:e.target.value}))}
                        className="bg-white/5 border-white/10 text-white focus:border-primary focus-visible:ring-0 h-9 text-sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <InfoRow icon={User} label="Name" value={member.emergencyContactName} />
                  <InfoRow icon={Phone} label="Phone" value={member.emergencyContactPhone} />
                  {!member.emergencyContactName && <p className="text-white/30 text-sm">No emergency contact added</p>}
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
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No attendance records</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
                <span>Check In</span><span>Check Out</span><span>Duration</span>
              </div>
              <div className="divide-y divide-white/4">
                {member.attendance.map(a => {
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

      {/* Payments Tab */}
      {tab === "Payments" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
          {member.payments.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No payment records</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
                <span>Date</span><span>Amount</span><span>Status</span>
              </div>
              <div className="divide-y divide-white/4">
                {member.payments.map(p => (
                  <div key={p.id} className="grid grid-cols-3 px-5 py-4 text-sm items-center">
                    <span className="text-white/60">{new Date(p.createdAt).toLocaleDateString("en-IN")}</span>
                    <span className="text-white font-semibold">₹{Number(p.amount).toLocaleString("en-IN")}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium w-fit ${
                      p.status === "COMPLETED" ? "bg-green-500/15 text-green-400"
                      : p.status === "PENDING" ? "bg-yellow-500/15 text-yellow-400"
                      : "bg-red-500/15 text-red-400"
                    }`}>{p.status}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
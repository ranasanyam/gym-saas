// "use client"

// import { useEffect, useState } from "react"
// import { useParams, useRouter } from "next/navigation"
// import { PageHeader } from "@/components/owner/PageHeader"
// import { useToast } from "@/hooks/use-toast"
// import {
//   User, Phone, Mail, Calendar, Weight, Ruler,
//   ClipboardList, CreditCard, Clock, Edit, Save, X,
//   Loader2, AlertTriangle, CheckCircle
// } from "lucide-react"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Button } from "@/components/ui/button"

// interface Member {
//   id: string; status: string; startDate: string; endDate: string | null
//   heightCm: number | null; weightKg: number | null
//   medicalNotes: string | null; emergencyContactName: string | null; emergencyContactPhone: string | null
//   profile: { fullName: string; email: string; mobileNumber: string | null; city: string | null; gender: string | null; dateOfBirth: string | null }
//   gym: { id: string; name: string }
//   membershipPlan: { name: string; durationMonths: number; price: number } | null
//   assignedTrainer: { profile: { fullName: string } } | null
//   attendance: { id: string; checkInTime: string; checkOutTime: string | null }[]
//   payments: { id: string; amount: number; status: string; createdAt: string }[]
// }

// function getInitials(name: string) {
//   return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
// }

// function InfoRow({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: any }) {
//   if (!value) return null
//   return (
//     <div className="flex items-start gap-3">
//       {Icon && <Icon className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />}
//       <div>
//         <p className="text-white/35 text-xs">{label}</p>
//         <p className="text-white/80 text-sm">{value}</p>
//       </div>
//     </div>
//   )
// }

// const TABS = ["Profile", "Attendance", "Payments"]

// export default function MemberDetailPage() {
//   const { memberId } = useParams<{ memberId: string }>()
//   const router = useRouter()
//   const { toast } = useToast()

//   const [member, setMember] = useState<Member | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [tab, setTab] = useState("Profile")
//   const [editing, setEditing] = useState(false)
//   const [saving, setSaving] = useState(false)
//   const [editForm, setEditForm] = useState<any>({})

//   const load = () => {
//     fetch(`/api/owner/members/${memberId}`)
//       .then(r => r.json())
//       .then(d => { setMember(d); setEditForm({ status: d.status, heightCm: d.heightCm ?? "", weightKg: d.weightKg ?? "", medicalNotes: d.medicalNotes ?? "", emergencyContactName: d.emergencyContactName ?? "", emergencyContactPhone: d.emergencyContactPhone ?? "" }) })
//       .finally(() => setLoading(false))
//   }
//   useEffect(() => { load() }, [memberId])

//   const save = async () => {
//     setSaving(true)
//     const res = await fetch(`/api/owner/members/${memberId}`, {
//       method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm),
//     })
//     if (res.ok) { toast({ variant: "success", title: "Member updated" }); setEditing(false); load() }
//     else toast({ variant: "destructive", title: "Failed to update" })
//     setSaving(false)
//   }

//   const suspend = async () => {
//     if (!confirm("Suspend this member?")) return
//     await fetch(`/api/owner/members/${memberId}`, { method: "DELETE" })
//     toast({ title: "Member suspended" })
//     router.push("/owner/members")
//   }

//   if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
//   if (!member) return <div className="text-white/40 text-center py-20">Member not found</div>

//   return (
//     <div className="max-w-5xl">
//       <PageHeader
//         title={member.profile.fullName}
//         subtitle={`Member at ${member.gym.name}`}
//         breadcrumb={[{ label: "Members", href: "/owner/members" }]}
//         action={editing
//           ? { label: saving ? "Saving..." : "Save", onClick: save, icon: Save }
//           : { label: "Edit", onClick: () => setEditing(true), icon: Edit }
//         }
//       />

//       {/* Status row */}
//       <div className="flex items-center gap-3 mb-6 flex-wrap">
//         <span className={`text-xs px-3 py-1 rounded-full font-medium ${
//           member.status === "ACTIVE" ? "bg-green-500/15 text-green-400"
//           : member.status === "EXPIRED" ? "bg-red-500/15 text-red-400"
//           : "bg-yellow-500/15 text-yellow-400"
//         }`}>{member.status}</span>
//         {member.membershipPlan && (
//           <span className="text-xs bg-primary/10 border border-primary/20 text-primary/80 px-3 py-1 rounded-full">
//             {member.membershipPlan.name}
//           </span>
//         )}
//         {editing && (
//           <select value={editForm.status} onChange={e => setEditForm((p: any) => ({...p, status: e.target.value}))}
//             className="text-xs bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1 focus:outline-none focus:border-primary">
//             {["ACTIVE","EXPIRED","SUSPENDED"].map(s => <option key={s} value={s}>{s}</option>)}
//           </select>
//         )}
//         <button onClick={suspend} className="ml-auto flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 transition-colors">
//           <AlertTriangle className="w-3 h-3" /> Suspend
//         </button>
//         {editing && <button onClick={() => setEditing(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>}
//       </div>

//       {/* Tabs */}
//       <div className="flex gap-1 bg-white/4 rounded-xl p-1 w-fit mb-6">
//         {TABS.map(t => (
//           <button key={t} onClick={() => setTab(t)}
//             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-[hsl(220_25%_12%)] text-white shadow" : "text-white/40 hover:text-white/70"}`}>
//             {t}
//           </button>
//         ))}
//       </div>

//       {/* Profile Tab */}
//       {tab === "Profile" && (
//         <div className="grid md:grid-cols-2 gap-5">
//           {/* Avatar + contact */}
//           <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
//             <div className="flex items-center gap-4 mb-6">
//               <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-bold text-xl">
//                 {getInitials(member.profile.fullName)}
//               </div>
//               <div>
//                 <h3 className="text-white font-semibold">{member.profile.fullName}</h3>
//                 <p className="text-white/40 text-sm">{member.profile.gender ?? "—"} · {member.profile.city ?? "—"}</p>
//               </div>
//             </div>
//             <div className="space-y-3">
//               <InfoRow icon={Mail} label="Email" value={member.profile.email} />
//               <InfoRow icon={Phone} label="Mobile" value={member.profile.mobileNumber} />
//               <InfoRow icon={Calendar} label="Start Date" value={new Date(member.startDate).toLocaleDateString("en-IN")} />
//               <InfoRow icon={Calendar} label="Expiry Date" value={member.endDate ? new Date(member.endDate).toLocaleDateString("en-IN") : "No expiry"} />
//               <InfoRow icon={User} label="Trainer" value={member.assignedTrainer?.profile.fullName ?? "Not assigned"} />
//             </div>
//           </div>

//           {/* Health + emergency */}
//           <div className="space-y-4">
//             <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
//               <h3 className="text-white font-semibold text-sm mb-4">Health Info</h3>
//               {editing ? (
//                 <div className="grid grid-cols-2 gap-3">
//                   {[["heightCm","Height (cm)"],["weightKg","Weight (kg)"]].map(([field, label]) => (
//                     <div key={field} className="space-y-1">
//                       <Label className="text-white/50 text-xs">{label}</Label>
//                       <Input type="number" value={editForm[field]} onChange={e => setEditForm((p: any)=>({...p,[field]:e.target.value}))}
//                         className="bg-white/5 border-white/10 text-white focus:border-primary focus-visible:ring-0 h-9 text-sm" />
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="flex gap-6">
//                   <div className="flex items-center gap-2"><Ruler className="w-4 h-4 text-white/30" /><span className="text-white/60 text-sm">{member.heightCm ? `${member.heightCm} cm` : "—"}</span></div>
//                   <div className="flex items-center gap-2"><Weight className="w-4 h-4 text-white/30" /><span className="text-white/60 text-sm">{member.weightKg ? `${member.weightKg} kg` : "—"}</span></div>
//                 </div>
//               )}
//               {editing ? (
//                 <div className="mt-3 space-y-1">
//                   <Label className="text-white/50 text-xs">Medical Notes</Label>
//                   <textarea value={editForm.medicalNotes} onChange={e => setEditForm((p: any)=>({...p,medicalNotes:e.target.value}))} rows={2}
//                     className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-sm p-3 focus:outline-none focus:border-primary resize-none" />
//                 </div>
//               ) : member.medicalNotes ? (
//                 <div className="mt-3">
//                   <p className="text-white/35 text-xs mb-1">Medical Notes</p>
//                   <p className="text-white/60 text-sm">{member.medicalNotes}</p>
//                 </div>
//               ) : null}
//             </div>

//             <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
//               <h3 className="text-white font-semibold text-sm mb-4">Emergency Contact</h3>
//               {editing ? (
//                 <div className="space-y-3">
//                   {[["emergencyContactName","Name"],["emergencyContactPhone","Phone"]].map(([field, label]) => (
//                     <div key={field} className="space-y-1">
//                       <Label className="text-white/50 text-xs">{label}</Label>
//                       <Input value={editForm[field]} onChange={e => setEditForm((p: any)=>({...p,[field]:e.target.value}))}
//                         className="bg-white/5 border-white/10 text-white focus:border-primary focus-visible:ring-0 h-9 text-sm" />
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="space-y-2">
//                   <InfoRow icon={User} label="Name" value={member.emergencyContactName} />
//                   <InfoRow icon={Phone} label="Phone" value={member.emergencyContactPhone} />
//                   {!member.emergencyContactName && <p className="text-white/30 text-sm">No emergency contact added</p>}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Attendance Tab */}
//       {tab === "Attendance" && (
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
//           {member.attendance.length === 0 ? (
//             <div className="text-center py-12 text-white/30">
//               <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No attendance records</p>
//             </div>
//           ) : (
//             <>
//               <div className="grid grid-cols-3 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
//                 <span>Check In</span><span>Check Out</span><span>Duration</span>
//               </div>
//               <div className="divide-y divide-white/4">
//                 {member.attendance.map(a => {
//                   const dur = a.checkOutTime ? Math.round((new Date(a.checkOutTime).getTime() - new Date(a.checkInTime).getTime()) / 60000) : null
//                   return (
//                     <div key={a.id} className="grid grid-cols-3 px-5 py-4 text-sm">
//                       <span className="text-white/70">{new Date(a.checkInTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
//                       <span className="text-white/50">{a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString("en-IN", { timeStyle: "short" }) : <span className="text-green-400">In gym</span>}</span>
//                       <span className="text-white/50">{dur ? `${Math.floor(dur/60)}h ${dur%60}m` : "—"}</span>
//                     </div>
//                   )
//                 })}
//               </div>
//             </>
//           )}
//         </div>
//       )}

//       {/* Payments Tab */}
//       {tab === "Payments" && (
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
//           {member.payments.length === 0 ? (
//             <div className="text-center py-12 text-white/30">
//               <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No payment records</p>
//             </div>
//           ) : (
//             <>
//               <div className="grid grid-cols-3 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
//                 <span>Date</span><span>Amount</span><span>Status</span>
//               </div>
//               <div className="divide-y divide-white/4">
//                 {member.payments.map(p => (
//                   <div key={p.id} className="grid grid-cols-3 px-5 py-4 text-sm items-center">
//                     <span className="text-white/60">{new Date(p.createdAt).toLocaleDateString("en-IN")}</span>
//                     <span className="text-white font-semibold">₹{Number(p.amount).toLocaleString("en-IN")}</span>
//                     <span className={`text-xs px-2.5 py-1 rounded-full font-medium w-fit ${
//                       p.status === "COMPLETED" ? "bg-green-500/15 text-green-400"
//                       : p.status === "PENDING" ? "bg-yellow-500/15 text-yellow-400"
//                       : "bg-red-500/15 text-red-400"
//                     }`}>{p.status}</span>
//                   </div>
//                 ))}
//               </div>
//             </>
//           )}
//         </div>
//       )}
//     </div>
//   )
// }

// src/app/owner/members/[memberId]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/owner/PageHeader"
import { useToast } from "@/hooks/use-toast"
import {
  Phone, Mail, Calendar, Weight, Ruler,
  CreditCard, Clock, Edit, Save, X,
  Loader2, AlertTriangle, RefreshCw, CheckCircle2,
  IndianRupee
} from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface Member {
  id: string; status: string; startDate: string; endDate: string | null
  heightCm: number | null; weightKg: number | null
  medicalNotes: string | null; emergencyContactName: string | null; emergencyContactPhone: string | null
  profile: { fullName: string; email: string; mobileNumber: string | null; city: string | null; gender: string | null; dateOfBirth: string | null; avatarUrl: string | null }
  gym: { id: string; name: string }
  membershipPlan: { id: string; name: string; durationMonths: number; price: number } | null
  assignedTrainer: { id: string; profile: { fullName: string } } | null
  attendance: { id: string; checkInTime: string; checkOutTime: string | null }[]
  payments: { id: string; amount: number; status: string; createdAt: string; planNameSnapshot: string | null }[]
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

function RenewalModal({ member, plans, onClose, onSuccess }: {
  member: Member; plans: any[]; onClose: () => void; onSuccess: () => void
}) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    membershipPlanId: member.membershipPlan?.id ?? (plans[0]?.id ?? ""),
    paymentAmount:    member.membershipPlan ? String(Number(member.membershipPlan.price)) : "",
    paymentMethod:    "CASH",
    notes:            "",
  })

  const selectedPlan = plans.find(p => p.id === form.membershipPlanId)

  const handlePlanChange = (planId: string) => {
    const p = plans.find(x => x.id === planId)
    setForm(prev => ({ ...prev, membershipPlanId: planId, paymentAmount: p ? String(Number(p.price)) : "" }))
  }

  const newExpiry = (() => {
    if (!selectedPlan) return null
    const now = new Date()
    const base = (member.endDate && new Date(member.endDate) > now) ? new Date(member.endDate) : now
    const d = new Date(base); const day = d.getDate()
    d.setMonth(d.getMonth() + selectedPlan.durationMonths)
    if (d.getDate() !== day) d.setDate(0)
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  })()

  const submit = async () => {
    if (!form.membershipPlanId) { toast({ variant: "destructive", title: "Select a plan" }); return }
    setSaving(true)
    const res = await fetch(`/api/owner/members/${member.id}/renew`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      toast({ variant: "success", title: "Membership renewed!", description: `New expiry: ${newExpiry}` })
      onSuccess()
    } else toast({ variant: "destructive", title: data.error ?? "Renewal failed" })
    setSaving(false)
  }

  const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl text-sm"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[hsl(220_25%_9%)] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white font-semibold text-base flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary" /> Renew Membership
            </h3>
            <p className="text-white/40 text-xs mt-0.5">for {member.profile.fullName}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-3 bg-white/4 border border-white/8 rounded-xl space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-white/40">Current status</span>
            <span className={member.status === "ACTIVE" ? "text-green-400" : "text-red-400"}>{member.status}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/40">Current expiry</span>
            <span className="text-white/60">{member.endDate ? new Date(member.endDate).toLocaleDateString("en-IN") : "No expiry"}</span>
          </div>
          {newExpiry && (
            <div className="flex justify-between text-xs">
              <span className="text-white/40">New expiry (preview)</span>
              <span className="text-green-400 font-medium">{newExpiry}</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/55 text-xs">Membership Plan</Label>
          <select value={form.membershipPlanId} onChange={e => handlePlanChange(e.target.value)}
            className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary">
            {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {p.durationMonths}mo — ₹{Number(p.price).toLocaleString("en-IN")}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-white/55 text-xs">Payment Amount (₹)</Label>
            <Input type="number" value={form.paymentAmount} onChange={e => setForm(p => ({ ...p, paymentAmount: e.target.value }))} placeholder="0" className={inp} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/55 text-xs">Payment Method</Label>
            <select value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))}
              className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary">
              {["CASH","UPI","CARD","BANK_TRANSFER","OTHER"].map(m => <option key={m} value={m}>{m.replace("_"," ")}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-white/55 text-xs">Notes (optional)</Label>
          <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Paid cash, receipt #123" className={inp} />
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 border-white/10 text-white/60 hover:text-white h-10 text-sm">Cancel</Button>
          <Button onClick={submit} disabled={saving} className="flex-1 bg-gradient-primary hover:opacity-90 text-white font-semibold h-10 text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" />Renew</>}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function MemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const [member,  setMember]  = useState<Member | null>(null)
  const [plans,   setPlans]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState("Profile")
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [showRenew, setShowRenew] = useState(false)
  const [editForm, setEditForm]   = useState<any>({})

  const load = () => {
    fetch(`/api/owner/members/${memberId}`)
      .then(r => r.json())
      .then(d => {
        setMember(d)
        setEditForm({ status: d.status, heightCm: d.heightCm ?? "", weightKg: d.weightKg ?? "", medicalNotes: d.medicalNotes ?? "", emergencyContactName: d.emergencyContactName ?? "", emergencyContactPhone: d.emergencyContactPhone ?? "" })
        if (d?.gym?.id) {
          fetch(`/api/owner/plans?gymId=${d.gym.id}`)
            .then(r => r.json()).then(p => setPlans(Array.isArray(p) ? p : [])).catch(() => {})
        }
      })
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
    toast({ title: "Member suspended" }); router.push("/owner/members")
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
  if (!member) return <div className="text-white/40 text-center py-20">Member not found</div>

  const daysLeft   = member.endDate ? Math.ceil((new Date(member.endDate).getTime() - Date.now()) / 86400000) : null
  const nearExpiry = daysLeft !== null && daysLeft <= 7 && member.status === "ACTIVE"
  const isExpired  = member.status === "EXPIRED"

  return (
    <div className="max-w-5xl">
      {showRenew && <RenewalModal member={member} plans={plans} onClose={() => setShowRenew(false)} onSuccess={() => { setShowRenew(false); load() }} />}

      <PageHeader
        title={member.profile.fullName}
        subtitle={`Member at ${member.gym.name}`}
        breadcrumb={[{ label: "Members", href: "/owner/members" }]}
        action={editing
          ? { label: saving ? "Saving..." : "Save", onClick: save, icon: Save }
          : { label: "Edit", onClick: () => setEditing(true), icon: Edit }
        }
      />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
          member.status === "ACTIVE" ? "bg-green-500/15 text-green-400"
          : member.status === "EXPIRED" ? "bg-red-500/15 text-red-400"
          : "bg-yellow-500/15 text-yellow-400"
        }`}>{member.status}</span>

        {member.membershipPlan && (
          <span className="text-xs bg-primary/10 border border-primary/20 text-primary/80 px-3 py-1 rounded-full">{member.membershipPlan.name}</span>
        )}

        {nearExpiry && !isExpired && (
          <span className="text-xs bg-yellow-500/15 border border-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" /> {daysLeft === 0 ? "Expires today" : `${daysLeft}d left`}
          </span>
        )}
        {isExpired && (
          <span className="text-xs bg-red-500/15 border border-red-500/20 text-red-400 px-3 py-1 rounded-full flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" /> Expired
          </span>
        )}

        {editing && (
          <select value={editForm.status} onChange={e => setEditForm((p: any) => ({ ...p, status: e.target.value }))}
            className="text-xs bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1 focus:outline-none focus:border-primary">
            {["ACTIVE","EXPIRED","SUSPENDED"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}

        <Button onClick={() => setShowRenew(true)} size="sm"
          className="ml-auto bg-gradient-primary hover:opacity-90 text-white h-8 px-4 text-xs gap-1.5">
          <RefreshCw className="w-3 h-3" /> Renew Membership
        </Button>

        <button onClick={suspend} className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 transition-colors">
          <AlertTriangle className="w-3 h-3" /> Suspend
        </button>
        {editing && <button onClick={() => setEditing(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>}
      </div>

      <div className="flex gap-1 bg-white/4 rounded-xl p-1 w-fit mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-[hsl(220_25%_12%)] text-white shadow" : "text-white/40 hover:text-white/70"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Profile" && (
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar name={member.profile.fullName} url={member.profile.avatarUrl} size={52} rounded="lg" />
              <div>
                <h3 className="text-white font-semibold">{member.profile.fullName}</h3>
                <p className="text-white/40 text-sm">{member.profile.gender ?? "—"} · {member.profile.city ?? "—"}</p>
              </div>
            </div>
            <div className="space-y-3">
              <InfoRow icon={Mail}     label="Email"       value={member.profile.email} />
              <InfoRow icon={Phone}    label="Mobile"      value={member.profile.mobileNumber} />
              <InfoRow icon={Calendar} label="Start Date"  value={new Date(member.startDate).toLocaleDateString("en-IN")} />
              <InfoRow icon={Calendar} label="Expiry Date" value={member.endDate ? new Date(member.endDate).toLocaleDateString("en-IN") : "No expiry"} />
              <InfoRow icon={Calendar} label="Trainer"     value={member.assignedTrainer?.profile.fullName ?? "Not assigned"} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Health Info</h3>
              {editing ? (
                <div className="grid grid-cols-2 gap-3">
                  {[["heightCm","Height (cm)"],["weightKg","Weight (kg)"]].map(([field, label]) => (
                    <div key={field} className="space-y-1">
                      <Label className="text-white/50 text-xs">{label}</Label>
                      <Input type="number" value={editForm[field]} onChange={e => setEditForm((p: any) => ({ ...p, [field]: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white focus:border-primary focus-visible:ring-0 h-9 text-sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-6">
                  <div className="flex items-center gap-2"><Ruler className="w-4 h-4 text-white/30" /><span className="text-white/60 text-sm">{member.heightCm ? `${Number(member.heightCm)} cm` : "—"}</span></div>
                  <div className="flex items-center gap-2"><Weight className="w-4 h-4 text-white/30" /><span className="text-white/60 text-sm">{member.weightKg ? `${Number(member.weightKg)} kg` : "—"}</span></div>
                </div>
              )}
              {editing ? (
                <div className="mt-3 space-y-1">
                  <Label className="text-white/50 text-xs">Medical Notes</Label>
                  <textarea value={editForm.medicalNotes} onChange={e => setEditForm((p: any) => ({ ...p, medicalNotes: e.target.value }))}
                    rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-sm p-3 focus:outline-none focus:border-primary resize-none" />
                </div>
              ) : member.medicalNotes ? (
                <div className="mt-3"><p className="text-white/35 text-xs mb-1">Medical Notes</p><p className="text-white/60 text-sm">{member.medicalNotes}</p></div>
              ) : null}
            </div>

            <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Emergency Contact</h3>
              {editing ? (
                <div className="space-y-3">
                  {[["emergencyContactName","Name"],["emergencyContactPhone","Phone"]].map(([field, label]) => (
                    <div key={field} className="space-y-1">
                      <Label className="text-white/50 text-xs">{label}</Label>
                      <Input value={editForm[field]} onChange={e => setEditForm((p: any) => ({ ...p, [field]: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white focus:border-primary focus-visible:ring-0 h-9 text-sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <InfoRow icon={undefined} label="Name"  value={member.emergencyContactName} />
                  <InfoRow icon={Phone}     label="Phone" value={member.emergencyContactPhone} />
                  {!member.emergencyContactName && <p className="text-white/30 text-sm">No emergency contact added</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

      {tab === "Payments" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
          {member.payments.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No payment records</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
                <span>Date</span><span>Plan</span><span>Amount</span><span>Status</span>
              </div>
              <div className="divide-y divide-white/4">
                {member.payments.map(p => (
                  <div key={p.id} className="grid grid-cols-4 px-5 py-4 text-sm items-center">
                    <span className="text-white/60">{new Date(p.createdAt).toLocaleDateString("en-IN")}</span>
                    <span className="text-white/40 text-xs truncate">{p.planNameSnapshot ?? "—"}</span>
                    <span className="text-white font-semibold flex items-center gap-1">
                      <IndianRupee className="w-3 h-3 text-white/40" />{Number(p.amount).toLocaleString("en-IN")}
                    </span>
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
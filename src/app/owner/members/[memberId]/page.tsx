// src/app/owner/members/[memberId]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  Phone,  Calendar, Weight, Ruler,
  CreditCard, Clock, X,
  Loader2, AlertTriangle, RefreshCw, CheckCircle2,
  IndianRupee, ArrowLeft, User2, MapPin, Plus
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
  assignedTrainer: { id: string; profile: { fullName: string; avatarUrl: string | null } } | null
  gymTrainers: { id: string; profile: { fullName: string; avatarUrl: string | null } }[]
  attendance: { id: string; checkInTime: string; checkOutTime: string | null }[]
  payments: { id: string; amount: number; status: string; createdAt: string; planNameSnapshot: string | null, paymentMethod: string | null }[]
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
          <Button variant="outline" onClick={onClose} className="flex-1 border-white/10 text-white/60 bg-white/10 hover:bg-white/10 hover:text-white h-10 text-sm">Cancel</Button>
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
  const [showRenew, setShowRenew] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [addPayForm, setAddPayForm] = useState({ membershipPlanId: "", amount: "", paymentMethod: "CASH", paymentDate: new Date().toISOString().split("T")[0], notes: "" })
  const [addPaySaving, setAddPaySaving] = useState(false)

  const [assigningTrainer, setAssigningTrainer] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const load = () => {
    fetch(`/api/owner/members/${memberId}`)
      .then(r => r.json())
      .then(d => {
        setMember(d)
        if (d?.gym?.id) {
          fetch(`/api/owner/plans?gymId=${d.gym.id}`)
            .then(r => r.json()).then(p => setPlans(Array.isArray(p) ? p : [])).catch(() => {})
        }
      })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [memberId])



  const addPayment = async () => {
    if (!addPayForm.amount) { toast({ variant: "destructive", title: "Amount is required" }); return }
    setAddPaySaving(true)
    const res = await fetch("/api/owner/payments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gymId: member!.gym.id, memberId, ...addPayForm }),
    })
    const d = await res.json()
    if (res.ok) {
      toast({ variant: "success", title: "Payment recorded!" })
      setShowAddPayment(false)
      setAddPayForm({ membershipPlanId: "", amount: "", paymentMethod: "CASH", paymentDate: new Date().toISOString().split("T")[0], notes: "" })
      load()
    } else toast({ variant: "destructive", title: d.error ?? "Failed to record payment" })
    setAddPaySaving(false)
  }

  const suspend = async () => {

    await fetch(`/api/owner/members/${memberId}`, { method: "DELETE" })
    setShowConfirmModal(false);
    toast({ title: "Member suspended" }); router.push("/owner/members")
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
  if (!member) return <div className="text-white/40 text-center py-20">Member not found</div>

  const daysLeft   = member.endDate ? Math.ceil((new Date(member.endDate).getTime() - Date.now()) / 86400000) : null
  const isExpired  = member.status === "EXPIRED" || (daysLeft !== null && daysLeft < 0) 

  const isExpiringSoon = daysLeft !== null && daysLeft < 0;

  return (
    <div className="max-w-5xl">
      {showRenew && <RenewalModal member={member} plans={plans} onClose={() => setShowRenew(false)} onSuccess={() => { setShowRenew(false); load() }} />}


            {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[hsl(220_25%_9%)] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-white font-semibold text-base">Archive Plan?</h3>
            <p className="text-white/50 text-sm">This plan will be hidden from members. You can restore it later.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm transition-colors">
                Cancel
              </button>
              <button onClick={() => suspend()}
                className="flex-1 py-2.5 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/25 text-sm font-semibold transition-colors">
                Suspend
              </button>
            </div>
          </div>
        </div>
)}
      <div className="flex items-center gap-4 mb-5 justify-center">
        <button onClick={() => router.push("/owner/members")} className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-all shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-display font-bold text-white">{member.profile.fullName}</h2>
            
          </div>
          <p className="text-white/40 text-sm mt-0.5 flex items-center gap-1.5">Member at {member.gym.name}</p>
        </div>

      </div>
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 mb-5">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-5">
            <Avatar name={member.profile.fullName} url={member.profile.avatarUrl} size={100} />
            <div>
              <h3 className="text-white font-semibold">{member.profile.fullName}</h3>
              <p className="text-white/40 text-sm">{member.profile.email}</p>
              <p className="text-white/40 text-sm">{member.profile.mobileNumber}</p>
            </div>
          </div>
          <div className="flex-end flex flex-col items-end gap-5">
            <span className={`text-xs px-3 py-1 rounded-full w-fit font-medium ${
              member.status === "ACTIVE" ? "bg-green-500/15 text-green-400"
              : member.status === "EXPIRED" ? "bg-red-500/15 text-red-400"
              : "bg-yellow-500/15 text-yellow-400"
            }`}>{member.status}</span>
            <div className="flex items-center gap-5">
          <Button onClick={() => setShowRenew(true)} size="sm"
            className="ml-auto bg-[hsl(220_25%_9%)] hover:bg-[hsl(220_25%_9%)] border border-white/6 hover:opacity-90 text-green-400 h-8 px-4 text-xs gap-1.5">
            <RefreshCw className="w-3 h-3" /> Renew Membership
          </Button>

          <Button onClick={() => setShowConfirmModal(true)} size="sm" className="flex bg-[hsl(220_25%_9%)] hover:bg-[hsl(220_25%_9%)] hover:opacity-90 border border-white/6 h-8 px-4 items-center gap-1.5 text-xs text-red-400 transition-colors">
            <AlertTriangle className="w-3 h-3" /> Suspend
          </Button>
        </div>
          </div>
        </div>
        <div className="bg-white/4 rounded-lg mb-5 px-5 py-2 flex items-center justify-around">
          <div className="text-white text-center">
            <p className="text-white/35 text-xs mb-1">Plan</p>
            <p className="text-white/80 text-sm">{member?.membershipPlan?.name}</p>
          </div>
          <div className="w-0.5 bg-white/10 h-10" />
          <div className="text-center">
            <p className="text-white/35 text-xs mb-1">Joined</p>
            <p className="text-white/80 text-sm">{new Date(member.startDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric"
            })}</p>
          </div>
          <div className="w-0.5 bg-white/10 h-10" />
          <div className="text-center">
            <p className="text-white/35 text-xs mb-1">Expires</p>
            <p className={`${isExpired ? 'text-red-400' : isExpiringSoon ? 'text-warning' : 'text-white/80'} text-sm`}>{member?.endDate ? isExpired ? "Expired" : `${daysLeft}d left` : "No expiry"}</p>
          </div>
        </div>
    

      </div>


      <div className="flex gap-1 bg-white/4 rounded-full p-1 w-full mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm w-full font-medium transition-all ${tab === t ? "bg-gradient-primary text-white shadow" : "text-white/40 hover:text-white/70"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Profile" && (
        <div >
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3 py-4 border-b-2 border-white/6">
                  <Phone className="w-4 h-4 text-green-400" />
                <div className="flex justify-between w-full">
                  <p className="text-white/35 text-xs">Phone Number</p>
                  <p className="text-white/80 text-sm">
                    {member.profile.mobileNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-4 border-b-2 border-white/6">
                  <User2 className="w-4 h-4 text-blue-400" />
                <div className="flex justify-between w-full">
                  <p className="text-white/35 text-xs">Gender</p>
                  <p className="text-white/80 text-sm">
                    {member.profile.gender?.toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-4 border-b-2 border-white/6">
                  <Calendar className="w-4 h-4 text-primary" />
                <div className="flex justify-between w-full">
                  <p className="text-white/35 text-xs">Date Of Birth</p>
                  <p className="text-white/80 text-sm">
                    {new Date(member?.profile?.dateOfBirth ?? "").toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-4 border-b-2 border-white/6">
                <MapPin className="w-4 h-4 text-blue-400" />
                <div className="flex justify-between w-full">
                  <p className="text-white/35 text-xs">City</p>
                  <p className="text-white/80 text-sm">
                    {member.profile.city}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-4 border-b-2 border-white/6">
                <Ruler className="w-4 h-4 text-blue-400" />
                <div className="flex justify-between w-full">
                  <p className="text-white/35 text-xs">Height</p>
                  <p className="text-white/80 text-sm">
                    {member.heightCm ? `${Number(member.heightCm)} cm` : "Not Provided"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-4 border-b-2 border-white/6">
                <Weight className="w-4 h-4 text-blue-400" />
                <div className="flex justify-between w-full">
                  <p className="text-white/35 text-xs">Weight</p>
                  <p className="text-white/80 text-sm">
                    {member.weightKg ? `${Number(member.weightKg)} kg` : "Not Provided"}
                  </p>
                </div>
              </div>
                                
              {/* Trainer assignment */}
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 mt-0.5 shrink-0 text-white/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/35 text-xs mb-1">Assigned Trainer</p>
                  <div className="flex items-center gap-2">
                    {member.assignedTrainer ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Avatar name={member.assignedTrainer.profile.fullName} url={member.assignedTrainer.profile.avatarUrl} size={22} />
                        <span className="text-white/80 text-sm truncate">{member.assignedTrainer.profile.fullName}</span>
                      </div>
                    ) : (
                      <span className="text-white/35 text-sm italic">Not assigned</span>
                    )}
                    <select
                      value={member.assignedTrainer?.id ?? ""}
                      disabled={assigningTrainer}
                      onChange={async (e) => {
                        const trainerId = e.target.value || null
                        setAssigningTrainer(true)
                        const res = await fetch(`/api/owner/members/${member.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ assignedTrainerId: trainerId }),
                        })
                        if (res.ok) { load(); toast({ variant: "success", title: trainerId ? "Trainer assigned" : "Trainer removed" }) }
                        else toast({ variant: "destructive", title: "Failed to update trainer" })
                        setAssigningTrainer(false)
                      }}
                      className="ml-auto text-xs bg-white/5 border border-white/10 text-white/70 rounded-lg px-2 py-1 focus:outline-none focus:border-primary disabled:opacity-50"
                    >
                      <option value="">— No trainer —</option>
                      {(member.gymTrainers ?? []).map((t: any) => (
                        <option key={t.id} value={t.id}>{t.profile.fullName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
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
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddPayment(p => !p)}
              className="flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> Add Payment
            </button>
          </div>
          {showAddPayment && (
            <div className="bg-[hsl(220_25%_9%)] border border-primary/20 rounded-2xl p-5 space-y-4">
              <h3 className="text-white font-semibold text-sm">Record Payment</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Membership Plan</label>
                  <select value={addPayForm.membershipPlanId} onChange={e => setAddPayForm(f => ({ ...f, membershipPlanId: e.target.value }))}
                    className="w-full bg-[hsl(220_25%_13%)] border border-white/10 text-white rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary/50">
                    <option value="">No plan</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Amount (₹) *</label>
                  <input type="number" value={addPayForm.amount} onChange={e => setAddPayForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full bg-[hsl(220_25%_13%)] border border-white/10 text-white rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Payment Method</label>
                  <select value={addPayForm.paymentMethod} onChange={e => setAddPayForm(f => ({ ...f, paymentMethod: e.target.value }))}
                    className="w-full bg-[hsl(220_25%_13%)] border border-white/10 text-white rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary/50">
                    {["CASH", "UPI", "CARD", "BANK_TRANSFER", "OTHER"].map(m => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Payment Date</label>
                  <input type="date" value={addPayForm.paymentDate} onChange={e => setAddPayForm(f => ({ ...f, paymentDate: e.target.value }))}
                    className="w-full bg-[hsl(220_25%_13%)] border border-white/10 text-white rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary/50" />
                </div>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1 block">Notes</label>
                <input value={addPayForm.notes} onChange={e => setAddPayForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full bg-[hsl(220_25%_13%)] border border-white/10 text-white rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary/50" />
              </div>
              <div className="flex gap-3">
                <button onClick={addPayment} disabled={addPaySaving}
                  className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50">
                  {addPaySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Record
                </button>
                <button onClick={() => setShowAddPayment(false)} className="text-white/40 text-sm px-4 py-2.5 rounded-xl hover:bg-white/5">Cancel</button>
              </div>
            </div>
          )}
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
            {member.payments.length === 0 ? (
              <div className="text-center py-12 text-white/30">
                <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No payment records</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-5 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
                  <span>Date</span><span>Plan</span><span>Payment Type</span><span>Amount</span><span>Status</span>
                </div>
                <div className="divide-y divide-white/4">
                  {member.payments.map(p => (
                    <div key={p.id} className="grid grid-cols-5 px-5 py-4 text-sm items-center">
                      <span className="text-white/60">{new Date(p.createdAt).toLocaleDateString("en-IN")}</span>
                      <span className="text-white/40 text-xs truncate">{p.planNameSnapshot ?? "—"}</span>
                      <span className="text-white/40 text-xs truncate">{p.paymentMethod}</span>
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
        </div>
      )}
    </div>
  )
}
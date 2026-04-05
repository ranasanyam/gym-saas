

// // src/app/owner/payments/page.tsx
// "use client"

// import { useEffect, useState, useCallback } from "react"
// import { PageHeader } from "@/components/owner/PageHeader"
// import { useToast } from "@/hooks/use-toast"
// import { CreditCard, TrendingUp, Plus, X, Loader2, Search, CheckCircle2, Clock, XCircle } from "lucide-react"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Button } from "@/components/ui/button"
// import { Avatar } from "@/components/ui/Avatar"

// interface Payment {
//   id: string; amount: number; status: string; createdAt: string; paymentDate: string | null
//   planNameSnapshot: string | null
//   member: { profile: { fullName: string; avatarUrl: string | null } }
//   gym: { name: string }
//   membershipPlan: { name: string } | null
// }

// const STATUS_STYLE: Record<string,{icon:any,color:string,bg:string}> = {
//   COMPLETED: { icon: CheckCircle2, color: "text-green-400",  bg: "bg-green-500/10"  },
//   PENDING:   { icon: Clock,        color: "text-yellow-400", bg: "bg-yellow-500/10" },
//   FAILED:    { icon: XCircle,      color: "text-red-400",    bg: "bg-red-500/10"    },
// }

// function fmt(n: number) {
//   if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`
//   if (n >= 1000)   return `₹${(n/1000).toFixed(1)}K`
//   return `₹${n.toLocaleString("en-IN")}`
// }

// export default function PaymentsPage() {
//   const { toast } = useToast()
//   const [payments, setPayments] = useState<Payment[]>([])
//   const [total, setTotal]       = useState(0)
//   const [pages, setPages]       = useState(1)
//   const [page, setPage]         = useState(1)
//   const [monthTotal, setMonthTotal] = useState(0)
//   const [loading, setLoading]   = useState(true)

//   // Add payment modal
//   const [showModal, setShowModal] = useState(false)
//   const [gyms, setGyms]         = useState<any[]>([])
//   const [members, setMembers]   = useState<any[]>([])
//   const [memberSearch, setMemberSearch] = useState("")
//   const [selectedMember, setSelectedMember] = useState<any>(null)
//   const [plans, setPlans]       = useState<any[]>([])
//   const [addForm, setAddForm]   = useState({
//     gymId: "", membershipPlanId: "", amount: "",
//     paymentMethod: "CASH",
//     paymentDate: new Date().toISOString().split("T")[0],
//   })
//   const [adding, setAdding] = useState(false)

//   const load = useCallback(() => {
//     setLoading(true)
//     fetch(`/api/owner/payments?page=${page}`)
//       .then(r => r.json())
//       .then(d => { setPayments(d.payments ?? []); setTotal(d.total ?? 0); setPages(d.pages ?? 1); setMonthTotal(d.monthTotal ?? 0) })
//       .finally(() => setLoading(false))
//   }, [page])

//   useEffect(() => { load() }, [load])

//   const openModal = async () => {
//     setShowModal(true)
//     setSelectedMember(null); setMemberSearch(""); setMembers([])
//     setAddForm({ gymId: "", membershipPlanId: "", amount: "", paymentMethod: "CASH", paymentDate: new Date().toISOString().split("T")[0] })
//     const g = await fetch("/api/owner/gyms").then(r => r.json())
//     setGyms(g)
//     if (g.length > 0) setAddForm(p => ({ ...p, gymId: g[0].id }))
//   }

//   useEffect(() => {
//     if (!addForm.gymId || !showModal) return
//     fetch(`/api/owner/members?gymId=${addForm.gymId}&page=1&limit=200`)
//       .then(r => r.json()).then(d => setMembers(Array.isArray(d.members) ? d.members : []))
//     fetch(`/api/owner/plans?gymId=${addForm.gymId}`)
//       .then(r => r.json()).then(d => setPlans(Array.isArray(d) ? d : []))
//   }, [addForm.gymId, showModal])

//   // Auto-fill amount when plan selected
//   useEffect(() => {
//     if (!addForm.membershipPlanId) return
//     const plan = plans.find(p => p.id === addForm.membershipPlanId)
//     if (plan) setAddForm(p => ({ ...p, amount: String(plan.price) }))
//   }, [addForm.membershipPlanId])

//   const addPayment = async () => {
//     if (!selectedMember) { toast({ variant: "destructive", title: "Please select a member" }); return }
//     if (!addForm.amount)  { toast({ variant: "destructive", title: "Amount is required" }); return }
//     setAdding(true)
//     const res = await fetch("/api/owner/payments", {
//       method: "POST", headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         gymId:            addForm.gymId,
//         memberId:         selectedMember.id,
//         membershipPlanId: addForm.membershipPlanId || null,
//         amount:           parseFloat(addForm.amount),
//         paymentMethod:    addForm.paymentMethod,
//         paymentDate:      addForm.paymentDate,
//       }),
//     })
//     const data = await res.json()
//     if (res.ok) {
//       toast({ variant: "success", title: "Payment recorded!", description: `₹${addForm.amount} from ${selectedMember.profile.fullName}` })
//       setShowModal(false); load()
//     } else {
//       toast({ variant: "destructive", title: data.error ?? "Failed to add payment" })
//     }
//     setAdding(false)
//   }

//   const filteredMembers = members.filter(m =>
//     m.profile.fullName.toLowerCase().includes(memberSearch.toLowerCase())
//   )
//   const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl"
//   const sel = "w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary"

//   return (
//     <div className="max-w-6xl">
//       <PageHeader title="Payments" subtitle="Member fee collection and history" />

//       {/* Stats + Add button */}
//       <div className="flex items-center gap-4 mb-7 flex-wrap">
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 flex items-center gap-4">
//           <div className="p-2.5 bg-primary/10 rounded-xl"><TrendingUp className="w-5 h-5 text-primary" /></div>
//           <div>
//             <p className="text-white/40 text-xs mb-0.5">This Month</p>
//             <p className="text-white text-2xl font-display font-bold">{fmt(monthTotal)}</p>
//           </div>
//         </div>
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 flex items-center gap-4">
//           <div className="p-2.5 bg-white/5 rounded-xl"><CreditCard className="w-5 h-5 text-white/40" /></div>
//           <div>
//             <p className="text-white/40 text-xs mb-0.5">Total Transactions</p>
//             <p className="text-white text-2xl font-display font-bold">{total}</p>
//           </div>
//         </div>
//         <button onClick={openModal} className="ml-auto flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity">
//           <Plus className="w-4 h-4" /> Add Payment
//         </button>
//       </div>

//       {/* Table */}
//       {loading ? (
//         <div className="space-y-3">{[...Array(5)].map((_,i) => <div key={i} className="h-16 bg-white/3 rounded-xl animate-pulse" />)}</div>
//       ) : payments.length === 0 ? (
//         <div className="text-center py-16"><CreditCard className="w-10 h-10 text-white/15 mx-auto mb-3" /><p className="text-white/30 text-sm">No payments yet</p></div>
//       ) : (
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
//           <div className="grid grid-cols-5 px-5 py-3 border-b border-white/5 text-xs text-white/30 uppercase tracking-wider">
//             <span className="col-span-2">Member</span><span>Plan</span><span>Date</span><span className="text-right">Amount</span>
//           </div>
//           <div className="divide-y divide-white/4">
//             {payments.map(p => {
//               const s = STATUS_STYLE[p.status] ?? STATUS_STYLE.PENDING
//               const Icon = s.icon
//               const date = new Date(p.paymentDate ?? p.createdAt)
//               return (
//                 <div key={p.id} className="grid grid-cols-5 items-center px-5 py-4">
//                   <div className="col-span-2 flex items-center gap-3 min-w-0">
//                     <Avatar name={p.member.profile.fullName} url={p.member.profile.avatarUrl} />
//                     <div className="min-w-0">
//                       <p className="text-white text-sm font-medium truncate">{p.member.profile.fullName}</p>
//                       <p className="text-white/35 text-xs">{p.gym.name}</p>
//                     </div>
//                   </div>
//                   <span className="text-white/55 text-sm truncate">{p.planNameSnapshot ?? p.membershipPlan?.name ?? "—"}</span>
//                   <span className="text-white/55 text-sm">{date.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>
//                   <div className="flex items-center justify-end gap-2">
//                     <div className={`p-1 rounded-lg ${s.bg}`}><Icon className={`w-3.5 h-3.5 ${s.color}`} /></div>
//                     <span className="text-white font-semibold text-sm">₹{Number(p.amount).toLocaleString("en-IN")}</span>
//                   </div>
//                 </div>
//               )
//             })}
//           </div>
//         </div>
//       )}

//       {pages > 1 && (
//         <div className="flex items-center justify-center gap-3 mt-5">
//           <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white disabled:opacity-30 text-sm">Previous</button>
//           <span className="text-white/30 text-sm">{page} / {pages}</span>
//           <button disabled={page===pages} onClick={() => setPage(p=>p+1)} className="px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white disabled:opacity-30 text-sm">Next</button>
//         </div>
//       )}

//       {/* Add Payment Modal */}
//       {showModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
//           <div className="bg-[hsl(220_25%_10%)] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
//             <div className="flex items-center justify-between">
//               <h3 className="text-white font-display font-bold text-lg">Add Payment</h3>
//               <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
//             </div>

//             {/* Gym */}
//             <div className="space-y-1.5">
//               <Label className="text-white/55 text-sm">Gym</Label>
//               <select value={addForm.gymId} onChange={e => setAddForm(p => ({ ...p, gymId: e.target.value, membershipPlanId: "", amount: "" }))} className={sel}>
//                 {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
//               </select>
//             </div>

//             {/* Member search */}
//             <div className="space-y-2">
//               <Label className="text-white/55 text-sm">Member</Label>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
//                 <Input value={memberSearch} onChange={e => { setMemberSearch(e.target.value); setSelectedMember(null) }} placeholder="Search member..." className={`${inp} pl-9`} />
//               </div>
//               {memberSearch && !selectedMember && filteredMembers.length > 0 && (
//                 <div className="bg-[hsl(220_25%_13%)] border border-white/10 rounded-xl overflow-hidden max-h-36 overflow-y-auto">
//                   {filteredMembers.slice(0,6).map(m => (
//                     <button key={m.id} type="button" onClick={() => { setSelectedMember(m); setMemberSearch(m.profile.fullName) }}
//                       className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left">
//                       <Avatar name={m.profile.fullName} url={m.profile.avatarUrl} />
//                       <span className="text-white text-sm">{m.profile.fullName}</span>
//                     </button>
//                   ))}
//                 </div>
//               )}
//               {selectedMember && (
//                 <div className="flex items-center gap-3 p-3 bg-primary/8 border border-primary/20 rounded-xl">
//                   <Avatar name={selectedMember.profile.fullName} url={selectedMember.profile.avatarUrl} />
//                   <span className="text-white text-sm font-medium">{selectedMember.profile.fullName}</span>
//                 </div>
//               )}
//             </div>

//             {/* Plan */}
//             <div className="space-y-1.5">
//               <Label className="text-white/55 text-sm">Membership Plan <span className="text-white/30">(optional)</span></Label>
//               <select value={addForm.membershipPlanId} onChange={e => setAddForm(p => ({ ...p, membershipPlanId: e.target.value }))} className={sel}>
//                 <option value="">No specific plan</option>
//                 {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ₹{Number(p.price).toLocaleString("en-IN")}</option>)}
//               </select>
//             </div>

//             {/* Amount + method + date */}
//             <div className="grid grid-cols-2 gap-3">
//               <div className="space-y-1.5">
//                 <Label className="text-white/55 text-sm">Amount (₹) *</Label>
//                 <Input type="number" value={addForm.amount} onChange={e => setAddForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" className={inp} />
//               </div>
//               <div className="space-y-1.5">
//                 <Label className="text-white/55 text-sm">Payment Method</Label>
//                 <select value={addForm.paymentMethod} onChange={e => setAddForm(p => ({ ...p, paymentMethod: e.target.value }))} className={sel}>
//                   <option value="CASH">Cash</option>
//                   <option value="UPI">UPI</option>
//                   <option value="CARD">Card</option>
//                   <option value="BANK_TRANSFER">Bank Transfer</option>
//                   <option value="CHEQUE">Cheque</option>
//                 </select>
//               </div>
//             </div>
//             <div className="space-y-1.5">
//               <Label className="text-white/55 text-sm">Payment Date</Label>
//               <Input type="date" value={addForm.paymentDate} onChange={e => setAddForm(p => ({ ...p, paymentDate: e.target.value }))} className={inp} />
//             </div>

//             <div className="flex gap-3 pt-1">
//               <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 border-white/10 text-white/60 hover:text-white h-11">Cancel</Button>
//               <Button onClick={addPayment} disabled={adding || !selectedMember} className="flex-1 bg-gradient-primary hover:opacity-90 text-white h-11">
//                 {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Record Payment"}
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// src/app/owner/payments/page.tsx
"use client"

import { useSubscription } from "@/contexts/SubscriptionContext"
import { PlanGate } from "@/components/owner/PlanGate"
import { PageHeader } from "@/components/owner/PageHeader"
import { AppSelect } from "@/components/ui/AppSelect"
import { useEffect, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { CreditCard, Plus, Loader2, TrendingUp } from "lucide-react"

function fmt(n: number) { return `₹${Number(n).toLocaleString("en-IN")}` }

interface Payment {
  id: string; amount: number; paymentMethod: string | null; status: string
  paymentDate: string | null; planNameSnapshot: string | null; notes: string | null
  member: { profile: { fullName: string; avatarUrl: string | null } }
  gym: { name: string }
}

function PaymentsContent() {
  const { toast } = useToast()
  const [payments, setPayments] = useState<Payment[]>([])
  const [gyms, setGyms] = useState<{ id: string; name: string }[]>([])
  const [gymId, setGymId] = useState("")
  const [total, setTotal] = useState(0)
  const [monthTotal, setMonthTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [members, setMembers] = useState<{ id: string; profile: { fullName: string } }[]>([])
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({ gymId: "", memberId: "", membershipPlanId: "", amount: "", paymentMethod: "CASH", paymentDate: new Date().toISOString().split("T")[0], notes: "" })

  const load = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (gymId) p.set("gymId", gymId)
    fetch(`/api/owner/payments?${p}`).then(r => r.json()).then(d => {
      setPayments(d.payments ?? [])
      setTotal(d.total ?? 0)
      setMonthTotal(d.monthTotal ?? 0)
    }).catch(() => { }).finally(() => setLoading(false))
  }, [gymId])

  useEffect(() => {
    fetch("/api/owner/gyms").then(r => r.json()).then(g => { if (Array.isArray(g)) setGyms(g) })
  }, [])
  useEffect(() => { load() }, [load])

  const onGymChange = async (id: string) => {
    setForm(f => ({ ...f, gymId: id, memberId: "", membershipPlanId: "" }))
    const [m, p] = await Promise.all([
      fetch(`/api/owner/members?gymId=${id}`).then(r => r.json()),
      fetch(`/api/owner/plans?gymId=${id}`).then(r => r.json()),
    ])
    setMembers(m.members ?? [])
    setPlans(Array.isArray(p) ? p : [])
  }

  const save = async () => {
    if (!form.gymId || !form.memberId || !form.amount) { toast({ variant: "destructive", title: "Gym, member and amount required" }); return }
    setSaving(true)
    const res = await fetch("/api/owner/payments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const d = await res.json()
    if (res.ok) { toast({ variant: "success", title: "Payment recorded!" }); setShowForm(false); load() }
    else toast({ variant: "destructive", title: d.error ?? "Failed" })
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-display font-bold text-primary">{fmt(monthTotal)}</p>
          <p className="text-white/35 text-xs mt-0.5">This Month</p>
        </div>
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4">
          <div className="w-8 h-8 bg-white/8 rounded-lg flex items-center justify-center mb-2">
            <CreditCard className="w-4 h-4 text-white/60" />
          </div>
          <p className="text-xl font-display font-bold text-white">{total}</p>
          <p className="text-white/35 text-xs mt-0.5">Total Transactions</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {gyms.length > 1 && (
          <AppSelect
            value={gymId}
            onChange={setGymId}
            placeholder="All Gyms"
            options={[{ value: "", label: "All Gyms" }, ...gyms.map(g => ({ value: g.id, label: g.name }))]}
            className="w-40"
          />
        )}
        <button onClick={() => setShowForm(true)}
          className="ml-auto flex items-center gap-2 bg-gradient-to-r from-primary to-orange-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90">
          <Plus className="w-4 h-4" /> Record Payment
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/8 rounded-2xl p-5 space-y-4">
          <h3 className="text-white font-semibold text-sm">Record Payment</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-white/50 text-xs mb-1 block">Gym *</label>
              <AppSelect
                value={form.gymId}
                onChange={onGymChange}
                placeholder="Select gym"
                options={gyms.map(g => ({ value: g.id, label: g.name }))}
              />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Member *</label>
              <AppSelect
                value={form.memberId}
                onChange={v => setForm(f => ({ ...f, memberId: v }))}
                placeholder="Select member"
                options={members.map(m => ({ value: m.id, label: m.profile.fullName }))}
              />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Membership Plan</label>
              <AppSelect
                value={form.membershipPlanId}
                onChange={v => setForm(f => ({ ...f, membershipPlanId: v }))}
                placeholder="No plan"
                options={[{ value: "", label: "No plan" }, ...plans.map(p => ({ value: p.id, label: p.name }))]}
              />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Amount (₹) *</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full bg-[hsl(220_25%_13%)] border border-white/10 text-white rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Payment Method</label>
              <AppSelect
                value={form.paymentMethod}
                onChange={v => setForm(f => ({ ...f, paymentMethod: v }))}
                options={["CASH", "UPI", "CARD", "BANK_TRANSFER", "OTHER"].map(m => ({ value: m, label: m.replace("_", " ") }))}
              />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Payment Date</label>
              <input type="date" value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))}
                className="w-full bg-[hsl(220_25%_13%)] border border-white/10 text-white rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary/50" />
            </div>
          </div>
          <div>
            <label className="text-white/50 text-xs mb-1 block">Notes</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full bg-[hsl(220_25%_13%)] border border-white/10 text-white rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary/50" />
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Record
            </button>
            <button onClick={() => setShowForm(false)} className="text-white/40 text-sm px-4 py-2.5 rounded-xl hover:bg-white/5">Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No payments recorded yet.</p>
        </div>
      ) : (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Member", "Gym", "Plan", "Amount", "Method", "Date", "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-white/30 text-xs font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-white/2">
                  <td className="px-4 py-3 text-white font-medium">{p.member.profile.fullName}</td>
                  <td className="px-4 py-3 text-white/50">{p.gym.name}</td>
                  <td className="px-4 py-3 text-white/50">{p.planNameSnapshot ?? "—"}</td>
                  <td className="px-4 py-3 text-primary font-semibold">{fmt(p.amount)}</td>
                  <td className="px-4 py-3 text-white/50">{p.paymentMethod ?? "—"}</td>
                  <td className="px-4 py-3 text-white/50">
                    {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${p.status === "COMPLETED" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      }`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function PaymentsPage() {
  const { hasPayments, isExpired } = useSubscription()
  return (
    <div className="max-w-6xl space-y-6">
      <PageHeader title="Payments" subtitle="Record and track member payments" />
      <PlanGate allowed={hasPayments && !isExpired} featureLabel="Payment Management">
        <PaymentsContent />
      </PlanGate>
    </div>
  )
}
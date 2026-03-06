// // src/app/owner/payments/page.tsx
// "use client"

// import { useEffect, useState, useCallback } from "react"
// import { PageHeader } from "@/components/owner/PageHeader"
// import { CreditCard, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react"

// interface Payment {
//   id: string; amount: number; status: string; createdAt: string; paymentDate: string | null
//   member: { profile: { fullName: string } }
//   gym: { name: string }
//   membershipPlan: { name: string } | null
// }

// function formatCurrency(n: number) {
//   if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`
//   if (n >= 1000) return `₹${(n/1000).toFixed(1)}K`
//   return `₹${n}`
// }

// export default function PaymentsPage() {
//   const [payments, setPayments] = useState<Payment[]>([])
//   const [total, setTotal] = useState(0)
//   const [pages, setPages] = useState(1)
//   const [page, setPage] = useState(1)
//   const [monthTotal, setMonthTotal] = useState(0)
//   const [loading, setLoading] = useState(true)

//   const load = useCallback(() => {
//     setLoading(true)
//     fetch(`/api/owner/payments?page=${page}`)
//       .then(r => r.json())
//       .then(d => { setPayments(d.payments); setTotal(d.total); setPages(d.pages); setMonthTotal(d.monthTotal) })
//       .finally(() => setLoading(false))
//   }, [page])

//   useEffect(() => { load() }, [load])

//   return (
//     <div className="max-w-6xl">
//       <PageHeader title="Payments" subtitle="Member fee collection and history" />

//       {/* Stats */}
//       <div className="grid grid-cols-2 gap-4 mb-7">
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 flex items-center gap-4">
//           <div className="p-2.5 bg-primary/10 rounded-xl"><TrendingUp className="w-5 h-5 text-primary" /></div>
//           <div>
//             <p className="text-white/40 text-xs mb-0.5">This Month</p>
//             <p className="text-white text-2xl font-display font-bold">{formatCurrency(monthTotal)}</p>
//           </div>
//         </div>
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 flex items-center gap-4">
//           <div className="p-2.5 bg-white/5 rounded-xl"><CreditCard className="w-5 h-5 text-white/40" /></div>
//           <div>
//             <p className="text-white/40 text-xs mb-0.5">Total Transactions</p>
//             <p className="text-white text-2xl font-display font-bold">{total}</p>
//           </div>
//         </div>
//       </div>

//       {loading ? (
//         <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white/3 rounded-xl animate-pulse" />)}</div>
//       ) : (
//         <>
//           <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
//             <div className="grid grid-cols-[1fr_1fr_1fr_120px_100px] gap-4 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
//               <span>Member</span><span>Plan</span><span>Gym</span><span>Amount</span><span>Status</span>
//             </div>
//             <div className="divide-y divide-white/4">
//               {payments.map(p => (
//                 <div key={p.id} className="grid grid-cols-[1fr_1fr_1fr_120px_100px] gap-4 px-5 py-4 items-center hover:bg-white/2 transition-colors">
//                   <div>
//                     <p className="text-white text-sm font-medium">{p.member.profile.fullName}</p>
//                     <p className="text-white/35 text-xs">{new Date(p.createdAt).toLocaleDateString("en-IN")}</p>
//                   </div>
//                   <span className="text-white/55 text-sm">{p.membershipPlan?.name ?? "—"}</span>
//                   <span className="text-white/55 text-sm truncate">{p.gym.name}</span>
//                   <span className="text-white font-semibold text-sm">₹{Number(p.amount).toLocaleString("en-IN")}</span>
//                   <span className={`text-xs px-2.5 py-1 rounded-full font-medium w-fit ${
//                     p.status === "COMPLETED" ? "bg-green-500/15 text-green-400"
//                     : p.status === "PENDING" ? "bg-yellow-500/15 text-yellow-400"
//                     : "bg-red-500/15 text-red-400"
//                   }`}>{p.status}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//           {pages > 1 && (
//             <div className="flex items-center justify-between mt-5">
//               <p className="text-white/35 text-sm">{total} transactions</p>
//               <div className="flex items-center gap-2">
//                 <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
//                   className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white disabled:opacity-30 transition-all">
//                   <ChevronLeft className="w-4 h-4" />
//                 </button>
//                 <span className="text-white/60 text-sm px-2">Page {page} of {pages}</span>
//                 <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
//                   className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white disabled:opacity-30 transition-all">
//                   <ChevronRight className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   )
// }


// src/app/owner/payments/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { PageHeader } from "@/components/owner/PageHeader"
import { useToast } from "@/hooks/use-toast"
import { CreditCard, TrendingUp, Plus, X, Loader2, Search, CheckCircle2, Clock, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface Payment {
  id: string; amount: number; status: string; createdAt: string; paymentDate: string | null
  planNameSnapshot: string | null
  member: { profile: { fullName: string; avatarUrl: string | null } }
  gym: { name: string }
  membershipPlan: { name: string } | null
}

const STATUS_STYLE: Record<string,{icon:any,color:string,bg:string}> = {
  COMPLETED: { icon: CheckCircle2, color: "text-green-400",  bg: "bg-green-500/10"  },
  PENDING:   { icon: Clock,        color: "text-yellow-400", bg: "bg-yellow-500/10" },
  FAILED:    { icon: XCircle,      color: "text-red-400",    bg: "bg-red-500/10"    },
}

function fmt(n: number) {
  if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n/1000).toFixed(1)}K`
  return `₹${n.toLocaleString("en-IN")}`
}
function Avatar({ name, url }: { name: string; url?: string | null }) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  if (url) return <img src={url} alt={name} className="w-8 h-8 rounded-full object-cover shrink-0" />
  return <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">{initials}</div>
}

export default function PaymentsPage() {
  const { toast } = useToast()
  const [payments, setPayments] = useState<Payment[]>([])
  const [total, setTotal]       = useState(0)
  const [pages, setPages]       = useState(1)
  const [page, setPage]         = useState(1)
  const [monthTotal, setMonthTotal] = useState(0)
  const [loading, setLoading]   = useState(true)

  // Add payment modal
  const [showModal, setShowModal] = useState(false)
  const [gyms, setGyms]         = useState<any[]>([])
  const [members, setMembers]   = useState<any[]>([])
  const [memberSearch, setMemberSearch] = useState("")
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [plans, setPlans]       = useState<any[]>([])
  const [addForm, setAddForm]   = useState({
    gymId: "", membershipPlanId: "", amount: "",
    paymentMethod: "CASH",
    paymentDate: new Date().toISOString().split("T")[0],
  })
  const [adding, setAdding] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/owner/payments?page=${page}`)
      .then(r => r.json())
      .then(d => { setPayments(d.payments ?? []); setTotal(d.total ?? 0); setPages(d.pages ?? 1); setMonthTotal(d.monthTotal ?? 0) })
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  const openModal = async () => {
    setShowModal(true)
    setSelectedMember(null); setMemberSearch(""); setMembers([])
    setAddForm({ gymId: "", membershipPlanId: "", amount: "", paymentMethod: "CASH", paymentDate: new Date().toISOString().split("T")[0] })
    const g = await fetch("/api/owner/gyms").then(r => r.json())
    setGyms(g)
    if (g.length > 0) setAddForm(p => ({ ...p, gymId: g[0].id }))
  }

  useEffect(() => {
    if (!addForm.gymId || !showModal) return
    fetch(`/api/owner/members?gymId=${addForm.gymId}&page=1&limit=200`)
      .then(r => r.json()).then(d => setMembers(Array.isArray(d.members) ? d.members : []))
    fetch(`/api/owner/plans?gymId=${addForm.gymId}`)
      .then(r => r.json()).then(d => setPlans(Array.isArray(d) ? d : []))
  }, [addForm.gymId, showModal])

  // Auto-fill amount when plan selected
  useEffect(() => {
    if (!addForm.membershipPlanId) return
    const plan = plans.find(p => p.id === addForm.membershipPlanId)
    if (plan) setAddForm(p => ({ ...p, amount: String(plan.price) }))
  }, [addForm.membershipPlanId])

  const addPayment = async () => {
    if (!selectedMember) { toast({ variant: "destructive", title: "Please select a member" }); return }
    if (!addForm.amount)  { toast({ variant: "destructive", title: "Amount is required" }); return }
    setAdding(true)
    const res = await fetch("/api/owner/payments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gymId:            addForm.gymId,
        memberId:         selectedMember.id,
        membershipPlanId: addForm.membershipPlanId || null,
        amount:           parseFloat(addForm.amount),
        paymentMethod:    addForm.paymentMethod,
        paymentDate:      addForm.paymentDate,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      toast({ variant: "success", title: "Payment recorded!", description: `₹${addForm.amount} from ${selectedMember.profile.fullName}` })
      setShowModal(false); load()
    } else {
      toast({ variant: "destructive", title: data.error ?? "Failed to add payment" })
    }
    setAdding(false)
  }

  const filteredMembers = members.filter(m =>
    m.profile.fullName.toLowerCase().includes(memberSearch.toLowerCase())
  )
  const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl"
  const sel = "w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary"

  return (
    <div className="max-w-6xl">
      <PageHeader title="Payments" subtitle="Member fee collection and history" />

      {/* Stats + Add button */}
      <div className="flex items-center gap-4 mb-7 flex-wrap">
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-2.5 bg-primary/10 rounded-xl"><TrendingUp className="w-5 h-5 text-primary" /></div>
          <div>
            <p className="text-white/40 text-xs mb-0.5">This Month</p>
            <p className="text-white text-2xl font-display font-bold">{fmt(monthTotal)}</p>
          </div>
        </div>
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-2.5 bg-white/5 rounded-xl"><CreditCard className="w-5 h-5 text-white/40" /></div>
          <div>
            <p className="text-white/40 text-xs mb-0.5">Total Transactions</p>
            <p className="text-white text-2xl font-display font-bold">{total}</p>
          </div>
        </div>
        <button onClick={openModal} className="ml-auto flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Payment
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_,i) => <div key={i} className="h-16 bg-white/3 rounded-xl animate-pulse" />)}</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16"><CreditCard className="w-10 h-10 text-white/15 mx-auto mb-3" /><p className="text-white/30 text-sm">No payments yet</p></div>
      ) : (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-5 px-5 py-3 border-b border-white/5 text-xs text-white/30 uppercase tracking-wider">
            <span className="col-span-2">Member</span><span>Plan</span><span>Date</span><span className="text-right">Amount</span>
          </div>
          <div className="divide-y divide-white/4">
            {payments.map(p => {
              const s = STATUS_STYLE[p.status] ?? STATUS_STYLE.PENDING
              const Icon = s.icon
              const date = new Date(p.paymentDate ?? p.createdAt)
              return (
                <div key={p.id} className="grid grid-cols-5 items-center px-5 py-4">
                  <div className="col-span-2 flex items-center gap-3 min-w-0">
                    <Avatar name={p.member.profile.fullName} url={p.member.profile.avatarUrl} />
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{p.member.profile.fullName}</p>
                      <p className="text-white/35 text-xs">{p.gym.name}</p>
                    </div>
                  </div>
                  <span className="text-white/55 text-sm truncate">{p.planNameSnapshot ?? p.membershipPlan?.name ?? "—"}</span>
                  <span className="text-white/55 text-sm">{date.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>
                  <div className="flex items-center justify-end gap-2">
                    <div className={`p-1 rounded-lg ${s.bg}`}><Icon className={`w-3.5 h-3.5 ${s.color}`} /></div>
                    <span className="text-white font-semibold text-sm">₹{Number(p.amount).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white disabled:opacity-30 text-sm">Previous</button>
          <span className="text-white/30 text-sm">{page} / {pages}</span>
          <button disabled={page===pages} onClick={() => setPage(p=>p+1)} className="px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white disabled:opacity-30 text-sm">Next</button>
        </div>
      )}

      {/* Add Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[hsl(220_25%_10%)] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-display font-bold text-lg">Add Payment</h3>
              <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Gym */}
            <div className="space-y-1.5">
              <Label className="text-white/55 text-sm">Gym</Label>
              <select value={addForm.gymId} onChange={e => setAddForm(p => ({ ...p, gymId: e.target.value, membershipPlanId: "", amount: "" }))} className={sel}>
                {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            {/* Member search */}
            <div className="space-y-2">
              <Label className="text-white/55 text-sm">Member</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <Input value={memberSearch} onChange={e => { setMemberSearch(e.target.value); setSelectedMember(null) }} placeholder="Search member..." className={`${inp} pl-9`} />
              </div>
              {memberSearch && !selectedMember && filteredMembers.length > 0 && (
                <div className="bg-[hsl(220_25%_13%)] border border-white/10 rounded-xl overflow-hidden max-h-36 overflow-y-auto">
                  {filteredMembers.slice(0,6).map(m => (
                    <button key={m.id} type="button" onClick={() => { setSelectedMember(m); setMemberSearch(m.profile.fullName) }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left">
                      <Avatar name={m.profile.fullName} url={m.profile.avatarUrl} />
                      <span className="text-white text-sm">{m.profile.fullName}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedMember && (
                <div className="flex items-center gap-3 p-3 bg-primary/8 border border-primary/20 rounded-xl">
                  <Avatar name={selectedMember.profile.fullName} url={selectedMember.profile.avatarUrl} />
                  <span className="text-white text-sm font-medium">{selectedMember.profile.fullName}</span>
                </div>
              )}
            </div>

            {/* Plan */}
            <div className="space-y-1.5">
              <Label className="text-white/55 text-sm">Membership Plan <span className="text-white/30">(optional)</span></Label>
              <select value={addForm.membershipPlanId} onChange={e => setAddForm(p => ({ ...p, membershipPlanId: e.target.value }))} className={sel}>
                <option value="">No specific plan</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ₹{Number(p.price).toLocaleString("en-IN")}</option>)}
              </select>
            </div>

            {/* Amount + method + date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Amount (₹) *</Label>
                <Input type="number" value={addForm.amount} onChange={e => setAddForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Payment Method</Label>
                <select value={addForm.paymentMethod} onChange={e => setAddForm(p => ({ ...p, paymentMethod: e.target.value }))} className={sel}>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/55 text-sm">Payment Date</Label>
              <Input type="date" value={addForm.paymentDate} onChange={e => setAddForm(p => ({ ...p, paymentDate: e.target.value }))} className={inp} />
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 border-white/10 text-white/60 hover:text-white h-11">Cancel</Button>
              <Button onClick={addPayment} disabled={adding || !selectedMember} className="flex-1 bg-gradient-primary hover:opacity-90 text-white h-11">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Record Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
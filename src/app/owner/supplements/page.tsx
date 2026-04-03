// // src/app/owner/supplements/page.tsx
// "use client"

// import { useSubscription } from "@/contexts/SubscriptionContext"
// import { PlanGate } from "@/components/owner/PlanGate"
// import { PageHeader } from "@/components/owner/PageHeader"
// import { useEffect, useState, useCallback } from "react"
// import { useToast } from "@/hooks/use-toast"
// import {
//   ShoppingBag, Plus, Search, Package, AlertTriangle,
//   Loader2, ChevronDown, Edit2, Trash2, TrendingUp
// } from "lucide-react"
// import { UpgradeButton } from "@/components/owner/PlanGate"

// function fmt(n: number) { return `₹${Number(n).toLocaleString("en-IN")}` }

// interface Supplement {
//   id: string; name: string; brand: string | null; category: string | null
//   unitSize: string | null; price: number; stockQty: number; lowStockAt: number
//   isActive: boolean; gym: { name: string }; _count: { sales: number }
// }

// export default function SupplementsPage() {
//   const { hasSupplements, isExpired } = useSubscription()

//   const { toast } = useToast()
//   const [items, setItems] = useState<Supplement[]>([])
//   const [gyms, setGyms] = useState<{ id: string; name: string }[]>([])
//   const [gymId, setGymId] = useState("")
//   const [search, setSearch] = useState("")
//   const [loading, setLoading] = useState(true)
//   const [showForm, setShowForm] = useState(false)
//   const [saving, setSaving] = useState(false)
//   const [form, setForm] = useState({
//     name: "", brand: "", category: "", unitSize: "",
//     price: "", costPrice: "", stockQty: "0", lowStockAt: "5",
//   })

//   const load = useCallback(() => {
//     setLoading(true)
//     const params = new URLSearchParams()
//     if (gymId) params.set("gymId", gymId)
//     if (search) params.set("search", search)
//     fetch(`/api/owner/supplements?${params}`)
//       .then(r => r.json()).then(setItems).catch(() => { }).finally(() => setLoading(false))
//   }, [gymId, search])

//   useEffect(() => {
//     fetch("/api/owner/gyms").then(r => r.json()).then(g => { if (Array.isArray(g)) setGyms(g) })
//   }, [])
//   useEffect(() => { if (hasSupplements) load() }, [load, hasSupplements])

//   const save = async () => {
//     if (!form.name.trim() || !form.price || !gymId) {
//       toast({ variant: "destructive", title: "Name, price and gym are required" }); return
//     }
//     setSaving(true)
//     const res = await fetch("/api/owner/supplements", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ ...form, gymId, price: parseFloat(form.price) }),
//     })
//     const data = await res.json()
//     if (res.ok) {
//       toast({ variant: "success", title: "Supplement added!" })
//       setShowForm(false)
//       setForm({ name: "", brand: "", category: "", unitSize: "", price: "", costPrice: "", stockQty: "0", lowStockAt: "5" })
//       load()
//     } else {
//       toast({ variant: "destructive", title: data.error ?? "Failed to add" })
//     }
//     setSaving(false)
//   }

//   return (
//     <div className="max-w-5xl space-y-6">
//       <PageHeader title="Supplements" subtitle="Manage your gym's supplement inventory" />

//       <PlanGate allowed={hasSupplements && !isExpired} featureLabel="Supplement Management">
//         <div className="space-y-5">
//           {/* Controls */}
//           <div className="flex flex-wrap items-center gap-3">
//             {gyms.length > 1 && (
//               <div className="relative">
//                 <select value={gymId} onChange={e => setGymId(e.target.value)}
//                   className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white/70 rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none cursor-pointer">
//                   <option value="">All Gyms</option>
//                   {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
//                 </select>
//                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
//               </div>
//             )}
//             <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 h-10 flex-1 max-w-xs">
//               <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
//               <input
//                 value={search} onChange={e => setSearch(e.target.value)}
//                 placeholder="Search supplements..."
//                 className="bg-transparent text-sm text-white placeholder:text-white/25 outline-none w-full"
//               />
//             </div>
//             {gyms.length > 0 && (
//               <button onClick={() => { setGymId(gyms[0].id); setShowForm(true) }}
//                 className="ml-auto flex items-center gap-2 bg-gradient-to-r from-primary to-orange-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all">
//                 <Plus className="w-4 h-4" /> Add Supplement
//               </button>
//             )}
//           </div>

//           {/* Add form */}
//           {showForm && (
//             <div className="bg-[hsl(220_25%_9%)] border border-white/8 rounded-2xl p-5 space-y-4">
//               <h3 className="text-white font-semibold text-sm">New Supplement</h3>
//               <div className="grid sm:grid-cols-2 gap-4">
//                 {[
//                   { label: "Name *", key: "name", type: "text" },
//                   { label: "Brand", key: "brand", type: "text" },
//                   { label: "Category", key: "category", type: "text" },
//                   { label: "Unit Size", key: "unitSize", type: "text" },
//                   { label: "Price (₹) *", key: "price", type: "number" },
//                   { label: "Cost Price", key: "costPrice", type: "number" },
//                   { label: "Stock Qty", key: "stockQty", type: "number" },
//                   { label: "Low Stock At", key: "lowStockAt", type: "number" },
//                 ].map(f => (
//                   <div key={f.key}>
//                     <label className="text-white/50 text-xs mb-1 block">{f.label}</label>
//                     <input
//                       type={f.type}
//                       value={(form as any)[f.key]}
//                       onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
//                       className="w-full bg-[hsl(220_25%_13%)] border border-white/10 text-white rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary/50"
//                     />
//                   </div>
//                 ))}
//               </div>
//               <div className="flex gap-3 pt-1">
//                 <button onClick={save} disabled={saving}
//                   className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all">
//                   {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
//                   Save Supplement
//                 </button>
//                 <button onClick={() => setShowForm(false)}
//                   className="text-white/40 text-sm px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all">
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* List */}
//           {loading ? (
//             <div className="flex items-center justify-center h-32">
//               <Loader2 className="w-5 h-5 text-primary animate-spin" />
//             </div>
//           ) : items.length === 0 ? (
//             <div className="text-center py-16 text-white/30">
//               <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
//               <p>No supplements yet. Add your first one.</p>
//             </div>
//           ) : (
//             <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
//               {items.map(s => (
//                 <div key={s.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4 space-y-3">
//                   <div className="flex items-start justify-between gap-2">
//                     <div>
//                       <p className="text-white font-semibold text-sm">{s.name}</p>
//                       {s.brand && <p className="text-white/40 text-xs">{s.brand}</p>}
//                     </div>
//                     <span className="text-primary font-bold text-sm shrink-0">{fmt(s.price)}</span>
//                   </div>
//                   {s.category && (
//                     <span className="inline-block text-[10px] bg-white/5 text-white/40 border border-white/8 px-2 py-0.5 rounded-full">
//                       {s.category}
//                     </span>
//                   )}
//                   <div className="flex items-center justify-between text-xs">
//                     <span className={`font-medium ${s.stockQty <= s.lowStockAt ? "text-red-400" : "text-white/60"}`}>
//                       {s.stockQty <= s.lowStockAt && <AlertTriangle className="w-3 h-3 inline mr-1" />}
//                       Stock: {s.stockQty}
//                     </span>
//                     <span className="text-white/30 flex items-center gap-1">
//                       <TrendingUp className="w-3 h-3" /> {s._count.sales} sold
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </PlanGate>
//     </div>
//   )
// }




// src/app/owner/supplements/page.tsx
"use client"

import { useSubscription }   from "@/contexts/SubscriptionContext"
import { PlanGate }          from "@/components/owner/PlanGate"
import { PageHeader }        from "@/components/owner/PageHeader"
import { useEffect, useState, useCallback, useRef } from "react"
import { useToast }          from "@/hooks/use-toast"
import {
  ShoppingBag, Plus, Search, AlertTriangle, Loader2,
  ChevronDown, TrendingUp, ShoppingCart, Package,
  IndianRupee, X, User, Hash, ChevronLeft, ChevronRight,
  BarChart3, Receipt,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────
interface Supplement {
  id: string; name: string; brand: string | null; category: string | null
  unitSize: string | null; price: number; stockQty: number; lowStockAt: number
  isActive: boolean; gym: { name: string }; _count: { sales: number }
}

interface Sale {
  id: string; qty: number; unitPrice: number; totalAmount: number
  memberName: string | null; paymentMethod: string; soldAt: string; notes: string | null
  supplement: { name: string; unitSize: string | null; category: string | null }
  member:     { profile: { fullName: string; avatarUrl: string | null } } | null
  gym:        { name: string }
}

interface SalesResponse {
  sales:          Sale[]
  total:          number
  pages:          number
  totalRevenue:   number
  totalUnitsSold: number
  totalSales:     number
}

interface Member {
  id: string
  profile: { fullName: string; avatarUrl: string | null }
}

// ── Constants ─────────────────────────────────────────────────────────────────
const RANGES = [
  { value: "today",         label: "Today"          },
  { value: "this_week",     label: "This Week"       },
  { value: "last_week",     label: "Last Week"       },
  { value: "this_month",    label: "This Month"      },
  { value: "last_month",    label: "Last Month"      },
  { value: "last_3_months", label: "Last 3 Months"   },
  { value: "last_6_months", label: "Last 6 Months"   },
  { value: "last_year",     label: "Last Year"       },
  { value: "all",           label: "All Time"        },
]

const PAYMENT_METHODS = ["CASH", "UPI", "CARD", "ONLINE", "OTHER"]

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function StockBadge({ qty, threshold }: { qty: number; threshold: number }) {
  if (qty === 0)              return <span className="text-red-400 font-medium text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Out of stock</span>
  if (qty <= threshold)       return <span className="text-yellow-400 font-medium text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Low: {qty}</span>
  return <span className="text-white/50 text-xs">Stock: {qty}</span>
}

// ── Sell Modal ────────────────────────────────────────────────────────────────
function SellModal({
  supplement, gymId, gyms, onClose, onSuccess,
}: {
  supplement: Supplement
  gymId:      string
  gyms:       { id: string; name: string }[]
  onClose:    () => void
  onSuccess:  () => void
}) {
  const { toast } = useToast()

  const [qty,         setQty]         = useState("1")
  const [memberQuery, setMemberQuery] = useState("")
  const [members,     setMembers]     = useState<Member[]>([])
  const [selMember,   setSelMember]   = useState<Member | null>(null)
  const [showDrop,    setShowDrop]    = useState(false)
  const [unitPrice,   setUnitPrice]   = useState(String(supplement.price))
  const [payMethod,   setPayMethod]   = useState("CASH")
  const [notes,       setNotes]       = useState("")
  const [saving,      setSaving]      = useState(false)
  const dropRef                       = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowDrop(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Debounced member search
  useEffect(() => {
    if (!memberQuery.trim()) { setMembers([]); return }
    const t = setTimeout(() => {
      const params = new URLSearchParams({ search: memberQuery, status: "ACTIVE" })
      if (gymId) params.set("gymId", gymId)
      fetch(`/api/owner/members?${params}`)
        .then(r => r.json())
        .then(d => setMembers(Array.isArray(d?.members) ? d.members : []))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [memberQuery, gymId])

  // Auto-recalculate total preview
  const total   = (parseFloat(unitPrice) || 0) * (parseInt(qty) || 0)
  const qtyNum  = parseInt(qty) || 0
  const overStock = qtyNum > supplement.stockQty

  const handleSell = async () => {
    if (!qtyNum || qtyNum <= 0) {
      toast({ variant: "destructive", title: "Quantity must be at least 1" }); return
    }
    if (overStock) {
      toast({ variant: "destructive", title: `Only ${supplement.stockQty} units in stock` }); return
    }
    if (!parseFloat(unitPrice)) {
      toast({ variant: "destructive", title: "Price must be greater than 0" }); return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/owner/supplements/sell", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplementId:  supplement.id,
          gymId:         gymId || supplement.gym?.name, // fallback if no gymId set
          memberId:      selMember?.id      || null,
          memberName:    selMember
            ? selMember.profile.fullName
            : memberQuery.trim() || null,
          qty:           qtyNum,
          unitPrice:     parseFloat(unitPrice),
          paymentMethod: payMethod,
          notes:         notes.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ variant: "destructive", title: data.error ?? "Sale failed" }); return
      }
      toast({ variant: "success", title: "Sale recorded!", description: `${supplement.name} × ${qtyNum} — ${fmt(total)}` })
      onSuccess()
      onClose()
    } catch {
      toast({ variant: "destructive", title: "Network error. Please try again." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[hsl(220_25%_10%)] pb-4 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <h2 className="text-white font-semibold">Sell Supplement</h2>
            <p className="text-white/40 text-xs mt-0.5">
              {supplement.name}{supplement.brand ? ` · ${supplement.brand}` : ""}
              {supplement.unitSize ? ` · ${supplement.unitSize}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Stock indicator */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">Available stock</span>
            <StockBadge qty={supplement.stockQty} threshold={supplement.lowStockAt} />
          </div>

          {/* Quantity */}
          <div>
            <label className="text-white/50 text-xs mb-1.5 flex items-center gap-1.5">
              <Hash className="w-3 h-3" /> Quantity *
            </label>
            <input
              type="number" min="1" max={supplement.stockQty}
              value={qty}
              onChange={e => setQty(e.target.value)}
              className={`w-full bg-[hsl(220_25%_13%)] border rounded-xl px-4 h-11 text-white text-sm focus:outline-none transition-colors ${
                overStock ? "border-red-500/60 focus:border-red-500" : "border-white/10 focus:border-primary/50"
              }`}
            />
            {overStock && (
              <p className="text-red-400 text-xs mt-1">
                Max available: {supplement.stockQty} units
              </p>
            )}
          </div>

          {/* Unit Price (pre-filled, editable) */}
          <div>
            <label className="text-white/50 text-xs mb-1.5 flex items-center gap-1.5">
              <IndianRupee className="w-3 h-3" /> Price per unit *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">₹</span>
              <input
                type="number" min="0" step="0.01"
                value={unitPrice}
                onChange={e => setUnitPrice(e.target.value)}
                className="w-full bg-[hsl(220_25%_13%)] border border-white/10 rounded-xl pl-8 pr-4 h-11 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            {Number(unitPrice) !== supplement.price && (
              <p className="text-white/30 text-xs mt-1">
                Listed price: {fmt(supplement.price)}
              </p>
            )}
          </div>

          {/* Member name (optional — with autocomplete) */}
          <div ref={dropRef}>
            <label className="text-white/50 text-xs mb-1.5 flex items-center gap-1.5">
              <User className="w-3 h-3" /> Member name
              <span className="text-white/25">(optional — leave blank for walk-in)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={selMember ? selMember.profile.fullName : memberQuery}
                onChange={e => {
                  setSelMember(null)
                  setMemberQuery(e.target.value)
                  setShowDrop(true)
                }}
                onFocus={() => memberQuery && setShowDrop(true)}
                placeholder="Type name or leave blank for walk-in"
                className="w-full bg-[hsl(220_25%_13%)] border border-white/10 rounded-xl px-4 h-11 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-primary/50 transition-colors"
              />
              {selMember && (
                <button
                  onClick={() => { setSelMember(null); setMemberQuery("") }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Dropdown */}
              {showDrop && members.length > 0 && !selMember && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-[hsl(220_25%_13%)] border border-white/10 rounded-xl shadow-xl z-10 overflow-hidden max-h-48 overflow-y-auto">
                  {members.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setSelMember(m); setMemberQuery(""); setShowDrop(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                        {m.profile.fullName[0].toUpperCase()}
                      </div>
                      <span className="text-white text-sm truncate">{m.profile.fullName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="text-white/50 text-xs mb-1.5 block">Payment Method</label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m}
                  onClick={() => setPayMethod(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    payMethod === m
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-white/5 border-white/8 text-white/50 hover:border-white/20"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-white/50 text-xs mb-1.5 block">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Bulk discount applied"
              className="w-full bg-[hsl(220_25%_13%)] border border-white/10 rounded-xl px-4 h-10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Total preview */}
          {qtyNum > 0 && parseFloat(unitPrice) > 0 && (
            <div className="bg-primary/8 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-white/60 text-sm">Total amount</span>
              <span className="text-primary font-bold text-lg">{fmt(total)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleSell}
            disabled={saving || overStock || !qtyNum || qtyNum <= 0}
            className="flex-1 flex items-center justify-center gap-2 bg-linear-to-r from-primary to-orange-400 text-white text-sm font-semibold h-11 rounded-xl hover:opacity-90 disabled:opacity-40 transition-all"
          >
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><ShoppingCart className="w-4 h-4" /> Record Sale</>}
          </button>
          <button
            onClick={onClose}
            className="px-5 h-11 text-white/40 text-sm rounded-xl hover:bg-white/5 hover:text-white/60 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Inventory Tab ─────────────────────────────────────────────────────────────
function InventoryTab({
  items, loading, gyms, gymId, setGymId, search, setSearch,
  showForm, setShowForm, form, setForm, saving, save,
  onSellClick,
}: any) {
  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {gyms.length > 1 && (
          <div className="relative">
            <select value={gymId} onChange={e => setGymId(e.target.value)}
              className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white/70 rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none cursor-pointer">
              <option value="">All Gyms</option>
              {gyms.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>
        )}
        <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 h-10 flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search supplements..."
            className="bg-transparent text-sm text-white placeholder:text-white/25 outline-none w-full"
          />
        </div>
        {gyms.length > 0 && (
          <button
            onClick={() => { if (!gymId) setGymId(gyms[0].id); setShowForm(true) }}
            className="ml-auto flex items-center gap-2 bg-linear-to-r from-primary to-orange-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Add Supplement
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/8 rounded-2xl p-5 space-y-4">
          <h3 className="text-white font-semibold text-sm">New Supplement</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: "Name *",       key: "name",      type: "text"   },
              { label: "Brand",        key: "brand",     type: "text"   },
              { label: "Category",     key: "category",  type: "text"   },
              { label: "Unit Size",    key: "unitSize",  type: "text"   },
              { label: "Price (₹) *",  key: "price",     type: "number" },
              { label: "Cost Price",   key: "costPrice", type: "number" },
              { label: "Stock Qty",    key: "stockQty",  type: "number" },
              { label: "Low Stock At", key: "lowStockAt",type: "number" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-white/50 text-xs mb-1 block">{f.label}</label>
                <input
                  type={f.type}
                  value={(form as any)[f.key]}
                  onChange={e => setForm((prev: any) => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full bg-[hsl(220_25%_13%)] border border-white/10 text-white rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary/50"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Save Supplement
            </button>
            <button onClick={() => setShowForm(false)}
              className="text-white/40 text-sm px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Inventory grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No supplements yet. Add your first one.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((s: Supplement) => (
            <div key={s.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4 space-y-3 group">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{s.name}</p>
                  {s.brand && <p className="text-white/40 text-xs">{s.brand}</p>}
                </div>
                <span className="text-primary font-bold text-sm shrink-0">{fmt(s.price)}</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {s.category && (
                  <span className="text-[10px] bg-white/5 text-white/40 border border-white/8 px-2 py-0.5 rounded-full">
                    {s.category}
                  </span>
                )}
                {s.unitSize && (
                  <span className="text-[10px] bg-white/5 text-white/35 border border-white/8 px-2 py-0.5 rounded-full">
                    {s.unitSize}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <StockBadge qty={s.stockQty} threshold={s.lowStockAt} />
                <span className="text-white/30 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {s._count.sales} sold
                </span>
              </div>

              {/* Sell button */}
              <button
                onClick={() => onSellClick(s)}
                disabled={s.stockQty === 0}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-white/8 text-white/50 text-xs font-medium hover:border-primary/40 hover:text-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {s.stockQty === 0 ? "Out of Stock" : "Sell"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sales History Tab ─────────────────────────────────────────────────────────
function SalesTab({ gymId, gyms }: { gymId: string; gyms: { id: string; name: string }[] }) {
  const [salesData,    setSalesData]    = useState<SalesResponse | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [range,        setRange]        = useState("this_month")
  const [filterGymId,  setFilterGymId]  = useState(gymId)
  const [page,         setPage]         = useState(1)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ range, page: String(page) })
    if (filterGymId) params.set("gymId", filterGymId)
    fetch(`/api/owner/supplements/sell?${params}`)
      .then(r => r.json())
      .then(setSalesData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [range, filterGymId, page])

  useEffect(() => { setPage(1) }, [range, filterGymId])
  useEffect(() => { load() }, [load])

  const rangeLabel = RANGES.find(r => r.value === range)?.label ?? range

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select value={range} onChange={e => setRange(e.target.value)}
            className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white/80 rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none cursor-pointer">
            {RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
        </div>

        {gyms.length > 1 && (
          <div className="relative">
            <select value={filterGymId} onChange={e => setFilterGymId(e.target.value)}
              className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white/70 rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none cursor-pointer">
              <option value="">All Gyms</option>
              {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>
        )}

        {loading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
      </div>

      {/* Summary cards */}
      {salesData && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Receipt,     label: "Total Sales",   value: String(salesData.totalSales),              color: "text-blue-400",  bg: "bg-blue-500/10"  },
            { icon: Package,     label: "Units Sold",    value: String(salesData.totalUnitsSold),           color: "text-purple-400",bg: "bg-purple-500/10"},
            { icon: IndianRupee, label: "Total Revenue", value: fmt(salesData.totalRevenue),               color: "text-primary",   bg: "bg-primary/10"   },
          ].map(c => (
            <div key={c.label} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-white/35 text-xs">{c.label} · {rangeLabel}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sales table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
      ) : !salesData || salesData.sales.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No sales recorded for {rangeLabel.toLowerCase()}.</p>
        </div>
      ) : (
        <>
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/6">
                    {["Supplement", "Buyer", "Qty", "Unit Price", "Total", "Method", "Date"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-white/30 text-xs font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {salesData.sales.map(sale => (
                    <tr key={sale.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-white/85 font-medium">{sale.supplement.name}</p>
                        {sale.supplement.category && (
                          <p className="text-white/30 text-xs">{sale.supplement.category}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-white/70">
                          {sale.member?.profile.fullName ?? sale.memberName ?? (
                            <span className="text-white/30 italic">Walk-in</span>
                          )}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-white/60">{sale.qty}</td>
                      <td className="px-5 py-3.5 text-white/60">{fmt(sale.unitPrice)}</td>
                      <td className="px-5 py-3.5 text-primary font-semibold">{fmt(sale.totalAmount)}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] bg-white/5 text-white/40 border border-white/8 px-2 py-0.5 rounded-full">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-white/35 text-xs whitespace-nowrap">
                        {fmtDate(sale.soldAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {salesData.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-white/30 text-xs">
                Showing {((page - 1) * 30) + 1}–{Math.min(page * 30, salesData.total)} of {salesData.total} sales
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-white/40 hover:text-white hover:border-white/20 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-white/40 text-sm px-2">{page} / {salesData.pages}</span>
                <button
                  onClick={() => setPage(p => Math.min(salesData.pages, p + 1))}
                  disabled={page === salesData.pages}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-white/40 hover:text-white hover:border-white/20 disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SupplementsPage() {
  const { hasSupplements, isExpired } = useSubscription()
  const { toast }    = useToast()

  // Shared state
  const [activeTab,  setActiveTab]  = useState<"inventory" | "sales">("inventory")
  const [gyms,       setGyms]       = useState<{ id: string; name: string }[]>([])
  const [gymId,      setGymId]      = useState("")

  // Inventory state
  const [items,      setItems]      = useState<Supplement[]>([])
  const [search,     setSearch]     = useState("")
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [form,       setForm]       = useState({
    name: "", brand: "", category: "", unitSize: "",
    price: "", costPrice: "", stockQty: "0", lowStockAt: "5",
  })

  // Sell modal
  const [sellTarget, setSellTarget] = useState<Supplement | null>(null)

  const loadInventory = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (gymId)  params.set("gymId",  gymId)
    if (search) params.set("search", search)
    fetch(`/api/owner/supplements?${params}`)
      .then(r => r.json())
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [gymId, search])

  useEffect(() => {
    fetch("/api/owner/gyms").then(r => r.json()).then(g => { if (Array.isArray(g)) setGyms(g) })
  }, [])

  useEffect(() => {
    if (hasSupplements) loadInventory()
  }, [loadInventory, hasSupplements])

  const save = async () => {
    if (!form.name.trim() || !form.price || !gymId) {
      toast({ variant: "destructive", title: "Name, price and gym are required" }); return
    }
    setSaving(true)
    const res = await fetch("/api/owner/supplements", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, gymId, price: parseFloat(form.price) }),
    })
    const data = await res.json()
    if (res.ok) {
      toast({ variant: "success", title: "Supplement added!" })
      setShowForm(false)
      setForm({ name: "", brand: "", category: "", unitSize: "", price: "", costPrice: "", stockQty: "0", lowStockAt: "5" })
      loadInventory()
    } else {
      toast({ variant: "destructive", title: data.error ?? "Failed to add" })
    }
    setSaving(false)
  }

  const TABS = [
    { id: "inventory", label: "Inventory",     icon: Package      },
    { id: "sales",     label: "Sales History", icon: ShoppingCart },
  ] as const

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader title="Supplements" subtitle="Manage inventory and track sales" />

      <PlanGate allowed={hasSupplements && !isExpired} featureLabel="Supplement Management">
        <div className="space-y-6">

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white/4 rounded-xl p-1 w-fit">
            {TABS.map(tab => {
              const Icon    = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[hsl(220_25%_14%)] text-white shadow-sm border border-white/8"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          {activeTab === "inventory" ? (
            <InventoryTab
              items={items} loading={loading}
              gyms={gyms} gymId={gymId} setGymId={setGymId}
              search={search} setSearch={setSearch}
              showForm={showForm} setShowForm={setShowForm}
              form={form} setForm={setForm}
              saving={saving} save={save}
              onSellClick={(s: Supplement) => {
                if (!gymId && gyms.length > 0) setGymId(gyms[0].id)
                setSellTarget(s)
              }}
            />
          ) : (
            <SalesTab gymId={gymId} gyms={gyms} />
          )}
        </div>
      </PlanGate>

      {/* Sell modal */}
      {sellTarget && (
        <SellModal
          supplement={sellTarget}
          gymId={gymId || (gyms[0]?.id ?? "")}
          gyms={gyms}
          onClose={() => setSellTarget(null)}
          onSuccess={loadInventory}
        />
      )}
    </div>
  )
}
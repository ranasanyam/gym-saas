// // src/app/owner/supplements/page.tsx
// "use client"

// import { useEffect, useState, useCallback } from "react"
// import { useToast } from "@/hooks/use-toast"
// import {
//   Package, Plus, X, Loader2, Edit, Trash2, ShoppingCart,
//   AlertTriangle, ChevronDown, ChevronUp, Search, History,
//   TrendingUp, BarChart2
// } from "lucide-react"
// import { Input }  from "@/components/ui/input"
// import { Label }  from "@/components/ui/label"
// import { Button } from "@/components/ui/button"

// interface Supplement {
//   id: string; gymId: string; name: string; brand: string | null
//   category: string | null; description: string | null; unitSize: string | null
//   price: number; costPrice: number | null; stockQty: number; lowStockAt: number
//   isActive: boolean; createdAt: string
// }

// interface Sale {
//   id: string; qty: number; unitPrice: number; totalAmount: number
//   paymentMethod: string; notes: string | null; soldAt: string; memberName: string | null
//   supplement: { name: string; unitSize: string | null }
//   member: { profile: { fullName: string } } | null
// }

// interface Gym { id: string; name: string }

// const CATEGORIES = ["Protein", "Creatine", "Pre-workout", "Vitamins", "Mass Gainer",
//                     "BCAA", "Omega-3", "Weight Loss", "Energy", "Other"]
// const PAY_METHODS = ["CASH", "UPI", "CARD", "ONLINE"]

// const blankItem = {
//   name: "", brand: "", category: "", description: "",
//   unitSize: "", price: "", costPrice: "", stockQty: "0", lowStockAt: "5",
// }

// const blankSale = { supplementId: "", memberId: "", memberName: "", qty: "1", paymentMethod: "CASH", notes: "" }

// export default function SupplementsPage() {
//   const { toast } = useToast()

//   const [gyms,        setGyms]        = useState<Gym[]>([])
//   const [gymId,       setGymId]       = useState("")
//   const [supplements, setSupplements] = useState<Supplement[]>([])
//   const [sales,       setSales]       = useState<Sale[]>([])
//   const [members,     setMembers]     = useState<any[]>([])

//   const [loading,       setLoading]       = useState(true)
//   const [saving,        setSaving]        = useState(false)
//   const [sellingSave,   setSellingSave]   = useState(false)
//   const [showForm,      setShowForm]      = useState(false)
//   const [showSellForm,  setShowSellForm]  = useState(false)
//   const [showHistory,   setShowHistory]   = useState(false)
//   const [editing,       setEditing]       = useState<Supplement | null>(null)
//   const [search,        setSearch]        = useState("")
//   const [catFilter,     setCatFilter]     = useState("")
//   const [tab,           setTab]           = useState<"inventory" | "history">("inventory")
//   const [form,          setForm]          = useState(blankItem)
//   const [saleForm,      setSaleForm]      = useState(blankSale)
//   const [histPage,      setHistPage]      = useState(1)
//   const [histTotal,     setHistTotal]     = useState(0)

//   useEffect(() => {
//     fetch("/api/owner/gyms").then(r => r.json()).then((g: Gym[]) => {
//       setGyms(g)
//       if (g.length) setGymId(g[0].id)
//     })
//   }, [])

//   const loadSupplements = useCallback(() => {
//     if (!gymId) return
//     setLoading(true)
//     const q = new URLSearchParams({ gymId, ...(search ? { search } : {}), ...(catFilter ? { category: catFilter } : {}) })
//     fetch(`/api/owner/supplements?${q}`).then(r => r.json()).then(d => setSupplements(Array.isArray(d) ? d : [])).finally(() => setLoading(false))
//   }, [gymId, search, catFilter])

//   const loadHistory = useCallback(() => {
//     if (!gymId) return
//     fetch(`/api/owner/supplements/sell?gymId=${gymId}&page=${histPage}`).then(r => r.json()).then(d => { setSales(d.sales ?? []); setHistTotal(d.total ?? 0) })
//   }, [gymId, histPage])

//   const loadMembers = useCallback(() => {
//     if (!gymId) return
//     fetch(`/api/owner/members?gymId=${gymId}&page=1&limit=200`).then(r => r.json()).then(d => setMembers(d.members ?? []))
//   }, [gymId])

//   useEffect(() => { loadSupplements() }, [loadSupplements])
//   useEffect(() => { if (tab === "history") loadHistory() }, [tab, loadHistory])
//   useEffect(() => { loadMembers() }, [loadMembers])

//   // ── Form helpers ──────────────────────────────────────────────────────────
//   const openCreate = () => { setEditing(null); setForm(blankItem); setShowForm(true) }
//   const openEdit   = (s: Supplement) => {
//     setEditing(s)
//     setForm({
//       name: s.name, brand: s.brand ?? "", category: s.category ?? "",
//       description: s.description ?? "", unitSize: s.unitSize ?? "",
//       price: String(s.price), costPrice: s.costPrice ? String(s.costPrice) : "",
//       stockQty: String(s.stockQty), lowStockAt: String(s.lowStockAt),
//     })
//     setShowForm(true)
//     window.scrollTo({ top: 0, behavior: "smooth" })
//   }

//   const saveItem = async () => {
//     if (!form.name.trim() || !form.price) { toast({ variant: "destructive", title: "Name and price are required" }); return }
//     setSaving(true)
//     const payload = {
//       gymId, name: form.name, brand: form.brand || null, category: form.category || null,
//       description: form.description || null, unitSize: form.unitSize || null,
//       price: parseFloat(form.price), costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
//       stockQty: parseInt(form.stockQty || "0"), lowStockAt: parseInt(form.lowStockAt || "5"),
//     }
//     const url    = editing ? `/api/owner/supplements/${editing.id}` : "/api/owner/supplements"
//     const method = editing ? "PATCH" : "POST"
//     const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
//     if (res.ok) {
//       toast({ variant: "success", title: editing ? "Updated!" : "Supplement added!" })
//       setShowForm(false); setEditing(null); loadSupplements()
//     } else {
//       const d = await res.json(); toast({ variant: "destructive", title: d.error ?? "Failed" })
//     }
//     setSaving(false)
//   }

//   const deleteItem = async (id: string) => {
//     if (!confirm("Archive this supplement?")) return
//     await fetch(`/api/owner/supplements/${id}`, { method: "DELETE" })
//     toast({ variant: "success", title: "Supplement archived" }); loadSupplements()
//   }

//   const openSell = (s: Supplement) => {
//     setSaleForm({ ...blankSale, supplementId: s.id })
//     setShowSellForm(true)
//   }

//   const recordSale = async () => {
//     if (!saleForm.supplementId || !saleForm.qty) { toast({ variant: "destructive", title: "Select supplement and quantity" }); return }
//     setSellingSave(true)
//     const res = await fetch("/api/owner/supplements/sell", {
//       method: "POST", headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ ...saleForm, gymId, qty: parseInt(saleForm.qty) }),
//     })
//     const d = await res.json()
//     if (res.ok) {
//       toast({ variant: "success", title: `Sale recorded! ₹${Number(d.totalAmount).toLocaleString("en-IN")}` })
//       setShowSellForm(false); loadSupplements(); if (tab === "history") loadHistory()
//     } else toast({ variant: "destructive", title: d.error ?? "Failed" })
//     setSellingSave(false)
//   }

//   const addStock = async (s: Supplement, qty: number) => {
//     await fetch(`/api/owner/supplements/${s.id}`, {
//       method: "PATCH", headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ stockQty: s.stockQty + qty }),
//     })
//     toast({ variant: "success", title: `Added ${qty} units to ${s.name}` }); loadSupplements()
//   }

//   // ── Derived stats ──────────────────────────────────────────────────────────
//   const totalValue    = supplements.reduce((s, i) => s + Number(i.price) * i.stockQty, 0)
//   const lowStock      = supplements.filter(i => i.stockQty <= i.lowStockAt)
//   const outOfStock    = supplements.filter(i => i.stockQty === 0)
//   const uniqueCats    = [...new Set(supplements.map(s => s.category).filter(Boolean))] as string[]

//   const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl text-sm"
//   const sel = "w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary"

//   return (
//     <div className="max-w-6xl space-y-6">

//       {/* Header */}
//       <div className="flex flex-wrap items-center justify-between gap-3">
//         <div>
//           <h2 className="text-2xl font-display font-bold text-white">Supplements</h2>
//           <p className="text-white/35 text-sm mt-0.5">Inventory management & sales tracking</p>
//         </div>
//         <div className="flex items-center gap-3">
//           {gyms.length > 1 && (
//             <select value={gymId} onChange={e => setGymId(e.target.value)}
//               className="bg-white/5 border border-white/10 text-white/70 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary">
//               {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
//             </select>
//           )}
//           <Button onClick={openCreate} className="bg-gradient-primary hover:opacity-90 text-white h-10 gap-2 text-sm">
//             <Plus className="w-4 h-4" /> Add Item
//           </Button>
//         </div>
//       </div>

//       {/* Stats row */}
//       <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//         {[
//           { label: "Total Items",   value: supplements.length,                icon: Package,      color: "text-blue-400",   bg: "bg-blue-500/10" },
//           { label: "Stock Value",   value: `₹${totalValue.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10" },
//           { label: "Low Stock",     value: lowStock.length,                   icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10" },
//           { label: "Out of Stock",  value: outOfStock.length,                 icon: BarChart2,    color: "text-red-400",    bg: "bg-red-500/10" },
//         ].map(s => (
//           <div key={s.label} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4">
//             <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
//               <s.icon className={`w-4 h-4 ${s.color}`} />
//             </div>
//             <p className="text-white font-bold text-xl">{s.value}</p>
//             <p className="text-white/35 text-xs mt-0.5">{s.label}</p>
//           </div>
//         ))}
//       </div>

//       {/* Sell Form Modal */}
//       {showSellForm && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
//           <div className="bg-[hsl(220_25%_10%)] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
//             <div className="flex items-center justify-between">
//               <h3 className="text-white font-semibold">Record Sale</h3>
//               <button onClick={() => setShowSellForm(false)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
//             </div>
//             <div className="space-y-3">
//               <div className="space-y-1.5">
//                 <Label className="text-white/55 text-sm">Supplement</Label>
//                 <select value={saleForm.supplementId} onChange={e => setSaleForm(p => ({ ...p, supplementId: e.target.value }))} className={sel}>
//                   <option value="">Select supplement</option>
//                   {supplements.map(s => (
//                     <option key={s.id} value={s.id}>{s.name} {s.unitSize ? `(${s.unitSize})` : ""} — {s.stockQty} in stock</option>
//                   ))}
//                 </select>
//               </div>
//               <div className="grid grid-cols-2 gap-3">
//                 <div className="space-y-1.5">
//                   <Label className="text-white/55 text-sm">Quantity</Label>
//                   <Input type="number" min="1" value={saleForm.qty} onChange={e => setSaleForm(p => ({ ...p, qty: e.target.value }))} className={inp} />
//                 </div>
//                 <div className="space-y-1.5">
//                   <Label className="text-white/55 text-sm">Payment</Label>
//                   <select value={saleForm.paymentMethod} onChange={e => setSaleForm(p => ({ ...p, paymentMethod: e.target.value }))} className={sel}>
//                     {PAY_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
//                   </select>
//                 </div>
//               </div>
//               <div className="space-y-1.5">
//                 <Label className="text-white/55 text-sm">Member <span className="text-white/30">(optional)</span></Label>
//                 <select value={saleForm.memberId} onChange={e => setSaleForm(p => ({ ...p, memberId: e.target.value, memberName: "" }))} className={sel}>
//                   <option value="">Walk-in / No member selected</option>
//                   {members.map((m: any) => <option key={m.id} value={m.id}>{m.profile?.fullName}</option>)}
//                 </select>
//               </div>
//               {!saleForm.memberId && (
//                 <div className="space-y-1.5">
//                   <Label className="text-white/55 text-sm">Customer Name <span className="text-white/30">(walk-in)</span></Label>
//                   <Input value={saleForm.memberName} onChange={e => setSaleForm(p => ({ ...p, memberName: e.target.value }))} placeholder="Enter name" className={inp} />
//                 </div>
//               )}
//               <div className="space-y-1.5">
//                 <Label className="text-white/55 text-sm">Notes</Label>
//                 <Input value={saleForm.notes} onChange={e => setSaleForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional" className={inp} />
//               </div>
//               {/* Price preview */}
//               {saleForm.supplementId && saleForm.qty && (
//                 <div className="bg-primary/8 border border-primary/15 rounded-xl px-4 py-3 flex items-center justify-between">
//                   <span className="text-white/55 text-sm">Total</span>
//                   <span className="text-primary font-bold text-lg">
//                     ₹{(Number(supplements.find(s => s.id === saleForm.supplementId)?.price ?? 0) * parseInt(saleForm.qty || "0")).toLocaleString("en-IN")}
//                   </span>
//                 </div>
//               )}
//             </div>
//             <div className="flex gap-3 justify-end">
//               <Button variant="outline" onClick={() => setShowSellForm(false)} className="border-white/10 text-white/60 h-10 text-sm">Cancel</Button>
//               <Button onClick={recordSale} disabled={sellingSave} className="bg-gradient-primary hover:opacity-90 text-white h-10 text-sm px-6">
//                 {sellingSave ? <Loader2 className="w-4 h-4 animate-spin" /> : "Record Sale"}
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Add/Edit Form */}
//       {showForm && (
//         <div className="bg-[hsl(220_25%_9%)] border border-primary/20 rounded-2xl p-6 space-y-4">
//           <div className="flex items-center justify-between">
//             <h3 className="text-white font-semibold">{editing ? "Edit Supplement" : "Add Supplement"}</h3>
//             <button onClick={() => { setShowForm(false); setEditing(null) }} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
//           </div>
//           <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
//             {[
//               { key: "name",        label: "Product Name *",        placeholder: "e.g. Whey Protein" },
//               { key: "brand",       label: "Brand",                  placeholder: "e.g. MuscleBlaze" },
//               { key: "unitSize",    label: "Unit Size",              placeholder: "e.g. 1kg, 60 caps" },
//             ].map(f => (
//               <div key={f.key} className="space-y-1.5">
//                 <Label className="text-white/55 text-sm">{f.label}</Label>
//                 <Input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className={inp} />
//               </div>
//             ))}
//             <div className="space-y-1.5">
//               <Label className="text-white/55 text-sm">Category</Label>
//               <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={sel}>
//                 <option value="">Select category</option>
//                 {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
//               </select>
//             </div>
//             <div className="space-y-1.5">
//               <Label className="text-white/55 text-sm">Selling Price (₹) *</Label>
//               <Input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="1499" className={inp} />
//             </div>
//             <div className="space-y-1.5">
//               <Label className="text-white/55 text-sm">Cost Price (₹)</Label>
//               <Input type="number" value={form.costPrice} onChange={e => setForm(p => ({ ...p, costPrice: e.target.value }))} placeholder="Optional" className={inp} />
//             </div>
//             <div className="space-y-1.5">
//               <Label className="text-white/55 text-sm">Stock Quantity</Label>
//               <Input type="number" value={form.stockQty} onChange={e => setForm(p => ({ ...p, stockQty: e.target.value }))} className={inp} />
//             </div>
//             <div className="space-y-1.5">
//               <Label className="text-white/55 text-sm">Low Stock Alert At</Label>
//               <Input type="number" value={form.lowStockAt} onChange={e => setForm(p => ({ ...p, lowStockAt: e.target.value }))} placeholder="5" className={inp} />
//             </div>
//           </div>
//           <div className="space-y-1.5">
//             <Label className="text-white/55 text-sm">Description</Label>
//             <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Short product description" className={inp} />
//           </div>
//           <div className="flex justify-end gap-3">
//             <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null) }} className="border-white/10 text-white/60 h-10 text-sm">Cancel</Button>
//             <Button onClick={saveItem} disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white h-10 text-sm px-7">
//               {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editing ? "Save Changes" : "Add Supplement"}
//             </Button>
//           </div>
//         </div>
//       )}

//       {/* Tabs */}
//       <div className="flex gap-1 bg-[hsl(220_25%_7%)] border border-white/5 rounded-xl p-1 w-fit">
//         {(["inventory", "history"] as const).map(t => (
//           <button key={t} onClick={() => setTab(t)}
//             className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all flex items-center gap-2 ${
//               tab === t ? "bg-[hsl(220_25%_12%)] text-white" : "text-white/40 hover:text-white/70"
//             }`}>
//             {t === "inventory" ? <Package className="w-4 h-4" /> : <History className="w-4 h-4" />}
//             {t === "inventory" ? "Inventory" : "Sales History"}
//           </button>
//         ))}
//       </div>

//       {/* INVENTORY TAB */}
//       {tab === "inventory" && (
//         <>
//           {/* Low stock alerts */}
//           {lowStock.length > 0 && (
//             <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-2xl p-4">
//               <div className="flex items-center gap-2 mb-2">
//                 <AlertTriangle className="w-4 h-4 text-yellow-400" />
//                 <span className="text-yellow-400 text-sm font-medium">Low Stock Alert</span>
//               </div>
//               <div className="flex flex-wrap gap-2">
//                 {lowStock.map(s => (
//                   <span key={s.id} className="text-xs bg-yellow-500/15 text-yellow-300 px-3 py-1 rounded-full border border-yellow-500/20">
//                     {s.name} — {s.stockQty} left
//                   </span>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Search + filter */}
//           <div className="flex flex-wrap gap-3">
//             <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 flex-1 min-w-50">
//               <Search className="w-4 h-4 text-white/30 shrink-0" />
//               <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search supplements..."
//                 className="bg-transparent text-sm text-white placeholder:text-white/25 outline-none w-full py-2.5" />
//             </div>
//             <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
//               className="bg-white/5 border border-white/8 text-white/60 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary">
//               <option value="">All Categories</option>
//               {(uniqueCats.length ? uniqueCats : CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
//             </select>
//           </div>

//           {loading ? (
//             <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
//               {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-white/3 rounded-2xl animate-pulse" />)}
//             </div>
//           ) : supplements.length === 0 ? (
//             <div className="flex flex-col items-center justify-center h-48 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl gap-3">
//               <Package className="w-10 h-10 text-white/10" />
//               <p className="text-white/30 text-sm">No supplements yet — add your first item</p>
//             </div>
//           ) : (
//             <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
//               {supplements.map(s => (
//                 <SupplementCard
//                   key={s.id} supplement={s}
//                   onEdit={() => openEdit(s)}
//                   onDelete={() => deleteItem(s.id)}
//                   onSell={() => openSell(s)}
//                   onAddStock={(qty) => addStock(s, qty)}
//                 />
//               ))}
//             </div>
//           )}
//         </>
//       )}

//       {/* HISTORY TAB */}
//       {tab === "history" && (
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
//           <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
//             <p className="text-white font-medium text-sm">{histTotal} sales recorded</p>
//           </div>
//           {sales.length === 0 ? (
//             <div className="flex flex-col items-center justify-center py-14 gap-3">
//               <ShoppingCart className="w-10 h-10 text-white/10" />
//               <p className="text-white/30 text-sm">No sales recorded yet</p>
//             </div>
//           ) : (
//             <>
//               <div className="divide-y divide-white/4">
//                 {sales.map(sale => (
//                   <div key={sale.id} className="flex items-center gap-4 px-5 py-4">
//                     <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
//                       <ShoppingCart className="w-4 h-4 text-primary" />
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <p className="text-white text-sm font-medium">{sale.supplement.name}
//                         {sale.supplement.unitSize && <span className="text-white/35 ml-1 text-xs">({sale.supplement.unitSize})</span>}
//                       </p>
//                       <p className="text-white/40 text-xs mt-0.5">
//                         {sale.member?.profile.fullName ?? sale.memberName ?? "Walk-in"}
//                         {" · "}{sale.qty} unit{sale.qty > 1 ? "s" : ""}
//                         {" · "}{sale.paymentMethod}
//                         {" · "}{new Date(sale.soldAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
//                       </p>
//                     </div>
//                     <p className="text-primary font-semibold text-sm">₹{Number(sale.totalAmount).toLocaleString("en-IN")}</p>
//                   </div>
//                 ))}
//               </div>
//               {histTotal > 30 && (
//                 <div className="flex items-center justify-center gap-3 p-4 border-t border-white/5">
//                   <button disabled={histPage === 1} onClick={() => setHistPage(p => p - 1)}
//                     className="px-4 py-2 rounded-xl bg-white/5 text-white/50 text-sm disabled:opacity-30 hover:bg-white/10 transition-all">Prev</button>
//                   <span className="text-white/30 text-sm">Page {histPage}</span>
//                   <button disabled={histPage * 30 >= histTotal} onClick={() => setHistPage(p => p + 1)}
//                     className="px-4 py-2 rounded-xl bg-white/5 text-white/50 text-sm disabled:opacity-30 hover:bg-white/10 transition-all">Next</button>
//                 </div>
//               )}
//             </>
//           )}
//         </div>
//       )}
//     </div>
//   )
// }

// function SupplementCard({ supplement: s, onEdit, onDelete, onSell, onAddStock }: {
//   supplement: Supplement
//   onEdit: () => void; onDelete: () => void; onSell: () => void
//   onAddStock: (qty: number) => void
// }) {
//   const [addQty, setAddQty]     = useState("")
//   const [showAdd, setShowAdd]   = useState(false)
//   const isLow     = s.stockQty <= s.lowStockAt && s.stockQty > 0
//   const isOut     = s.stockQty === 0
//   const margin    = s.costPrice ? ((Number(s.price) - Number(s.costPrice)) / Number(s.costPrice) * 100).toFixed(0) : null

//   const stockColor = isOut ? "text-red-400 bg-red-500/10" : isLow ? "text-yellow-400 bg-yellow-500/10" : "text-green-400 bg-green-500/10"

//   return (
//     <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 flex flex-col gap-3 hover:border-white/12 transition-all">
//       <div className="flex items-start justify-between">
//         <div className="flex-1 min-w-0">
//           <h3 className="text-white font-semibold truncate">{s.name}</h3>
//           {s.brand && <p className="text-white/40 text-xs">{s.brand}</p>}
//         </div>
//         {s.category && (
//           <span className="text-xs bg-white/6 text-white/40 px-2.5 py-1 rounded-full border border-white/8 ml-2 shrink-0">{s.category}</span>
//         )}
//       </div>

//       <div className="flex items-center justify-between">
//         <div>
//           <p className="text-2xl font-display font-bold text-white">₹{Number(s.price).toLocaleString("en-IN")}</p>
//           {s.unitSize && <p className="text-white/30 text-xs">{s.unitSize}</p>}
//           {margin && <p className="text-primary/60 text-xs mt-0.5">{margin}% margin</p>}
//         </div>
//         <span className={`text-sm font-semibold px-3 py-1.5 rounded-xl ${stockColor}`}>
//           {isOut ? "Out of stock" : `${s.stockQty} in stock`}
//         </span>
//       </div>

//       {s.description && <p className="text-white/35 text-xs line-clamp-2">{s.description}</p>}

//       {/* Add stock inline */}
//       {showAdd ? (
//         <div className="flex gap-2">
//           <Input type="number" min="1" value={addQty} onChange={e => setAddQty(e.target.value)}
//             placeholder="Qty to add" className="bg-white/5 border-white/10 text-white focus:border-primary focus-visible:ring-0 h-9 rounded-xl text-sm flex-1" />
//           <button onClick={() => { if (addQty) { onAddStock(parseInt(addQty)); setAddQty(""); setShowAdd(false) } }}
//             className="px-3 h-9 bg-green-500/20 text-green-400 rounded-xl text-xs hover:bg-green-500/30 transition-all">Add</button>
//           <button onClick={() => setShowAdd(false)} className="px-2 h-9 text-white/30 hover:text-white"><X className="w-3.5 h-3.5" /></button>
//         </div>
//       ) : (
//         <button onClick={() => setShowAdd(true)}
//           className="w-full py-2 rounded-xl border border-dashed border-white/10 text-white/30 hover:border-white/25 hover:text-white/50 text-xs transition-all">
//           + Add Stock
//         </button>
//       )}

//       <div className="flex gap-1.5 border-t border-white/5 pt-3">
//         <button onClick={onSell} disabled={isOut}
//           className="flex-1 flex items-center justify-center gap-1.5 text-xs text-primary hover:text-primary/80 py-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
//           <ShoppingCart className="w-3.5 h-3.5" /> Sell
//         </button>
//         <button onClick={onEdit}
//           className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white/50 hover:text-white py-2 transition-colors">
//           <Edit className="w-3.5 h-3.5" /> Edit
//         </button>
//         <button onClick={onDelete}
//           className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-400/50 hover:text-red-400 py-2 transition-colors">
//           <Trash2 className="w-3.5 h-3.5" /> Remove
//         </button>
//       </div>
//     </div>
//   )
// }

// src/app/owner/supplements/page.tsx
"use client"

import { useSubscription } from "@/contexts/SubscriptionContext"
import { PlanGate } from "@/components/owner/PlanGate"
import { PageHeader } from "@/components/owner/PageHeader"
import { useEffect, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  ShoppingBag, Plus, Search, Package, AlertTriangle,
  Loader2, ChevronDown, Edit2, Trash2, TrendingUp
} from "lucide-react"
import { UpgradeButton } from "@/components/owner/PlanGate"

function fmt(n: number) { return `₹${Number(n).toLocaleString("en-IN")}` }

interface Supplement {
  id: string; name: string; brand: string | null; category: string | null
  unitSize: string | null; price: number; stockQty: number; lowStockAt: number
  isActive: boolean; gym: { name: string }; _count: { sales: number }
}

export default function SupplementsPage() {
  const { hasSupplements, isExpired } = useSubscription()

  const { toast } = useToast()
  const [items, setItems] = useState<Supplement[]>([])
  const [gyms, setGyms] = useState<{ id: string; name: string }[]>([])
  const [gymId, setGymId] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "", brand: "", category: "", unitSize: "",
    price: "", costPrice: "", stockQty: "0", lowStockAt: "5",
  })

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (gymId) params.set("gymId", gymId)
    if (search) params.set("search", search)
    fetch(`/api/owner/supplements?${params}`)
      .then(r => r.json()).then(setItems).catch(() => { }).finally(() => setLoading(false))
  }, [gymId, search])

  useEffect(() => {
    fetch("/api/owner/gyms").then(r => r.json()).then(g => { if (Array.isArray(g)) setGyms(g) })
  }, [])
  useEffect(() => { if (hasSupplements) load() }, [load, hasSupplements])

  const save = async () => {
    if (!form.name.trim() || !form.price || !gymId) {
      toast({ variant: "destructive", title: "Name, price and gym are required" }); return
    }
    setSaving(true)
    const res = await fetch("/api/owner/supplements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, gymId, price: parseFloat(form.price) }),
    })
    const data = await res.json()
    if (res.ok) {
      toast({ variant: "success", title: "Supplement added!" })
      setShowForm(false)
      setForm({ name: "", brand: "", category: "", unitSize: "", price: "", costPrice: "", stockQty: "0", lowStockAt: "5" })
      load()
    } else {
      toast({ variant: "destructive", title: data.error ?? "Failed to add" })
    }
    setSaving(false)
  }

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader title="Supplements" subtitle="Manage your gym's supplement inventory" />

      <PlanGate allowed={hasSupplements && !isExpired} featureLabel="Supplement Management">
        <div className="space-y-5">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {gyms.length > 1 && (
              <div className="relative">
                <select value={gymId} onChange={e => setGymId(e.target.value)}
                  className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white/70 rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none cursor-pointer">
                  <option value="">All Gyms</option>
                  {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
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
              <button onClick={() => { setGymId(gyms[0].id); setShowForm(true) }}
                className="ml-auto flex items-center gap-2 bg-gradient-to-r from-primary to-orange-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all">
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
                  { label: "Name *", key: "name", type: "text" },
                  { label: "Brand", key: "brand", type: "text" },
                  { label: "Category", key: "category", type: "text" },
                  { label: "Unit Size", key: "unitSize", type: "text" },
                  { label: "Price (₹) *", key: "price", type: "number" },
                  { label: "Cost Price", key: "costPrice", type: "number" },
                  { label: "Stock Qty", key: "stockQty", type: "number" },
                  { label: "Low Stock At", key: "lowStockAt", type: "number" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-white/50 text-xs mb-1 block">{f.label}</label>
                    <input
                      type={f.type}
                      value={(form as any)[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
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

          {/* List */}
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
              {items.map(s => (
                <div key={s.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-white font-semibold text-sm">{s.name}</p>
                      {s.brand && <p className="text-white/40 text-xs">{s.brand}</p>}
                    </div>
                    <span className="text-primary font-bold text-sm shrink-0">{fmt(s.price)}</span>
                  </div>
                  {s.category && (
                    <span className="inline-block text-[10px] bg-white/5 text-white/40 border border-white/8 px-2 py-0.5 rounded-full">
                      {s.category}
                    </span>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${s.stockQty <= s.lowStockAt ? "text-red-400" : "text-white/60"}`}>
                      {s.stockQty <= s.lowStockAt && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                      Stock: {s.stockQty}
                    </span>
                    <span className="text-white/30 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {s._count.sales} sold
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PlanGate>
    </div>
  )
}
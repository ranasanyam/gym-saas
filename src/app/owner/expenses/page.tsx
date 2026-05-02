// src/app/owner/expenses/page.tsx
"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { PlanGate } from "@/components/owner/PlanGate"
import { PageHeader } from "@/components/owner/PageHeader"
import { AppSelect } from "@/components/ui/AppSelect"
import {
  Receipt, Plus, Trash2, Pencil, Loader2,
  TrendingDown, X, Calendar, ChevronDown,
} from "lucide-react"
import { Pagination } from "@/components/ui/Pagination"

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toLocaleString("en-IN")}`
}

const CATEGORIES = [
  "ELECTRICITY","WATER","RENT","EQUIPMENT_PURCHASE","EQUIPMENT_MAINTENANCE",
  "STAFF_SALARY","MARKETING","CLEANING","INSURANCE","INTERNET","SOFTWARE","MISCELLANEOUS",
]

const CATEGORY_LABELS: Record<string, string> = {
  ELECTRICITY:"Electricity", WATER:"Water", RENT:"Rent",
  EQUIPMENT_PURCHASE:"Equipment Purchase", EQUIPMENT_MAINTENANCE:"Equipment Maintenance",
  STAFF_SALARY:"Staff Salary", MARKETING:"Marketing", CLEANING:"Cleaning",
  INSURANCE:"Insurance", INTERNET:"Internet", SOFTWARE:"Software",
  MISCELLANEOUS:"Miscellaneous",
}

const CATEGORY_COLORS: Record<string, string> = {
  ELECTRICITY:"bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  WATER:"bg-blue-500/20 text-blue-400 border-blue-500/30",
  RENT:"bg-purple-500/20 text-purple-400 border-purple-500/30",
  EQUIPMENT_PURCHASE:"bg-orange-500/20 text-orange-400 border-orange-500/30",
  EQUIPMENT_MAINTENANCE:"bg-red-500/20 text-red-400 border-red-500/30",
  STAFF_SALARY:"bg-green-500/20 text-green-400 border-green-500/30",
  MARKETING:"bg-pink-500/20 text-pink-400 border-pink-500/30",
  CLEANING:"bg-teal-500/20 text-teal-400 border-teal-500/30",
  INSURANCE:"bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  INTERNET:"bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  SOFTWARE:"bg-violet-500/20 text-violet-400 border-violet-500/30",
  MISCELLANEOUS:"bg-white/10 text-white/60 border-white/20",
}

const RANGES = [
  { key: "today",          label: "Today"                    },
  { key: "last_7_days",    label: "Last 7 Days"              },
  { key: "last_30_days",   label: "Last 30 Days"             },
  { key: "last_90_days",   label: "This Quarter (90 days)"   },
  { key: "financial_year", label: "Financial Year (Apr–Mar)" },
  { key: "custom",         label: "Custom Range"             },
]

interface Expense {
  id: string; 
  title: string; 
  amount: number; 
  category: string
  description: string | null; 
  expenseDate: string; 
  receiptUrl: string | null
  gym: { 
    name: string 
  }; 
  addedBy: { 
    fullName: string 
  }
}

interface ExpenseForm {
  gymId: string; title: string; amount: string; category: string
  description: string; expenseDate: string; receiptUrl: string
}

function localDateString() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const emptyForm = (): ExpenseForm => ({
  gymId: "", title: "", amount: "", category: "MISCELLANEOUS",
  description: "", expenseDate: localDateString(), receiptUrl: "",
})

function ExpenseModal({
  open, onClose, onSave, initial, gyms, saving,
}: {
  open: boolean; onClose: () => void
  onSave: (f: ExpenseForm) => void
  initial?: Expense | null
  gyms: { id: string; name: string }[]
  saving: boolean
}) {
  const [form, setForm] = useState<ExpenseForm>(emptyForm())
  useEffect(() => {
    if (initial) {
      setForm({
        gymId: (initial as any).gymId ?? "",
        title: initial.title, amount: String(initial.amount),
        category: initial.category, description: initial.description ?? "",
        expenseDate: initial.expenseDate.split("T")[0], receiptUrl: initial.receiptUrl ?? "",
      })
    } else {
      setForm(emptyForm())
    }
  }, [initial, open])

  if (!open) return null
  const set = (k: keyof ExpenseForm, v: string) => setForm(f => ({ ...f, [k]: v }))
  console.log("gyms", gyms);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="bg-[hsl(220_25%_11%)] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">{initial ? "Edit Expense" : "Add Expense"}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={20}/></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Gym select */}
          {!initial && (
            gyms.length > 1 ? (
              <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Gym *</label>
              <AppSelect
                value={form.gymId}
                onChange={v => set("gymId", v)}
                placeholder="Select gym"
                options={[...gyms.map(g => ({ value: g.id, label: g.name }))]}
              />
            </div>
            ) : (
              <div>
                <div className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Gym *</div>
                <div className="text-white border border-white/10 py-3 px-4 bg-white/5 rounded-lg text-md">{gyms?.[0]?.name}</div>
              </div>
            )
          )}

          {/* Title */}
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Title *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)}
              placeholder="e.g. October Electricity Bill"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary/50"/>
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Amount (₹) *</label>
              <input value={form.amount} onChange={e => set("amount", e.target.value)}
                type="number" min="0" placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary/50"/>
            </div>
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Date *</label>
              <input value={form.expenseDate} onChange={e => set("expenseDate", e.target.value)}
                type="date"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50"/>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Category</label>
            <AppSelect
              value={form.category}
              onChange={v => set("category", v)}
              options={CATEGORIES.map(c => ({ value: c, label: CATEGORY_LABELS[c] }))}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Notes</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Optional details..." rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary/50 resize-none"/>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm transition-colors">Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.title.trim() || !form.amount}
            className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={15} className="animate-spin"/> : null}
            {initial ? "Save Changes" : "Add Expense"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ExpensesPage() {
  const { toast } = useToast()
  const { hasExpenses, isExpired } = useSubscription()
  const [expenses,    setExpenses]    = useState<Expense[]>([])
  const [gyms,        setGyms]        = useState<{ id: string; name: string }[]>([])
  const [gymId,       setGymId]       = useState("")
  const [range,       setRange]       = useState("last_30_days")
  const [customStart, setCustomStart] = useState("")
  const [customEnd,   setCustomEnd]   = useState("")
  const [rangeOpen,   setRangeOpen]   = useState(false)
  const rangeDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (rangeDropdownRef.current && !rangeDropdownRef.current.contains(e.target as Node))
        setRangeOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])
  const [category,    setCategory]    = useState("")
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [showForm,    setShowForm]    = useState(false)
  const [editing,     setEditing]     = useState<Expense | null>(null)
  const [totalAmount, setTotalAmount] = useState(0)
  const [byCategory,  setByCategory]  = useState<{ category: string; total: number; count: number }[]>([])
  const [total,       setTotal]       = useState(0)
  const [page,        setPage]        = useState(1)
  const [pages,       setPages]       = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams({ range, page: String(page) })
    if (gymId)       p.set("gymId", gymId)
    if (category)    p.set("category", category)
    if (range === "custom" && customStart && customEnd) {
      p.set("customStart", customStart)
      p.set("customEnd",   customEnd)
    }
    fetch(`/api/owner/expenses?${p}`)
      .then(r => r.json())
      .then(d => {
        setExpenses(d.expenses ?? [])
        setTotalAmount(d.totalAmount ?? 0)
        setByCategory(d.byCategory ?? [])
        setTotal(d.total ?? 0)
        setPages(d.pages ?? 1)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [gymId, range, category, customStart, customEnd, page])

  useEffect(() => {
    fetch("/api/owner/gyms").then(r => r.json()).then(d => { if (Array.isArray(d)) setGyms(d) })
  }, [])
  useEffect(() => { setPage(1) }, [gymId, range, category, customStart, customEnd])
  useEffect(() => { load() }, [load])

  const handleSave = async (form: ExpenseForm) => {
    if (!form.gymId && !editing) { toast({ title: "Please select a gym", variant: "destructive" }); return }
    if (!form.title.trim())      { toast({ title: "Title is required", variant: "destructive" });   return }
    if (!form.amount || isNaN(parseFloat(form.amount))) { toast({ title: "Valid amount required", variant: "destructive" }); return }

    setSaving(true)
    try {
      const url    = editing ? `/api/owner/expenses/${editing.id}` : "/api/owner/expenses"
      const method = editing ? "PATCH" : "POST"
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast({ title: editing ? "Expense updated" : "Expense added" })
      setShowForm(false); setEditing(null); load()
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" })
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    
    try {
      const res = await fetch(`/api/owner/expenses/${id}`, { method: "DELETE" })
      setDeleteId(null);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast({ title: "Expense deleted" })
      load()
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }) }
  }



  const maxCategory = Math.max(...byCategory.map(b => b.total), 1)

  return (
    <PlanGate allowed={hasExpenses && !isExpired} featureLabel="Expense Management">
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        subtitle="Track your gym operating costs"
        icon={<Receipt className="text-red-400" size={22}/>}
        action={
          <button
            onClick={() => { setEditing(null); setShowForm(true) }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus size={16}/> Add Expense
          </button>
        }
      />
{deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[hsl(220_25%_9%)] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-white font-semibold text-base">Archive Plan?</h3>
            <p className="text-white/50 text-sm">This plan will be hidden from members. You can restore it later.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/25 text-sm font-semibold transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
)}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Range dropdown */}
        {(() => {
          const rangeRef = rangeDropdownRef
          const rangeLabel = RANGES.find(r => r.key === range)?.label ?? "Select range"
          return (
            <div ref={rangeRef} className="relative">
              <button
                onClick={() => setRangeOpen(v => !v)}
                className="flex items-center gap-2 bg-[hsl(220_25%_11%)] border border-white/10 text-white/80 rounded-xl px-3.5 h-10 text-sm hover:border-primary/40 transition-colors focus:outline-none"
              >
                <Calendar className="w-3.5 h-3.5 text-white/40 shrink-0" />
                <span className="truncate max-w-48">{rangeLabel}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/30 shrink-0 transition-transform ${rangeOpen ? "rotate-180" : ""}`} />
              </button>

              {rangeOpen && (
                <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-64 bg-[hsl(220_25%_10%)] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="p-1.5">
                    {RANGES.filter(r => r.key !== "custom").map(r => (
                      <button
                        key={r.key}
                        onClick={() => { setRange(r.key); setRangeOpen(false) }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                          range === r.key
                            ? "bg-primary/12 text-primary font-semibold"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-white/6 p-3">
                    <p className={`text-xs font-semibold mb-2.5 ${range === "custom" ? "text-primary" : "text-white/40"}`}>
                      Custom Range
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={customStart}
                          onChange={e => setCustomStart(e.target.value)}
                          max={customEnd || undefined}
                          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/70 focus:outline-none focus:border-primary/40"
                          style={{ colorScheme: "dark" }}
                        />
                        <span className="text-white/20 text-xs shrink-0">→</span>
                        <input
                          type="date"
                          value={customEnd}
                          onChange={e => setCustomEnd(e.target.value)}
                          min={customStart || undefined}
                          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/70 focus:outline-none focus:border-primary/40"
                          style={{ colorScheme: "dark" }}
                        />
                      </div>
                      <button
                        disabled={!customStart || !customEnd}
                        onClick={() => { setRange("custom"); setRangeOpen(false) }}
                        className="w-full py-2 rounded-xl text-xs font-semibold bg-primary text-white disabled:opacity-35 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                      >
                        Apply Custom Range
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {/* Gym filter */}
        {gyms.length > 1 && (
          <AppSelect
            value={gymId}
            onChange={setGymId}
            placeholder="All Gyms"
            options={[{ value: "", label: "All Gyms" }, ...gyms.map(g => ({ value: g.id, label: g.name }))]}
            className="w-40"
          />
        )}

        {/* Category filter */}
        <AppSelect
          value={category}
          onChange={setCategory}
          placeholder="All Categories"
          options={[{ value: "", label: "All Categories" }, ...CATEGORIES.map(c => ({ value: c, label: CATEGORY_LABELS[c] }))]}
          className="w-44"
        />
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#141920] border border-white/10 rounded-2xl p-5">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Total Expenses</p>
          <p className="text-red-400 text-2xl font-bold">{fmt(totalAmount)}</p>
          <p className="text-white/30 text-xs mt-1">{expenses.length} transactions</p>
        </div>
        <div className="bg-[#141920] border border-white/10 rounded-2xl p-5">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Avg per Transaction</p>
          <p className="text-white text-2xl font-bold">{expenses.length ? fmt(totalAmount / expenses.length) : "₹0"}</p>
        </div>
        <div className="bg-[#141920] border border-white/10 rounded-2xl p-5">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Top Category</p>
          <p className="text-white text-2xl font-bold">{byCategory[0] ? CATEGORY_LABELS[byCategory[0].category] : "—"}</p>
          {byCategory[0] && <p className="text-white/30 text-xs mt-1">{fmt(byCategory[0].total)}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category breakdown */}
        {byCategory.length > 0 && (
          <div className="bg-[#141920] border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">By Category</h3>
            <div className="space-y-3">
              {byCategory.map(b => (
                <div key={b.category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[b.category] ?? CATEGORY_COLORS.MISCELLANEOUS}`}>
                      {CATEGORY_LABELS[b.category]}
                    </span>
                    <span className="text-white/70 text-xs">{fmt(b.total)}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400/60 rounded-full" style={{ width: `${(b.total / maxCategory) * 100}%` }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expense list */}
        <div className={`${byCategory.length > 0 ? "lg:col-span-2" : "lg:col-span-3"} bg-[#141920] border border-white/10 rounded-2xl`}>
          <div className="p-5 border-b border-white/10">
            <h3 className="text-white font-semibold text-sm">Transactions</h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="text-primary animate-spin" size={24}/>
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/30 gap-3">
              <TrendingDown size={32}/>
              <p className="text-sm">No expenses for this period</p>
              <button onClick={() => { setEditing(null); setShowForm(true) }}
                className="text-primary text-sm hover:underline">Add first expense</button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {expenses.map(e => (
                <div key={e.id} className="flex items-center gap-4 overflow-x-scroll px-5 py-3.5 hover:bg-white/3 transition-colors">
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium truncate">{e.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[e.category] ?? CATEGORY_COLORS.MISCELLANEOUS}`}>
                        {CATEGORY_LABELS[e.category]}
                      </span>
                      <span className="text-white/30 text-xs">{e.gym?.name}</span>
                      <span className="text-white/30 text-xs">·</span>
                      <span className="text-white/30 text-xs">{new Date(e.expenseDate).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}</span>
                    </div>
                    {e.description && <p className="text-white/30 text-xs mt-0.5 truncate">{e.description}</p>}
                  </div>
                  <span className="text-red-400 font-bold text-sm shrink-0">−{fmt(e.amount)}</span>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { setEditing(e); setShowForm(true) }}
                      className="text-white/30 hover:text-white/70 transition-colors">
                      <Pencil size={14}/>
                    </button>
                    <button onClick={() => setDeleteId(e.id)}
                      className="text-white/30 hover:text-red-400 transition-colors">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Pagination page={page} pages={pages} total={total} limit={20} onChange={setPage} />

      <ExpenseModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
        gyms={gyms}
        saving={saving}
      />
    </div>
    </PlanGate>
  )
}
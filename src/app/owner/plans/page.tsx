// src/app/owner/plans/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  CreditCard, Plus, X, Loader2, Edit, Trash2,
  CheckCircle2, Clock, Users, ChevronDown, ChevronUp, Star
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface Plan {
  id: string; gymId: string; name: string; description: string | null
  durationMonths: number; price: number; features: string[]
  maxClasses: number | null; isActive: boolean; createdAt: string
  _count?: { members: number }
}
interface Gym { id: string; name: string }

const DURATION_LABEL: Record<number, string> = {
  1: "Monthly", 3: "Quarterly", 6: "Half-Yearly", 12: "Yearly"
}

const PLAN_COLORS = [
  "from-blue-500/20 to-cyan-500/5 border-blue-500/20",
  "from-primary/20 to-amber-500/5 border-primary/20",
  "from-purple-500/20 to-pink-500/5 border-purple-500/20",
  "from-green-500/20 to-emerald-500/5 border-green-500/20",
]

const blankForm = {
  name: "", description: "", durationMonths: "1", price: "", features: "", maxClasses: ""
}

export default function MembershipPlansPage() {
  const { toast } = useToast()
  const [gyms,  setGyms]  = useState<Gym[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedGymId, setSelectedGymId] = useState("")
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState(blankForm)
  const [showInactive, setShowInactive] = useState(false)

  // Load gyms first
  useEffect(() => {
    fetch("/api/owner/gyms")
      .then(r => r.json())
      .then((data: Gym[]) => {
        setGyms(data)
        if (data.length > 0) setSelectedGymId(data[0].id)
      })
  }, [])

  // Load plans when gym selected
  const loadPlans = () => {
    if (!selectedGymId) return
    setLoading(true)
    fetch(`/api/owner/plans?gymId=${selectedGymId}`)
      .then(r => r.json())
      .then(data => setPlans(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }
  useEffect(() => { loadPlans() }, [selectedGymId])

  const openCreate = () => {
    setEditingPlan(null)
    setForm(blankForm)
    setShowForm(true)
  }

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setForm({
      name:           plan.name,
      description:    plan.description ?? "",
      durationMonths: String(plan.durationMonths),
      price:          String(plan.price),
      features:       plan.features.join(", "),
      maxClasses:     plan.maxClasses ? String(plan.maxClasses) : "",
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const save = async () => {
    if (!form.name.trim()) { toast({ variant: "destructive", title: "Plan name is required" }); return }
    if (!form.price)       { toast({ variant: "destructive", title: "Price is required" }); return }
    setSaving(true)
    const payload = {
      gymId:          selectedGymId,
      name:           form.name.trim(),
      description:    form.description.trim() || null,
      durationMonths: parseInt(form.durationMonths),
      price:          parseFloat(form.price),
      features:       form.features.split(",").map(f => f.trim()).filter(Boolean),
      maxClasses:     form.maxClasses ? parseInt(form.maxClasses) : null,
    }
    const url    = editingPlan ? `/api/owner/plans/${editingPlan.id}` : "/api/owner/plans"
    const method = editingPlan ? "PATCH" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    if (res.ok) {
      toast({ variant: "success", title: editingPlan ? "Plan updated!" : "Plan created!" })
      setShowForm(false); setEditingPlan(null); setForm(blankForm); loadPlans()
    } else {
      const d = await res.json()
      toast({ variant: "destructive", title: d.error ?? "Failed to save plan" })
    }
    setSaving(false)
  }

  const toggleActive = async (plan: Plan) => {
    setDeletingId(plan.id)
    await fetch(`/api/owner/plans/${plan.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !plan.isActive }),
    })
    toast({ variant: "success", title: plan.isActive ? "Plan deactivated" : "Plan activated" })
    loadPlans()
    setDeletingId(null)
  }

  const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl text-sm"
  const sel = "w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary"

  const activePlans   = plans.filter(p => p.isActive)
  const inactivePlans = plans.filter(p => !p.isActive)

  return (
    <div className="max-w-5xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Membership Plans</h2>
          <p className="text-white/35 text-sm mt-0.5">
            {activePlans.length} active plan{activePlans.length !== 1 ? "s" : ""}
            {gyms.find(g => g.id === selectedGymId) ? ` · ${gyms.find(g => g.id === selectedGymId)!.name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Gym selector */}
          {gyms.length > 1 && (
            <select value={selectedGymId} onChange={e => setSelectedGymId(e.target.value)}
              className="bg-white/5 border border-white/10 text-white/70 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary">
              {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
          <Button onClick={openCreate} className="bg-gradient-primary hover:opacity-90 text-white h-10 gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Plan
          </Button>
        </div>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-[hsl(220_25%_9%)] border border-primary/20 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">
              {editingPlan ? "Edit Plan" : "New Membership Plan"}
            </h3>
            <button onClick={() => { setShowForm(false); setEditingPlan(null) }}
              className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white/55 text-sm">Plan Name <span className="text-primary">*</span></Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Monthly Premium" className={inp} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/55 text-sm">Price (₹) <span className="text-primary">*</span></Label>
              <Input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                placeholder="1499" className={inp} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/55 text-sm">Duration (months) <span className="text-primary">*</span></Label>
              <select value={form.durationMonths} onChange={e => setForm(p => ({ ...p, durationMonths: e.target.value }))}
                className={sel}>
                {[1, 2, 3, 6, 12].map(n => (
                  <option key={n} value={n}>{n} month{n > 1 ? "s" : ""} {DURATION_LABEL[n] ? `— ${DURATION_LABEL[n]}` : ""}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/55 text-sm">Max Classes/Month <span className="text-white/30">(optional)</span></Label>
              <Input type="number" value={form.maxClasses} onChange={e => setForm(p => ({ ...p, maxClasses: e.target.value }))}
                placeholder="Unlimited" className={inp} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/55 text-sm">Description <span className="text-white/30">(optional)</span></Label>
            <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Best for beginners, includes all basic amenities..." className={inp} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/55 text-sm">Features <span className="text-white/30">(comma-separated)</span></Label>
            <Input value={form.features} onChange={e => setForm(p => ({ ...p, features: e.target.value }))}
              placeholder="Gym access, Locker room, 2 PT sessions, Diet consultation"
              className={inp} />
            {form.features && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.features.split(",").map(f => f.trim()).filter(Boolean).map((f, i) => (
                  <span key={i} className="text-xs bg-primary/10 text-primary/80 px-2.5 py-1 rounded-full border border-primary/15">
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingPlan(null) }}
              className="border-white/10 text-white/60 hover:text-white h-10 text-sm">Cancel</Button>
            <Button onClick={save} disabled={saving}
              className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-10 text-sm px-7">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingPlan ? "Save Changes" : "Create Plan"}
            </Button>
          </div>
        </div>
      )}

      {/* Active Plans */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-56 bg-white/3 rounded-2xl animate-pulse" />)}
        </div>
      ) : activePlans.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center h-48 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl gap-3">
          <CreditCard className="w-10 h-10 text-white/15" />
          <p className="text-white/30 text-sm">No plans yet — add your first membership plan</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activePlans.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              colorClass={PLAN_COLORS[i % PLAN_COLORS.length]}
              onEdit={() => openEdit(plan)}
              onToggle={() => toggleActive(plan)}
              isToggling={deletingId === plan.id}
            />
          ))}
        </div>
      )}

      {/* Inactive / Archived Plans */}
      {inactivePlans.length > 0 && (
        <div>
          <button onClick={() => setShowInactive(p => !p)}
            className="flex items-center gap-2 text-white/35 hover:text-white/60 text-sm transition-colors mb-3">
            {showInactive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showInactive ? "Hide" : "Show"} {inactivePlans.length} inactive plan{inactivePlans.length !== 1 ? "s" : ""}
          </button>
          {showInactive && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50">
              {inactivePlans.map((plan, i) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  colorClass="from-white/5 to-transparent border-white/10"
                  onEdit={() => openEdit(plan)}
                  onToggle={() => toggleActive(plan)}
                  isToggling={deletingId === plan.id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PlanCard({ plan, colorClass, onEdit, onToggle, isToggling }: {
  plan: Plan; colorClass: string
  onEdit: () => void; onToggle: () => void; isToggling: boolean
}) {
  const durationLabel = DURATION_LABEL[plan.durationMonths] ?? `${plan.durationMonths} months`
  const pricePerMonth = plan.durationMonths > 1
    ? Math.round(Number(plan.price) / plan.durationMonths)
    : null

  return (
    <div className={`relative bg-linear-to-br ${colorClass} border rounded-2xl p-5 flex flex-col gap-4 transition-all hover:scale-[1.01]`}>
      {/* Status badge */}
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${
          plan.isActive ? "bg-green-500/15 text-green-400" : "bg-white/8 text-white/35"
        }`}>
          <CheckCircle2 className="w-3 h-3" />
          {plan.isActive ? "Active" : "Inactive"}
        </span>
        <span className="flex items-center gap-1 text-xs text-white/35">
          <Clock className="w-3 h-3" />
          {durationLabel}
        </span>
      </div>

      {/* Name + price */}
      <div>
        <h3 className="text-white font-bold text-lg leading-tight">{plan.name}</h3>
        {plan.description && <p className="text-white/45 text-xs mt-1 leading-relaxed line-clamp-2">{plan.description}</p>}
        <div className="flex items-end gap-2 mt-3">
          <span className="text-3xl font-display font-bold text-white">
            ₹{Number(plan.price).toLocaleString("en-IN")}
          </span>
          <span className="text-white/35 text-sm mb-1">/ {plan.durationMonths}mo</span>
        </div>
        {pricePerMonth && (
          <p className="text-white/30 text-xs mt-0.5">₹{pricePerMonth.toLocaleString("en-IN")}/month</p>
        )}
      </div>

      {/* Features */}
      {plan.features.length > 0 && (
        <ul className="space-y-1.5">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-white/55">
              <Star className="w-3 h-3 text-primary/60 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      )}

      {plan.maxClasses && (
        <p className="text-xs text-white/35 flex items-center gap-1">
          <Users className="w-3 h-3" /> Max {plan.maxClasses} classes/month
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-white/8 mt-auto">
        <button onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-primary hover:text-primary/80 py-2 transition-colors">
          <Edit className="w-3.5 h-3.5" /> Edit
        </button>
        <button onClick={onToggle} disabled={isToggling}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 transition-colors ${
            plan.isActive
              ? "text-red-400/60 hover:text-red-400"
              : "text-green-400/60 hover:text-green-400"
          }`}>
          {isToggling
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <><Trash2 className="w-3.5 h-3.5" /> {plan.isActive ? "Deactivate" : "Activate"}</>
          }
        </button>
      </div>
    </div>
  )
}
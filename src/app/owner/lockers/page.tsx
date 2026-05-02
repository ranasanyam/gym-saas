
// src/app/owner/lockers/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { useToast }     from "@/hooks/use-toast"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { PlanGate }     from "@/components/owner/PlanGate"
import { PageHeader }   from "@/components/owner/PageHeader"
import {
  Lock, Plus, User, X, Loader2, RefreshCw,
  ChevronDown, Calendar, IndianRupee, KeyRound,
  AlertTriangle, CheckCircle2, Wrench, Clock,
} from "lucide-react"

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; dot: string; card: string; badge: string }> = {
  AVAILABLE:   { label: "Available",   dot: "bg-white", card: "border-white/8",          badge: "bg-green-500/12 text-green-400 border-green-500/25" },
  ASSIGNED:    { label: "Assigned",    dot: "bg-blue-400",    card: "border-blue-500/30",       badge: "bg-blue-500/12    text-blue-400    border-blue-500/25"   },
  MAINTENANCE: { label: "Maintenance", dot: "bg-amber-400",   card: "border-amber-500/30",      badge: "bg-amber-500/12   text-amber-400   border-amber-500/25"  },
  RESERVED:    { label: "Reserved",    dot: "bg-purple-400",  card: "border-purple-500/30",     badge: "bg-purple-500/12  text-purple-400  border-purple-500/25" },
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  AVAILABLE:   CheckCircle2,
  ASSIGNED:    KeyRound,
  MAINTENANCE: Wrench,
  RESERVED:    Clock,
}

const SIZES = ["SMALL", "MEDIUM", "LARGE"]

const inputCls  = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
const labelCls  = "text-white/50 text-xs font-medium uppercase tracking-wider mb-1.5 block"
const selectCls = `${inputCls} appearance-none cursor-pointer`

// ── Types ─────────────────────────────────────────────────────────────────────
interface Locker {
  id: string; lockerNumber: string; floor: string | null; size: string | null
  status: string; monthlyFee: number | null; notes: string | null
  assignments: {
    id: string; assignedAt: string; expiresAt: string | null
    isActive: boolean; feeCollected: boolean; notes: string | null
    member: { id: string; profile: { fullName: string; avatarUrl: string | null; mobileNumber: string | null } }
  }[]
}
interface Member   { id: string; profile: { fullName: string } }
interface Stats    { total: number; available: number; assigned: number; maintenance: number; reserved: number }
interface GymOpt   { id: string; name: string }

// ── Skeleton ──────────────────────────────────────────────────────────────────
function LockerSkeleton() {
  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4 animate-pulse space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-4 w-12 bg-white/8 rounded-lg" />
          <div className="h-5 w-20 bg-white/6 rounded-full" />
        </div>
        <div className="h-3 w-6 bg-white/5 rounded" />
      </div>
      <div className="h-3 w-24 bg-white/5 rounded" />
      <div className="h-10 bg-white/5 rounded-xl" />
      <div className="h-8 bg-white/5 rounded-xl" />
    </div>
  )
}

function StatSkeleton() {
  return <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4 animate-pulse h-[72px]" />
}

// ── Locker Card ───────────────────────────────────────────────────────────────
function LockerCard({ locker, onEdit, onAssign, onUnassign, onUpdateAssignment, releasingId }: {
  locker:             Locker
  onEdit:             (l: Locker) => void
  onAssign:           (l: Locker) => void
  onUnassign:         (l: Locker) => void
  onUpdateAssignment: (l: Locker) => void
  releasingId:        string | null
}) {
  const active      = locker.assignments.find(a => a.isActive)
  const meta        = STATUS_META[locker.status] ?? STATUS_META.AVAILABLE
  const StatusIcon  = STATUS_ICONS[locker.status] ?? Lock

  const daysLeft    = active?.expiresAt
    ? Math.ceil((new Date(active.expiresAt).getTime() - Date.now()) / 86400000)
    : null
  const isExpiring  = daysLeft !== null && daysLeft <= 7 && daysLeft > 0
  const isExpired   = daysLeft !== null && daysLeft <= 0

  return (
    <div className={`bg-[hsl(220_25%_9%)] border ${meta.card} rounded-2xl p-4 flex flex-col gap-3 hover:border-opacity-60 transition-all group`}>

      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {/* Status colour dot */}
          <div className={`w-2 h-2 rounded-full shrink-0 ${meta.dot} ${locker.status === "ASSIGNED" || locker.status === "AVAILABLE" ? "animate-none" : ""}`} />
          <div>
            <p className="text-white font-bold text-sm leading-tight"># {locker.lockerNumber}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {locker.floor && (
                <span className="text-white/35 text-[10px]">{locker.floor}</span>
              )}
              {locker.size && (
                <span className="text-white/25 text-[10px]">· {locker.size}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status badge */}
          <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${meta.badge}`}>
            <StatusIcon className="w-2.5 h-2.5" />
            {meta.label}
          </span>
          <button
            onClick={() => onEdit(locker)}
            className="text-white/20 hover:text-white/60 text-[10px] font-medium transition-colors opacity-0 group-hover:opacity-100"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Monthly fee */}
      {locker.monthlyFee != null && locker.monthlyFee > 0 && (
        <div className="flex items-center gap-1.5 text-white/40 text-xs">
          <IndianRupee className="w-3 h-3" />
          <span>{Number(locker.monthlyFee).toLocaleString("en-IN")}</span>
          <span className="text-white/20">/ month</span>
        </div>
      )}

      {/* Assigned member card */}
      {active ? (
        <div className="bg-white/4 border border-white/6 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
              {active.member.profile.fullName[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/85 text-xs font-semibold truncate">{active.member.profile.fullName}</p>
              {active.member.profile.mobileNumber && (
                <p className="text-white/30 text-[10px]">{active.member.profile.mobileNumber}</p>
              )}
            </div>
            {active.feeCollected ? (
              <span className="flex items-center gap-1 text-[10px] text-green-400 font-medium shrink-0">
                <CheckCircle2 className="w-3 h-3" /> Paid
              </span>
            ) : (
              <span className="text-[10px] text-amber-400 font-medium shrink-0">Unpaid</span>
            )}
          </div>

          {/* Expiry */}
          {active.expiresAt && (
            <div className={`flex items-center gap-1.5 text-[10px] font-medium rounded-lg px-2 py-1 ${
              isExpired   ? "bg-red-500/10 text-red-400" :
              isExpiring  ? "bg-amber-500/10 text-amber-400" :
                            "text-white/30"
            }`}>
              <Calendar className="w-3 h-3 shrink-0" />
              {isExpired   ? "Expired" :
               isExpiring  ? `Expires in ${daysLeft}d` :
               `Expires ${new Date(active.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
            </div>
          )}

          {active.notes && (
            <p className="text-white/25 text-[10px] truncate">{active.notes}</p>
          )}
        </div>
      ) : (
        locker.status === "AVAILABLE" && (
          <div className="flex items-center justify-center h-10 border border-dashed border-white/8 rounded-xl">
            <span className="text-white/20 text-xs">Unoccupied</span>
          </div>
        )
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-0.5">
        {locker.status === "AVAILABLE" && (
          <button
            onClick={() => onAssign(locker)}
            className="flex-1 py-2 rounded-xl bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors flex items-center justify-center gap-1.5 border border-primary/20"
          >
            <User className="w-3 h-3" /> Assign
          </button>
        )}

        {locker.status === "ASSIGNED" && (
          <>
            <button
              onClick={() => onUpdateAssignment(locker)}
              className="flex-1 py-2 rounded-xl bg-white/5 text-white/60 text-xs font-semibold hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-1.5 border border-white/8"
            >
              <RefreshCw className="w-3 h-3" /> Update
            </button>
            <button
              onClick={() => onUnassign(locker)}
              disabled={releasingId === locker.id}
              className="flex-1 py-2 rounded-xl bg-red-500/8 text-red-400 text-xs font-semibold hover:bg-red-500/15 transition-colors flex items-center justify-center gap-1.5 border border-red-500/15 disabled:opacity-50"
            >
              {releasingId === locker.id
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <X className="w-3 h-3" />
              }
              Release
            </button>
          </>
        )}

        {(locker.status === "MAINTENANCE" || locker.status === "RESERVED") && (
          <button
            onClick={() => onEdit(locker)}
            className="flex-1 py-2 rounded-xl bg-white/4 text-white/35 text-xs font-semibold border border-white/6 flex items-center justify-center gap-1.5"
          >
            <Wrench className="w-3 h-3" /> Edit Status
          </button>
        )}
      </div>
    </div>
  )
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, footer }: {
  title: string; onClose: () => void
  children: React.ReactNode; footer: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[hsl(220_25%_10%)] border border-white/10 rounded-2xl w-full max-w-md pb-5 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
        <div className="px-6 pb-6 flex gap-3 border-t border-white/6 pt-4">{footer}</div>
      </div>
    </div>
  )
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
interface ConfirmState {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
}

function ConfirmModal({ state, onClose, loading }: {
  state: ConfirmState
  onClose: () => void
  loading?: boolean
}) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[hsl(220_25%_10%)] border border-white/10 rounded-2xl w-full max-w-sm py-5 shadow-2xl">
        <div className="px-6 pt-6 pb-2 flex flex-col items-center gap-3 text-center">
          <div className="w-11 h-11 rounded-full bg-red-500/12 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm">{state.title}</h2>
            <p className="text-white/45 text-xs mt-1.5 leading-relaxed">{state.message}</p>
          </div>
        </div>
        <div className="px-6 pb-6 pt-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:text-white hover:border-white/20 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={state.onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500/15 text-red-400 border border-red-500/25 text-sm font-semibold hover:bg-red-500/25 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {state.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  )
}



// ── Page ──────────────────────────────────────────────────────────────────────
export default function LockersPage() {
  const { toast } = useToast()
  const { hasLockers, isExpired } = useSubscription()

  // Data
  const [gyms,    setGyms]    = useState<GymOpt[]>([])
  const [gymId,   setGymId]   = useState("")
  const [lockers, setLockers] = useState<Locker[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [stats,   setStats]   = useState<Stats>({ total: 0, available: 0, assigned: 0, maintenance: 0, reserved: 0 })

  // UI state
  const [loading,      setLoading]      = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [releasingId,  setReleasingId]  = useState<string | null>(null)
  const [filter,       setFilter]       = useState("")
  const [gymsReady,    setGymsReady]    = useState(false)
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  // Modals
  const [showAdd,      setShowAdd]      = useState(false)
  const [showBulk,     setShowBulk]     = useState(false)
  const [editLocker,   setEditLocker]   = useState<Locker | null>(null)
  const [assignLocker, setAssignLocker] = useState<Locker | null>(null)
  const [updateLocker, setUpdateLocker] = useState<Locker | null>(null)

  // Forms
  const emptyAdd  = { lockerNumber: "", floor: "", size: "", monthlyFee: "", notes: "", status: "AVAILABLE" }
  const emptyBulk = { prefix: "", from: "1", to: "10", floor: "", size: "", monthlyFee: "" }
  const emptyAssign = { memberId: "", expiresAt: "", notes: "", feeCollected: false }
  const emptyUpdate = { expiresAt: "", notes: "", feeCollected: false }

  const [addForm,    setAddForm]    = useState(emptyAdd)
  const [bulkForm,   setBulkForm]   = useState(emptyBulk)
  const [assignForm, setAssignForm] = useState(emptyAssign)
  const [updateForm, setUpdateForm] = useState(emptyUpdate)

  // Fetch gyms on mount
  useEffect(() => {
    fetch("/api/owner/gyms").then(r => r.json()).then(d => {
      if (Array.isArray(d) && d.length > 0) {
        setGyms(d)
        setGymId(d[0].id)   // default to first gym
      }
      setGymsReady(true)
    }).catch(() => setGymsReady(true))
  }, [])

  // Fetch lockers when gymId changes
  const load = useCallback(() => {
    if (!gymId) return
    setLoading(true)
    setLockers([])
    setStats({ total: 0, available: 0, assigned: 0, maintenance: 0, reserved: 0 })
    fetch(`/api/owner/lockers?gymId=${gymId}`)
      .then(r => r.json())
      .then(d => { setLockers(d.lockers ?? []); setStats(d.stats ?? {}) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [gymId])

  useEffect(() => { if (gymId) load() }, [load, gymId])

  // Fetch members for the selected gym
  useEffect(() => {
    if (!gymId) return
    fetch(`/api/owner/members?gymId=${gymId}&status=ACTIVE`)
      .then(r => r.json())
      .then(d => setMembers(d.members ?? []))
      .catch(() => {})
  }, [gymId])

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddSingle = async () => {
    if (!addForm.lockerNumber.trim()) { toast({ title: "Locker number required", variant: "destructive" }); return }
    setSaving(true)
    try {
      const res = await fetch("/api/owner/lockers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gymId, ...addForm, monthlyFee: addForm.monthlyFee || null }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast({ title: "Locker added!" })
      setShowAdd(false); setAddForm(emptyAdd); load()
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }) }
    finally { setSaving(false) }
  }

  const handleBulkAdd = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/owner/lockers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gymId, bulk: true,
          prefix:     bulkForm.prefix,
          from:       parseInt(bulkForm.from),
          to:         parseInt(bulkForm.to),
          floor:      bulkForm.floor || null,
          size:       bulkForm.size  || null,
          monthlyFee: bulkForm.monthlyFee || null,
        }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      const d = await res.json()
      toast({ title: `Created ${d.created.length} lockers${d.skipped.length ? `, skipped ${d.skipped.length} existing` : ""}` })
      setShowBulk(false); load()
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }) }
    finally { setSaving(false) }
  }

  const handleEditSave = async () => {
    if (!editLocker) return
    setSaving(true)
    try {
      const res = await fetch(`/api/owner/lockers/${editLocker.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editLocker),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast({ title: "Locker updated" }); setEditLocker(null); load()
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }) }
    finally { setSaving(false) }
  }

  const handleDelete = (id: string, onDone?: () => void) => {
    setConfirmState({
      title: "Delete locker?",
      message: "This will permanently remove the locker and all its assignment history. This cannot be undone.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        setSaving(true)
        try {
          const res = await fetch(`/api/owner/lockers/${id}`, { method: "DELETE" })
          if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
          toast({ title: "Locker deleted" })
          setConfirmState(null)
          onDone?.()
          load()
        } catch (err: any) { toast({ title: err.message, variant: "destructive" }) }
        finally { setSaving(false) }
      },
    })
  }

  const handleAssign = async () => {
    if (!assignForm.memberId) { toast({ title: "Select a member", variant: "destructive" }); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/owner/lockers/${assignLocker!.id}/assign`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignForm),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      const feeMsg = assignForm.feeCollected && assignLocker?.monthlyFee
        ? ` Fee of ₹${Number(assignLocker.monthlyFee).toLocaleString("en-IN")} recorded in revenue.`
        : ""
      toast({ title: `Locker assigned!${feeMsg}` })
      setAssignLocker(null); setAssignForm(emptyAssign); load()
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }) }
    finally { setSaving(false) }
  }

  const handleUnassign = (locker: Locker) => {
    setConfirmState({
      title: `Release locker #${locker.lockerNumber}?`,
      message: "The member will lose access and the locker will become available again.",
      confirmLabel: "Release",
      onConfirm: async () => {
        setReleasingId(locker.id)
        try {
          const res = await fetch(`/api/owner/lockers/${locker.id}/assign`, { method: "DELETE" })
          if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
          toast({ title: "Locker released" })
          setConfirmState(null)
          load()
        } catch (err: any) { toast({ title: err.message, variant: "destructive" }) }
        finally { setReleasingId(null) }
      },
    })
  }

  const handleUpdateAssignment = async () => {
    if (!updateLocker) return
    setSaving(true)
    try {
      const res = await fetch(`/api/owner/lockers/${updateLocker.id}/assign`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateForm),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast({ title: "Assignment updated" }); setUpdateLocker(null); load()
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }) }
    finally { setSaving(false) }
  }

  // ── Derived state ────────────────────────────────────────────────────────────
  const filtered = lockers.filter(l => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return (
      l.lockerNumber.toLowerCase().includes(q) ||
      l.assignments.find(a => a.isActive)?.member.profile.fullName.toLowerCase().includes(q)
    )
  })

  const statsItems = [
    { label: "Total",       value: stats.total,       color: "text-white",         icon: Lock          },
    { label: "Available",   value: stats.available,   color: "text-green-400",   icon: CheckCircle2  },
    { label: "Assigned",    value: stats.assigned,    color: "text-blue-400",      icon: KeyRound      },
    { label: "Maintenance", value: stats.maintenance, color: "text-amber-400",     icon: Wrench        },
    { label: "Reserved",    value: stats.reserved,    color: "text-purple-400",    icon: Clock         },
  ]

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <PlanGate allowed={hasLockers && !isExpired} featureLabel="Locker Management">
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Locker Management"
        subtitle="Assign and track gym lockers"
        action={gymId ? {
          label: "Add Locker",
          onClick: () => setShowAdd(true),
        } : undefined}
      />

      {/* ── Gym selector + Bulk button ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {!gymsReady ? (
          /* Skeleton while gyms are fetching */
          <div className="h-10 w-40 bg-white/6 rounded-xl animate-pulse" />
        ) : (
          <div className="relative">
            <select
              value={gymId}
              onChange={e => setGymId(e.target.value)}
              className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white/80 rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none focus:border-primary/50 cursor-pointer transition-colors"
            >
              {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>
        )}

        {gymId && (
          <button
            onClick={() => setShowBulk(true)}
            className="px-4 h-10 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm transition-colors"
          >
            Bulk Add
          </button>
        )}

        {loading && gymId && (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        )}
      </div>

      {/* ── No gym selected ────────────────────────────────────────────────── */}
      {!gymId && gymsReady && (
        <div className="flex flex-col items-center justify-center py-20 text-white/30 gap-3">
          <Lock className="w-10 h-10 opacity-30" />
          <p className="text-sm">Select a gym to manage lockers</p>
        </div>
      )}

      {gymId && (
        <>
          {/* ── Stats ───────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <StatSkeleton key={i} />)
              : statsItems.map(s => {
                  const Icon = s.icon
                  return (
                    <div key={s.label} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4 flex items-center gap-3">
                      <div className="flex-1">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-white/35 text-xs mt-0.5">{s.label}</p>
                      </div>
                      <Icon className={`w-5 h-5 ${s.color} opacity-40`} />
                    </div>
                  )
                })
            }
          </div>

          {/* ── Search ──────────────────────────────────────────────────────── */}
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Search by locker number or member name…"
            className="w-full bg-[hsl(220_25%_9%)] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-primary/50 transition-colors"
          />

          {/* ── Locker grid ──────────────────────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => <LockerSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/30 gap-3">
              <Lock className="w-10 h-10 opacity-30" />
              <p className="text-sm">{filter ? "No lockers match your search" : "No lockers yet"}</p>
              {!filter && (
                <button onClick={() => setShowAdd(true)} className="text-primary text-sm hover:underline">
                  Add your first locker
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map(l => (
                <LockerCard
                  key={l.id} locker={l}
                  onEdit={setEditLocker}
                  onAssign={setAssignLocker}
                  onUnassign={handleUnassign}
                  releasingId={releasingId}
                  onUpdateAssignment={lo => {
                    const a = lo.assignments.find(x => x.isActive)
                    setUpdateLocker(lo)
                    setUpdateForm({
                      expiresAt:    a?.expiresAt ? a.expiresAt.split("T")[0] : "",
                      notes:        a?.notes ?? "",
                      feeCollected: a?.feeCollected ?? false,
                    })
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Add Single Modal ───────────────────────────────────────────────── */}
      {showAdd && (
        <Modal
          title="Add Locker"
          onClose={() => { setShowAdd(false); setAddForm(emptyAdd) }}
          footer={
            <>
              <button onClick={() => { setShowAdd(false); setAddForm(emptyAdd) }}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:text-white hover:border-white/20 transition-colors">
                Cancel
              </button>
              <button onClick={handleAddSingle} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Add Locker
              </button>
            </>
          }
        >
          <div><label className={labelCls}>Locker Number *</label>
            <input value={addForm.lockerNumber} onChange={e => setAddForm(f => ({ ...f, lockerNumber: e.target.value }))}
              placeholder="e.g. A-01" className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Floor / Zone</label>
              <input value={addForm.floor} onChange={e => setAddForm(f => ({ ...f, floor: e.target.value }))}
                placeholder="Ground Floor" className={inputCls} /></div>
            <div><label className={labelCls}>Size</label>
              <select value={addForm.size} onChange={e => setAddForm(f => ({ ...f, size: e.target.value }))} className={selectCls}>
                <option value="">Any</option>
                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
          </div>
          <div><label className={labelCls}>Monthly Fee (₹)</label>
            <input value={addForm.monthlyFee} onChange={e => setAddForm(f => ({ ...f, monthlyFee: e.target.value }))}
              type="number" placeholder="0" className={inputCls} /></div>
          <div><label className={labelCls}>Status</label>
            <select value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value }))} className={selectCls}>
              {["AVAILABLE", "MAINTENANCE", "RESERVED"].map(s => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select></div>
          <div><label className={labelCls}>Notes</label>
            <input value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Optional" className={inputCls} /></div>
        </Modal>
      )}

      {/* ── Bulk Add Modal ─────────────────────────────────────────────────── */}
      {showBulk && (
        <Modal
          title="Bulk Add Lockers"
          onClose={() => { setShowBulk(false); setBulkForm(emptyBulk) }}
          footer={
            <>
              <button onClick={() => { setShowBulk(false); setBulkForm(emptyBulk) }}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleBulkAdd} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create Lockers
              </button>
            </>
          }
        >
          <p className="text-white/35 text-xs">Creates lockers like A01, A02 … A20 (prefix + zero-padded number)</p>
          <div><label className={labelCls}>Prefix (optional)</label>
            <input value={bulkForm.prefix} onChange={e => setBulkForm(f => ({ ...f, prefix: e.target.value }))}
              placeholder="e.g. A, B, L-" className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>From</label>
              <input value={bulkForm.from} onChange={e => setBulkForm(f => ({ ...f, from: e.target.value }))}
                type="number" min="1" className={inputCls} /></div>
            <div><label className={labelCls}>To</label>
              <input value={bulkForm.to} onChange={e => setBulkForm(f => ({ ...f, to: e.target.value }))}
                type="number" min="1" className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Floor / Zone</label>
              <input value={bulkForm.floor} onChange={e => setBulkForm(f => ({ ...f, floor: e.target.value }))}
                placeholder="Ground" className={inputCls} /></div>
            <div><label className={labelCls}>Monthly Fee (₹)</label>
              <input value={bulkForm.monthlyFee} onChange={e => setBulkForm(f => ({ ...f, monthlyFee: e.target.value }))}
                type="number" placeholder="0" className={inputCls} /></div>
          </div>
          <p className="text-white/25 text-xs">
            Will create {Math.max(0, parseInt(bulkForm.to || "0") - parseInt(bulkForm.from || "0") + 1)} lockers
          </p>
        </Modal>
      )}

      {/* ── Edit Locker Modal ──────────────────────────────────────────────── */}
      {editLocker && (
        <Modal
          title={`Edit Locker #${editLocker.lockerNumber}`}
          onClose={() => setEditLocker(null)}
          footer={
            <>
              <button onClick={() => handleDelete(editLocker.id, () => setEditLocker(null))}
                className="px-4 py-2.5 rounded-xl bg-red-500/8 text-red-400 text-sm hover:bg-red-500/15 transition-colors border border-red-500/15">
                Delete
              </button>
              <button onClick={handleEditSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Changes
              </button>
            </>
          }
        >
          <div><label className={labelCls}>Locker Number</label>
            <input value={editLocker.lockerNumber}
              onChange={e => setEditLocker(l => l ? { ...l, lockerNumber: e.target.value } : l)}
              className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Floor</label>
              <input value={editLocker.floor ?? ""}
                onChange={e => setEditLocker(l => l ? { ...l, floor: e.target.value || null } : l)}
                className={inputCls} /></div>
            <div><label className={labelCls}>Size</label>
              <select value={editLocker.size ?? ""}
                onChange={e => setEditLocker(l => l ? { ...l, size: e.target.value || null } : l)}
                className={selectCls}>
                <option value="">Any</option>
                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
          </div>
          <div><label className={labelCls}>Monthly Fee (₹)</label>
            <input value={editLocker.monthlyFee ?? ""}
              onChange={e => setEditLocker(l => l ? { ...l, monthlyFee: e.target.value ? parseFloat(e.target.value) : null } : l)}
              type="number" className={inputCls} /></div>
          {editLocker.status !== "ASSIGNED" && (
            <div><label className={labelCls}>Status</label>
              <select value={editLocker.status}
                onChange={e => setEditLocker(l => l ? { ...l, status: e.target.value } : l)}
                className={selectCls}>
                {["AVAILABLE", "MAINTENANCE", "RESERVED"].map(s => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </select></div>
          )}
          <div><label className={labelCls}>Notes</label>
            <input value={editLocker.notes ?? ""}
              onChange={e => setEditLocker(l => l ? { ...l, notes: e.target.value || null } : l)}
              className={inputCls} /></div>
        </Modal>
      )}

      {/* ── Assign Modal ───────────────────────────────────────────────────── */}
      {assignLocker && (
        <Modal
          title={`Assign Locker #${assignLocker.lockerNumber}`}
          onClose={() => { setAssignLocker(null); setAssignForm(emptyAssign) }}
          footer={
            <>
              <button onClick={() => { setAssignLocker(null); setAssignForm(emptyAssign) }}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleAssign} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Assign
              </button>
            </>
          }
        >
          {assignLocker.monthlyFee != null && assignLocker.monthlyFee > 0 && (
            <div className="flex items-center gap-2 bg-primary/8 border border-primary/20 rounded-xl px-3 py-2">
              <IndianRupee className="w-3.5 h-3.5 text-primary shrink-0" />
              <p className="text-primary text-xs font-medium">
                Monthly fee: ₹{Number(assignLocker.monthlyFee).toLocaleString("en-IN")}
              </p>
            </div>
          )}
          <div><label className={labelCls}>Member *</label>
            <select value={assignForm.memberId}
              onChange={e => setAssignForm(f => ({ ...f, memberId: e.target.value }))}
              className={selectCls}>
              <option value="">Select member</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.profile.fullName}</option>)}
            </select></div>
          <div><label className={labelCls}>Expiry Date (optional)</label>
            <input value={assignForm.expiresAt}
              onChange={e => setAssignForm(f => ({ ...f, expiresAt: e.target.value }))}
              type="date" className={inputCls} /></div>
          <div><label className={labelCls}>Notes</label>
            <input value={assignForm.notes}
              onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Optional note" className={inputCls} /></div>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-white/4 transition-colors">
            <input type="checkbox" checked={assignForm.feeCollected}
              onChange={e => setAssignForm(f => ({ ...f, feeCollected: e.target.checked }))}
              className="w-4 h-4 accent-primary rounded" />
            <div>
              <span className="text-white/80 text-sm font-medium">Fee collected</span>
              {assignLocker.monthlyFee != null && assignLocker.monthlyFee > 0 && assignForm.feeCollected && (
                <p className="text-white/50 text-xs mt-0.5">
                  ₹{Number(assignLocker.monthlyFee).toLocaleString("en-IN")} will be added to gym revenue
                </p>
              )}
            </div>
          </label>
        </Modal>
      )}

      {/* ── Update Assignment Modal ────────────────────────────────────────── */}
      {updateLocker && (
        <Modal
          title={`Update Assignment — #${updateLocker.lockerNumber}`}
          onClose={() => setUpdateLocker(null)}
          footer={
            <>
              <button onClick={() => setUpdateLocker(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleUpdateAssignment} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Update
              </button>
            </>
          }
        >
          <div><label className={labelCls}>New Expiry Date</label>
            <input value={updateForm.expiresAt}
              onChange={e => setUpdateForm(f => ({ ...f, expiresAt: e.target.value }))}
              type="date" className={inputCls} /></div>
          <div><label className={labelCls}>Notes</label>
            <input value={updateForm.notes}
              onChange={e => setUpdateForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Optional note" className={inputCls} /></div>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-white/4 transition-colors">
            <input type="checkbox" checked={updateForm.feeCollected}
              onChange={e => setUpdateForm(f => ({ ...f, feeCollected: e.target.checked }))}
              className="w-4 h-4 accent-primary rounded" />
            <div>
              <span className="text-white/80 text-sm font-medium">Fee collected</span>
              {!updateLocker.assignments.find(a => a.isActive)?.feeCollected && updateForm.feeCollected && updateLocker.monthlyFee != null && updateLocker.monthlyFee > 0 && (
                <p className="text-white/5 text-xs mt-0.5">
                  ₹{Number(updateLocker.monthlyFee).toLocaleString("en-IN")} will be added to gym revenue
                </p>
              )}
            </div>
          </label>
        </Modal>
      )}

      {/* ── Confirm dialog ─────────────────────────────────────────────────── */}
      {confirmState && (
        <ConfirmModal
          state={confirmState}
          onClose={() => setConfirmState(null)}
          loading={saving || releasingId !== null}
        />
      )}
    </div>
    </PlanGate>
  )
}
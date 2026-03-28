// src/app/owner/lockers/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { PageHeader } from "@/components/owner/PageHeader"
import { Lock, Plus, User, Wrench, X, Loader2, RefreshCw, AlertCircle } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE:   "bg-green-500/20  text-green-400  border-green-500/30",
  ASSIGNED:    "bg-blue-500/20   text-blue-400   border-blue-500/30",
  MAINTENANCE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  RESERVED:    "bg-purple-500/20 text-purple-400 border-purple-500/30",
}

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE:"Available", ASSIGNED:"Assigned",
  MAINTENANCE:"Maintenance", RESERVED:"Reserved",
}

const SIZES = ["SMALL","MEDIUM","LARGE"]

interface Locker {
  id: string; lockerNumber: string; floor: string | null; size: string | null
  status: string; monthlyFee: number | null; notes: string | null
  assignments: {
    id: string; assignedAt: string; expiresAt: string | null
    isActive: boolean; feeCollected: boolean; notes: string | null
    member: { id: string; profile: { fullName: string; avatarUrl: string | null; mobileNumber: string | null } }
  }[]
}

interface Member {
  id: string
  profile: { fullName: string; avatarUrl: string | null }
}

interface Stats { total: number; available: number; assigned: number; maintenance: number; reserved: number }

function LockerCard({ locker, onEdit, onAssign, onUnassign, onUpdateAssignment }: {
  locker: Locker
  onEdit:             (l: Locker) => void
  onAssign:           (l: Locker) => void
  onUnassign:         (l: Locker) => void
  onUpdateAssignment: (l: Locker) => void
}) {
  const active = locker.assignments.find(a => a.isActive)
  const isExpiring = active?.expiresAt
    ? (new Date(active.expiresAt).getTime() - Date.now()) < 7 * 86400000
    : false

  return (
    <div className={`bg-[#141920] border rounded-2xl p-4 flex flex-col gap-3 ${
      locker.status === "ASSIGNED" ? "border-blue-500/30" :
      locker.status === "MAINTENANCE" ? "border-yellow-500/30" :
      locker.status === "RESERVED" ? "border-purple-500/30" : "border-white/10"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Lock size={14} className={locker.status === "ASSIGNED" ? "text-blue-400" : "text-white/40"}/>
            <span className="text-white font-bold text-base">{locker.lockerNumber}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[locker.status]}`}>
              {STATUS_LABELS[locker.status]}
            </span>
            {locker.floor && <span className="text-white/30 text-xs">{locker.floor}</span>}
            {locker.size  && <span className="text-white/30 text-xs">{locker.size}</span>}
          </div>
        </div>
        <button onClick={() => onEdit(locker)} className="text-white/30 hover:text-white/60 transition-colors text-xs">Edit</button>
      </div>

      {/* Fee */}
      {locker.monthlyFee != null && (
        <p className="text-white/40 text-xs">₹{Number(locker.monthlyFee).toLocaleString("en-IN")}/month</p>
      )}

      {/* Assigned member */}
      {active && (
        <div className="bg-white/5 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
              {active.member.profile.fullName[0]}
            </div>
            <span className="text-white text-sm font-medium truncate">{active.member.profile.fullName}</span>
            {active.feeCollected && (
              <span className="text-green-400 text-xs ml-auto shrink-0">✓ Paid</span>
            )}
          </div>
          {active.expiresAt && (
            <p className={`text-xs ${isExpiring ? "text-yellow-400" : "text-white/30"}`}>
              {isExpiring ? "⚠ " : ""}Expires {new Date(active.expiresAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
            </p>
          )}
          {active.notes && <p className="text-white/30 text-xs truncate">{active.notes}</p>}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        {locker.status === "AVAILABLE" && (
          <button onClick={() => onAssign(locker)}
            className="flex-1 py-2 rounded-xl bg-primary/20 text-primary text-xs font-semibold hover:bg-primary/30 transition-colors flex items-center justify-center gap-1.5">
            <User size={12}/> Assign
          </button>
        )}
        {locker.status === "ASSIGNED" && (
          <>
            <button onClick={() => onUpdateAssignment(locker)}
              className="flex-1 py-2 rounded-xl bg-white/5 text-white/60 text-xs font-semibold hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5">
              <RefreshCw size={12}/> Update
            </button>
            <button onClick={() => onUnassign(locker)}
              className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5">
              <X size={12}/> Release
            </button>
          </>
        )}
        {(locker.status === "MAINTENANCE" || locker.status === "RESERVED") && (
          <button onClick={() => onAssign(locker)}
            className="flex-1 py-2 rounded-xl bg-white/5 text-white/50 text-xs font-semibold cursor-not-allowed" disabled>
            Unavailable
          </button>
        )}
      </div>
    </div>
  )
}

export default function LockersPage() {
  const { toast } = useToast()
  const [gyms,     setGyms]     = useState<{ id: string; name: string }[]>([])
  const [gymId,    setGymId]    = useState("")
  const [lockers,  setLockers]  = useState<Locker[]>([])
  const [members,  setMembers]  = useState<Member[]>([])
  const [stats,    setStats]    = useState<Stats>({ total:0, available:0, assigned:0, maintenance:0, reserved:0 })
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [filter,   setFilter]   = useState("")

  // Modals
  const [showAdd,    setShowAdd]    = useState(false)
  const [showBulk,   setShowBulk]   = useState(false)
  const [editLocker, setEditLocker] = useState<Locker | null>(null)
  const [assignLocker,setAssignLocker] = useState<Locker | null>(null)
  const [updateLocker,setUpdateLocker] = useState<Locker | null>(null)

  // Forms
  const [addForm,  setAddForm]  = useState({ lockerNumber:"", floor:"", size:"", monthlyFee:"", notes:"", status:"AVAILABLE" })
  const [bulkForm, setBulkForm] = useState({ prefix:"", from:"1", to:"10", floor:"", size:"", monthlyFee:"" })
  const [assignForm,setAssignForm] = useState({ memberId:"", expiresAt:"", notes:"", feeCollected:false })
  const [updateForm,setUpdateForm] = useState({ expiresAt:"", notes:"", feeCollected:false })

  const load = useCallback(() => {
    if (!gymId) return
    setLoading(true)
    const p = new URLSearchParams({ gymId })
    fetch(`/api/owner/lockers?${p}`)
      .then(r => r.json())
      .then(d => { setLockers(d.lockers ?? []); setStats(d.stats ?? {}) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [gymId])

  useEffect(() => {
    fetch("/api/owner/gyms").then(r => r.json()).then(d => {
      if (Array.isArray(d)) {
        setGyms(d)
        if (d.length > 0) setGymId(d[0].id)
      }
    })
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!gymId) return
    fetch(`/api/owner/members?gymId=${gymId}&status=ACTIVE`)
      .then(r => r.json())
      .then(d => setMembers(d.members ?? []))
      .catch(() => {})
  }, [gymId])

  const handleAddSingle = async () => {
    if (!gymId)                      { toast({ title: "Select a gym first", variant: "destructive" }); return }
    if (!addForm.lockerNumber.trim()){ toast({ title: "Locker number required", variant: "destructive" }); return }
    setSaving(true)
    try {
      const res = await fetch("/api/owner/lockers", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ gymId, ...addForm, monthlyFee: addForm.monthlyFee || null }) })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast({ title: "Locker added!" })
      setShowAdd(false); setAddForm({ lockerNumber:"", floor:"", size:"", monthlyFee:"", notes:"", status:"AVAILABLE" }); load()
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }) }
    finally { setSaving(false) }
  }

  const handleBulkAdd = async () => {
    if (!gymId) { toast({ title: "Select a gym first", variant: "destructive" }); return }
    setSaving(true)
    try {
      const res = await fetch("/api/owner/lockers", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ gymId, bulk:true, prefix:bulkForm.prefix, from:parseInt(bulkForm.from), to:parseInt(bulkForm.to), floor:bulkForm.floor||null, size:bulkForm.size||null, monthlyFee:bulkForm.monthlyFee||null }) })
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
      const res = await fetch(`/api/owner/lockers/${editLocker.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(editLocker) })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast({ title: "Locker updated" }); setEditLocker(null); load()
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this locker? This cannot be undone.")) return
    try {
      const res = await fetch(`/api/owner/lockers/${id}`, { method:"DELETE" })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast({ title: "Locker deleted" }); load()
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }) }
  }

  const handleAssign = async () => {
    if (!assignLocker || !assignForm.memberId) { toast({ title:"Select a member", variant:"destructive" }); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/owner/lockers/${assignLocker.id}/assign`, { method:"POST",
        headers:{"Content-Type":"application/json"}, body: JSON.stringify(assignForm) })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast({ title: "Locker assigned! 🔒" }); setAssignLocker(null); setAssignForm({ memberId:"", expiresAt:"", notes:"", feeCollected:false }); load()
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }) }
    finally { setSaving(false) }
  }

  const handleUnassign = async (locker: Locker) => {
    if (!confirm(`Release locker ${locker.lockerNumber}?`)) return
    try {
      const res = await fetch(`/api/owner/lockers/${locker.id}/assign`, { method:"DELETE" })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast({ title: "Locker released" }); load()
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }) }
  }

  const handleUpdateAssignment = async () => {
    if (!updateLocker) return
    setSaving(true)
    try {
      const res = await fetch(`/api/owner/lockers/${updateLocker.id}/assign`, { method:"PATCH",
        headers:{"Content-Type":"application/json"}, body: JSON.stringify(updateForm) })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast({ title: "Assignment updated" }); setUpdateLocker(null); load()
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }) }
    finally { setSaving(false) }
  }

  const filtered = lockers.filter(l => {
    if (!filter) return true
    return l.lockerNumber.toLowerCase().includes(filter.toLowerCase()) ||
      l.assignments.find(a => a.isActive)?.member.profile.fullName.toLowerCase().includes(filter.toLowerCase())
  })

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary/50"
  const labelCls = "text-white/50 text-xs uppercase tracking-wider mb-1.5 block"

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locker Management"
        subtitle="Assign and track gym lockers"
        icon={<Lock className="text-blue-400" size={22}/>}
        action={
          gymId ? (
            <div className="flex gap-2">
              <button onClick={() => setShowBulk(true)}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm transition-colors">
                Bulk Add
              </button>
              <button onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Plus size={16}/> Add Locker
              </button>
            </div>
          ) : null
        }
      />

      {/* Gym selector */}
      {gyms.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {gyms.map(g => (
            <button key={g.id} onClick={() => setGymId(g.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${gymId === g.id ? "bg-primary/20 text-primary border-primary/30" : "bg-white/5 text-white/50 border-white/10 hover:text-white"}`}>
              {g.name}
            </button>
          ))}
        </div>
      )}

      {!gymId ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/30 gap-3">
          <Lock size={32}/><p>Select a gym to manage lockers</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label:"Total",       value:stats.total,       color:"text-white" },
              { label:"Available",   value:stats.available,   color:"text-green-400" },
              { label:"Assigned",    value:stats.assigned,    color:"text-blue-400" },
              { label:"Maintenance", value:stats.maintenance, color:"text-yellow-400" },
              { label:"Reserved",    value:stats.reserved,    color:"text-purple-400" },
            ].map(s => (
              <div key={s.label} className="bg-[#141920] border border-white/10 rounded-2xl p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-white/40 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <input value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Search by locker number or member name..."
            className="w-full bg-[#141920] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary/50"/>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="text-primary animate-spin" size={24}/></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/30 gap-3">
              <Lock size={32}/><p>No lockers found</p>
              <button onClick={() => setShowAdd(true)} className="text-primary text-sm hover:underline">Add your first locker</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map(l => (
                <LockerCard key={l.id} locker={l}
                  onEdit={setEditLocker}
                  onAssign={setAssignLocker}
                  onUnassign={handleUnassign}
                  onUpdateAssignment={lo => { setUpdateLocker(lo); const a = lo.assignments.find(x => x.isActive); setUpdateForm({ expiresAt: a?.expiresAt ? a.expiresAt.split("T")[0] : "", notes: a?.notes ?? "", feeCollected: a?.feeCollected ?? false }) }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Add Single Modal ───────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#141920] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-white font-semibold">Add Locker</h2>
              <button onClick={() => setShowAdd(false)} className="text-white/40 hover:text-white"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className={labelCls}>Locker Number *</label><input value={addForm.lockerNumber} onChange={e => setAddForm(f => ({...f, lockerNumber:e.target.value}))} placeholder="e.g. A-01" className={inputCls}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Floor / Zone</label><input value={addForm.floor} onChange={e => setAddForm(f => ({...f, floor:e.target.value}))} placeholder="Ground Floor" className={inputCls}/></div>
                <div><label className={labelCls}>Size</label>
                  <select value={addForm.size} onChange={e => setAddForm(f => ({...f, size:e.target.value}))} className={inputCls}>
                    <option value="">Any</option>{SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div><label className={labelCls}>Monthly Fee (₹)</label><input value={addForm.monthlyFee} onChange={e => setAddForm(f => ({...f, monthlyFee:e.target.value}))} type="number" placeholder="0" className={inputCls}/></div>
              <div><label className={labelCls}>Status</label>
                <select value={addForm.status} onChange={e => setAddForm(f => ({...f, status:e.target.value}))} className={inputCls}>
                  {["AVAILABLE","MAINTENANCE","RESERVED"].map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Notes</label><input value={addForm.notes} onChange={e => setAddForm(f => ({...f, notes:e.target.value}))} placeholder="Optional" className={inputCls}/></div>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm">Cancel</button>
              <button onClick={handleAddSingle} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin"/>} Add Locker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Add Modal ─────────────────────────────────────────────── */}
      {showBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#141920] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-white font-semibold">Bulk Add Lockers</h2>
              <button onClick={() => setShowBulk(false)} className="text-white/40 hover:text-white"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-white/40 text-xs">Creates lockers with numbers like A01, A02 ... A20 (prefix + number)</p>
              <div><label className={labelCls}>Prefix (optional)</label><input value={bulkForm.prefix} onChange={e => setBulkForm(f => ({...f, prefix:e.target.value}))} placeholder="e.g. A, B, L-" className={inputCls}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>From Number</label><input value={bulkForm.from} onChange={e => setBulkForm(f => ({...f, from:e.target.value}))} type="number" min="1" className={inputCls}/></div>
                <div><label className={labelCls}>To Number</label><input value={bulkForm.to} onChange={e => setBulkForm(f => ({...f, to:e.target.value}))} type="number" min="1" className={inputCls}/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Floor / Zone</label><input value={bulkForm.floor} onChange={e => setBulkForm(f => ({...f, floor:e.target.value}))} placeholder="Ground" className={inputCls}/></div>
                <div><label className={labelCls}>Monthly Fee (₹)</label><input value={bulkForm.monthlyFee} onChange={e => setBulkForm(f => ({...f, monthlyFee:e.target.value}))} type="number" placeholder="0" className={inputCls}/></div>
              </div>
              <p className="text-white/30 text-xs">Will create {Math.max(0, parseInt(bulkForm.to||"0") - parseInt(bulkForm.from||"0") + 1)} lockers</p>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button onClick={() => setShowBulk(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm">Cancel</button>
              <button onClick={handleBulkAdd} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin"/>} Create Lockers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Locker Modal ──────────────────────────────────────────── */}
      {editLocker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#141920] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-white font-semibold">Edit Locker {editLocker.lockerNumber}</h2>
              <button onClick={() => setEditLocker(null)} className="text-white/40 hover:text-white"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className={labelCls}>Locker Number</label><input value={editLocker.lockerNumber} onChange={e => setEditLocker(l => l ? {...l, lockerNumber:e.target.value} : l)} className={inputCls}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Floor</label><input value={editLocker.floor ?? ""} onChange={e => setEditLocker(l => l ? {...l, floor:e.target.value||null} : l)} className={inputCls}/></div>
                <div><label className={labelCls}>Size</label>
                  <select value={editLocker.size ?? ""} onChange={e => setEditLocker(l => l ? {...l, size:e.target.value||null} : l)} className={inputCls}>
                    <option value="">Any</option>{SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div><label className={labelCls}>Monthly Fee</label><input value={editLocker.monthlyFee ?? ""} onChange={e => setEditLocker(l => l ? {...l, monthlyFee:e.target.value ? parseFloat(e.target.value) : null} : l)} type="number" className={inputCls}/></div>
              {editLocker.status !== "ASSIGNED" && (
                <div><label className={labelCls}>Status</label>
                  <select value={editLocker.status} onChange={e => setEditLocker(l => l ? {...l, status:e.target.value} : l)} className={inputCls}>
                    {["AVAILABLE","MAINTENANCE","RESERVED"].map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              )}
              <div><label className={labelCls}>Notes</label><input value={editLocker.notes ?? ""} onChange={e => setEditLocker(l => l ? {...l, notes:e.target.value||null} : l)} className={inputCls}/></div>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button onClick={() => { if(confirm("Delete this locker?")) handleDelete(editLocker.id).then(() => setEditLocker(null)) }} className="px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors">Delete</button>
              <button onClick={handleEditSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin"/>} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Modal ───────────────────────────────────────────────── */}
      {assignLocker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#141920] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-white font-semibold">Assign Locker {assignLocker.lockerNumber}</h2>
              <button onClick={() => setAssignLocker(null)} className="text-white/40 hover:text-white"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Member *</label>
                <select value={assignForm.memberId} onChange={e => setAssignForm(f => ({...f, memberId:e.target.value}))} className={inputCls}>
                  <option value="">Select member</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.profile.fullName}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Expiry Date (optional)</label><input value={assignForm.expiresAt} onChange={e => setAssignForm(f => ({...f, expiresAt:e.target.value}))} type="date" className={inputCls}/></div>
              <div><label className={labelCls}>Notes</label><input value={assignForm.notes} onChange={e => setAssignForm(f => ({...f, notes:e.target.value}))} placeholder="Optional note" className={inputCls}/></div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={assignForm.feeCollected} onChange={e => setAssignForm(f => ({...f, feeCollected:e.target.checked}))} className="w-4 h-4 accent-primary"/>
                <span className="text-white/60 text-sm">Fee collected</span>
              </label>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button onClick={() => setAssignLocker(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm">Cancel</button>
              <button onClick={handleAssign} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin"/>} Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Update Assignment Modal ────────────────────────────────────── */}
      {updateLocker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#141920] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-white font-semibold">Update Assignment — {updateLocker.lockerNumber}</h2>
              <button onClick={() => setUpdateLocker(null)} className="text-white/40 hover:text-white"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className={labelCls}>New Expiry Date</label><input value={updateForm.expiresAt} onChange={e => setUpdateForm(f => ({...f, expiresAt:e.target.value}))} type="date" className={inputCls}/></div>
              <div><label className={labelCls}>Notes</label><input value={updateForm.notes} onChange={e => setUpdateForm(f => ({...f, notes:e.target.value}))} placeholder="Optional note" className={inputCls}/></div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={updateForm.feeCollected} onChange={e => setUpdateForm(f => ({...f, feeCollected:e.target.checked}))} className="w-4 h-4 accent-primary"/>
                <span className="text-white/60 text-sm">Fee collected</span>
              </label>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button onClick={() => setUpdateLocker(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm">Cancel</button>
              <button onClick={handleUpdateAssignment} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin"/>} Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// src/app/owner/gyms/[gymId]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft, Building2, Users, UserCheck, CreditCard, TrendingUp,
  MapPin, Phone, Edit, Save, X, Loader2, CheckCircle, Tag,
  Plus, ToggleRight, ToggleLeft, Wifi, Car, Dumbbell
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface Gym {
  id: string; name: string; address: string | null; city: string | null; state: string | null
  pincode: string | null; contactNumber: string | null; isActive: boolean; timezone: string
  services: string[]; facilities: string[]
  _count: { members: number; trainers: number }
  membershipPlans: { id: string; name: string; price: number; durationMonths: number; isActive: boolean; features: string[] }[]
}

interface GymStats { monthRevenue: number; totalRevenue: number }
interface GymMemberRow {
  id: string; status: string; startDate: string; endDate: string | null
  profile: { fullName: string; email: string; mobileNumber: string | null }
  membershipPlan: { name: string } | null
}

const SERVICES  = ["Weight Training","Cardio","Yoga","Zumba","CrossFit","Boxing","Swimming","Cycling","Pilates","HIIT","Personal Training","Massage","Diet Planning","Supplements","Sports Training"]
const FACILITIES = ["Locker Room","Shower","Parking","AC","WiFi","Cafeteria","Steam Room","Sauna","Pro Shop","Child Care","Changing Room","Water Cooler","First Aid","CCTV","Music System"]
const TABS = ["Details","Members","Trainers","Facilities","Services","Plans"]

export default function GymDetailPage() {
  const { gymId } = useParams<{ gymId: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const [gym, setGym]     = useState<Gym | null>(null)
  const [stats, setStats] = useState<GymStats>({ monthRevenue: 0, totalRevenue: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab]     = useState("Details")
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Gym>>({})
  const [saving, setSaving]   = useState(false)

  // Plan form
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [planForm, setPlanForm] = useState({ name: "", description: "", durationMonths: "1", price: "", features: "" })
  const [planSaving, setPlanSaving] = useState(false)

  // Members list for Members tab
  const [gymMembers, setGymMembers] = useState<GymMemberRow[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

  const load = async () => {
    const [gymRes, payRes] = await Promise.all([
      fetch(`/api/owner/gyms/${gymId}`),
      fetch(`/api/owner/payments?gymId=${gymId}&page=1`),
    ])
    const gymData = await gymRes.json()
    const payData = await payRes.json()
    setGym(gymData)
    setEditForm(gymData)
    setStats({ monthRevenue: payData.monthTotal ?? 0, totalRevenue: payData.total ?? 0 })
    setLoading(false)
  }
  useEffect(() => { load() }, [gymId])

  // Load members lazily when Members tab is clicked
  useEffect(() => {
    if (tab !== "Members") return
    setMembersLoading(true)
    fetch(`/api/owner/members?gymId=${gymId}&page=1`)
      .then(r => r.json())
      .then(d => setGymMembers(Array.isArray(d.members) ? d.members : []))
      .finally(() => setMembersLoading(false))
  }, [tab, gymId])

  const saveGym = async () => {
    setSaving(true)
    const res = await fetch(`/api/owner/gyms/${gymId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm),
    })
    if (res.ok) { toast({ variant: "success", title: "Gym updated" }); setEditing(false); load() }
    else toast({ variant: "destructive", title: "Failed to update gym" })
    setSaving(false)
  }

  const addPlan = async () => {
    if (!planForm.name || !planForm.price) { toast({ variant: "destructive", title: "Name and price required" }); return }
    setPlanSaving(true)
    const res = await fetch("/api/owner/plans", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gymId, name: planForm.name, description: planForm.description,
        durationMonths: parseInt(planForm.durationMonths),
        price: parseFloat(planForm.price),
        features: planForm.features ? planForm.features.split(",").map(s => s.trim()).filter(Boolean) : [],
      }),
    })
    if (res.ok) {
      toast({ variant: "success", title: "Plan added!" })
      setShowPlanForm(false)
      setPlanForm({ name: "", description: "", durationMonths: "1", price: "", features: "" })
      load()
    } else toast({ variant: "destructive", title: "Failed to add plan" })
    setPlanSaving(false)
  }

  const toggleFacility = (val: string) => setEditForm(p => ({
    ...p, facilities: (p.facilities ?? []).includes(val)
      ? (p.facilities ?? []).filter(x => x !== val)
      : [...(p.facilities ?? []), val]
  }))
  const toggleService = (val: string) => setEditForm(p => ({
    ...p, services: (p.services ?? []).includes(val)
      ? (p.services ?? []).filter(x => x !== val)
      : [...(p.services ?? []), val]
  }))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  )
  if (!gym) return <div className="text-white/40 text-center py-20">Gym not found</div>

  const ef = (field: keyof Gym, val: any) => setEditForm(p => ({ ...p, [field]: val }))

  return (
    <div className="max-w-6xl space-y-5">

      {/* ── Back + Header ── */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.push("/owner/gyms")}
          className="mt-1 p-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-all shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-display font-bold text-white">{gym.name}</h2>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${gym.isActive ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
              {gym.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          {(gym.address || gym.city) && (
            <p className="text-white/40 text-sm mt-0.5 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              {[gym.address, gym.city, gym.state].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button onClick={saveGym} disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white h-9 text-sm gap-2">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
            </Button>
            <Button variant="outline" onClick={() => { setEditing(false); setEditForm(gym) }}
              className="border-white/10 text-white/60 hover:text-white h-9 text-sm gap-2">
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
          </div>
        ) : (
          <Button onClick={() => setEditing(true)}
            className="bg-white/8 hover:bg-white/12 border border-white/10 text-white h-9 text-sm gap-2">
            <Edit className="w-3.5 h-3.5" /> Edit Gym
          </Button>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users,      label: "Members",       value: gym._count.members,  sub: "Total enrolled" },
          { icon: UserCheck,  label: "Trainers",      value: gym._count.trainers, sub: "Active trainers" },
          { icon: CreditCard, label: "This Month",    value: `₹${stats.monthRevenue.toLocaleString("en-IN")}`, sub: "Revenue" },
          { icon: TrendingUp, label: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`, sub: "All time" },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 flex items-start justify-between">
            <div>
              <p className="text-white/40 text-xs mb-1">{label}</p>
              <p className="text-white text-2xl font-display font-bold">{value}</p>
              <p className="text-white/35 text-xs mt-0.5">{sub}</p>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-xl"><Icon className="w-5 h-5 text-primary" /></div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-white/4 p-1 rounded-xl w-fit overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tab === t ? "bg-[hsl(220_25%_12%)] text-white shadow" : "text-white/40 hover:text-white/70"
            }`}>{t}</button>
        ))}
      </div>

      {/* ── Details Tab ── */}
      {tab === "Details" && (
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
            <h3 className="text-white font-semibold text-sm mb-5">Basic Information</h3>
            {editing ? (
              <div className="space-y-3">
                {([
                  ["name","Gym Name *"], ["address","Address"], ["city","City"],
                  ["state","State"], ["pincode","Pincode"], ["contactNumber","Contact Number"]
                ] as [keyof Gym, string][]).map(([field, label]) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-white/50 text-xs">{label}</Label>
                    <Input value={(editForm[field] as string) ?? ""}
                      onChange={e => ef(field, e.target.value)}
                      className="bg-white/5 border-white/10 text-white focus:border-primary focus-visible:ring-0 h-9 text-sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: "Address",  value: gym.address },
                  { label: "City",     value: gym.city },
                  { label: "State",    value: gym.state },
                  { label: "Pincode",  value: gym.pincode },
                  { label: "Contact",  value: gym.contactNumber },
                  { label: "Timezone", value: gym.timezone },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="grid grid-cols-2 gap-2">
                    <span className="text-white/35 text-sm">{label}</span>
                    <span className="text-white font-medium text-sm">{value}</span>
                  </div>
                ) : null)}
              </div>
            )}
          </div>

          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
            <h3 className="text-white font-semibold text-sm mb-5">Services Overview</h3>
            <div className="flex flex-wrap gap-2">
              {gym.services.length > 0 ? gym.services.map(s => (
                <span key={s} className="text-xs bg-primary/10 border border-primary/20 text-primary/80 px-3 py-1.5 rounded-full font-medium">{s}</span>
              )) : <p className="text-white/30 text-sm">No services added yet</p>}
            </div>
            <h3 className="text-white font-semibold text-sm mt-6 mb-4">Facilities</h3>
            <div className="flex flex-wrap gap-2">
              {gym.facilities.length > 0 ? gym.facilities.map(f => (
                <span key={f} className="text-xs bg-white/6 border border-white/10 text-white/55 px-3 py-1.5 rounded-full">{f}</span>
              )) : <p className="text-white/30 text-sm">No facilities added yet</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Members Tab ── */}
      {tab === "Members" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-white/50 text-sm">{gym._count.members} member{gym._count.members !== 1 ? "s" : ""} enrolled</p>
            <Link href={`/owner/members/new?gymId=${gymId}`}
              className="flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> Add Member
            </Link>
          </div>

          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
            {membersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            ) : gymMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-8 h-8 text-white/15 mx-auto mb-3" />
                <p className="text-white/30 text-sm">No members yet</p>
                <Link href={`/owner/members/new?gymId=${gymId}`}
                  className="inline-flex items-center gap-2 mt-4 text-primary text-sm hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add the first member
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
                  <span>Member</span><span>Plan</span><span>Expires</span><span>Status</span>
                </div>
                <div className="divide-y divide-white/4">
                  {gymMembers.map(m => (
                    <Link key={m.id} href={`/owner/members/${m.id}`}
                      className="grid grid-cols-4 px-5 py-4 items-center hover:bg-white/2 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {m.profile.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{m.profile.fullName}</p>
                          <p className="text-white/35 text-xs truncate">{m.profile.mobileNumber ?? m.profile.email}</p>
                        </div>
                      </div>
                      <span className="text-white/55 text-sm">{m.membershipPlan?.name ?? "—"}</span>
                      <span className="text-white/55 text-sm">
                        {m.endDate ? new Date(m.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No expiry"}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium w-fit ${
                        m.status === "ACTIVE"     ? "bg-green-500/15 text-green-400"
                        : m.status === "EXPIRED"  ? "bg-red-500/15 text-red-400"
                        : "bg-yellow-500/15 text-yellow-400"
                      }`}>{m.status}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Trainers Tab ── */}
      {tab === "Trainers" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 text-center py-12">
          <UserCheck className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm mb-4">Manage all trainers for {gym.name}</p>
          <Link href={`/owner/trainers?gymId=${gymId}`}
            className="inline-flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
            <UserCheck className="w-4 h-4" /> View Trainers
          </Link>
        </div>
      )}

      {/* ── Facilities Tab ── */}
      {tab === "Facilities" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold text-sm">Facilities</h3>
            {!editing && <button onClick={() => setEditing(true)} className="text-primary text-xs hover:underline flex items-center gap-1"><Edit className="w-3 h-3" /> Edit</button>}
          </div>
          <div className="flex flex-wrap gap-2">
            {FACILITIES.map(f => {
              const active = (editing ? editForm.facilities : gym.facilities)?.includes(f)
              return (
                <button key={f} type="button"
                  onClick={() => editing && toggleFacility(f)}
                  className={`text-sm px-4 py-2 rounded-full border transition-all ${
                    active ? "bg-primary/15 border-primary/40 text-primary" : "bg-white/4 border-white/8 text-white/50"
                  } ${editing ? "cursor-pointer hover:border-white/20" : "cursor-default"}`}>
                  {f}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Services Tab ── */}
      {tab === "Services" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold text-sm">Services</h3>
            {!editing && <button onClick={() => setEditing(true)} className="text-primary text-xs hover:underline flex items-center gap-1"><Edit className="w-3 h-3" /> Edit</button>}
          </div>
          <div className="flex flex-wrap gap-2">
            {SERVICES.map(s => {
              const active = (editing ? editForm.services : gym.services)?.includes(s)
              return (
                <button key={s} type="button"
                  onClick={() => editing && toggleService(s)}
                  className={`text-sm px-4 py-2 rounded-full border transition-all ${
                    active ? "bg-primary/15 border-primary/40 text-primary" : "bg-white/4 border-white/8 text-white/50"
                  } ${editing ? "cursor-pointer hover:border-white/20" : "cursor-default"}`}>
                  {s}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Plans Tab ── */}
      {tab === "Plans" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowPlanForm(true)}
              className="flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> Add Plan
            </button>
          </div>

          {showPlanForm && (
            <div className="bg-[hsl(220_25%_9%)] border border-primary/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm">New Membership Plan</h3>
                <button onClick={() => setShowPlanForm(false)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[["name","Plan Name *"],["price","Price (₹) *"],["durationMonths","Duration (months) *"],["description","Description"]] .map(([field, label]) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-white/50 text-xs">{label}</Label>
                    <Input
                      type={field === "price" || field === "durationMonths" ? "number" : "text"}
                      value={(planForm as any)[field]}
                      onChange={e => setPlanForm(p => ({ ...p, [field]: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white focus:border-primary focus-visible:ring-0 h-9 text-sm" />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <Label className="text-white/50 text-xs">Features (comma separated)</Label>
                <Input value={planForm.features} onChange={e => setPlanForm(p => ({ ...p, features: e.target.value }))}
                  placeholder="Gym access, Locker, 2 PT sessions"
                  className="bg-white/5 border-white/10 text-white focus:border-primary focus-visible:ring-0 h-9 text-sm" />
              </div>
              <div className="flex gap-3">
                <Button onClick={addPlan} disabled={planSaving} className="bg-gradient-primary hover:opacity-90 text-white h-9 text-sm">
                  {planSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add Plan"}
                </Button>
                <Button variant="outline" onClick={() => setShowPlanForm(false)} className="border-white/10 text-white/60 hover:text-white h-9 text-sm">Cancel</Button>
              </div>
            </div>
          )}

          {gym.membershipPlans.length === 0 && !showPlanForm ? (
            <div className="text-center py-12 text-white/30">
              <Tag className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>No membership plans yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gym.membershipPlans.map(plan => (
                <div key={plan.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${plan.isActive ? "bg-green-500/15 text-green-400" : "bg-white/8 text-white/35"}`}>
                      {plan.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="text-primary font-display font-bold text-lg">₹{Number(plan.price).toLocaleString("en-IN")}</span>
                  </div>
                  <h4 className="text-white font-semibold mb-0.5">{plan.name}</h4>
                  <p className="text-white/40 text-xs mb-3">{plan.durationMonths} month{plan.durationMonths > 1 ? "s" : ""}</p>
                  <ul className="space-y-1.5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-white/50">
                        <CheckCircle className="w-3 h-3 text-primary/60 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
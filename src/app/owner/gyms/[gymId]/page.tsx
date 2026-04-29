
// src/app/owner/gyms/[gymId]/page.tsx
"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft, Building2, Users, UserCheck, CreditCard, TrendingUp,
  MapPin, Edit, Save, X, Loader2, CheckCircle, Tag,
  ChevronLeft, ChevronRight, Plus, Image as ImageIcon, Trash2, Star
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/Pagination"
import { MultiImageUpload } from "@/components/ui/MultiUpload"
import { Avatar } from "@/components/ui/Avatar"

interface Plan {
  id: string; name: string; price: number; durationMonths: number
  isActive: boolean; features: string[]; description: string | null
}
interface Gym {
  id: string; name: string; address: string | null; city: string | null; state: string | null
  pincode: string | null; contactNumber: string | null; isActive: boolean; timezone: string
  services: string[]; facilities: string[]; gymImages: string[]
  _count: { members: number; trainers: number }
  membershipPlans: Plan[]
}
interface MemberRow {
  id: string; status: string; startDate: string; endDate: string | null
  profile: { fullName: string; email: string; mobileNumber: string | null; avatarUrl: string | null }
  membershipPlan: { name: string } | null
}
interface TrainerRow {
  id: string; specializations: string[]; experienceYears: number
  _count: { assignedMembers: number }
  profile: { fullName: string; email: string; mobileNumber: string | null; avatarUrl: string | null }
}

const SERVICES   = ["Weight Training","Cardio","Yoga","Zumba","CrossFit","Boxing","Swimming","Cycling","Pilates","HIIT","Personal Training","Massage","Diet Planning","Supplements","Sports Training"]
const FACILITIES = ["Locker Room","Shower","Parking","AC","WiFi","Cafeteria","Steam Room","Sauna","Pro Shop","Child Care","Changing Room","Water Cooler","First Aid","CCTV","Music System"]
const TABS = ["Details","Members","Trainers","Services","Facilities","Plans","Photos","Reviews"]


export default function GymDetailPage() {
  const { gymId } = useParams<{ gymId: string }>()
  const router    = useRouter()
  const { toast } = useToast()

  const [gym, setGym]         = useState<Gym | null>(null)
  const [stats, setStats]     = useState({ monthRevenue: 0, totalRevenue: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState("Details")
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving]   = useState(false)

  const [facilityInput, setFacilityInput] = useState("")
  const [serviceInput,  setServiceInput]  = useState("")

  const [carouselIdx, setCarouselIdx] = useState(0)
  const carouselTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  const startCarousel = useCallback((total: number) => {
    if (carouselTimer.current) clearInterval(carouselTimer.current)
    if (total < 2) return
    carouselTimer.current = setInterval(() => {
      setCarouselIdx(i => (i + 1) % total)
    }, 3500)
  }, [])

  const [showPlanForm, setShowPlanForm] = useState(false)
  const [editingPlan, setEditingPlan]   = useState<Plan | null>(null)
  const [planForm, setPlanForm]         = useState({ name: "", description: "", durationMonths: "1", price: "", features: "" })
  const [planSaving, setPlanSaving]     = useState(false)

  const [gymMembers,   setGymMembers]   = useState<MemberRow[]>([])
  const [gymTrainers,  setGymTrainers]  = useState<TrainerRow[]>([])
  const [membersLoading, setMembersLoading]   = useState(false)
  const [trainersLoading, setTrainersLoading] = useState(false)
  const [membersPage,  setMembersPage]  = useState(1)
  const [membersPages, setMembersPages] = useState(1)
  const [membersTotal, setMembersTotal] = useState(0)

  const [gymReviews,      setGymReviews]      = useState<any[]>([])
  const [reviewsLoading,  setReviewsLoading]  = useState(false)
  const [reviewsTotal,    setReviewsTotal]    = useState(0)

  const load = useCallback(async () => {
    const [gymRes, payRes] = await Promise.all([
      fetch(`/api/owner/gyms/${gymId}`),
      fetch(`/api/owner/payments?gymId=${gymId}&page=1`),
    ])
    const gymData = await gymRes.json()
    const payData = await payRes.json()
    setGym(gymData)
    setEditForm({ ...gymData, gymImages: gymData.gymImages ?? [] })
    setStats({ monthRevenue: payData.monthTotal ?? 0, totalRevenue: payData.allTimeRevenue ?? 0 })
    setLoading(false)
    startCarousel((gymData.gymImages ?? []).length)
  }, [gymId, startCarousel])

  useEffect(() => { load() }, [load])

  // Cleanup carousel on unmount
  useEffect(() => {
    return () => { if (carouselTimer.current) clearInterval(carouselTimer.current) }
  }, [])

  // Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIdx === null) return
    const images = gym?.gymImages ?? []
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null)
      if (e.key === "ArrowRight") setLightboxIdx(i => i === null ? null : (i + 1) % images.length)
      if (e.key === "ArrowLeft")  setLightboxIdx(i => i === null ? null : (i - 1 + images.length) % images.length)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [lightboxIdx, gym?.gymImages])

  const loadMembers = useCallback((p: number) => {
    setMembersLoading(true)
    fetch(`/api/owner/members?gymId=${gymId}&page=${p}`)
      .then(r => r.json())
      .then(d => {
        setGymMembers(d.members ?? [])
        setMembersTotal(d.total ?? 0)
        setMembersPages(d.pages ?? 1)
        setMembersPage(p)
      })
      .finally(() => setMembersLoading(false))
  }, [gymId])

  useEffect(() => {
    if (tab !== "Members") return
    loadMembers(1)
  }, [tab, gymId])

  useEffect(() => {
    if (tab !== "Trainers") return
    setTrainersLoading(true)
    fetch(`/api/owner/trainers?gymId=${gymId}`)
      .then(r => r.json())
      .then(d => setGymTrainers(Array.isArray(d) ? d : []))
      .finally(() => setTrainersLoading(false))
  }, [tab, gymId])

  useEffect(() => {
    if (tab !== "Reviews") return
    setReviewsLoading(true)
    fetch(`/api/member/gyms/${gymId}/reviews`)
      .then(r => r.json())
      .then(d => { setGymReviews(d.reviews ?? []); setReviewsTotal(d.total ?? 0) })
      .finally(() => setReviewsLoading(false))
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

  const openAddPlan = () => {
    setEditingPlan(null)
    setPlanForm({ name: "", description: "", durationMonths: "1", price: "", features: "" })
    setShowPlanForm(true)
  }
  const openEditPlan = (p: Plan) => {
    setEditingPlan(p)
    setPlanForm({ name: p.name, description: p.description ?? "", durationMonths: String(p.durationMonths), price: String(p.price), features: p.features.join(", ") })
    setShowPlanForm(true)
  }
  const savePlan = async () => {
    if (!planForm.name || !planForm.price) { toast({ variant: "destructive", title: "Name and price required" }); return }
    setPlanSaving(true)
    const payload = { gymId, name: planForm.name, description: planForm.description, durationMonths: parseInt(planForm.durationMonths), price: parseFloat(planForm.price), features: planForm.features ? planForm.features.split(",").map((s: string) => s.trim()).filter(Boolean) : [] }
    const res = await fetch(
      editingPlan ? `/api/owner/plans/${editingPlan.id}` : "/api/owner/plans",
      { method: editingPlan ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
    )
    if (res.ok) { toast({ variant: "success", title: editingPlan ? "Plan updated!" : "Plan added!" }); setShowPlanForm(false); load() }
    else toast({ variant: "destructive", title: "Failed to save plan" })
    setPlanSaving(false)
  }


  const togglePlanActive = async (plan: Plan) => {
    const res = await fetch(`/api/owner/plans/${plan.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !plan.isActive })
    })
    if (res.ok) { toast({ variant: "success", title: plan.isActive ? "Plan deactivated" : "Plan activated" }); load()}
    else toast({ variant: "destructive", title: "Failed to update plan"})
  }
  const deletePlan = async (planId: string) => {
    if (!confirm("Permanently delete this plan? This cannot be undone.")) return
    const res = await fetch(`/api/owner/plans/${planId}`, { method: "DELETE" })
    if (res.ok) { toast({ variant: "success", title: "Plan deleted" }); load() }
    else {
      const d = await res.json();
      toast({ variant: 'destructive', title: d.error ?? "Failed to delete plan"})
    }
  }

  const toggleFacility = (v: string) => setEditForm((p: any) => ({ ...p, facilities: (p.facilities ?? []).includes(v) ? p.facilities.filter((x: string) => x !== v) : [...(p.facilities ?? []), v] }))
  const toggleService  = (v: string) => setEditForm((p: any) => ({ ...p, services:   (p.services   ?? []).includes(v) ? p.services.filter((x: string)   => x !== v) : [...(p.services   ?? []), v] }))

  const addCustomFacility = () => {
    const val = facilityInput.trim()
    if (!val) return
    setEditForm((p: any) => ({ ...p, facilities: [...new Set([...(p.facilities ?? []), val])] }))
    setFacilityInput("")
    if (!editing) setEditing(true)
  }
  const removeCustomFacility = (v: string) =>
    setEditForm((p: any) => ({ ...p, facilities: (p.facilities ?? []).filter((f: string) => f !== v) }))

  const addCustomService = () => {
    const val = serviceInput.trim()
    if (!val) return
    setEditForm((p: any) => ({ ...p, services: [...new Set([...(p.services ?? []), val])] }))
    setServiceInput("")
    if (!editing) setEditing(true)
  }
  const removeCustomService = (v: string) =>
    setEditForm((p: any) => ({ ...p, services: (p.services ?? []).filter((s: string) => s !== v) }))

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
  if (!gym)    return <div className="text-white/40 text-center py-20">Gym not found</div>

  const images = gym.gymImages ?? []

  return (
    <div className="max-w-6xl space-y-5">

      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.push("/owner/gyms")} className="mt-1 p-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-all shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-display font-bold text-white">{gym.name}</h2>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${gym.isActive ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>{gym.isActive ? "Active" : "Inactive"}</span>
          </div>
          {(gym.address || gym.city) && (
            <p className="text-white/40 text-sm mt-0.5 flex items-center gap-1.5"><MapPin className="w-3 h-3" />{[gym.address, gym.city, gym.state].filter(Boolean).join(", ")}</p>
          )}
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button onClick={saveGym} disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white h-9 text-sm gap-2">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
            </Button>
            <Button variant="outline" onClick={() => { setEditing(false); setEditForm({ ...gym, gymImages: gym.gymImages ?? [] }) }} className="border-white/10 text-white/60 hover:text-white h-9 text-sm gap-2">
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
          </div>
        ) : (
          <Button onClick={() => setEditing(true)} className="bg-white/8 hover:bg-white/12 border border-white/10 text-white h-9 text-sm gap-2">
            <Edit className="w-3.5 h-3.5" /> Edit Gym
          </Button>
        )}
      </div>

      {/* Carousel */}
      {images.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden bg-black" style={{ height: 220 }}>
          <img src={images[carouselIdx]} alt="Gym" className="w-full h-full object-cover opacity-90 cursor-pointer" onClick={() => setLightboxIdx(carouselIdx)} />
          {images.length > 1 && <>
            <button onClick={() => { setCarouselIdx(i => (i - 1 + images.length) % images.length); startCarousel(images.length) }} className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => { setCarouselIdx(i => (i + 1) % images.length); startCarousel(images.length) }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70"><ChevronRight className="w-4 h-4" /></button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_: string, i: number) => <button key={i} onClick={() => setCarouselIdx(i)} className={`h-1.5 rounded-full transition-all ${i === carouselIdx ? "bg-white w-4" : "bg-white/40 w-1.5"}`} />)}
            </div>
          </>}
          <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">{carouselIdx + 1}/{images.length}</div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users,      label: "Members",       value: gym._count.members },
          { icon: UserCheck,  label: "Trainers",      value: gym._count.trainers },
          { icon: CreditCard, label: "This Month",    value: `₹${stats.monthRevenue.toLocaleString("en-IN")}` },
          { icon: TrendingUp, label: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString("en-IN")}` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 flex items-start justify-between">
            <div>
              <p className="text-white/40 text-xs mb-1">{label}</p>
              <p className="text-white text-2xl font-display font-bold">{value}</p>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-xl"><Icon className="w-5 h-5 text-primary" /></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/4 p-1 rounded-xl overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0 ${tab === t ? "bg-[hsl(220_25%_12%)] text-white shadow" : "text-white/40 hover:text-white/70"}`}>{t}</button>
        ))}
      </div>

      {/* Details */}
      {tab === "Details" && (
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
            <h3 className="text-white font-semibold text-sm mb-5">Basic Information</h3>
            {editing ? (
              <div className="space-y-3">
                {(["name","address","city","state","pincode","contactNumber"] as const).map(field => (
                  <div key={field} className="space-y-1">
                    <Label className="text-white/50 text-xs capitalize">{field === "contactNumber" ? "Contact Number" : field}</Label>
                    <Input value={editForm[field] ?? ""} onChange={e => setEditForm((p: any) => ({ ...p, [field]: e.target.value }))} className="bg-white/5 border-white/10 text-white focus:border-primary focus-visible:ring-0 h-9 text-sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {[["Address",gym.address],["City",gym.city],["State",gym.state],["Pincode",gym.pincode],["Contact",gym.contactNumber],["Timezone",gym.timezone]].map(([l,v]) => v ? (
                  <div key={l as string} className="grid grid-cols-2 gap-2"><span className="text-white/35 text-sm">{l}</span><span className="text-white font-medium text-sm">{v}</span></div>
                ) : null)}
              </div>
            )}
          </div>
          {/* <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
            <h3 className="text-white font-semibold text-sm mb-4">Services</h3>
            <div className="flex flex-wrap gap-2 mb-5">
              {gym.services.length > 0 ? gym.services.map(s => <span key={s} className="text-xs bg-primary/10 border border-primary/20 text-primary/80 px-3 py-1.5 rounded-full font-medium">{s}</span>) : <p className="text-white/30 text-sm">No services</p>}
            </div>
            <h3 className="text-white font-semibold text-sm mb-4">Facilities</h3>
            <div className="flex flex-wrap gap-2">
              {gym.facilities.length > 0 ? gym.facilities.map(f => <span key={f} className="text-xs bg-white/6 border border-white/10 text-white/55 px-3 py-1.5 rounded-full">{f}</span>) : <p className="text-white/30 text-sm">No facilities</p>}
            </div>
          </div> */}
        </div>
      )}

      {/* Members */}
      {tab === "Members" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-white/50 text-sm">{gym._count.members} member{gym._count.members !== 1 ? "s" : ""} enrolled</p>
            <Link href={`/owner/members/new?gymId=${gymId}`} className="flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> Add Member
            </Link>
          </div>
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
            {membersLoading ? <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
              : gymMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-8 h-8 text-white/15 mx-auto mb-3" />
                <p className="text-white/30 text-sm">No members yet</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
                  <span>Member</span><span>Plan</span><span>Expires</span><span>Status</span>
                </div>
                <div className="divide-y divide-white/4">
                  {gymMembers.map(m => (
                    <Link key={m.id} href={`/owner/members/${m.id}`} className="grid grid-cols-4 px-5 py-4 items-center hover:bg-white/2 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={m.profile.fullName} url={m.profile.avatarUrl} size={32} />
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{m.profile.fullName}</p>
                          <p className="text-white/35 text-xs truncate">{m.profile.mobileNumber ?? m.profile.email}</p>
                        </div>
                      </div>
                      <span className="text-white/55 text-sm">{m.membershipPlan?.name ?? "—"}</span>
                      <span className="text-white/55 text-sm">{m.endDate ? new Date(m.endDate).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "No expiry"}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium w-fit ${m.status==="ACTIVE"?"bg-green-500/15 text-green-400":m.status==="EXPIRED"?"bg-red-500/15 text-red-400":"bg-yellow-500/15 text-yellow-400"}`}>{m.status}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
          <Pagination page={membersPage} pages={membersPages} total={membersTotal} limit={20} onChange={p => loadMembers(p)} />
        </div>
      )}

      {/* Trainers */}
      {tab === "Trainers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-white/50 text-sm">{gym._count.trainers} trainer{gym._count.trainers !== 1 ? "s" : ""}</p>
            <Link href={`/owner/trainers/new?gymId=${gymId}`} className="flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> Add Trainer
            </Link>
          </div>
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
            {trainersLoading ? <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
              : gymTrainers.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="w-8 h-8 text-white/15 mx-auto mb-3" />
                <p className="text-white/30 text-sm">No trainers yet</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
                  <span>Trainer</span><span>Specializations</span><span>Experience</span><span>Members</span>
                </div>
                <div className="divide-y divide-white/4">
                  {gymTrainers.map(t => (
                    <Link key={t.id} href={`/owner/trainers/${t.id}`} className="grid grid-cols-4 px-5 py-4 items-center hover:bg-white/2 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={t.profile.fullName} url={t.profile.avatarUrl} size={32} />
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{t.profile.fullName}</p>
                          <p className="text-white/35 text-xs truncate">{t.profile.mobileNumber ?? t.profile.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {t.specializations.slice(0,2).map((s:string) => <span key={s} className="text-xs bg-primary/10 text-primary/80 px-2 py-0.5 rounded-full">{s}</span>)}
                        {t.specializations.length > 2 && <span className="text-xs text-white/30">+{t.specializations.length-2}</span>}
                      </div>
                      <span className="text-white/55 text-sm">{t.experienceYears}yr{t.experienceYears !== 1 ? "s" : ""}</span>
                      <span className="text-white/55 text-sm">{t._count.assignedMembers} assigned</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Facilities */}
      {tab === "Facilities" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">Facilities</h3>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-primary text-xs hover:underline flex items-center gap-1">
                <Edit className="w-3 h-3" /> Edit
              </button>
            )}
          </div>

          {/* Custom entry input — edit mode only */}
          {editing && (
            <div className="flex gap-2">
              <Input
                value={facilityInput}
                onChange={e => setFacilityInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomFacility() } }}
                placeholder="Add a custom facility…"
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-9 text-sm"
              />
              <button
                type="button"
                onClick={addCustomFacility}
                disabled={!facilityInput.trim()}
                className="h-9 w-9 rounded-xl bg-primary hover:opacity-90 text-white flex items-center justify-center disabled:opacity-40 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* All facilities — active items show X icon, inactive tap to add */}
          <div className="flex flex-wrap gap-2">
            {/* Custom (non-predefined) active items */}
            {((editing ? editForm.facilities : gym.facilities) ?? [])
              .filter((f: string) => !FACILITIES.includes(f))
              .map((f: string) => (
                <span key={f} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border bg-primary/15 border-primary/40 text-primary">
                  {f}
                  {editing && (
                    <button type="button" onClick={() => removeCustomFacility(f)} className="hover:text-white transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            {/* Predefined items */}
            {FACILITIES.map(f => {
              const active = (editing ? editForm.facilities : gym.facilities)?.includes(f)
              if (active) {
                return (
                  <span key={f} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border bg-primary/15 border-primary/40 text-primary">
                    {f}
                    {editing && (
                      <button type="button" onClick={() => toggleFacility(f)} className="hover:text-white transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                )
              }
              return (
                <button key={f} type="button" onClick={() => editing && toggleFacility(f)}
                  className={`text-sm px-4 py-2 rounded-full border transition-all bg-white/4 border-white/8 text-white/50 ${editing ? "cursor-pointer hover:border-white/20" : "cursor-default"}`}>
                  {f}
                </button>
              )
            })}
          </div>

          {editing && (
            <div className="flex gap-3 pt-2 border-t border-white/6">
              <Button onClick={saveGym} disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white h-9 text-sm">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
              </Button>
              <Button variant="outline" onClick={() => { setEditing(false); setEditForm({ ...gym }); setFacilityInput("") }}
                className="border-white/10 text-white/60 h-9 text-sm bg-white/10 hover:bg-white/10">
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Services */}
      {tab === "Services" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">Services</h3>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-primary text-xs hover:underline flex items-center gap-1">
                <Edit className="w-3 h-3" /> Edit
              </button>
            )}
          </div>

          {/* Custom entry input — edit mode only */}
          {editing && (
            <div className="flex gap-2">
              <Input
                value={serviceInput}
                onChange={e => setServiceInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomService() } }}
                placeholder="Add a custom service…"
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-9 text-sm"
              />
              <button
                type="button"
                onClick={addCustomService}
                disabled={!serviceInput.trim()}
                className="h-9 w-9 rounded-xl bg-primary hover:opacity-90 text-white flex items-center justify-center disabled:opacity-40 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* All services — active items show X icon, inactive tap to add */}
          <div className="flex flex-wrap gap-2">
            {/* Custom (non-predefined) active items */}
            {((editing ? editForm.services : gym.services) ?? [])
              .filter((s: string) => !SERVICES.includes(s))
              .map((s: string) => (
                <span key={s} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border bg-primary/15 border-primary/40 text-primary">
                  {s}
                  {editing && (
                    <button type="button" onClick={() => removeCustomService(s)} className="hover:text-white transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            {/* Predefined items */}
            {SERVICES.map(s => {
              const active = (editing ? editForm.services : gym.services)?.includes(s)
              if (active) {
                return (
                  <span key={s} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border bg-primary/15 border-primary/40 text-primary">
                    {s}
                    {editing && (
                      <button type="button" onClick={() => toggleService(s)} className="hover:text-white transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                )
              }
              return (
                <button key={s} type="button" onClick={() => editing && toggleService(s)}
                  className={`text-sm px-4 py-2 rounded-full border transition-all bg-white/4 border-white/8 text-white/50 ${editing ? "cursor-pointer hover:border-white/20" : "cursor-default"}`}>
                  {s}
                </button>
              )
            })}
          </div>

          {editing && (
            <div className="flex gap-3 pt-2 border-t border-white/6">
              <Button onClick={saveGym} disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white h-9 text-sm">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
              </Button>
              <Button variant="outline" onClick={() => { setEditing(false); setEditForm({ ...gym }); setServiceInput("") }}
                className="border-white/10 text-white/60 h-9 text-sm bg-white/10 hover:bg-white/10">
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Plans */}
      {tab === "Plans" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openAddPlan} className="flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"><Plus className="w-4 h-4" /> Add Plan</button>
          </div>
          {showPlanForm && (
            <div className="bg-[hsl(220_25%_9%)] border border-primary/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm">{editingPlan ? "Edit Plan" : "New Membership Plan"}</h3>
                <button onClick={() => setShowPlanForm(false)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[["name","Plan Name *"],["price","Price (₹) *"],["durationMonths","Duration (months) *"],["description","Description"]].map(([field, label]) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-white/50 text-xs">{label}</Label>
                    <Input type={field==="price"||field==="durationMonths"?"number":"text"} value={(planForm as any)[field]} onChange={e => setPlanForm(p => ({...p,[field]:e.target.value}))} className="bg-white/5 border-white/10 text-white focus:border-primary focus-visible:ring-0 h-9 text-sm" />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <Label className="text-white/50 text-xs">Features (comma separated)</Label>
                <Input value={planForm.features} onChange={e => setPlanForm(p => ({...p,features:e.target.value}))} placeholder="Gym access, Locker, 2 PT sessions" className="bg-white/5 border-white/10 text-white focus:border-primary focus-visible:ring-0 h-9 text-sm" />
              </div>
              <div className="flex gap-3">
                <Button onClick={savePlan} disabled={planSaving} className="bg-gradient-primary hover:opacity-90 text-white h-9 text-sm">{planSaving?<Loader2 className="w-3 h-3 animate-spin"/>:editingPlan?"Save Changes":"Add Plan"}</Button>
                <Button variant="outline" onClick={() => setShowPlanForm(false)} className="border-white/10 text-white/60 hover:text-white h-9 text-sm">Cancel</Button>
              </div>
            </div>
          )}
          {gym.membershipPlans.length === 0 && !showPlanForm ? (
            <div className="text-center py-12 text-white/30"><Tag className="w-8 h-8 mx-auto mb-3 opacity-30" /><p>No membership plans yet.</p></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gym.membershipPlans.map(plan => (
                <div key={plan.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${plan.isActive?"bg-green-500/15 text-green-400":"bg-white/8 text-white/35"}`}>{plan.isActive?"Active":"Inactive"}</span>
                    <span className="text-primary font-display font-bold text-lg">₹{Number(plan.price).toLocaleString("en-IN")}</span>
                  </div>
                  <h4 className="text-white font-semibold mb-0.5">{plan.name}</h4>
                  <p className="text-white/40 text-xs mb-3">{plan.durationMonths} month{plan.durationMonths > 1 ? "s" : ""}</p>
                  <ul className="space-y-1.5 mb-4">
                    {plan.features.map(f => <li key={f} className="flex items-center gap-2 text-xs text-white/50"><CheckCircle className="w-3 h-3 text-primary/60 shrink-0" />{f}</li>)}
                  </ul>
                  <div className="flex gap-2 pt-3 border-t border-white/6">
                    <button onClick={() => openEditPlan(plan)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-primary hover:text-primary/80 py-1.5"><Edit className="w-3 h-3" />Edit</button>
                    <button onClick={() => togglePlanActive(plan)} className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 ${plan.isActive ? "text-amber-400/60 hover:text-amber-400" : "text-green-400/60 hover:text-green-400"}`}>
                      {plan.isActive ? "Deactivate" : "Activate"}
                    </button>
                     <button onClick={() => deletePlan(plan.id)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 py-1.5 px-2"><Trash2 className="w-3 h-3" />Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews */}
      {tab === "Reviews" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-white font-semibold text-sm">Member & Trainer Reviews</h3>
              {reviewsTotal > 0 && (
                <p className="text-white/35 text-xs mt-1">{reviewsTotal} review{reviewsTotal !== 1 ? "s" : ""}</p>
              )}
            </div>
          </div>
          {reviewsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          ) : gymReviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-8 h-8 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">No reviews yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/6">
              {gymReviews.map((r: any) => {
                const date = new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                return (
                  <div key={r.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                    <Avatar name={r.profile.fullName} url={r.profile.avatarUrl} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-semibold">{r.profile.fullName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.role === "trainer" ? "bg-blue-500/15 text-blue-400" : "bg-primary/15 text-primary"}`}>
                            {r.role === "trainer" ? "Trainer" : "Member"}
                          </span>
                        </div>
                        <span className="text-white/30 text-xs">{date}</span>
                      </div>
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "text-amber-400 fill-amber-400" : "text-white/15 fill-white/5"}`} />
                        ))}
                        <span className="text-white/40 text-xs ml-1">{r.rating}/5</span>
                      </div>
                      {r.comment && <p className="text-white/55 text-sm mt-1.5 leading-relaxed">{r.comment}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Photos */}
      {tab === "Photos" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">Gym Photos <span className="text-white/30 font-normal">(up to 8)</span></h3>
            {!editing && <button onClick={() => setEditing(true)} className="text-primary text-xs hover:underline flex items-center gap-1"><Edit className="w-3 h-3" /> Edit Photos</button>}
          </div>
          {editing ? (
            <>
              <MultiImageUpload values={editForm.gymImages ?? []} onChange={urls => setEditForm((p: any) => ({...p,gymImages:urls}))} max={8} folder="gymImages" />
              <div className="flex gap-3 pt-3 border-t border-white/6">
                <Button onClick={saveGym} disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white h-9 text-sm gap-2">{saving?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Save className="w-3.5 h-3.5"/>} Save Photos</Button>
                <Button variant="outline" onClick={()=>{setEditing(false);setEditForm({...gym})}} className="border-white/10 text-white/60 hover:text-white h-9 text-sm">Cancel</Button>
              </div>
            </>
          ) : gym.gymImages?.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {gym.gymImages.map((url: string, i: number) => <button key={i} className="w-32 h-32 rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary" onClick={() => setLightboxIdx(i)}><img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" /></button>)}
            </div>
          ) : (
            <div className="text-center py-10">
              <ImageIcon className="w-10 h-10 text-white/15 mx-auto mb-3" />
              <p className="text-white/30 text-sm mb-4">No photos uploaded yet</p>
              <button onClick={() => setEditing(true)} className="text-primary text-sm hover:underline">Add photos</button>
            </div>
          )}
        </div>
      )}
      {/* Lightbox */}
      {lightboxIdx !== null && gym?.gymImages?.length > 0 && (() => {
        const imgs = gym.gymImages
        const idx  = lightboxIdx
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={() => setLightboxIdx(null)}
          >
            {/* Close */}
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              onClick={() => setLightboxIdx(null)}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
              {idx + 1} / {imgs.length}
            </div>

            {/* Image */}
            <img
              src={imgs[idx]}
              alt=""
              className="max-w-[90vw] max-h-[85vh] rounded-xl object-contain select-none"
              onClick={e => e.stopPropagation()}
            />

            {/* Prev */}
            {imgs.length > 1 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                onClick={e => { e.stopPropagation(); setLightboxIdx((idx - 1 + imgs.length) % imgs.length) }}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Next */}
            {imgs.length > 1 && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                onClick={e => { e.stopPropagation(); setLightboxIdx((idx + 1) % imgs.length) }}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Dot indicators */}
            {imgs.length > 1 && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                {imgs.map((_: string, i: number) => (
                  <button
                    key={i}
                    onClick={e => { e.stopPropagation(); setLightboxIdx(i) }}
                    className={`h-1.5 rounded-full transition-all ${i === idx ? "bg-white w-5" : "bg-white/40 w-1.5"}`}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
// src/app/owner/members/new/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/ui/ImageUpload"

interface Gym {
  id: string; name: string
  membershipPlans: { id: string; name: string; price: number; durationMonths: number }[]
}

const FITNESS_GOALS = [
  "Muscle Building","Weight Loss","Weight Gain","General Fitness",
  "Cardio Health","Flexibility","Sports Training","Rehabilitation"
]

let regCounter = Math.floor(Math.random() * 100) + 1

// Defined OUTSIDE component — prevents input focus loss on re-render
const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-white/55 text-sm">{label}{required && <span className="text-primary ml-0.5">*</span>}</Label>
    {children}
  </div>
)

// Safe month addition — won't overflow (Jan 31 + 1mo → Feb 28, not Mar 3)
function addMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const date = new Date(y, m - 1 + months, d)
  if (date.getDate() !== d) date.setDate(0)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export default function AddMemberPage() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const { toast }   = useToast()

  const [gyms, setGyms]     = useState<Gym[]>([])
  const [loading, setLoading] = useState(false)
  const [regId] = useState(`REG-${String(regCounter).padStart(4, "0")}`)

  // Confirm dialog state — shown when member has active membership elsewhere
  const [showConfirm, setShowConfirm] = useState(false)

  const [form, setForm] = useState({
    gymId: "", membershipPlanId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    fullName: "", mobileNumber: "", email: "", gender: "",
    dateOfBirth: "", city: "", address: "",
    fitnessGoals: [] as string[],
    heightCm: "", weightKg: "", medicalNotes: "",
    emergencyContactName: "", emergencyContactPhone: "",
    workoutStartTime: "", workoutEndTime: "",
    paymentReceived: false,
  })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/owner/gyms").then(r => r.json()).then((data: Gym[]) => {
      setGyms(data)
      const urlGymId  = searchParams.get("gymId")
      const defaultGym = urlGymId ? data.find(g => g.id === urlGymId) : data[0]
      if (defaultGym) setForm(p => ({ ...p, gymId: defaultGym.id }))
    })
  }, [])

  const selectedGym  = gyms.find(g => g.id === form.gymId)
  const selectedPlan = selectedGym?.membershipPlans.find(p => p.id === form.membershipPlanId)

  useEffect(() => {
    if (selectedPlan && form.startDate) {
      const newEnd = addMonths(form.startDate, selectedPlan.durationMonths)
      setForm(p => ({ ...p, endDate: newEnd }))
    } else if (!form.membershipPlanId) {
      setForm(p => ({ ...p, endDate: "" }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.membershipPlanId, form.startDate, selectedPlan?.durationMonths])

  const toggleGoal = (g: string) =>
    setForm(p => ({ ...p, fitnessGoals: p.fitnessGoals.includes(g) ? p.fitnessGoals.filter(x => x !== g) : [...p.fitnessGoals, g] }))

  // Core submit — confirm=false on first attempt, confirm=true after dialog
  const submit = async (confirm = false) => {
    if (!form.fullName.trim())    { toast({ variant: "destructive", title: "Full name is required" }); return }
    if (!form.mobileNumber.trim()){ toast({ variant: "destructive", title: "Mobile number is required" }); return }
    if (!form.gymId)              { toast({ variant: "destructive", title: "Please select a gym" }); return }

    setLoading(true)
    try {
      const res = await fetch("/api/owner/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName:    form.fullName,
          mobileNumber: form.mobileNumber,
          email:       form.email || null,
          gender:      form.gender || null,
          dateOfBirth: form.dateOfBirth || null,
          city:        form.city || null,
          avatarUrl:   avatarUrl || null,
          gymId:       form.gymId,
          membershipPlanId: form.membershipPlanId || null,
          startDate:   form.startDate,
          endDate:     form.endDate || null,
          heightCm:    form.heightCm || null,
          weightKg:    form.weightKg || null,
          medicalNotes: form.medicalNotes || null,
          emergencyContactName:  form.emergencyContactName || null,
          emergencyContactPhone: form.emergencyContactPhone || null,
          workoutStartTime: form.workoutStartTime || null,
          workoutEndTime:   form.workoutEndTime   || null,
          confirm,
        }),
      })

      const data = await res.json()

      // ── Handle all status cases ────────────────────────────────────────
      if (data.status === "CONFLICT_OWNER") {
        toast({
          variant: "destructive",
          title: "Cannot add as member",
          description: "This email belongs to a gym owner and cannot be added as a gym member.",
        })
        return
      }

      if (data.status === "ALREADY_HERE") {
        toast({
          variant: "destructive",
          title: "Already enrolled",
          description: "This person is already a member of this gym.",
        })
        return
      }

      if (data.status === "ACTIVE_ELSEWHERE") {
        // Show confirmation dialog — don't close loading yet
        setShowConfirm(true)
        return
      }

      if (data.status === "CREATED" || data.status === "ENROLLED") {
        // Auto-record payment if owner checked "payment received"
        if (form.paymentReceived && selectedPlan && data.id) {
          await fetch("/api/owner/payments", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              gymId:            form.gymId,
              memberId:         data.id,
              membershipPlanId: form.membershipPlanId || null,
              amount:           selectedPlan.price,
              paymentMethod:    "CASH",
              paymentDate:      form.startDate,
            }),
          })
        }

        toast({
          variant: "success",
          title: data.status === "CREATED" ? "Member added!" : "Member enrolled!",
          description: data.status === "CREATED"
            ? `${form.fullName} enrolled. A password setup email has been sent.`
            : `${form.fullName} has been added to ${selectedGym?.name}.`,
        })
        router.push(`/owner/members/${data.gymMemberId ?? data.id}`)
        return
      }

      // Generic API error
      throw new Error(data.error ?? "Failed to add member")

    } catch (err: any) {
      toast({ variant: "destructive", title: err.message ?? "Something went wrong" })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); submit(false) }
  const handleConfirm = () => { setShowConfirm(false); submit(true) }

  const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-11 rounded-xl"
  const sel = "w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-11 text-sm focus:outline-none focus:border-primary"

  return (
    <div className="max-w-2xl">

      {/* ── Confirm Dialog — Active Elsewhere ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[hsl(220_25%_10%)] border border-yellow-500/30 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-500/15 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Active Membership Found</h3>
                <p className="text-white/55 text-sm leading-relaxed">
                  This member already has an active membership at another gym.
                  Do you still want to add them to <span className="text-white font-medium">{selectedGym?.name}</span>?
                  Their existing membership will not be affected.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <Button variant="outline" onClick={() => setShowConfirm(false)}
                className="border-white/10 text-white/60 hover:text-white h-10 text-sm">
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold h-10 text-sm px-6">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Add Anyway"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => router.back()}
          className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Add New Member</h2>
          <p className="text-white/40 text-sm">
            {selectedGym ? `Adding to ${selectedGym.name}` : "Register a new gym member"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Photo + Reg ID */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
          <div className="flex items-center gap-5">
            <ImageUpload value={avatarUrl} onChange={setAvatarUrl} shape="circle" size={80} placeholder="Photo" />
            <div>
              <p className="text-primary text-sm font-semibold">Upload Member Photo</p>
              <p className="text-white/40 text-xs mt-0.5">Registration ID: <span className="text-white/70 font-mono">{regId}</span></p>
              <p className="text-white/25 text-xs mt-1">JPG, PNG or WebP · Max 2MB</p>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm">Personal Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" required>
              <Input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                placeholder="Enter full name" className={inp} />
            </Field>
            <Field label="Mobile Number" required>
              <Input value={form.mobileNumber} onChange={e => setForm(p => ({ ...p, mobileNumber: e.target.value }))}
                placeholder="Enter mobile number" type="tel" className={inp} />
            </Field>
            <Field label="Email">
              <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="Enter email" type="email" className={inp} />
            </Field>
            <Field label="Gender">
              <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} className={sel}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Date of Birth">
              <Input value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                type="date" className={inp} />
            </Field>
            <Field label="City">
              <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                placeholder="Enter city" className={inp} />
            </Field>
          </div>
          <Field label="Address">
            <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              placeholder="Enter address" className={inp} />
          </Field>
        </div>

        {/* Fitness Goals */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-3">
          <h3 className="text-white font-semibold text-sm">Fitness Goals</h3>
          <div className="flex flex-wrap gap-2">
            {FITNESS_GOALS.map(g => (
              <button type="button" key={g} onClick={() => toggleGoal(g)}
                className={`text-sm px-4 py-2 rounded-full border transition-all ${
                  form.fitnessGoals.includes(g)
                    ? "bg-primary/15 border-primary/40 text-primary font-medium"
                    : "bg-white/4 border-white/10 text-white/50 hover:border-white/20"
                }`}>{g}</button>
            ))}
          </div>
        </div>

        {/* Membership */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm">Membership Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Gym" required>
              <select value={form.gymId} onChange={e => setForm(p => ({ ...p, gymId: e.target.value, membershipPlanId: "" }))} className={sel}>
                {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </Field>
            <Field label="Membership Plan">
              <select value={form.membershipPlanId} onChange={e => setForm(p => ({ ...p, membershipPlanId: e.target.value }))} className={sel}>
                <option value="">Select plan</option>
                {selectedGym?.membershipPlans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — ₹{p.price}/{p.durationMonths}mo</option>
                ))}
              </select>
            </Field>
            <Field label="Start Date">
              <Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className={inp} />
            </Field>
            <Field label="End Date">
              <div className="relative">
                <Input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className={inp} />
                {selectedPlan && form.endDate && (
                  <p className="text-primary/60 text-xs mt-1">Auto-calculated from {selectedPlan.durationMonths}-month plan</p>
                )}
              </div>
            </Field>
          </div>
          <div className="flex items-center justify-between py-3 border-t border-white/6 mt-2">
            <span className="text-white/50 text-sm">Total Fees</span>
            <span className="text-primary text-2xl font-display font-bold">
              ₹{selectedPlan ? Number(selectedPlan.price).toLocaleString("en-IN") : "0"}
            </span>
          </div>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div onClick={() => setForm(p => ({ ...p, paymentReceived: !p.paymentReceived }))}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                form.paymentReceived ? "border-primary bg-primary" : "border-white/25 group-hover:border-primary/50"
              }`}>
              {form.paymentReceived && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <span className="text-white/60 text-sm">Check if you received payment</span>
          </label>
        </div>

        {/* Health Info */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm">Health Info <span className="text-white/30 font-normal">(optional)</span></h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Height (cm)">
              <Input type="number" value={form.heightCm} onChange={e => setForm(p => ({ ...p, heightCm: e.target.value }))} placeholder="170" className={inp} />
            </Field>
            <Field label="Weight (kg)">
              <Input type="number" value={form.weightKg} onChange={e => setForm(p => ({ ...p, weightKg: e.target.value }))} placeholder="65" className={inp} />
            </Field>
            <Field label="Emergency Contact Name">
              <Input value={form.emergencyContactName} onChange={e => setForm(p => ({ ...p, emergencyContactName: e.target.value }))} className={inp} />
            </Field>
            <Field label="Emergency Contact Phone">
              <Input value={form.emergencyContactPhone} onChange={e => setForm(p => ({ ...p, emergencyContactPhone: e.target.value }))} className={inp} />
            </Field>
          </div>
          <Field label="Medical Notes">
            <textarea value={form.medicalNotes} onChange={e => setForm(p => ({ ...p, medicalNotes: e.target.value }))} rows={2}
              placeholder="Any allergies, injuries or conditions..."
              className="w-full bg-[hsl(220_25%_11%)] border border-white/10 rounded-xl text-white text-sm p-3 focus:outline-none focus:border-primary placeholder:text-white/20 resize-none" />
          </Field>
        </div>

        {/* Workout Timing */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-white font-semibold text-sm">Workout Timing <span className="text-white/30 font-normal">(optional)</span></h3>
            <p className="text-white/35 text-xs mt-0.5">Record when this member plans to work out</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Workout Start Time">
              <Input type="time" value={form.workoutStartTime}
                onChange={e => setForm(p => ({ ...p, workoutStartTime: e.target.value }))}
                className={inp} />
            </Field>
            <Field label="Workout End Time">
              <Input type="time" value={form.workoutEndTime}
                onChange={e => setForm(p => ({ ...p, workoutEndTime: e.target.value }))}
                className={inp} />
            </Field>
          </div>
          {form.workoutStartTime && form.workoutEndTime && (
            <div className="flex items-center gap-2 text-xs text-primary/80 bg-primary/5 border border-primary/15 rounded-xl px-4 py-2.5">
              <span>⏱️</span>
              <span>Workout slot: <strong>{form.workoutStartTime}</strong> – <strong>{form.workoutEndTime}</strong></span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pb-4">
          <Button type="button" variant="outline" onClick={() => router.back()}
            className="border-white/10 bg-white/5 text-white hover:bg-white/8 h-11 px-6">Cancel</Button>
          <Button type="submit" disabled={loading}
            className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 px-8">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Member"}
          </Button>
        </div>
      </form>
    </div>
  )
}
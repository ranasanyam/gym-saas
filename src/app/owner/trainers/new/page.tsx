// src/app/owner/trainers/new/page.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft, UserCheck, MessageSquare, Loader, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/ui/ImageUpload"
const SPECIALIZATIONS = [
  "Weight Training", "Cardio", "Yoga", "Zumba", "CrossFit",
  "Boxing", "HIIT", "Pilates", "Nutrition", "Swimming",
  "Personal Training", "Stretching", "Rehabilitation", "Dance Fitness", "Martial Arts",
]

type MobileStatus = "idle" | "checking" | "available" | "exists_active" | "exists_invited"

interface FormErrors { fullName?: string; mobileNumber?: string }

const Field = ({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-white/55 text-sm">
      {label}{required && <span className="text-primary ml-0.5">*</span>}
    </Label>
    {children}
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
)

function outcomeMessage(outcome: string, name: string, gymName: string) {
  if (outcome === "created")   return `${name} has been added. They'll receive an SMS to complete their profile.`
  if (outcome === "reinvited") return `${name} was already invited. A fresh SMS has been sent.`
  if (outcome === "linked")    return `${name} is already on GymStack and has been added to ${gymName}.`
  return `${name} has been added to ${gymName}.`
}

export default function AddTrainerPage() {
  const router    = useRouter()
  const { toast } = useToast()

  const [gyms, setGyms]       = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState<FormErrors>({})

  const [gymId,           setGymId]           = useState("")
  const [fullName,        setFullName]        = useState("")
  const [mobileNumber,    setMobileNumber]    = useState("")
  const [mobileStatus,    setMobileStatus]    = useState<MobileStatus>("idle")
  const [email,           setEmail]           = useState("")
  const [gender,          setGender]          = useState("")
  const [dateOfBirth,     setDateOfBirth]     = useState("")
  const [address,         setAddress]         = useState("")
  const [avatarUrl,       setAvatarUrl]       = useState("")
  const [bio,             setBio]             = useState("")
  const [experienceYears, setExperienceYears] = useState("0")
  const [certifications,  setCertifications]  = useState("")
  const [specializations, setSpecializations] = useState<string[]>([])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkMobile = (digits: string) => {
    if (digits.length !== 10) { setMobileStatus("idle"); return }
    setMobileStatus("checking")
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/auth/check-mobile-status?mobile=${digits}`)
        const data = await res.json()
        if (data.status === "NOT_FOUND")   setMobileStatus("available")
        else if (data.status === "ACTIVE") setMobileStatus("exists_active")
        else                               setMobileStatus("exists_invited")
      } catch {
        setMobileStatus("idle")
      }
    }, 500)
  }

  const MobileHint = () => {
    if (mobileStatus === "checking")
      return <span className="text-white/30 text-xs flex items-center gap-1"><Loader className="w-3 h-3 animate-spin" /> Checking…</span>
    if (mobileStatus === "available")
      return <span className="text-green-400 text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> New user — an SMS will be sent</span>
    if (mobileStatus === "exists_active")
      return <span className="text-amber-400 text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Existing GymStack user — will be linked to your gym</span>
    if (mobileStatus === "exists_invited")
      return <span className="text-amber-400 text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Already invited — a fresh SMS will be sent</span>
    return null
  }

  const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-11 rounded-xl"
  const sel = "w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-11 text-sm focus:outline-none focus:border-primary"

  useEffect(() => {
    fetch("/api/owner/gyms").then(r => r.json()).then((data: { id: string; name: string }[]) => {
      setGyms(data)
      if (data.length > 0) setGymId(data[0].id)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (val: string) =>
    setSpecializations(prev =>
      prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
    )

  const selectedGym = gyms.find(g => g.id === gymId)

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errs: FormErrors = {}
    if (!fullName.trim())     errs.fullName = "Full name is required"
    if (!mobileNumber.trim()) errs.mobileNumber = "Mobile number is required"
    else if (mobileNumber.length !== 10) errs.mobileNumber = "Enter a valid 10-digit mobile number"
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    if (!gymId) { toast({ variant: "destructive", title: "Please select a gym" }); return }

    setLoading(true)
    try {
      const res = await fetch("/api/owner/trainers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gymId,
          fullName:       fullName.trim(),
          mobileNumber:   mobileNumber.trim(),
          email:          email.trim() || null,
          gender:         gender || null,
          dateOfBirth:    dateOfBirth || null,
          address:        address.trim() || null,
          avatarUrl:      avatarUrl.trim() || null,
          bio:            bio.trim() || null,
          experienceYears: parseInt(experienceYears) || 0,
          specializations,
          certifications: certifications
            ? certifications.split(",").map(s => s.trim()).filter(Boolean)
            : [],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({
        variant: "success",
        title: "Trainer added!",
        description: outcomeMessage(data.outcome, fullName.trim(), selectedGym?.name ?? "your gym"),
      })
      router.push("/owner/trainers")
    } catch (err: any) {
      toast({ variant: "destructive", title: err.message ?? "Failed to add trainer" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => router.back()}
          className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Add Trainer</h2>
          <p className="text-white/40 text-sm">
            {selectedGym ? `Adding to ${selectedGym.name}` : "Register a new trainer"}
          </p>
        </div>
      </div>

      {/* SMS callout */}
      <div className="flex items-start gap-3 bg-primary/8 border border-primary/20 rounded-2xl p-4 mb-5">
        <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-primary/90 text-sm leading-relaxed">
          The trainer will receive an SMS to complete their profile (email, password, city, etc.).
          You only need their name and mobile number to get started.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Core fields */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" /> Trainer Details
          </h3>

          <Field label="Full Name" required error={errors.fullName}>
            <Input value={fullName} onChange={e => { setFullName(e.target.value); if (errors.fullName) setErrors(p => ({ ...p, fullName: undefined })) }}
              placeholder="Enter full name" className={`${inp} ${errors.fullName ? "border-red-500/50" : ""}`} />
          </Field>
          <Field label="Mobile Number" required error={errors.mobileNumber}>
            <Input
              value={mobileNumber}
              onChange={e => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 10)
                setMobileNumber(digits)
                setMobileStatus("idle")
                if (errors.mobileNumber) setErrors(p => ({ ...p, mobileNumber: undefined }))
                checkMobile(digits)
              }}
              placeholder="10-digit mobile number"
              type="tel"
              maxLength={10}
              className={`${inp} ${errors.mobileNumber ? "border-red-500/50" : ""}`}
            />
            <MobileHint />
          </Field>

          {gyms.length > 1 && (
            <Field label="Gym" required>
              <select value={gymId} onChange={e => setGymId(e.target.value)} className={sel}>
                {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </Field>
          )}
        </div>

        {/* Profile Details (optional) */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm">
            Profile Details <span className="text-white/30 font-normal">(optional)</span>
          </h3>
          <div className="space-y-1.5">
            <Label className="text-white/55 text-sm">Profile Photo <span className="text-white/30 font-normal">(optional)</span></Label>
            <ImageUpload value={avatarUrl} onChange={v => setAvatarUrl(v ?? "")} shape="circle" size={80} folder="avatars" placeholder="Add Photo" />
          </div>
          <Field label="Email">
            <Input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="trainer@example.com" type="email" className={inp} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Gender">
              <select value={gender} onChange={e => setGender(e.target.value)} className={sel}>
                <option value="">Select…</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </Field>
            <Field label="Date of Birth">
              <Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className={inp} />
            </Field>
          </div>
          <Field label="Address">
            <Input value={address} onChange={e => setAddress(e.target.value)}
              placeholder="Street, city, state" className={inp} />
          </Field>
        </div>

        {/* Professional Details (optional) */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm">
            Professional Details <span className="text-white/30 font-normal">(optional)</span>
          </h3>

          <Field label="Years of Experience">
            <Input type="number" min="0" value={experienceYears}
              onChange={e => setExperienceYears(e.target.value)} className={inp} />
          </Field>

          <Field label="Certifications (comma separated)">
            <Input value={certifications} onChange={e => setCertifications(e.target.value)}
              placeholder="ACE, NASM, ISSA..." className={inp} />
          </Field>

          <Field label="Bio">
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              placeholder="Brief introduction about the trainer..."
              className="w-full bg-[hsl(220_25%_11%)] border border-white/10 rounded-xl text-white text-sm p-3 focus:outline-none focus:border-primary placeholder:text-white/20 resize-none" />
          </Field>

          <div className="space-y-2">
            <Label className="text-white/55 text-sm">Specializations</Label>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map(s => (
                <button type="button" key={s} onClick={() => toggle(s)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-all ${
                    specializations.includes(s)
                      ? "bg-primary/15 border-primary/40 text-primary font-medium"
                      : "bg-white/4 border-white/10 text-white/50 hover:border-white/20"
                  }`}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-4">
          <Button type="button" variant="outline" onClick={() => router.back()}
            className="border-white/10 bg-white/5 text-white hover:bg-white/8 h-11 px-6">Cancel</Button>
          <Button type="submit" disabled={loading || mobileStatus === "checking"}
            className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 px-8">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Trainer"}
          </Button>
        </div>
      </form>
    </div>
  )
}

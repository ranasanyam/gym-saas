// src/app/owner/trainers/new/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft, UserCheck, MessageSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const SPECIALIZATIONS = [
  "Weight Training", "Cardio", "Yoga", "Zumba", "CrossFit",
  "Boxing", "HIIT", "Pilates", "Nutrition", "Swimming",
  "Personal Training", "Stretching", "Rehabilitation", "Dance Fitness", "Martial Arts",
]

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-white/55 text-sm">
      {label}{required && <span className="text-primary ml-0.5">*</span>}
    </Label>
    {children}
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

  const [gymId,           setGymId]           = useState("")
  const [fullName,        setFullName]        = useState("")
  const [mobileNumber,    setMobileNumber]    = useState("")
  const [bio,             setBio]             = useState("")
  const [experienceYears, setExperienceYears] = useState("0")
  const [certifications,  setCertifications]  = useState("")
  const [specializations, setSpecializations] = useState<string[]>([])

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
    if (!gymId)            { toast({ variant: "destructive", title: "Please select a gym" }); return }
    if (!fullName.trim())  { toast({ variant: "destructive", title: "Full name is required" }); return }
    if (!mobileNumber.trim()) { toast({ variant: "destructive", title: "Mobile number is required" }); return }

    setLoading(true)
    try {
      const res = await fetch("/api/owner/trainers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gymId,
          fullName:       fullName.trim(),
          mobileNumber:   mobileNumber.trim(),
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

          <Field label="Full Name" required>
            <Input value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="Enter full name" className={inp} />
          </Field>
          <Field label="Mobile Number" required>
            <Input value={mobileNumber} onChange={e => setMobileNumber(e.target.value)}
              placeholder="10-digit mobile number" type="tel" className={inp} />
          </Field>

          {gyms.length > 1 && (
            <Field label="Gym" required>
              <select value={gymId} onChange={e => setGymId(e.target.value)} className={sel}>
                {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </Field>
          )}
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
          <Button type="submit" disabled={loading}
            className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 px-8">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Trainer"}
          </Button>
        </div>
      </form>
    </div>
  )
}

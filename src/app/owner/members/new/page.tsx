// src/app/owner/members/new/page.tsx
"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2, ArrowLeft, MessageSquare, Users, CreditCard,
  CheckCircle2, Loader,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/ui/ImageUpload"
interface Gym {
  id: string
  name: string
  membershipPlans: { id: string; name: string; price: number; durationMonths: number }[]
}

interface FormErrors {
  fullName?:         string
  mobileNumber?:     string
  membershipPlanId?: string
  startDate?:        string
  endDate?:          string
  paymentReceived?:  string
}

type MobileStatus = "idle" | "checking" | "available" | "exists_active" | "exists_invited"

// ── Helpers ───────────────────────────────────────────────────────────────────

function addMonths(dateStr: string, months: number): string {
  console.log('data', dateStr)
  const d   = new Date(dateStr)
  const day = d.getDate()
  d.setMonth(d.getMonth() + months)
  if (d.getDate() !== day) d.setDate(0)
  return d.toISOString().split("T")[0]
}

function outcomeMessage(outcome: string, name: string, gymName: string) {
  if (outcome === "created")   return `${name} has been added. They'll receive an SMS to complete their profile.`
  if (outcome === "reinvited") return `${name} was already invited. A fresh SMS has been sent.`
  if (outcome === "linked")    return `${name} is already on GymStack and has been added to ${gymName}.`
  return `${name} has been added to ${gymName}.`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-white/55 text-sm">
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

function PaymentRadio({
  value, onChange, error,
}: {
  value: boolean | null
  onChange: (v: boolean) => void
  error?: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-white/55 text-sm">
        Payment Received<span className="text-primary ml-0.5">*</span>
      </Label>
      <div className="flex gap-3">
        {([true, false] as const).map(opt => {
          const label    = opt ? "Yes" : "No"
          const selected = value === opt
          return (
            <button
              key={String(opt)}
              type="button"
              onClick={() => onChange(opt)}
              className={`flex-1 h-11 rounded-xl border text-sm font-semibold transition-all ${
                selected
                  ? opt
                    ? "bg-green-500/15 border-green-500/50 text-green-400"
                    : "bg-red-500/10 border-red-500/40 text-red-400"
                  : "bg-white/5 border-white/10 text-white/50 hover:border-white/25 hover:text-white/75"
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────

function AddMemberContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { toast }    = useToast()

  const [gyms,    setGyms]    = useState<Gym[]>([])
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState<FormErrors>({})
  // Required fields
  const [gymId,            setGymId]            = useState("")
  const [membershipPlanId, setMembershipPlanId] = useState("")
  const [startDate,        setStartDate]        = useState(new Date().toISOString().split("T")[0])
  const [endDate,          setEndDate]          = useState("")
  const [paymentReceived,  setPaymentReceived]  = useState<boolean | null>(null)
  const [fullName,         setFullName]         = useState("")
  const [mobileNumber,     setMobileNumber]     = useState("")
  const [mobileStatus,     setMobileStatus]     = useState<MobileStatus>("idle")

  // Optional fields
  const [email,       setEmail]       = useState("")
  const [gender,      setGender]      = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [address,     setAddress]     = useState("")
  const [goals,       setGoals]       = useState("")
  const [avatarUrl,   setAvatarUrl]   = useState("")

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load gyms
  useEffect(() => {
    fetch("/api/owner/gyms")
      .then(r => r.json())
      .then((data: Gym[]) => {
        setGyms(data)
        const urlGymId   = searchParams.get("gymId")
        const defaultGym = urlGymId ? data.find(g => g.id === urlGymId) : data[0]
        if (defaultGym) setGymId(defaultGym.id)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-compute end date
  useEffect(() => {
    if (!membershipPlanId) { setEndDate(""); return }
    console.log('gyms', gyms)
    const plan = gyms.find(g => g.id === gymId)?.membershipPlans.find(p => p.id === membershipPlanId)
    if (plan) {
      console.log('start', startDate);
      console.log('duration', plan);
      setEndDate(addMonths(startDate, plan.durationMonths))

    }
  }, [membershipPlanId, startDate, gymId, gyms])

  // Debounced mobile uniqueness check
  const checkMobile = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(-10)
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

  const selectedGym  = gyms.find(g => g.id === gymId)
  const selectedPlan = selectedGym?.membershipPlans.find(p => p.id === membershipPlanId)

  // ── Validation ───────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const e: FormErrors = {}
    if (!fullName.trim())         e.fullName         = "Full name is required"
    if (!mobileNumber.trim())     e.mobileNumber     = "Mobile number is required"
    else if (mobileNumber.replace(/\D/g, "").length !== 10)
                                  e.mobileNumber     = "Enter a valid 10-digit mobile number"
    if (!membershipPlanId)        e.membershipPlanId = "Membership plan is required"
    if (!startDate)               e.startDate        = "Start date is required"
    if (!endDate)                 e.endDate          = "End date is required"
    if (paymentReceived === null)
                                  e.paymentReceived  = "Please confirm whether payment has been received"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-11 rounded-xl"
  const sel = "w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-11 text-sm focus:outline-none focus:border-primary"

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch("/api/owner/members", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gymId,
          fullName:         fullName.trim(),
          mobileNumber:     mobileNumber.trim(),
          membershipPlanId: membershipPlanId || null,
          startDate,
          endDate:          endDate || null,
          paymentReceived:  paymentReceived ?? false,
          // Optional profile fields
          email:       email.trim() || null,
          gender:      gender || null,
          dateOfBirth: dateOfBirth || null,
          address:     address.trim() || null,
          goals:       goals.trim()
            ? goals.split(/[\n,]/).map(g => g.trim()).filter(Boolean)
            : [],
          avatarUrl: avatarUrl.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to add member")

      toast({
        variant:     "success",
        title:       "Member added!",
        description: outcomeMessage(data.outcome, fullName.trim(), selectedGym?.name ?? "your gym"),
      })
      router.push(`/owner/members/${data.id}`)
    } catch (err: any) {
      toast({ variant: "destructive", title: err.message ?? "Something went wrong" })
    } finally {
      setLoading(false)
    }
  }

  // Mobile status indicator icon
  const MobileHint = () => {
    if (mobileStatus === "checking")
      return <span className="text-white/30 text-xs flex items-center gap-1"><Loader className="w-3 h-3 animate-spin" /> Checking…</span>
    if (mobileStatus === "available")
      return <span className="text-green-400 text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> New member — an SMS will be sent</span>
    if (mobileStatus === "exists_active")
      return <span className="text-amber-400 text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Existing GymStack user — will be linked to your gym</span>
    if (mobileStatus === "exists_invited")
      return <span className="text-amber-400 text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Already invited — a fresh SMS will be sent</span>
    return null
  }

  return (
    <div className="max-w-lg">

      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Add New Member</h2>
          <p className="text-white/40 text-sm">
            {selectedGym ? `Adding to ${selectedGym.name}` : "Register a new gym member"}
          </p>
        </div>
      </div>

      {/* SMS callout */}
      <div className="flex items-start gap-3 bg-primary/8 border border-primary/20 rounded-2xl p-4 mb-5">
        <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-primary/90 text-sm leading-relaxed">
          The member will receive an SMS to complete their profile. You only need their name, mobile number, and plan to get started.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Member details */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Member Details
          </h3>
          <div className="space-y-1.5">
              <Label className="text-white/55 text-sm">Profile Photo <span className="text-white/30 font-normal">(optional)</span></Label>
              <ImageUpload value={avatarUrl} onChange={v => setAvatarUrl(v ?? "")} shape="circle" size={80} folder="avatars" placeholder="Add Photo" />
            </div>

          <Field label="Full Name" required error={errors.fullName}>
            <Input
              value={fullName}
              onChange={e => { setFullName(e.target.value); if (errors.fullName) setErrors(p => ({ ...p, fullName: undefined })) }}
              placeholder="Enter full name"
              className={`${inp} ${errors.fullName ? "border-red-500/50" : ""}`}
            />
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

          <div className="space-y-4 pt-1 border-t border-white/6">
            

            <Field label="Email">
              <Input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="member@example.com"
                type="email"
                className={inp}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Gender">
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className={sel}
                >
                  <option value="">Select…</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </Field>

              <Field label="Date of Birth">
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  className={inp}
                />
              </Field>
            </div>

            <Field label="Address">
              <Input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Street, city, state"
                className={inp}
              />
            </Field>

            <Field label="Goals">
              <textarea
                value={goals}
                onChange={e => setGoals(e.target.value)}
                placeholder="e.g. Weight loss, Build muscle, Improve fitness (one per line or comma-separated)"
                rows={3}
                className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white placeholder:text-white/20 focus:border-primary focus:outline-none rounded-xl px-3 py-2.5 text-sm resize-none"
              />
            </Field>
          </div>
        </div>

        {/* Gym + Plan */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" /> Membership
          </h3>

          {gyms.length > 1 && (
            <Field label="Gym" required>
              <select
                value={gymId}
                onChange={e => { setGymId(e.target.value); setMembershipPlanId(""); setPaymentReceived(null) }}
                className={sel}
              >
                {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </Field>
          )}

          <Field label="Membership Plan" required error={errors.membershipPlanId}>
            <select
              value={membershipPlanId}
              onChange={e => {
                setMembershipPlanId(e.target.value)
                setPaymentReceived(null)
                if (errors.membershipPlanId) setErrors(p => ({ ...p, membershipPlanId: undefined }))
              }}
              className={`${sel} ${errors.membershipPlanId ? "border-red-500/50" : ""}`}
            >
              <option value="">Select a plan…</option>
              {selectedGym?.membershipPlans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — ₹{Number(p.price).toLocaleString("en-IN")} / {p.durationMonths} mo
                </option>
              ))}
            </select>
          </Field>

          {membershipPlanId && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Start Date" required error={errors.startDate}>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={e => { setStartDate(e.target.value); if (errors.startDate) setErrors(p => ({ ...p, startDate: undefined })) }}
                    className={`${inp} ${errors.startDate ? "border-red-500/50" : ""}`}
                  />
                </Field>
                <Field label="End Date" required error={errors.endDate}>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={e => { setEndDate(e.target.value); if (errors.endDate) setErrors(p => ({ ...p, endDate: undefined })) }}
                    className={`${inp} ${errors.endDate ? "border-red-500/50" : ""}`}
                  />
                </Field>
              </div>

              {/* Total Amount — read-only */}
              <div className="flex items-center justify-between py-3 px-4 bg-white/3 border border-white/6 rounded-xl">
                <span className="text-white/50 text-sm">Total Amount</span>
                <span className="text-primary text-xl font-display font-bold">
                  ₹{selectedPlan ? Number(selectedPlan.price).toLocaleString("en-IN") : "—"}
                </span>
              </div>

              {/* Payment received — radio group, required */}
              <PaymentRadio
                value={paymentReceived}
                onChange={v => { setPaymentReceived(v); if (errors.paymentReceived) setErrors(p => ({ ...p, paymentReceived: undefined })) }}
                error={errors.paymentReceived}
              />

              {paymentReceived === true && selectedPlan && (
                <p className="text-green-400/70 text-xs">
                  ₹{Number(selectedPlan.price).toLocaleString("en-IN")} will be recorded in gym revenue.
                </p>
              )}
              {paymentReceived === false && (
                <p className="text-amber-400/70 text-xs">
                  Member will be added but no payment will be recorded.
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 pb-4">
          <Button
            type="button" variant="outline"
            onClick={() => router.back()}
            className="border-white/10 bg-white/5 text-white hover:bg-white/8 h-11 px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || mobileStatus === "checking"}
            className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 px-8"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Member"}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function AddMemberPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    }>
      <AddMemberContent />
    </Suspense>
  )
}

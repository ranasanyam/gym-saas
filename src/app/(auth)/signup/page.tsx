// src/app/(auth)/signup/page.tsx
"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useRouter, useSearchParams }             from "next/navigation"
import Link                                       from "next/link"
import { motion, AnimatePresence }                from "framer-motion"
import { Eye, EyeOff, ArrowRight, Loader2, Mail, ShieldCheck, CheckCircle2 } from "lucide-react"
import { signIn }                                 from "next-auth/react"
import { AuthLayout }                             from "@/components/auth/AuthLayout"
import { Button }                                 from "@/components/ui/button"
import { Input }                                  from "@/components/ui/input"
import { Label }                                  from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useToast }                               from "@/hooks/use-toast"

type Step = "form" | "otp"

interface FormData {
  fullName: string; 
  email: string; 
  password: string
  mobileNumber: string; 
  city: string; 
  gender: string; 
  // referralCode: string
}

// ── OTP input boxes ───────────────────────────────────────────────────────────

function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6)

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault()
      const next = value.slice(0, i)
      onChange(next)
      if (i > 0) refs.current[i - 1]?.focus()
    }
  }

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.replace(/\D/g, "").slice(-1)
    if (!digit) return
    const next = value.slice(0, i) + digit + value.slice(i + 1)
    onChange(next.slice(0, 6))
    if (i < 5) refs.current[i + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    onChange(pasted)
    const focusIdx = Math.min(pasted.length, 5)
    refs.current[focusIdx]?.focus()
  }

  return (
    <div className="flex gap-3 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none
            bg-white/5 text-white transition-all caret-transparent
            ${d ? "border-primary bg-primary/10" : "border-white/15"}
            focus:border-primary focus:bg-primary/5`}
        />
      ))}
    </div>
  )
}

// ── Main signup content ───────────────────────────────────────────────────────

function SignupContent() {
  const router       = useRouter()
  const { toast }    = useToast()
  const searchParams = useSearchParams()

  const [step,        setStep]        = useState<Step>("form")
  const [loading,     setLoading]     = useState(false)
  const [showPw,      setShowPw]      = useState(false)
  const [otpCode,     setOtpCode]     = useState("")
  const [resendTimer, setResendTimer] = useState(0)
  const [mobileError, setMobileError] = useState("")
  const [mobileOk,    setMobileOk]    = useState(false)
  const [emailError,  setEmailError]  = useState("")
  const [emailOk,     setEmailOk]     = useState(false)

  const [form, setForm] = useState<FormData>({
    fullName: "", 
    email: "", 
    password: "",
    mobileNumber: "", 
    city: "", 
    gender: "", 
    // referralCode: "",
  })

  const mobileDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const emailDebounce  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // useEffect(() => {
  //   const ref = searchParams.get("ref")
  //   if (ref) setForm(p => ({ ...p, referralCode: ref.toUpperCase() }))
  // }, [])

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer(r => r - 1), 1_000)
    return () => clearTimeout(t)
  }, [resendTimer])

  const checkMobileUnique = useCallback((raw: string) => {
    setMobileError("")
    setMobileOk(false)
    const digits = raw.replace(/\D/g, "").slice(-10)
    if (digits.length !== 10) return
    if (mobileDebounce.current) clearTimeout(mobileDebounce.current)
    mobileDebounce.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/auth/check-mobile-status?mobile=${digits}`)
        const data = await res.json()
        if (data.status !== "NOT_FOUND") {
          setMobileError("An account with this mobile number already exists")
        } else {
          setMobileOk(true)
        }
      } catch { /* ignore */ }
    }, 500)
  }, [])

  const checkEmailUnique = useCallback((raw: string) => {
    setEmailError("")
    setEmailOk(false)
    const email = raw.trim().toLowerCase()
    if (!email || !email.includes("@") || !email.includes(".")) return
    if (emailDebounce.current) clearTimeout(emailDebounce.current)
    emailDebounce.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/auth/check-email-status?email=${encodeURIComponent(email)}`)
        const data = await res.json()
        if (data.status === "FOUND") {
          setEmailError("An account with this email already exists")
        } else {
          setEmailOk(true)
        }
      } catch { /* ignore */ }
    }, 500)
  }, [])

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(p => ({ ...p, [field]: e.target.value }))

  // ── Step 1: send OTP ───────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mobileError || emailError) return
    setLoading(true)
    try {
      const res  = await fetch("/api/auth/send-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: form.email.trim().toLowerCase(), fullName: form.fullName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ variant: "destructive", title: data.error ?? "Failed to send code" })
        return
      }
      setStep("otp")
      setOtpCode("")
      setResendTimer(60)
      toast({ title: "Code sent!", description: `Check ${form.email} for your verification code.` })
    } catch {
      toast({ variant: "destructive", title: "Network error. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  // ── Resend ─────────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendTimer > 0) return
    setLoading(true)
    try {
      const res  = await fetch("/api/auth/send-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: form.email.trim().toLowerCase(), fullName: form.fullName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { toast({ variant: "destructive", title: data.error ?? "Failed to resend" }); return }
      setResendTimer(60)
      setOtpCode("")
      toast({ title: "New code sent!" })
    } catch {
      toast({ variant: "destructive", title: "Network error." })
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: verify + register ──────────────────────────────────────────────
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.length !== 6) {
      toast({ variant: "destructive", title: "Enter the 6-digit code" })
      return
    }
    setLoading(true)
    try {
      // Verify OTP
      const verifyRes  = await fetch("/api/auth/verify-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: form.email.trim().toLowerCase(), otp: otpCode }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok) {
        toast({ variant: "destructive", title: verifyData.error ?? "Invalid code" })
        return
      }


      console.log('verified otp', verifyData);
      // Register
      const regRes  = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          fullName:     form.fullName.trim(),
          email:        form.email.trim().toLowerCase(),
          password:     form.password,
          mobileNumber: form.mobileNumber.trim(),
          city:         form.city.trim(),
          gender:       form.gender || null,
          // referralCode: form.referralCode.trim() || undefined,
        }),
      })
      const regData = await regRes.json()
      console.log('registered user', regData);
      if (!regRes.ok) {
        toast({ variant: "destructive", title: regData.error ?? "Registration failed" })
        return
      }

      console.log('before auto sign in');

      // Auto sign-in then go straight to select-role
      const signInRes = await signIn("credentials", {
        redirect:  false,
        email:     form.email.trim().toLowerCase(),
        password:  form.password,
      })
      console.log('after sign in', signInRes)
      if (signInRes?.error) {
        // Sign-in failed for some reason — send to login
        console.log('go error while auto sign in',signInRes?.error);
        toast({ title: "Account created!", description: "Please sign in to continue." })
        router.push("/login")
        return
      }

      // Hard-redirect so the browser does a full page load with the fresh session
      // cookie — avoids any stale useSession() cache carrying over a previous login.
      window.location.href = "/select-role"
    } catch {
      toast({ variant: "destructive", title: "Something went wrong", description: "Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence mode="wait">
      {step === "form" ? (
        <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <AuthLayout title="Create your account" subtitle="Join GymStack and manage your gym smarter">
            <form onSubmit={handleSendOtp} className="space-y-4">

              <div className="space-y-1.5">
                <Label className="text-white/65 text-sm">Full name <span className="text-primary">*</span></Label>
                <Input placeholder="Rahul Singh" value={form.fullName} onChange={set("fullName")} required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-white/65 text-sm">Mobile <span className="text-primary">*</span></Label>
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    value={form.mobileNumber}
                    onChange={e => {
                      set("mobileNumber")(e)
                      checkMobileUnique(e.target.value)
                    }}
                    required
                    className={`bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11 ${mobileError ? "border-red-500/50" : ""}`}
                  />
                  {mobileError && <p className="text-red-400 text-xs">{mobileError}</p>}
                  {mobileOk && !mobileError && (
                    <p className="text-green-400 text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Available
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/65 text-sm">City <span className="text-primary">*</span></Label>
                  <Input placeholder="Mumbai" value={form.city} onChange={set("city")} required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/65 text-sm">Email <span className="text-primary">*</span></Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => {
                    set("email")(e)
                    checkEmailUnique(e.target.value)
                  }}
                  required
                  autoComplete="email"
                  className={`bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11 ${emailError ? "border-red-500/50" : ""}`}
                />
                {emailError && <p className="text-red-400 text-xs">{emailError}</p>}
                {emailOk && !emailError && (
                  <p className="text-green-400 text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Available
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/65 text-sm">Gender</Label>
                <Select value={form.gender} onValueChange={v => setForm(p => ({ ...p, gender: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 focus:ring-0 focus:border-primary">
                    <SelectValue placeholder="Select gender (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-[hsl(220_25%_10%)] border-white/10 text-white">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/65 text-sm">Password <span className="text-primary">*</span></Label>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} placeholder="Min. 8 characters"
                    value={form.password} onChange={set("password")} required minLength={8} autoComplete="new-password"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11 pr-11" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
{/* 
              <div className="space-y-1.5">
                <Label className="text-white/65 text-sm">Referral code <span className="text-white/30 font-normal">(optional)</span></Label>
                <Input placeholder="e.g. RAHUL1234" value={form.referralCode}
                  onChange={e => setForm(p => ({ ...p, referralCode: e.target.value.toUpperCase() }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11 tracking-widest uppercase" />
              </div> */}

              <div className="pt-1">
                <Button type="submit" disabled={loading} className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Account</span>}
                </Button>
              </div>

              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-xs">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <Button type="button" variant="outline"
                onClick={() => signIn("google", { callbackUrl: "/auth-redirect" })}
                className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 h-11 gap-2.5">
                <GoogleIcon /> Continue with Google
              </Button>

              <p className="text-center text-sm text-white/40">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:text-primary/80 font-medium">Sign in</Link>
              </p>
            </form>
          </AuthLayout>
        </motion.div>
      ) : (
        <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
          <AuthLayout>
            <form onSubmit={handleVerifyAndRegister} className="space-y-6">

              {/* Icon + heading — centered */}
              <div className="flex flex-col items-center gap-4 mb-2">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <h1 className="text-[1.6rem] font-display font-bold text-white leading-tight mb-1">Verify your email</h1>
                  <p className="text-white/45 text-sm">Enter the 6-digit code sent to {form.email}</p>
                </div>
              </div>

              {/* OTP boxes */}
              <OtpBoxes value={otpCode} onChange={setOtpCode} />

              {/* Resend */}
              <div className="text-center text-sm text-white/40">
                Didn't receive it?{" "}
                {resendTimer > 0 ? (
                  <span className="text-white/30">Resend in {resendTimer}s</span>
                ) : (
                  <button type="button" onClick={handleResend} disabled={loading}
                    className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Resend code
                  </button>
                )}
              </div>

              <Button type="submit" disabled={loading || otpCode.length !== 6}
                className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 gap-2">
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><ShieldCheck className="w-4 h-4" /><span>Verify & Create Account</span><ArrowRight className="w-4 h-4" /></>}
              </Button>

              <button type="button" onClick={() => { setStep("form"); setOtpCode("") }}
                className="w-full text-center text-sm text-white/35 hover:text-white/60 transition-colors">
                ← Edit my details
              </button>
            </form>
          </AuthLayout>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[hsl(220_25%_6%)]">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
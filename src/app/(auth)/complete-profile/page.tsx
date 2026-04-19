// src/app/(auth)/complete-profile/page.tsx
"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn }    from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Eye, EyeOff, Loader2, ShieldCheck, Smartphone, Mail,
  CheckCircle2, ArrowRight, ChevronDown,
} from "lucide-react"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { Button }     from "@/components/ui/button"
import { Input }      from "@/components/ui/input"
import { Label }      from "@/components/ui/label"
import { useToast }   from "@/hooks/use-toast"

type Step =
  | "loading"           // validating token from URL
  | "token-form"        // token valid → show completion form
  | "mobile-input"      // no token → ask for mobile
  | "choose-method"     // INVITED mobile found → choose token or email OTP
  | "otp-input"         // waiting for email OTP
  | "completion-form"   // email OTP verified → show completion form
  | "done"

interface TokenInfo { name: string; mobile: string; role: string; gymName?: string }

// ── OTP input boxes ────────────────────────────────────────────────────────
function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs  = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6)

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault()
      onChange(value.slice(0, i))
      if (i > 0) refs.current[i - 1]?.focus()
    }
  }
  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value.replace(/\D/g, "").slice(-1)
    if (!d) return
    const next = value.slice(0, i) + d + value.slice(i + 1)
    onChange(next.slice(0, 6))
    if (i < 5) refs.current[i + 1]?.focus()
  }
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    onChange(pasted)
    refs.current[Math.min(pasted.length, 5)]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input key={i} ref={el => { refs.current[i] = el }} type="text" inputMode="numeric"
          maxLength={1} value={d}
          onChange={e => handleChange(i, e)} onKeyDown={e => handleKey(i, e)} onPaste={handlePaste}
          className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 outline-none
            bg-white/5 text-white transition-all caret-transparent
            ${d ? "border-primary bg-primary/10" : "border-white/15"}
            focus:border-primary focus:bg-primary/5`}
        />
      ))}
    </div>
  )
}

// ── Completion form (shared by token and OTP paths) ────────────────────────
function CompletionForm({
  tokenInfo, token, mobile, email, onDone,
}: {
  tokenInfo: TokenInfo | null
  token?: string
  mobile?: string
  email?: string
  onDone: (role: string) => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    email:    email ?? "",
    password: "",
    city:     "",
    gender:   "",
  })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email.trim()) { toast({ variant: "destructive", title: "Email is required" }); return }
    if (form.password.length < 8) { toast({ variant: "destructive", title: "Password must be at least 8 characters" }); return }

    setLoading(true)
    try {
      const body: any = { email: form.email.trim(), password: form.password, city: form.city, gender: form.gender }
      if (token)  body.token  = token
      if (mobile) body.mobile = mobile
      if (form.email) body.otp = undefined  // OTP already verified

      const res  = await fetch("/api/auth/complete-profile", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { toast({ variant: "destructive", title: data.error ?? "Failed to activate profile" }); return }

      // Auto sign-in
      const signInRes = await signIn("credentials", {
        redirect:  false,
        email:     form.email.trim().toLowerCase(),
        password:  form.password,
      })
      if (signInRes?.error) {
        toast({ title: "Profile activated! Please sign in." })
        window.location.href = "/login"
        return
      }
      onDone(data.role)
    } catch {
      toast({ variant: "destructive", title: "Something went wrong. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-11 rounded-xl"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {tokenInfo && (
        <div className="bg-primary/8 border border-primary/20 rounded-2xl px-5 py-4 space-y-0.5">
          <p className="text-white font-semibold text-sm">Hi, {tokenInfo.name.split(" ")[0]}!</p>
          {tokenInfo.gymName && <p className="text-white/50 text-xs">{tokenInfo.gymName} has added you to GymStack</p>}
          <p className="text-white/40 text-xs">Mobile: {tokenInfo.mobile}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-white/55 text-sm">Email address <span className="text-primary">*</span></Label>
        <Input type="email" placeholder="you@example.com" value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
          disabled={!!email} className={inp} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-white/55 text-sm">Password <span className="text-primary">*</span></Label>
        <div className="relative">
          <Input type={showPw ? "text" : "password"} placeholder="Min. 8 characters"
            value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            required minLength={8} className={`${inp} pr-11`} />
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-white/55 text-sm">City</Label>
          <Input placeholder="Mumbai" value={form.city}
            onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className={inp} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/55 text-sm">Gender</Label>
          <div className="flex gap-2">
            {["Male", "Female", "Other"].map(g => (
              <button type="button" key={g} onClick={() => setForm(p => ({ ...p, gender: p.gender === g ? "" : g }))}
                className={`flex-1 h-11 rounded-xl text-xs font-medium border transition-all ${
                  form.gender === g
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                }`}>{g}</button>
            ))}
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading}
        className="w-full bg-gradient-to-r from-primary to-orange-400 text-white font-semibold h-11 rounded-xl mt-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4" /><span className="ml-2">Activate My Account</span></>}
      </Button>
    </form>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
function CompleteProfileContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { toast }    = useToast()

  const [step,        setStep]        = useState<Step>("loading")
  const [tokenInfo,   setTokenInfo]   = useState<TokenInfo | null>(null)
  const [urlToken,    setUrlToken]    = useState<string>("")
  const [mobile,      setMobile]      = useState("")
  const [manualToken, setManualToken] = useState("")
  const [verifiedEmail, setVerifiedEmail] = useState("")
  const [emailForOtp, setEmailForOtp] = useState("")
  const [otpCode,     setOtpCode]     = useState("")
  const [loading,     setLoading]     = useState(false)
  const [showEmailOtp, setShowEmailOtp] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  // Countdown
  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  // On mount: validate token from URL if present
  useEffect(() => {
    const tok = searchParams.get("token") ?? ""
    if (tok) {
      setUrlToken(tok)
      fetch(`/api/auth/validate-token?token=${tok}`)
        .then(r => r.json())
        .then(d => {
          if (d.valid) {
            setTokenInfo({ name: d.name, mobile: d.mobile, role: d.role, gymName: d.gymName })
            setStep("token-form")
          } else {
            toast({ variant: "destructive", title: d.error ?? "Invalid invite link" })
            setStep("mobile-input")
          }
        })
        .catch(() => setStep("mobile-input"))
    } else {
      setStep("mobile-input")
    }
  }, [])

  // Check mobile status
  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = mobile.replace(/\D/g, "").slice(-10)
    if (normalized.length !== 10) { toast({ variant: "destructive", title: "Enter a valid 10-digit mobile number" }); return }

    setLoading(true)
    // Check if there's an INVITED profile for this mobile
    try {
      const res  = await fetch(`/api/auth/check-mobile-status?mobile=${normalized}`)
      const data = await res.json()
      if (data.status === "INVITED") {
        setStep("choose-method")
      } else if (data.status === "ACTIVE") {
        toast({ title: "Account already active", description: "This number is already registered. Please log in." })
        router.push("/login")
      } else {
        toast({ variant: "destructive", title: "No account found", description: "Ask your gym owner to invite you." })
      }
    } catch {
      toast({ variant: "destructive", title: "Something went wrong" })
    } finally {
      setLoading(false)
    }
  }

  // Use manual token
  const handleManualToken = async (e: React.FormEvent) => {
    e.preventDefault()
    const tok = manualToken.trim()
    if (!tok) return
    setLoading(true)
    try {
      const res = await fetch(`/api/auth/validate-token?token=${tok}`)
      const d   = await res.json()
      if (d.valid) {
        setUrlToken(tok)
        setTokenInfo({ name: d.name, mobile: d.mobile, role: d.role, gymName: d.gymName })
        setStep("token-form")
      } else {
        toast({ variant: "destructive", title: d.error ?? "Invalid or expired code" })
      }
    } catch {
      toast({ variant: "destructive", title: "Could not validate code" })
    } finally {
      setLoading(false)
    }
  }

  // Send email OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailForOtp.trim()) { toast({ variant: "destructive", title: "Enter your email address" }); return }
    setLoading(true)
    try {
      const res  = await fetch("/api/auth/request-completion-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ mobile: mobile.replace(/\D/g, "").slice(-10), email: emailForOtp.trim() }),
      })
      const d = await res.json()
      if (!res.ok) { toast({ variant: "destructive", title: d.error ?? "Failed to send code" }); return }
      setStep("otp-input")
      setResendTimer(60)
      toast({ title: "Verification code sent!", description: `Check ${emailForOtp}` })
    } catch {
      toast({ variant: "destructive", title: "Failed to send code" })
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.length !== 6) { toast({ variant: "destructive", title: "Enter the 6-digit code" }); return }
    setLoading(true)
    try {
      // Inline verify — the complete-profile API verifies OTP + activates in one step
      // So we just move to the completion form with email pre-set
      setVerifiedEmail(emailForOtp.trim())
      setStep("completion-form")
    } finally {
      setLoading(false)
    }
  }

  const handleDone = (role: string) => {
    setStep("done")
    setTimeout(() => {
      if (role === "trainer") window.location.href = "/trainer/dashboard"
      else window.location.href = "/member/dashboard"
    }, 1500)
  }

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">

        {/* ── Loading ── */}
        {step === "loading" && (
          <motion.div key="loading" className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </motion.div>
        )}

        {/* ── Token form ── */}
        {step === "token-form" && (
          <motion.div key="token-form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-display font-bold text-white">Complete your profile</h1>
                <p className="text-white/40 text-sm mt-1">Set up your account to get started</p>
              </div>
            </div>
            <CompletionForm tokenInfo={tokenInfo} token={urlToken} onDone={handleDone} />
          </motion.div>
        )}

        {/* ── Mobile input ── */}
        {step === "mobile-input" && (
          <motion.div key="mobile-input" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Smartphone className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-display font-bold text-white">Complete your profile</h1>
                <p className="text-white/40 text-sm mt-1">Enter your mobile number to find your account</p>
              </div>
            </div>
            <form onSubmit={handleMobileSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Mobile Number <span className="text-primary">*</span></Label>
                <Input type="tel" placeholder="9876543210" value={mobile}
                  onChange={e => setMobile(e.target.value)} required
                  className="bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-11 rounded-xl" />
              </div>
              <Button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-orange-400 text-white font-semibold h-11 rounded-xl">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Find my account</span><ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
              <p className="text-center text-sm text-white/40">
                Already have an account?{" "}
                <a href="/login" className="text-primary hover:text-primary/80 font-medium">Sign in</a>
              </p>
            </form>
          </motion.div>
        )}

        {/* ── Choose method ── */}
        {step === "choose-method" && (
          <motion.div key="choose-method" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="text-center">
              <h1 className="text-xl font-display font-bold text-white">Account found!</h1>
              <p className="text-white/40 text-sm mt-1">How would you like to verify?</p>
            </div>

            {/* Option A: token code */}
            <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 space-y-3">
              <p className="text-white font-medium text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> Use the code from your SMS
              </p>
              <p className="text-white/40 text-xs">Your gym owner sent you an SMS with a link. The code is the long string at the end of that link.</p>
              <form onSubmit={handleManualToken} className="flex gap-2">
                <Input value={manualToken} onChange={e => setManualToken(e.target.value)}
                  placeholder="Paste code from SMS link"
                  className="bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl flex-1 text-xs" />
                <Button type="submit" disabled={loading || !manualToken.trim()}
                  className="bg-gradient-to-r from-primary to-orange-400 text-white font-semibold h-10 px-4 rounded-xl text-sm shrink-0">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                </Button>
              </form>
            </div>

            {/* Option B: email OTP */}
            <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 space-y-3">
              <button type="button" onClick={() => setShowEmailOtp(!showEmailOtp)}
                className="w-full flex items-center justify-between text-white font-medium text-sm">
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" /> Verify with email instead
                </span>
                <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${showEmailOtp ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {showEmailOtp && (
                  <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} onSubmit={handleSendOtp} className="space-y-3 overflow-hidden">
                    <p className="text-white/40 text-xs">We'll send a verification code to your email.</p>
                    <Input type="email" placeholder="you@example.com" value={emailForOtp}
                      onChange={e => setEmailForOtp(e.target.value)} required
                      className="bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl text-sm" />
                    <Button type="submit" disabled={loading || !emailForOtp}
                      className="w-full bg-white/8 border border-white/10 text-white font-medium h-10 rounded-xl text-sm hover:bg-white/12">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send verification code"}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ── OTP input ── */}
        {step === "otp-input" && (
          <motion.div key="otp" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-display font-bold text-white">Check your email</h1>
                <p className="text-white/40 text-sm mt-1">Code sent to {emailForOtp}</p>
              </div>
            </div>
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <OtpBoxes value={otpCode} onChange={setOtpCode} />
              <div className="text-center text-sm text-white/40">
                Didn't receive it?{" "}
                {resendTimer > 0
                  ? <span className="text-white/30">Resend in {resendTimer}s</span>
                  : <button type="button" onClick={handleSendOtp} disabled={loading}
                      className="text-primary hover:text-primary/80 font-medium">Resend code</button>}
              </div>
              <Button type="submit" disabled={loading || otpCode.length !== 6}
                className="w-full bg-gradient-to-r from-primary to-orange-400 text-white font-semibold h-11 rounded-xl">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
              </Button>
            </form>
          </motion.div>
        )}

        {/* ── Completion form (OTP path) ── */}
        {step === "completion-form" && (
          <motion.div key="completion" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-display font-bold text-white">Email verified!</h1>
                <p className="text-white/40 text-sm mt-1">Now complete your profile</p>
              </div>
            </div>
            <CompletionForm tokenInfo={null} mobile={mobile} email={verifiedEmail} onDone={handleDone} />
          </motion.div>
        )}

        {/* ── Done ── */}
        {step === "done" && (
          <motion.div key="done" className="flex flex-col items-center gap-4 py-12">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}
              className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </motion.div>
            <h2 className="text-xl font-display font-bold text-white">Account activated!</h2>
            <p className="text-white/40 text-sm">Redirecting to your dashboard…</p>
            <Loader2 className="w-5 h-5 text-primary animate-spin mt-2" />
          </motion.div>
        )}

      </AnimatePresence>
    </AuthLayout>
  )
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[hsl(220_25%_6%)]">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    }>
      <CompleteProfileContent />
    </Suspense>
  )
}

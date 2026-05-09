"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Loader2, Mail, UserPlus, ShieldCheck, RotateCcw } from "lucide-react"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

type PageState = "form" | "otp" | "no_account" | "oauth_account"

const OTP_EXPIRY_SECONDS = 10 * 60
const RESEND_COOLDOWN_SECONDS = 60

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [email, setEmail]           = useState("")
  const [loading, setLoading]       = useState(false)
  const [pageState, setPageState]   = useState<PageState>("form")

  // OTP step
  const [otp, setOtp]               = useState(["", "", "", "", "", ""])
  const [otpError, setOtpError]     = useState("")
  const [verifying, setVerifying]   = useState(false)
  const [resending, setResending]   = useState(false)
  const [countdown, setCountdown]   = useState(OTP_EXPIRY_SECONDS)
  const [resendCD, setResendCD]     = useState(RESEND_COOLDOWN_SECONDS)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // OTP expiry countdown
  useEffect(() => {
    if (pageState !== "otp") return
    setCountdown(OTP_EXPIRY_SECONDS)
    const t = setInterval(() => setCountdown(s => (s <= 1 ? (clearInterval(t), 0) : s - 1)), 1000)
    return () => clearInterval(t)
  }, [pageState])

  // Resend cooldown
  useEffect(() => {
    if (pageState !== "otp") return
    setResendCD(RESEND_COOLDOWN_SECONDS)
    const t = setInterval(() => setResendCD(s => (s <= 1 ? (clearInterval(t), 0) : s - 1)), 1000)
    return () => clearInterval(t)
  }, [pageState])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  const sendOtp = useCallback(async (targetEmail: string): Promise<boolean> => {
    const res = await fetch("/api/auth/forgot-password-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail }),
    })
    const data = await res.json()
    if (!res.ok) {
      if (data.error === "no_account")   { setPageState("no_account");   return false }
      if (data.error === "oauth_account"){ setPageState("oauth_account"); return false }
      throw new Error(data.error)
    }
    return true
  }, [])

  const handleEmailSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const ok = await sendOtp(email.trim().toLowerCase())
      if (ok) {
        setOtp(["", "", "", "", "", ""])
        setOtpError("")
        setPageState("otp")
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to send code", description: "Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    // Support paste of full 6-digit code into any box
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6)
      if (digits.length === 6) {
        setOtp(digits.split(""))
        setOtpError("")
        inputRefs.current[5]?.focus()
        return
      }
    }
    if (!/^\d?$/.test(value)) return
    const next = [...otp]
    next[index] = value
    setOtp(next)
    setOtpError("")
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === "Enter") handleVerify()
  }

  const handleVerify = async () => {
    const code = otp.join("")
    if (code.length !== 6)  { setOtpError("Enter the 6-digit code from your email."); return }
    if (countdown === 0)    { setOtpError("Code has expired — request a new one."); return }
    setVerifying(true)
    setOtpError("")
    try {
      const res = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setOtpError("Invalid or expired code. Please try again.")
        setOtp(["", "", "", "", "", ""])
        setTimeout(() => inputRefs.current[0]?.focus(), 50)
        return
      }
      router.push(`/reset-password?token=${encodeURIComponent(data.resetToken)}`)
    } catch {
      setOtpError("Something went wrong. Please try again.")
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    if (resendCD > 0 || resending) return
    setResending(true)
    try {
      const ok = await sendOtp(email.trim().toLowerCase())
      if (ok) {
        setOtp(["", "", "", "", "", ""])
        setOtpError("")
        toast({ variant: "success", title: "New code sent!", description: "Check your inbox." })
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to resend code. Please try again." })
    } finally {
      setResending(false)
    }
  }

  const reset = () => {
    setPageState("form")
    setEmail("")
    setOtp(["", "", "", "", "", ""])
    setOtpError("")
  }

  const titles: Record<PageState, string> = {
    form:          "Forgot your password?",
    otp:           "Enter verification code",
    no_account:    "No account found",
    oauth_account: "Use Google to sign in",
  }
  const subtitles: Record<PageState, string> = {
    form:          "We'll send a 6-digit code to your email",
    otp:           `Code sent to ${email}`,
    no_account:    "We couldn't find an account with that email",
    oauth_account: "This email is linked to a Google account",
  }

  return (
    <AuthLayout title={titles[pageState]} subtitle={subtitles[pageState]}>
      <AnimatePresence mode="wait">

        {/* ── No account ── */}
        {pageState === "no_account" && (
          <motion.div key="no_account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex justify-center py-2">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="w-16 h-16 rounded-full bg-yellow-500/15 flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-yellow-400" />
              </motion.div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-white/65 text-sm leading-relaxed">
                There&apos;s no GymStack account linked to{" "}
                <span className="text-white font-medium">{email}</span>.
              </p>
              <p className="text-white/40 text-xs">Double-check the email or create a new account.</p>
            </div>
            <div className="space-y-3">
              <Link href="/signup">
                <Button className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 mb-2">
                  <UserPlus className="w-4 h-4 mr-2" /> Create an account
                </Button>
              </Link>
              <Button variant="outline" onClick={reset}
                className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 h-11 text-sm">
                Try a different email
              </Button>
              <Link href="/login">
                <Button variant="ghost" className="w-full text-white/45 hover:bg-white/10 h-11 text-sm">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to sign in
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* ── Google-only account ── */}
        {pageState === "oauth_account" && (
          <motion.div key="oauth_account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex justify-center py-2">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="w-16 h-16 rounded-full bg-blue-500/15 flex items-center justify-center">
                <GoogleIcon />
              </motion.div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-white/65 text-sm leading-relaxed">
                <span className="text-white font-medium">{email}</span> is registered via Google.
                Use the Google button to sign in — no password needed.
              </p>
            </div>
            <div className="space-y-3">
              <Link href="/login">
                <Button className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-11">
                  Go to sign in
                </Button>
              </Link>
              <Button variant="outline" onClick={reset}
                className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 h-11 text-sm">
                Try a different email
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── OTP step ── */}
        {pageState === "otp" && (
          <motion.div key="otp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} className="space-y-6">

            {/* Shield icon */}
            <div className="flex justify-center py-1">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </motion.div>
            </div>

            {/* 6-box OTP input */}
            <div className="flex gap-2.5 justify-center">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  onFocus={e => e.target.select()}
                  className={`
                    w-11 h-13 text-center text-xl font-bold rounded-xl border bg-white/5 text-white
                    outline-none transition-all duration-150 caret-transparent
                    ${digit ? "border-primary bg-primary/10" : "border-white/15"}
                    ${otpError ? "border-red-500/60" : "focus:border-primary"}
                  `}
                />
              ))}
            </div>

            {/* Inline error */}
            {otpError && (
              <p className="text-red-400 text-xs text-center -mt-2">{otpError}</p>
            )}

            {/* Expiry countdown */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-white/35 text-xs">
                  Code expires in{" "}
                  <span className={`font-mono font-semibold ${countdown < 60 ? "text-red-400" : "text-white/55"}`}>
                    {fmt(countdown)}
                  </span>
                </p>
              ) : (
                <p className="text-red-400 text-xs font-medium">Code has expired</p>
              )}
            </div>

            {/* Verify button */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button onClick={handleVerify} disabled={verifying || otp.join("").length !== 6}
                className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 disabled:opacity-35">
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify code"}
              </Button>
            </motion.div>

            {/* Resend + back */}
            <div className="flex items-center justify-between text-sm">
              <button onClick={handleResend} disabled={resendCD > 0 || resending}
                className="flex items-center gap-1.5 text-white/40 hover:text-white/70 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs">
                {resending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <RotateCcw className="w-3.5 h-3.5" />
                }
                {resendCD > 0 ? `Resend in ${resendCD}s` : "Resend code"}
              </button>
              <button onClick={reset} className="text-white/40 hover:text-white/70 transition-colors text-xs">
                Change email
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Email form ── */}
        {pageState === "form" && (
          <motion.form key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} onSubmit={handleEmailSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/65 text-sm">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <Input id="email" type="email" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} required autoComplete="email"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11 pl-10" />
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button type="submit" disabled={loading}
                className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 transition-opacity">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send code"}
              </Button>
            </motion.div>
            <Link href="/login">
              <Button type="button" variant="ghost" className="w-full text-white/45 hover:bg-white/10 h-11 text-sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to sign in
              </Button>
            </Link>
          </motion.form>
        )}

      </AnimatePresence>
    </AuthLayout>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

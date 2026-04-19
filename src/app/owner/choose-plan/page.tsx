// src/app/owner/choose-plan/page.tsx
// Standalone fullscreen plan-selection page — no owner sidebar.
// Shown to new owners (no subscription) and expired owners (past grace period).
// ?expired=true → shows "plan has expired" messaging instead of welcome copy.
"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  Dumbbell, Check, Zap, AlertTriangle, Loader2, LogOut,
} from "lucide-react"
import { signOut } from "next-auth/react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface SaasPlan {
  id:       string
  name:     string
  interval: string
  price:    string | number
}

interface PlanTierConfig {
  slug:        string
  name:        string
  description: string
  badge?:      string
  features:    string[]
  isFree:      boolean
}

// ── Plan tier definitions (features hardcoded per spec; prices from DB) ───────

const PLAN_TIERS: PlanTierConfig[] = [
  {
    slug:        "free",
    name:        "Free",
    description: "1 month trial — no credit card required",
    isFree:      true,
    features: [
      "1 gym",
      "Unlimited members & trainers",
      "Attendance tracking",
      "Basic reports",
      "Announcements",
    ],
  },
  {
    slug:        "basic",
    name:        "Basic",
    description: "Everything you need to manage a gym",
    isFree:      false,
    features: [
      "Everything in Free",
      "Membership plans",
      "Full reports & analytics",
      "Refer & Earn",
    ],
  },
  {
    slug:        "pro",
    name:        "Pro",
    badge:       "Most Popular",
    description: "For gyms that need the full feature set",
    isFree:      false,
    features: [
      "Everything in Basic",
      "Workout plans",
      "Diet plans",
      "Supplement management",
      "Payments & expenses",
      "Lockers",
    ],
  },
  {
    slug:        "enterprise",
    name:        "Enterprise",
    description: "For multi-gym businesses",
    isFree:      false,
    features: [
      "Everything in Pro",
      "Up to 5 gyms",
      "AI-powered plans",
      "Custom integrations",
      "Priority support",
    ],
  },
]

// Map duration selector → DB interval value
const INTERVAL_MAP: Record<number, string> = {
  3:  "QUARTERLY",
  6:  "HALF_YEARLY",
  12: "YEARLY",
}

// ── Inner component (needs useSearchParams, wrapped in Suspense below) ────────

function ChoosePlanContent() {
  const router               = useRouter()
  const searchParams         = useSearchParams()
  const { data: session, update } = useSession()
  const isExpiredRenewal     = searchParams.get("expired") === "true"

  const [plans,      setPlans]      = useState<SaasPlan[]>([])
  const [loading,    setLoading]    = useState(true)
  const [duration,   setDuration]   = useState<3 | 6 | 12>(3)
  const [activating, setActivating] = useState<string | null>(null)
  const [error,      setError]      = useState("")

  // Redirect if owner already has an active plan
  useEffect(() => {
    if (session?.user?.hasActivePlan) {
      router.replace("/owner/dashboard")
    }
  }, [session, router])

  // Load plans from DB + inject Razorpay script
  useEffect(() => {
    fetch("/api/subscriptions/plans")
      .then(r => r.json())
      .then(data => setPlans(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load plans. Please refresh the page."))
      .finally(() => setLoading(false))

    // if (!document.getElementById("razorpay-checkout-js")) {
    //   const s    = document.createElement("script")
    //   s.id       = "razorpay-checkout-js"
    //   s.src      = "https://checkout.razorpay.com/v1/checkout.js"
    //   s.async    = true
    //   document.head.appendChild(s)
    // }
  }, [])

  // ── Plan lookup helpers ───────────────────────────────────────────────────

  const findFreePlan = useCallback((): SaasPlan | null =>
    plans.find(p => p.name.toLowerCase().includes("free")) ?? null
  , [plans])

  const findPaidPlan = useCallback((slug: string, months: number): SaasPlan | null =>
    plans.find(p =>
      p.name.toLowerCase().includes(slug) &&
      p.interval === INTERVAL_MAP[months]
    ) ?? null
  , [plans])

  // ── Free plan activation ──────────────────────────────────────────────────

  const handleFreePlan = useCallback(async () => {
    const plan = findFreePlan()
    if (!plan) return
    setActivating(plan.id)
    setError("")
    try {
      const res = await fetch("/api/subscriptions/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ saasPlanId: plan.id, amount: 0 }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to activate plan")
      }
      await update()          // refresh JWT: hasActivePlan → true
      router.replace("/owner/dashboard")
    } catch (err: any) {
      setError(err.message ?? "Failed to activate plan")
      setActivating(null)
    }
  }, [findFreePlan, update, router])

  // ── Paid plan activation via Razorpay ─────────────────────────────────────

  const handlePaidPlan = useCallback(async (plan: SaasPlan, planDisplayName: string) => {
    setActivating(plan.id)
    setError("")
    try {
      // Step 1: create Razorpay order
      const orderRes = await fetch("/api/subscriptions/create-order", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ saasPlanId: plan.id }),
      })
      if (!orderRes.ok) {
        const body = await orderRes.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to create order")
      }
      const { orderId, amount, currency } = await orderRes.json()

      // Step 2: open Razorpay checkout
      const RazorpayConstructor = (window as any).Razorpay
      if (!RazorpayConstructor) throw new Error("Razorpay not loaded — please refresh and try again")

      const options = {
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        name:        "GymStack",
        description: `${planDisplayName} Subscription`,
        order_id:    orderId,
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_order_id:   string
          razorpay_signature:  string
        }) => {
          // Step 3: confirm subscription after successful payment
          const subRes = await fetch("/api/subscriptions/subscribe", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              saasPlanId:         plan.id,
              amount:             Number(amount) / 100,
              razorpayPaymentId:  response.razorpay_payment_id,
              razorpayOrderId:    response.razorpay_order_id,
              razorpaySignature:  response.razorpay_signature,
            }),
          })
          if (subRes.ok) {
            await update()   // refresh JWT: hasActivePlan → true
            router.replace("/owner/dashboard")
          } else {
            const body = await subRes.json().catch(() => ({}))
            setError(body.error ?? "Payment succeeded but plan activation failed. Please contact support.")
            setActivating(null)
          }
        },
        modal: {
          ondismiss: () => setActivating(null),
        },
        prefill: {
          name: session?.user?.name ?? "",
        },
        theme: { color: "#f97316" },
      }

      const rzp = new RazorpayConstructor(options)
      rzp.on("payment.failed", () => {
        setError("Payment failed. Please try again.")
        setActivating(null)
      })
      rzp.open()
    } catch (err: any) {
      setError(err.message ?? "Failed to initiate payment")
      setActivating(null)
    }
  }, [session, update, router])

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(220_25%_6%)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[hsl(220_25%_6%)] py-12 px-4">

      {/* Header */}
      <div className="text-center mb-10 max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="p-2.5 bg-gradient-primary rounded-xl">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-display font-bold text-white">GymStack</span>
        </div>

        {/* Expired banner */}
        {isExpiredRenewal && (
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-2.5 rounded-xl mb-5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Your plan has expired. Choose a plan to continue.
          </div>
        )}

        <h1 className="text-3xl font-bold text-white mb-2">
          {isExpiredRenewal
            ? "Renew your plan to restore access"
            : "Welcome to GymStack — choose a plan to get started"}
        </h1>
        <p className="text-white/40 text-sm">No hidden fees. Cancel anytime.</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="max-w-5xl mx-auto mb-6 bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Duration toggle (controls all paid plan prices simultaneously) */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
          {([3, 6, 12] as const).map(m => (
            <button
              key={m}
              onClick={() => setDuration(m)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                duration === m
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {m === 3 ? "3 months" : m === 6 ? "6 months" : "12 months"}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {PLAN_TIERS.map(tier => {
          const plan = tier.isFree ? findFreePlan() : findPaidPlan(tier.slug, duration)
          const price = plan ? Number(plan.price) : null
          const isActivating = activating === plan?.id

          return (
            <div
              key={tier.slug}
              className={`relative flex flex-col rounded-2xl p-6 ${
                tier.slug === "pro"
                  ? "bg-[hsl(220_25%_10%)] border border-primary/40 shadow-xl shadow-primary/10"
                  : "bg-[hsl(220_25%_9%)] border border-white/8"
              }`}
            >
              {/* "Most Popular" badge */}
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-linear-to-r from-primary to-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Plan name + description */}
              <div className="mb-4 mt-1">
                <h3 className="text-white font-bold text-lg">{tier.name}</h3>
                <p className="text-white/35 text-xs mt-1 leading-relaxed">{tier.description}</p>
              </div>

              {/* Price */}
              <div className="mb-5">
                {tier.isFree ? (
                  <div className="flex items-end gap-1.5">
                    <span className="text-3xl font-bold text-white">₹0</span>
                    <span className="text-white/30 text-sm mb-0.5">/ 1 month</span>
                  </div>
                ) : price !== null ? (
                  <div className="flex items-end gap-1.5">
                    <span className="text-3xl font-bold text-white">
                      ₹{price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-white/30 text-sm mb-0.5">/ {duration} mo</span>
                  </div>
                ) : (
                  <p className="text-white/25 text-sm italic">Not available</p>
                )}
              </div>

              {/* Feature list */}
              <ul className="space-y-2 mb-6 flex-1">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/55">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <button
                disabled={!plan || !!activating}
                onClick={() => {
                  if (!plan) return
                  if (tier.isFree) {
                    handleFreePlan()
                  } else {
                    handlePaidPlan(plan, `${tier.name} ${duration}mo`)
                  }
                }}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  tier.slug === "pro"
                    ? "bg-linear-to-r from-primary to-orange-400 text-white hover:opacity-90"
                    : "border border-white/15 text-white hover:bg-white/5"
                }`}
              >
                {isActivating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                ) : tier.isFree ? (
                  <><Zap className="w-4 h-4" /> Start Free Trial</>
                ) : (
                  "Subscribe"
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Footer links */}
      <div className="flex items-center justify-center gap-6 mt-10 text-white/20 text-xs">
        <span>By subscribing you agree to our Terms of Service and Privacy Policy.</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 hover:text-white/40 transition-colors"
        >
          <LogOut className="w-3 h-3" /> Sign out
        </button>
      </div>
    </div>
  )
}

// ── Page export (Suspense boundary for useSearchParams) ───────────────────────

export default function ChoosePlanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[hsl(220_25%_6%)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <ChoosePlanContent />
    </Suspense>
  )
}

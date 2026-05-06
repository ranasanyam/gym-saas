"use client"

import { useEffect, useState, useCallback } from "react"
import { BadgeCheck, CheckCircle2, Crown, Loader2, Zap, Briefcase, Calendar } from "lucide-react"
import type { TrainerPlan } from "@/lib/trainerSubscriptionPlans"

declare global {
  interface Window { Razorpay: any }
}

interface SubStatus {
  isActive: boolean
  id?: string
  planSlug?: string
  startDate?: string
  endDate?: string
  status?: string
}

const PLAN_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  monthly:   { bg: "bg-blue-500/10",   border: "border-blue-500/20",   text: "text-blue-400",   badge: "bg-blue-500/20"   },
  quarterly: { bg: "bg-primary/10",    border: "border-primary/25",    text: "text-primary",    badge: "bg-primary/20"    },
  yearly:    { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400", badge: "bg-purple-500/20" },
}

function loadRazorpay(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function TrainerSubscriptionPage() {
  const [plans, setPlans]         = useState<TrainerPlan[]>([])
  const [status, setStatus]       = useState<SubStatus | null>(null)
  const [loading, setLoading]     = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [plansRes, statusRes] = await Promise.all([
      fetch("/api/trainer/subscription/plans"),
      fetch("/api/trainer/subscription/status"),
    ])
    const [plansData, statusData] = await Promise.all([plansRes.json(), statusRes.json()])
    setPlans(Array.isArray(plansData) ? plansData : [])
    setStatus(statusData)
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const handlePurchase = async (plan: TrainerPlan) => {
    setPurchasing(plan.slug)
    try {
      const loaded = await loadRazorpay()
      if (!loaded) { alert("Failed to load payment gateway."); return }

      const orderRes = await fetch("/api/trainer/subscription/create-order", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ planSlug: plan.slug }),
      })
      const order = await orderRes.json()
      if (!orderRes.ok) { alert(order.error ?? "Failed to create order"); return }

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          order_id:    order.orderId,
          amount:      order.amount,
          currency:    order.currency,
          name:        "GymStack Job Portal",
          description: `Trainer ${plan.name} Subscription`,
          handler: async (response: any) => {
            try {
              const subRes = await fetch("/api/trainer/subscription/subscribe", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                  planSlug:          plan.slug,
                  razorpayOrderId:   response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              })
              if (subRes.ok) { await load(); resolve() }
              else { const d = await subRes.json(); reject(new Error(d.error ?? "Activation failed")) }
            } catch (e) { reject(e) }
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
          theme: { color: "#f97316" },
        })
        rzp.open()
      })
    } catch (err: any) {
      if (err?.message !== "Payment cancelled") alert(err?.message ?? "Payment failed")
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) return (
    <div className="max-w-3xl space-y-5">
      <div className="h-8 w-56 bg-white/5 rounded animate-pulse" />
      <div className="grid sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-72 bg-white/5 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <BadgeCheck className="w-6 h-6 text-primary" /> Job Portal Subscription
        </h2>
        <p className="text-white/35 text-sm mt-0.5">Subscribe to unlock full job details and apply to gym vacancies</p>
      </div>

      {/* Active subscription card */}
      {status?.isActive && (
        <div className="bg-gradient-to-r from-primary/10 to-orange-500/5 border border-primary/25 rounded-2xl p-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-primary" />
                <span className="text-primary font-semibold capitalize">{status.planSlug} Plan Active</span>
              </div>
              <p className="text-white/50 text-sm flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Expires {status.endDate ? new Date(status.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
              <Briefcase className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-semibold">Full Access</span>
            </div>
          </div>
        </div>
      )}

      {/* What you get banner (for non-subscribers) */}
      {!status?.isActive && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <p className="text-white font-semibold mb-3">What you unlock with a subscription</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              "Full job description and requirements",
              "Gym contact email and phone number",
              "Exact gym address and location",
              "Application instructions",
              "Apply directly to job postings",
              "Track your application status",
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-primary" />
                {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div>
        <h3 className="text-white font-semibold mb-4">
          {status?.isActive ? "Extend or Upgrade" : "Choose a Plan"}
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {plans.map(plan => {
            const colors   = PLAN_COLORS[plan.slug] ?? PLAN_COLORS.monthly
            const isCurrent = status?.isActive && status.planSlug === plan.slug
            return (
              <div key={plan.slug} className={`relative flex flex-col ${colors.bg} border ${colors.border} rounded-2xl p-5`}>
                {plan.badge && (
                  <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-0.5 rounded-full ${colors.badge} ${colors.text} border ${colors.border}`}>
                    {plan.badge}
                  </span>
                )}
                <div className="mb-3">
                  <h4 className={`font-bold text-lg ${colors.text}`}>{plan.name}</h4>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-white">₹{plan.price.toLocaleString("en-IN")}</span>
                    <span className="text-white/35 text-xs">/ {plan.durationDays} days</span>
                  </div>
                </div>
                <ul className="space-y-1.5 flex-1 mb-4">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${colors.text}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className={`text-center text-xs font-semibold py-2 rounded-xl ${colors.badge} ${colors.text}`}>
                    Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handlePurchase(plan)}
                    disabled={purchasing === plan.slug}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${colors.bg} hover:brightness-125 border ${colors.border} ${colors.text}`}
                  >
                    {purchasing === plan.slug
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <><Zap className="w-4 h-4" /> Subscribe</>
                    }
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

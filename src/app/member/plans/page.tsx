"use client"

import { useEffect, useState, useCallback } from "react"
import { Sparkles, Zap, CheckCircle2, Crown, Loader2, History, UtensilsCrossed, Dumbbell, ChevronRight } from "lucide-react"
import type { MemberAIPlan } from "@/lib/memberAISubscriptionPlans"

declare global {
  interface Window { Razorpay: any }
}

interface SubStatus {
  hasSubscription: boolean
  id?: string
  planSlug?: string
  totalCredits?: number
  usedCredits?: number
  remainingCredits?: number
  expiryDate?: string
  startDate?: string
}

interface HistoryItem {
  id: string
  planType: string
  userPrompt: string | null
  lastChangeRequest: string | null
  generatedAt: string
  createdAt: string
  linkedPlanId: string | null
  planContent: any
}

const PLAN_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  basic:    { bg: "bg-blue-500/10",   border: "border-blue-500/20",   text: "text-blue-400",   badge: "bg-blue-500/20"   },
  standard: { bg: "bg-primary/10",    border: "border-primary/25",    text: "text-primary",    badge: "bg-primary/20"    },
  premium:  { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400", badge: "bg-purple-500/20" },
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

export default function MemberPlansPage() {
  const [plans, setPlans]         = useState<MemberAIPlan[]>([])
  const [status, setStatus]       = useState<SubStatus | null>(null)
  const [history, setHistory]     = useState<HistoryItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [plansRes, statusRes, histRes] = await Promise.all([
      fetch("/api/member/ai-subscription/plans"),
      fetch("/api/member/ai-subscription/status"),
      fetch("/api/member/ai-plan/history"),
    ])
    const [plansData, statusData, histData] = await Promise.all([
      plansRes.json(), statusRes.json(), histRes.json(),
    ])
    setPlans(Array.isArray(plansData) ? plansData : [])
    setStatus(statusData)
    setHistory(Array.isArray(histData) ? histData : [])
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const handlePurchase = async (plan: MemberAIPlan) => {
    setPurchasing(plan.slug)
    try {
      const loaded = await loadRazorpay()
      if (!loaded) { alert("Failed to load payment gateway."); return }

      const orderRes = await fetch("/api/member/ai-subscription/create-order", {
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
          name:        "GymStack AI",
          description: `${plan.name} AI Plan Subscription`,
          handler: async (response: any) => {
            try {
              const subRes = await fetch("/api/member/ai-subscription/subscribe", {
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
              else { const d = await subRes.json(); reject(new Error(d.error ?? "Subscription activation failed")) }
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
    <div className="max-w-4xl space-y-5">
      <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
      <div className="grid sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  )

  const sub = status

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" /> AI Plans
        </h2>
        <p className="text-white/35 text-sm mt-0.5">Subscribe to generate personalized AI diet and workout plans</p>
      </div>

      {/* Active subscription card */}
      {sub?.hasSubscription && (
        <div className="bg-linear-to-r from-primary/10 to-orange-500/5 border border-primary/25 rounded-2xl p-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-primary" />
                <span className="text-primary font-semibold capitalize">{sub.planSlug} Plan Active</span>
              </div>
              <p className="text-white/50 text-sm">
                Expires {sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{sub.remainingCredits}</p>
              <p className="text-white/35 text-xs">of {sub.totalCredits} credits left</p>
            </div>
          </div>
          <div className="mt-3 bg-white/5 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-primary to-orange-400 rounded-full transition-all"
              style={{ width: `${((sub.remainingCredits ?? 0) / (sub.totalCredits ?? 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Subscription plans */}
      <div>
        <h3 className="text-white font-semibold mb-4">
          {sub?.hasSubscription ? "Upgrade or Renew" : "Choose a Plan"}
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {plans.map(plan => {
            const colors = PLAN_COLORS[plan.slug] ?? PLAN_COLORS.basic
            const isCurrent = sub?.hasSubscription && sub.planSlug === plan.slug
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
                    <span className="text-white/35 text-xs">/{plan.durationMonths} mo</span>
                  </div>
                  <p className={`text-xs mt-0.5 font-semibold ${colors.text}`}>{plan.credits} credits</p>
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

      {/* Plan history */}
      {history.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-white/40" /> Generation History
          </h3>
          <div className="space-y-3">
            {history.map(item => {
              const title = (item.planContent as any)?.title ?? `${item.planType === "diet" ? "Diet" : "Workout"} Plan`
              const since = new Date(item.createdAt)
              return (
                <div key={item.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-xl p-4 flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.planType === "diet" ? "bg-green-500/15" : "bg-purple-500/15"}`}>
                    {item.planType === "diet"
                      ? <UtensilsCrossed className="w-4 h-4 text-green-400" />
                      : <Dumbbell className="w-4 h-4 text-purple-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{title}</p>
                    <p className="text-white/35 text-xs mt-0.5">
                      Generated {since.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {item.lastChangeRequest && " · edited"}
                    </p>
                  </div>
                  {item.linkedPlanId && (
                    <a
                      href={`/member/${item.planType === "diet" ? "diet" : "workouts"}/${item.linkedPlanId}`}
                      className="shrink-0 text-white/30 hover:text-primary transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

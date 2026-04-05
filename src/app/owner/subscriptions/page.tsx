// src/app/owner/subscriptions/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { PageHeader } from "@/components/owner/PageHeader"
import {
  Check, Crown, Loader2, CreditCard, Star,
  Users, Dumbbell, UtensilsCrossed, ShoppingBag, BarChart3,
  Infinity, Shield, Clock, Building2, UserCheck, Bell,
  ClipboardList, AlertTriangle, BanknoteArrowDown,
  Calendar, Headphones, Zap, Rocket,
  IndianRupee,
  LockIcon,
  BrainCircuitIcon,
} from "lucide-react"

// ── Duration options ──────────────────────────────────────────────────────────
const DURATIONS = [
  { label: "3 mo",  months: 3,  interval: "QUARTERLY"   },
  { label: "6 mo",  months: 6,  interval: "HALF_YEARLY" },
  { label: "12 mo", months: 12, interval: "YEARLY"      },
] as const
type DurationInterval = typeof DURATIONS[number]["interval"]

// ── Plan tier definitions ─────────────────────────────────────────────────────
interface PlanTier {
  key:         string
  name:        string
  description: string
  gradient:    string
  ring:        string
  textAccent:  string
  badge?:      string
  badgeClass?: string
  prices:      Record<DurationInterval, number>
  features:    { icon: React.ElementType; label: string }[]
}

const TIERS: PlanTier[] = [
  {
    key: "basic", name: "Basic", description: "Everything you need to run one gym",
    gradient: "from-blue-500/10 to-cyan-500/4",
    ring: "ring-blue-500/30", textAccent: "text-blue-400",
    prices: { QUARTERLY: 999, HALF_YEARLY: 1649, YEARLY: 2999 },
    features: [
      { icon: Building2,         label: "1 Gym" },
      { icon: Users,             label: "Unlimited members" },
      { icon: UserCheck,         label: "Unlimited trainers" },
      { icon: Calendar,          label: "Attendance tracking" },
      { icon: ClipboardList,     label: "Membership plans" },
      { icon: BarChart3,         label: "Basic reports & analytics" },
      { icon: Bell,              label: "Unlimited Announcements" },
      { icon: Headphones,        label: "Email support" },
    ],
  },
  {
    key: "pro", name: "Pro", description: "Scale across multiple locations",
    gradient: "from-primary/12 to-orange-500/4",
    ring: "ring-primary/35", textAccent: "text-primary",
    badge: "Most Popular", badgeClass: "bg-primary text-white",
    prices: { QUARTERLY: 1499, HALF_YEARLY: 2499, YEARLY: 4499 },
    features: [
      { icon: Building2,         label: "1 Gym" },
      { icon: Users,             label: "Unlimited members" },
      { icon: UserCheck,         label: "Unlimited trainers" },
      { icon: Calendar,          label: "Attendance tracking" },
      { icon: ClipboardList,     label: "Membership plans" },
      { icon: LockIcon,          label: "Locker management" },
      { icon: BanknoteArrowDown, label: "Payment management" },
      { icon: IndianRupee,       label: "Expense management" },
      { icon: Dumbbell,          label: "Workout plans" },
      { icon: UtensilsCrossed,   label: "Diet plans" },
      { icon: ShoppingBag,       label: "Supplement management" },
      { icon: BarChart3,         label: "Full reports & analytics" },
      { icon: Bell,              label: "Unlimited Announcements & notifications" },
      { icon: Headphones,        label: "Priority support" },
    ],
  },
  {
    key: "enterprise", name: "Enterprise", description: "For large chains with no limits",
    gradient: "from-purple-500/12 to-violet-500/4",
    ring: "ring-purple-500/30", textAccent: "text-purple-400",
    badge: "Unlimited Everything", badgeClass: "bg-purple-500 text-white",
    prices: { QUARTERLY: 2999, HALF_YEARLY: 4999, YEARLY: 8999 },
    features: [
      { icon: Building2,          label: "Up to 5 gyms" },
      { icon: Users,             label: "Unlimited members" },
      { icon: UserCheck,         label: "Unlimited trainers" },
      { icon: Calendar,          label: "Attendance tracking" },
      { icon: ClipboardList,     label: "Membership plans" },
      { icon: LockIcon,          label: "Locker management" },
      { icon: BanknoteArrowDown, label: "Payment management" },
      { icon: IndianRupee,       label: "Expense management" },
      { icon: Dumbbell,          label: "Workout plans" },
      { icon: UtensilsCrossed,   label: "Diet plans" },
      { icon: BrainCircuitIcon, label: "AI-powered workout/diet plans" },
      { icon: ShoppingBag,       label: "Supplement management" },
      { icon: BarChart3,         label: "Full reports & analytics" },
      { icon: Bell,              label: "Unlimited Announcements & notifications" },
      { icon: Rocket,            label: "Custom integrations" },
      { icon: Headphones,        label: "Priority support" },
    ],
  },
]

// ── DB interfaces ─────────────────────────────────────────────────────────────
interface DbPlan         { id: string; name: string; interval: string; price: number }
interface DbSubscription { id: string; status: string; saasPlan: DbPlan; currentPeriodEnd: string | null }

// ── Savings badge helper ──────────────────────────────────────────────────────
function savingsLabel(prices: PlanTier["prices"], interval: DurationInterval): string | null {
  const monthly3 = prices.QUARTERLY  / 3
  const perMonth = prices[interval]  / DURATIONS.find(d => d.interval === interval)!.months
  if (interval === "QUARTERLY") return null
  const pct = Math.round(((monthly3 - perMonth) / monthly3) * 100)
  return pct > 0 ? `Save ${pct}%` : null
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SubscriptionsPage() {
  const { toast } = useToast()
  const sub = useSubscription()

  const [dbPlans,    setDbPlans]    = useState<DbPlan[]>([])
  const [dbSub,      setDbSub]      = useState<DbSubscription | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  // Per-tier duration selection (defaults to 6 months)
  const [durations, setDurations] = useState<Record<string, DurationInterval>>({
    basic:      "HALF_YEARLY",
    pro:        "HALF_YEARLY",
    enterprise: "HALF_YEARLY",
  })

  useEffect(() => {
    Promise.all([
      fetch("/api/subscriptions/plans").then(r => r.json()),
      fetch("/api/owner/subscription").then(r => r.json()),
    ]).then(([p, s]) => {
      setDbPlans(Array.isArray(p) ? p : [])
      setDbSub(s.subscription ?? null)
    }).finally(() => setLoading(false))
  }, [])

  const findDbPlan = (tierKey: string, interval: DurationInterval): DbPlan | undefined =>
    dbPlans.find(p =>
      p.name.toLowerCase().includes(tierKey) &&
      p.interval === interval
    )

  const activePlanKey = dbSub?.saasPlan?.name?.toLowerCase().trim() ?? null
  const activeInterval = dbSub?.saasPlan?.interval ?? null
  const isActiveSub = dbSub?.status === "ACTIVE" || dbSub?.status === "TRIALING"

  const isCurrent = (tier: PlanTier, interval: DurationInterval) =>
    isActiveSub &&
    activePlanKey?.includes(tier.key) &&
    activeInterval === interval

  const purchase = async (tier: PlanTier, interval: DurationInterval) => {
    const dbPlan = findDbPlan(tier.key, interval)
    if (!dbPlan) {
      toast({ variant: "destructive", title: "Plan not found. Please contact support." })
      return
    }
    const price = tier.prices[interval]
    const duration = DURATIONS.find(d => d.interval === interval)!
    const purchaseKey = `${tier.key}-${interval}`

    setPurchasing(purchaseKey)
    try {
      const orderRes = await fetch("/api/subscriptions/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saasPlanId: dbPlan.id }),
      })
      const order = await orderRes.json()
      if (!order.orderId) throw new Error(order.error ?? "Could not create order")

      if (!(window as any).Razorpay) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement("script")
          s.src = "https://checkout.razorpay.com/v1/checkout.js"
          s.onload = () => res()
          s.onerror = () => rej(new Error("Failed to load Razorpay"))
          document.head.appendChild(s)
        })
      }

      const rzp = new (window as any).Razorpay({
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      order.amount,
        currency:    "INR",
        name:        "GymStack",
        description: `${tier.name} Plan — ${duration.months} months`,
        order_id:    order.orderId,
        handler: async (response: any) => {
          const res = await fetch("/api/subscriptions/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              saasPlanId:        dbPlan.id,
              amount:            price,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId:   response.razorpay_order_id,
            }),
          })
          if (res.ok) {
            toast({ variant: "success", title: `${tier.name} plan activated!` })
            sub.refresh()
          } else {
            toast({ variant: "destructive", title: "Payment recorded but activation failed — contact support" })
          }
          setPurchasing(null)
        },
        modal: { ondismiss: () => setPurchasing(null) },
        prefill: {},
        theme: { color: "#f59e0b" },
      })
      rzp.open()
    } catch (err: any) {
      toast({ variant: "destructive", title: err.message ?? "Payment failed" })
      setPurchasing(null)
    }
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="max-w-6xl space-y-8">
      <PageHeader title="Subscriptions & Plans" subtitle="Choose the right plan for your gym business" />
      {/* Free plan skeleton */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/8 rounded-2xl p-6 animate-pulse h-32" />
      {/* Paid plan skeletons */}
      <div className="grid sm:grid-cols-3 gap-5">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[hsl(220_25%_9%)] border border-white/8 rounded-2xl p-6 animate-pulse h-130" />
        ))}
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl space-y-8">
      <PageHeader title="Subscriptions & Plans" subtitle="Choose the right plan for your gym business" />

      {/* ── Current subscription banner ───────────────────────────────── */}
      {dbSub && (
        <div className={`border rounded-2xl px-5 py-4 flex items-center justify-between flex-wrap gap-3 ${
          sub.isExpired ? "bg-red-500/8 border-red-500/20" : "bg-primary/8 border-primary/20"
        }`}>
          <div className="flex items-center gap-3">
            {sub.isExpired
              ? <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              : <Crown className="w-4 h-4 text-primary shrink-0" />
            }
            <div>
              <p className="text-white text-sm font-semibold">
                Current Plan: {dbSub?.saasPlan?.name}
              </p>
              <p className="text-white/40 text-xs mt-0.5">
                <span className={`capitalize font-medium ${sub.isExpired ? "text-red-400" : "text-primary"}`}>
                  {dbSub?.status?.toLowerCase()}
                </span>
                {dbSub.currentPeriodEnd && !sub.isExpired && (
                  <> · Renews {new Date(dbSub.currentPeriodEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</>
                )}
                {dbSub.currentPeriodEnd && sub.isExpired && (
                  <> · Expired {new Date(dbSub.currentPeriodEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</>
                )}
              </p>
            </div>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full border font-medium ${
            sub.isExpired
              ? "bg-red-500/15 text-red-400 border-red-500/25"
              : "bg-primary/15 text-primary border-primary/25"
          }`}>
            {sub.isExpired ? "Expired" : "Active"}
          </span>
        </div>
      )}

      {/* ── Usage summary ─────────────────────────────────────────────── */}
      {!sub.isExpired && sub.usage && sub.limits && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Gyms",             used: sub.usage.gyms,            max: sub.limits.maxGyms },
            { label: "Members",          used: sub.usage.members,         max: sub.limits.maxMembers },
            { label: "Trainers",         used: sub.usage.trainers,        max: sub.limits.maxTrainers },
            { label: "Membership Plans", used: sub.usage.membershipPlans, max: sub.limits.maxMembershipPlans },
          ].map(({ label, used, max }) => {
            const pct         = max !== null ? Math.min(100, Math.round((used / max) * 100)) : null
            const isUnlimited = max === null
            const isHigh      = pct !== null && pct >= 90
            return (
              <div key={label} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white/45 text-xs">{label}</p>
                  {isUnlimited
                    ? <Infinity className="w-3.5 h-3.5 text-yellow-400" />
                    : <span className={`text-xs font-semibold ${isHigh ? "text-red-400" : "text-white/60"}`}>{used}/{max}</span>
                  }
                </div>
                {!isUnlimited && (
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isHigh ? "bg-red-500" : pct! >= 70 ? "bg-yellow-500" : "bg-primary"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
                {isUnlimited && <p className="text-yellow-400/70 text-[11px]">Unlimited</p>}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Free plan banner ──────────────────────────────────────────── */}
      {(() => {
        const freeIsActive = isActiveSub && activePlanKey?.includes("free")
        const freeBuying   = purchasing === "free"
        const freeDbPlan   = dbPlans.find(p => p.name.toLowerCase().includes("free"))
        return (
          <div className={`bg-[hsl(220_25%_9%)] border rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            freeIsActive ? "border-green-500/25 ring-1 ring-green-500/20" : "border-white/8"
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center shrink-0">
                <Star className="w-4.5 h-4.5 text-white/60" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-semibold text-sm">Free Plan</h3>
                  <span className="text-[10px] bg-white/8 text-white/50 px-2 py-0.5 rounded-full border border-white/10">1 month</span>
                  {freeIsActive && (
                    <span className="text-[10px] bg-green-500/15 text-green-400 border border-green-500/25 px-2 py-0.5 rounded-full font-semibold">
                      ✓ Active
                    </span>
                  )}
                </div>
                <p className="text-white/40 text-xs mt-1">
                  1 gym · Unlimited members & trainers · Attendance · Reports · Announcements
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (freeIsActive || freeBuying || !freeDbPlan) return
                setPurchasing("free")
                fetch("/api/subscriptions/subscribe", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ saasPlanId: freeDbPlan.id, amount: 0 }),
                }).then(r => {
                  if (r.ok) { toast({ variant: "success", title: "Free plan activated!" }); sub.refresh() }
                  else toast({ variant: "destructive", title: "Failed to activate free plan" })
                }).finally(() => setPurchasing(null))
              }}
              disabled={freeIsActive || freeBuying || !freeDbPlan}
              className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                freeIsActive
                  ? "bg-white/5 text-white/30 cursor-not-allowed"
                  : "bg-white/8 hover:bg-white/14 text-white border border-white/10"
              }`}
            >
              {freeBuying ? <Loader2 className="w-4 h-4 animate-spin" /> : freeIsActive ? "Current Plan" : "Get Started Free"}
            </button>
          </div>
        )
      })()}

      {/* ── Paid plan cards ───────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-3 gap-5">
        {TIERS.map((tier) => {
          const selectedInterval = durations[tier.key]
          const price            = tier.prices[selectedInterval]
          const selectedDuration = DURATIONS.find(d => d.interval === selectedInterval)!
          const current          = isCurrent(tier, selectedInterval)
          const anyTierCurrent   = isActiveSub && activePlanKey?.includes(tier.key)
          const purchaseKey      = `${tier.key}-${selectedInterval}`
          const isBuying         = purchasing === purchaseKey
          const isPopular        = tier.key === "pro"

          return (
            <div
              key={tier.key}
              className={`relative bg-linear-to-br ${tier.gradient} border rounded-2xl flex flex-col transition-all ${
                current
                  ? `ring-2 ${tier.ring} border-transparent`
                  : anyTierCurrent
                    ? "border-white/10"
                    : "border-white/8 hover:border-white/15"
              }`}
            >
              {/* Top badge — centered */}
              {(tier.badge || current) && (
                <div className="absolute -top-3 inset-x-0 flex justify-center w-full m-auto pointer-events-none">
                  {current ? (
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/25 whitespace-nowrap">
                      ✓ Current Plan
                    </span>
                  ) : (
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap ${tier.badgeClass}`}>
                      {tier.badge}
                    </span>
                  )}
                </div>
              )}

              <div className="p-6 flex flex-col gap-5 flex-1">
                {/* Plan name + description */}
                <div>
                  <h3 className="text-white font-bold text-xl">{tier.name}</h3>
                  <p className="text-white/40 text-xs mt-1">{tier.description}</p>
                </div>

                {/* Duration picker */}
                <div className="flex gap-1.5 bg-white/4 p-1 rounded-xl border border-white/6">
                  {DURATIONS.map((d) => {
                    const isSelected = d.interval === selectedInterval
                    const sav = savingsLabel(tier.prices, d.interval)
                    return (
                      <button
                        key={d.interval}
                        onClick={() => setDurations(prev => ({ ...prev, [tier.key]: d.interval }))}
                        className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-lg transition-all ${
                          isSelected
                            ? `bg-white/10 ${tier.textAccent} border border-white/12`
                            : "text-white/40 hover:text-white/65"
                        }`}
                      >
                        <span className="text-xs font-semibold leading-tight">{d.label}</span>
                        {sav ? (
                          <span className={`text-[9px] font-bold leading-tight mt-0.5 ${
                            isSelected ? "text-green-400" : "text-green-500/70"
                          }`}>{sav}</span>
                        ) : (
                          <span className="text-[9px] leading-tight mt-0.5 opacity-0">-</span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Price */}
                <div className="flex items-end gap-1.5">
                  <span className="text-4xl font-bold text-white leading-none">
                    ₹{price.toLocaleString("en-IN")}
                  </span>
                  <div className="mb-1">
                    <span className="text-white/35 text-xs">/ {selectedDuration.months} mo</span>
                  </div>
                </div>

                {/* Per-month breakdown */}
                <p className="text-white/30 text-[11px] -mt-3">
                  ≈ ₹{Math.round(price / selectedDuration.months).toLocaleString("en-IN")} / month
                </p>

                {/* Divider */}
                <div className="h-px bg-white/6" />

                {/* Features */}
                <ul className="space-y-2.5 flex-1">
                  {tier.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2.5 text-sm py-1 text-white/65">
                      <f.icon className={`w-3.5 h-3.5 ${tier.textAccent} opacity-70 shrink-0`} />
                      {f.label}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => !current && !isBuying && purchase(tier, selectedInterval)}
                  disabled={current || isBuying}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    current
                      ? "bg-white/5 text-white/30 cursor-not-allowed"
                      : isPopular
                        ? "bg-linear-to-r from-primary to-orange-400 text-white hover:opacity-90 shadow-lg shadow-primary/20"
                        : tier.key === "enterprise"
                          ? "bg-purple-500 text-white hover:opacity-90"
                          : "bg-white/8 hover:bg-white/15 text-white border border-white/10"
                  }`}
                >
                  {isBuying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : current ? (
                    "Current Plan"
                  ) : (
                    <><CreditCard className="w-4 h-4" /> Subscribe — ₹{price.toLocaleString("en-IN")}</>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Trust badges ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {[
          { icon: Shield,     text: "Secure Payments",    sub: "Powered by Razorpay" },
          { icon: Clock,      text: "Instant Activation", sub: "No waiting period"   },
          { icon: Check,      text: "Easy Upgrade",       sub: "Switch anytime"      },
          { icon: Infinity,   text: "No Lock-in",         sub: "Cancel any time"     },
        ].map(b => (
          <div key={b.text} className="flex items-center gap-3 p-4 bg-[hsl(220_25%_9%)] border border-white/5 rounded-xl">
            <b.icon className="w-4 h-4 text-primary/60 shrink-0" />
            <div>
              <p className="text-white text-xs font-medium">{b.text}</p>
              <p className="text-white/30 text-[10px]">{b.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
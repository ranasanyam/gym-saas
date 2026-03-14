// // src/app/owner/billing/page.tsx
// "use client"

// import { useEffect, useState } from "react"
// import { useToast } from "@/hooks/use-toast"
// import {
//   Zap, Check, Crown, Loader2, CreditCard, Star,
//   Users, Bell, BarChart3, ShoppingBag, Palette, MessageCircle,
//   Infinity, Shield, ChevronRight, Calendar, Clock
// } from "lucide-react"

// interface SaasPlan {
//   id: string; name: string; description: string | null
//   interval: string; price: number; sortOrder: number
//   maxMembers: number | null; maxTrainers: number | null
//   attendanceTracking: boolean; workoutPlans: boolean; dietPlans: boolean
//   classScheduling: boolean; reportsAnalytics: boolean; onlinePayments: boolean
//   balanceSheet: boolean; supplementManagement: boolean
//   customBranding: boolean; whatsappIntegration: boolean; apiAccess: boolean
// }

// interface Subscription {
//   id: string; status: string
//   currentPeriodStart: string; currentPeriodEnd: string | null
//   saasPlan: SaasPlan
// }

// const INTERVAL_LABEL: Record<string, string> = {
//   MONTHLY:     "1 month",
//   QUARTERLY:   "3 months",
//   HALF_YEARLY: "6 months",
//   YEARLY:      "1 year",
//   LIFETIME:    "Lifetime",
// }

// const PLAN_GRADIENTS = [
//   "from-white/4 to-transparent border-white/8",
//   "from-blue-500/15 to-cyan-500/5 border-blue-500/20",
//   "from-primary/15 to-amber-500/5 border-primary/20",
//   "from-purple-500/15 to-violet-500/5 border-purple-500/20",
//   "from-pink-500/15 to-rose-500/5 border-pink-500/20",
//   "from-amber-500/20 to-yellow-500/5 border-amber-500/30",
// ]

// const POPULAR_IDX = 2 // Standard plan

// function featureList(plan: SaasPlan): { label: string; icon: any }[] {
//   const all = [
//     { flag: true,                           label: `Up to ${plan.maxMembers ?? "Unlimited"} members`, icon: Users },
//     { flag: true,                           label: "Attendance tracking",            icon: Check },
//     { flag: true,                           label: "Workout & diet plans",           icon: Check },
//     { flag: plan.classScheduling,           label: "Class scheduling",               icon: Check },
//     { flag: plan.reportsAnalytics,          label: "Reports & analytics",            icon: BarChart3 },
//     { flag: plan.onlinePayments,            label: "Online payments (Razorpay)",     icon: CreditCard },
//     { flag: plan.balanceSheet,              label: "Balance sheet",                  icon: Check },
//     { flag: plan.supplementManagement,      label: "Supplement management",          icon: ShoppingBag },
//     { flag: plan.customBranding,            label: "Custom branding (logo & name)",  icon: Palette },
//     { flag: plan.whatsappIntegration,       label: "WhatsApp integration",           icon: MessageCircle },
//     { flag: plan.apiAccess,                 label: "API access",                     icon: Zap },
//     { flag: true,                           label: "24/7 support",                   icon: Shield },
//     { flag: true,                           label: "Free updates",                   icon: Check },
//     { flag: plan.interval === "LIFETIME",   label: "Lifetime access — pay once",     icon: Infinity },
//   ]
//   return all.filter(f => f.flag)
// }

// export default function BillingPage() {
//   const { toast } = useToast()
//   const [plans,        setPlans]        = useState<SaasPlan[]>([])
//   const [subscription, setSubscription] = useState<Subscription | null>(null)
//   const [loading,      setLoading]      = useState(true)
//   const [purchasing,   setPurchasing]   = useState<string | null>(null)

//   useEffect(() => {
//     Promise.all([
//       fetch("/api/billing/plans").then(r => r.json()),
//       fetch("/api/billing/subscription").then(r => r.json()),
//     ]).then(([p, s]) => {
//       setPlans(Array.isArray(p) ? p.sort((a: SaasPlan, b: SaasPlan) => a.sortOrder - b.sortOrder) : [])
//       setSubscription(s.subscription ?? null)
//     }).finally(() => setLoading(false))
//   }, [])

//   const purchase = async (plan: SaasPlan) => {
//     if (plan.price === 0) {
//       // Free plan — activate immediately, no payment needed
//       setPurchasing(plan.id)
//       const res = await fetch("/api/billing/subscribe", {
//         method: "POST", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ saasPlanId: plan.id, amount: 0 }),
//       })
//       if (res.ok) {
//         toast({ variant: "success", title: "Free plan activated!" })
//         const data = await res.json()
//         setSubscription({ ...data.subscription, saasPlan: plan })
//       } else toast({ variant: "destructive", title: "Failed to activate plan" })
//       setPurchasing(null)
//       return
//     }

//     // Paid plan — initiate Razorpay
//     setPurchasing(plan.id)
//     try {
//       // Create Razorpay order
//       const orderRes = await fetch("/api/billing/create-order", {
//         method: "POST", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ saasPlanId: plan.id }),
//       })
//       const order = await orderRes.json()
//       if (!order.orderId) throw new Error(order.error ?? "Could not create order")

//       // Load Razorpay script if not loaded
//       if (!(window as any).Razorpay) {
//         await new Promise<void>((res, rej) => {
//           const s = document.createElement("script")
//           s.src = "https://checkout.razorpay.com/v1/checkout.js"
//           s.onload = () => res(); s.onerror = () => rej(new Error("Failed to load Razorpay"))
//           document.head.appendChild(s)
//         })
//       }

//       const rzp = new (window as any).Razorpay({
//         key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
//         amount:      order.amount,
//         currency:    "INR",
//         name:        "GymStack",
//         description: `${plan.name} Plan — ${INTERVAL_LABEL[plan.interval]}`,
//         order_id:    order.orderId,
//         handler: async (response: any) => {
//           const res = await fetch("/api/billing/subscribe", {
//             method: "POST", headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               saasPlanId:        plan.id,
//               amount:            plan.price,
//               razorpayPaymentId: response.razorpay_payment_id,
//               razorpayOrderId:   response.razorpay_order_id,
//             }),
//           })
//           if (res.ok) {
//             toast({ variant: "success", title: `🎉 ${plan.name} plan activated!` })
//             const data = await res.json()
//             setSubscription({ ...data.subscription, saasPlan: plan })
//           } else toast({ variant: "destructive", title: "Payment recorded but activation failed — contact support" })
//           setPurchasing(null)
//         },
//         modal: { ondismiss: () => setPurchasing(null) },
//         prefill: {},
//         theme: { color: "#f59e0b" },
//       })
//       rzp.open()
//     } catch (err: any) {
//       toast({ variant: "destructive", title: err.message ?? "Payment failed" })
//       setPurchasing(null)
//     }
//   }

//   const activePlanId = subscription?.status === "ACTIVE" || subscription?.status === "LIFETIME"
//     ? subscription.saasPlan.id : null

//   if (loading) return (
//     <div className="flex items-center justify-center h-48">
//       <Loader2 className="w-6 h-6 text-primary animate-spin" />
//     </div>
//   )

//   return (
//     <div className="max-w-6xl space-y-8">

//       {/* Header */}
//       <div className="text-center space-y-2">
//         <h2 className="text-3xl font-display font-bold text-white">Choose Your Plan</h2>
//         <p className="text-white/45 text-sm">Scale your gym with the right tools. Upgrade or downgrade anytime.</p>
//       </div>

//       {/* Current subscription banner */}
//       {subscription && (
//         <div className="bg-primary/8 border border-primary/20 rounded-2xl px-6 py-4 flex items-center justify-between flex-wrap gap-3">
//           <div className="flex items-center gap-3">
//             <Crown className="w-5 h-5 text-primary" />
//             <div>
//               <p className="text-white font-semibold">Current Plan: {subscription.saasPlan.name}</p>
//               <p className="text-white/45 text-xs mt-0.5">
//                 Status: <span className="text-primary capitalize">{subscription.status.toLowerCase()}</span>
//                 {subscription.currentPeriodEnd && (
//                   <> · Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</>
//                 )}
//                 {!subscription.currentPeriodEnd && subscription.status === "LIFETIME" && " · Never expires"}
//               </p>
//             </div>
//           </div>
//           <span className="text-xs bg-primary/15 text-primary px-3 py-1.5 rounded-full border border-primary/25 font-medium">Active</span>
//         </div>
//       )}

//       {/* Plan cards */}
//       <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
//         {plans.map((plan, i) => {
//           const isActive  = plan.id === activePlanId
//           const isPopular = i === POPULAR_IDX
//           const features  = featureList(plan)
//           const isBuying  = purchasing === plan.id

//           return (
//             <div key={plan.id}
//               className={`relative bg-linear-to-br ${PLAN_GRADIENTS[i % PLAN_GRADIENTS.length]} border rounded-2xl p-6 flex flex-col gap-4 transition-all hover:scale-[1.01] ${isActive ? "ring-2 ring-primary/50" : ""}`}>

//               {/* Badges */}
//               <div className="flex items-center justify-between">
//                 {isPopular && !isActive && (
//                   <span className="text-xs bg-primary text-white px-3 py-1 rounded-full font-semibold flex items-center gap-1">
//                     <Star className="w-3 h-3" /> Most Popular
//                   </span>
//                 )}
//                 {isActive && (
//                   <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/25 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
//                     <Check className="w-3 h-3" /> Current Plan
//                   </span>
//                 )}
//                 {plan.interval === "LIFETIME" && !isActive && (
//                   <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/25 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
//                     <Infinity className="w-3 h-3" /> Best Value
//                   </span>
//                 )}
//                 {!isPopular && !isActive && plan.interval !== "LIFETIME" && <span />}

//                 <span className="flex items-center gap-1 text-xs text-white/35 ml-auto">
//                   {plan.interval === "LIFETIME" ? <Infinity className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
//                   {INTERVAL_LABEL[plan.interval]}
//                 </span>
//               </div>

//               {/* Name + Price */}
//               <div>
//                 <h3 className="text-white font-bold text-xl">{plan.name}</h3>
//                 {plan.description && <p className="text-white/40 text-xs mt-1 leading-relaxed">{plan.description}</p>}
//                 <div className="flex items-end gap-2 mt-4">
//                   {plan.price === 0 ? (
//                     <span className="text-4xl font-display font-bold text-white">Free</span>
//                   ) : (
//                     <>
//                       <span className="text-4xl font-display font-bold text-white">₹{Number(plan.price).toLocaleString("en-IN")}</span>
//                       <span className="text-white/35 text-sm mb-1.5">/ {INTERVAL_LABEL[plan.interval].toLowerCase()}</span>
//                     </>
//                   )}
//                 </div>
//               </div>

//               {/* Features */}
//               <ul className="space-y-2 flex-1">
//                 {features.map((f, fi) => (
//                   <li key={fi} className="flex items-start gap-2.5 text-xs text-white/65">
//                     <f.icon className="w-3.5 h-3.5 text-primary/80 shrink-0 mt-0.5" />
//                     {f.label}
//                   </li>
//                 ))}
//               </ul>

//               {/* CTA */}
//               <button
//                 onClick={() => !isActive && purchase(plan)}
//                 disabled={isActive || isBuying}
//                 className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
//                   isActive
//                     ? "bg-white/5 text-white/30 cursor-not-allowed"
//                     : isPopular
//                     ? "bg-gradient-primary hover:opacity-90 text-white"
//                     : "bg-white/8 hover:bg-white/15 text-white border border-white/10"
//                 }`}>
//                 {isBuying ? (
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                 ) : isActive ? (
//                   "Active Plan"
//                 ) : plan.price === 0 ? (
//                   "Get Started Free"
//                 ) : (
//                   <><CreditCard className="w-4 h-4" /> Subscribe Now</>
//                 )}
//               </button>
//             </div>
//           )
//         })}
//       </div>

//       {/* Trust badges */}
//       <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
//         {[
//           { icon: Shield,        text: "Secure Payments",    sub: "Powered by Razorpay" },
//           { icon: Clock,         text: "24/7 Support",       sub: "Always available" },
//           { icon: Zap,           text: "Instant Activation", sub: "No waiting period" },
//           { icon: ChevronRight,  text: "Easy Upgrade",       sub: "Switch plans anytime" },
//         ].map(b => (
//           <div key={b.text} className="flex items-center gap-3 p-4 bg-[hsl(220_25%_9%)] border border-white/5 rounded-xl">
//             <b.icon className="w-4 h-4 text-primary/70 shrink-0" />
//             <div>
//               <p className="text-white text-xs font-medium">{b.text}</p>
//               <p className="text-white/30 text-[10px]">{b.sub}</p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }

// src/app/owner/billing/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { PageHeader } from "@/components/owner/PageHeader"
import {
  Zap, Check, Crown, Loader2, CreditCard, Star,
  Users, Dumbbell, UtensilsCrossed, ShoppingBag, BarChart3,
  Infinity, Shield, Clock, Building2, UserCheck, Bell,
  Gift, ClipboardList, AlertTriangle, ChevronRight,
} from "lucide-react"

// ── Plan definitions matching spec exactly ────────────────────────────────────

interface PlanSpec {
  key: string
  name: string
  price: number
  duration: string
  interval: string
  badge?: string
  badgeColor?: string
  gradient: string
  ring: string
  features: { icon: React.ElementType; label: string }[]
}

const PLANS: PlanSpec[] = [
  {
    key: "free trial", name: "Free Trial", price: 0, duration: "1 month", interval: "MONTHLY",
    gradient: "from-white/4 to-transparent", ring: "ring-white/10",
    features: [
      { icon: Building2, label: "1 gym" },
      { icon: Users, label: "Up to 100 members" },
      { icon: UserCheck, label: "1 trainer" },
      { icon: ClipboardList, label: "10 membership plans" },
      { icon: BarChart3, label: "Basic analytics" },
      { icon: Bell, label: "10 app notifications" },
    ],
  },
  {
    key: "starter", name: "Starter", price: 2000, duration: "6 months", interval: "HALF_YEARLY",
    badge: "Popular", badgeColor: "bg-blue-500 text-white",
    gradient: "from-blue-500/12 to-cyan-500/5", ring: "ring-blue-500/25",
    features: [
      { icon: Building2, label: "2 gyms" },
      { icon: Users, label: "Up to 200 members" },
      { icon: UserCheck, label: "2 trainers" },
      { icon: ClipboardList, label: "20 membership plans" },
      { icon: BarChart3, label: "Dashboard analytics" },
      { icon: Dumbbell, label: "Workout plan creation" },
      { icon: UtensilsCrossed, label: "Diet plan creation" },
      { icon: Check, label: "Member attendance" },
      { icon: Bell, label: "50 notifications / month" },
    ],
  },
  {
    key: "growth", name: "Growth", price: 3000, duration: "12 months", interval: "YEARLY",
    badge: "Best Value", badgeColor: "bg-primary text-white",
    gradient: "from-primary/12 to-orange-500/5", ring: "ring-primary/30",
    features: [
      { icon: Building2, label: "10 gyms" },
      { icon: Users, label: "Up to 500 members" },
      { icon: UserCheck, label: "10 trainers" },
      { icon: ClipboardList, label: "50 membership plans" },
      { icon: BarChart3, label: "Full analytics dashboard" },
      { icon: ShoppingBag, label: "Supplement management" },
      { icon: CreditCard, label: "Payment management" },
      { icon: Users, label: "Member CRUD operations" },
      { icon: Bell, label: "100 notifications / month" },
    ],
  },
  {
    key: "pro", name: "Pro", price: 5000, duration: "12 months", interval: "YEARLY",
    badge: "Most Powerful", badgeColor: "bg-purple-500 text-white",
    gradient: "from-purple-500/12 to-violet-500/5", ring: "ring-purple-500/25",
    features: [
      { icon: Infinity, label: "Unlimited gyms" },
      { icon: Infinity, label: "Unlimited members" },
      { icon: Infinity, label: "Unlimited trainers" },
      { icon: Infinity, label: "Unlimited notifications" },
      { icon: ClipboardList, label: "Workout & diet templates" },
      { icon: Gift, label: "Refer & earn" },
      { icon: BarChart3, label: "Full reports" },
      { icon: Check, label: "Everything in Growth" },
    ],
  },
  {
    key: "lifetime", name: "Lifetime", price: 30000, duration: "Lifetime", interval: "LIFETIME",
    badge: "Pay Once Forever", badgeColor: "bg-yellow-500 text-black",
    gradient: "from-yellow-500/15 to-amber-500/5", ring: "ring-yellow-500/30",
    features: [
      { icon: Infinity, label: "All Pro features — forever" },
      { icon: Shield, label: "No renewal fees, ever" },
      { icon: Star, label: "Lifetime access guaranteed" },
      { icon: Zap, label: "Priority support" },
    ],
  },
]

// ── DB plan interface (from /api/billing/plans) ───────────────────────────────
interface DbPlan { id: string; name: string; interval: string; price: number }
interface DbSubscription { id: string; status: string; saasPlan: DbPlan; currentPeriodEnd: string | null }

export default function BillingPage() {
  const { toast } = useToast()
  const sub = useSubscription()
  const [dbPlans, setDbPlans] = useState<DbPlan[]>([])
  const [dbSub, setDbSub] = useState<DbSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/billing/plans").then(r => r.json()),
      fetch("/api/billing/subscription").then(r => r.json()),
    ]).then(([p, s]) => {
      setDbPlans(Array.isArray(p) ? p : [])
      setDbSub(s.subscription ?? null)
    }).finally(() => setLoading(false))
  }, [])

  const findDbPlan = (key: string): DbPlan | undefined =>
    dbPlans.find(p => p.name.toLowerCase().trim() === key)

  const activePlanKey = dbSub?.saasPlan?.name?.toLowerCase().trim() ?? null
  const isActiveSub = dbSub?.status === "ACTIVE" || dbSub?.status === "TRIALING" || dbSub?.status === "LIFETIME"

  const purchase = async (spec: PlanSpec) => {
    const dbPlan = findDbPlan(spec.key)
    if (!dbPlan) {
      toast({ variant: "destructive", title: "Plan not found. Please contact support." })
      return
    }

    if (spec.price === 0) {
      setPurchasing(spec.key)
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saasPlanId: dbPlan.id, amount: 0 }),
      })
      if (res.ok) {
        toast({ variant: "success", title: "Free Trial activated!" })
        sub.refresh()
      } else {
        toast({ variant: "destructive", title: "Failed to activate plan" })
      }
      setPurchasing(null)
      return
    }

    setPurchasing(spec.key)
    try {
      const orderRes = await fetch("/api/billing/create-order", {
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
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "FitHub",
        description: `${spec.name} Plan — ${spec.duration}`,
        order_id: order.orderId,
        handler: async (response: any) => {
          const res = await fetch("/api/billing/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              saasPlanId: dbPlan.id,
              amount: spec.price,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
            }),
          })
          if (res.ok) {
            toast({ variant: "success", title: `🎉 ${spec.name} plan activated!` })
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

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  )

  return (
    <div className="max-w-6xl space-y-8">
      <PageHeader title="Billing & Plans" subtitle="Choose the right plan for your gym business" />

      {/* ── Current subscription banner ───────────────────────────────── */}
      {dbSub && (
        <div className={`border rounded-2xl px-6 py-4 flex items-center justify-between flex-wrap gap-3 ${sub.isExpired
            ? "bg-red-500/8 border-red-500/20"
            : "bg-primary/8 border-primary/20"
          }`}>
          <div className="flex items-center gap-3">
            {sub.isExpired
              ? <AlertTriangle className="w-5 h-5 text-red-400" />
              : <Crown className="w-5 h-5 text-primary" />
            }
            <div>
              <p className="text-white font-semibold">
                Current Plan: {dbSub.saasPlan.name}
              </p>
              <p className="text-white/45 text-xs mt-0.5">
                Status:{" "}
                <span className={`capitalize font-medium ${sub.isExpired ? "text-red-400" : "text-primary"}`}>
                  {dbSub.status.toLowerCase()}
                </span>
                {dbSub.currentPeriodEnd && !sub.isExpired && (
                  <> · Renews {new Date(dbSub.currentPeriodEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</>
                )}
                {dbSub.currentPeriodEnd && sub.isExpired && (
                  <> · Expired {new Date(dbSub.currentPeriodEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</>
                )}
                {!dbSub.currentPeriodEnd && " · Never expires"}
              </p>
            </div>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full border font-medium ${sub.isExpired
              ? "bg-red-500/15 text-red-400 border-red-500/25"
              : "bg-primary/15 text-primary border-primary/25"
            }`}>
            {sub.isExpired ? "Expired" : "Active"}
          </span>
        </div>
      )}

      {/* ── Usage summary (only when subscribed and not expired) ──────── */}
      {!sub.isExpired && sub.usage && sub.limits && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Gyms", used: sub.usage.gyms, max: sub.limits.maxGyms },
            { label: "Members", used: sub.usage.members, max: sub.limits.maxMembers },
            { label: "Trainers", used: sub.usage.trainers, max: sub.limits.maxTrainers },
            { label: "Membership Plans", used: sub.usage.membershipPlans, max: sub.limits.maxMembershipPlans },
          ].map(({ label, used, max }) => {
            const pct = max !== null ? Math.min(100, Math.round((used / max) * 100)) : null
            const isUnlimited = max === null
            const isHigh = pct !== null && pct >= 90
            return (
              <div key={label} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white/50 text-xs">{label}</p>
                  {isUnlimited
                    ? <Infinity className="w-3.5 h-3.5 text-yellow-400" />
                    : <span className={`text-xs font-semibold ${isHigh ? "text-red-400" : "text-white/60"}`}>{used}/{max}</span>
                  }
                </div>
                {!isUnlimited && (
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isHigh ? "bg-red-500" : pct! >= 70 ? "bg-yellow-500" : "bg-primary"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
                {isUnlimited && (
                  <p className="text-yellow-400/70 text-[11px]">Unlimited</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Plan cards ────────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {PLANS.map((spec) => {
          const dbPlan = findDbPlan(spec.key)
          const isCurrent = isActiveSub && activePlanKey === spec.key
          const isBuying = purchasing === spec.key

          return (
            <div
              key={spec.key}
              className={`relative bg-gradient-to-br ${spec.gradient} border rounded-2xl p-6 flex flex-col gap-5 transition-all hover:scale-[1.01] ${isCurrent ? `ring-2 ${spec.ring}` : "border-white/8"
                }`}
            >
              {/* Badge */}
              {spec.badge && !isCurrent && (
                <span className={`absolute -top-3 left-5 text-[11px] font-bold px-3 py-1 rounded-full ${spec.badgeColor}`}>
                  {spec.badge}
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 left-5 text-[11px] font-bold px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/25">
                  ✓ Current Plan
                </span>
              )}

              {/* Name + Price */}
              <div>
                <h3 className="text-white font-bold text-xl">{spec.name}</h3>
                <p className="text-white/35 text-xs mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {spec.duration}
                </p>
                <div className="flex items-end gap-1.5 mt-4">
                  {spec.price === 0 ? (
                    <span className="text-4xl font-display font-bold text-white">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-display font-bold text-white">
                        ₹{spec.price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-white/35 text-sm mb-1.5">/ {spec.duration.toLowerCase()}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1">
                {spec.features.map((f, fi) => (
                  <li key={fi} className="flex items-center gap-2.5 text-xs text-white/65">
                    <f.icon className="w-3.5 h-3.5 text-primary/80 shrink-0" />
                    {f.label}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => !isCurrent && !isBuying && purchase(spec)}
                disabled={isCurrent || isBuying || !dbPlan}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${isCurrent
                    ? "bg-white/5 text-white/30 cursor-not-allowed"
                    : spec.key === "growth"
                      ? "bg-gradient-to-r from-primary to-orange-400 text-white hover:opacity-90"
                      : spec.key === "lifetime"
                        ? "bg-gradient-to-r from-yellow-500 to-amber-400 text-black font-bold hover:opacity-90"
                        : "bg-white/8 hover:bg-white/15 text-white border border-white/10"
                  }`}
              >
                {isBuying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCurrent ? (
                  "Current Plan"
                ) : spec.price === 0 ? (
                  "Start Free Trial"
                ) : (
                  <><CreditCard className="w-4 h-4" /> Subscribe — ₹{spec.price.toLocaleString("en-IN")}</>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Trust badges ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        {[
          { icon: Shield, text: "Secure Payments", sub: "Powered by Razorpay" },
          { icon: Clock, text: "Instant Activation", sub: "No waiting period" },
          { icon: ChevronRight, text: "Easy Upgrade", sub: "Switch anytime" },
          { icon: Infinity, text: "Lifetime Option", sub: "Pay once, use forever" },
        ].map(b => (
          <div key={b.text} className="flex items-center gap-3 p-4 bg-[hsl(220_25%_9%)] border border-white/5 rounded-xl">
            <b.icon className="w-4 h-4 text-primary/70 shrink-0" />
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
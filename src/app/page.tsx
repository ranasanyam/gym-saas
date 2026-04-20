// src/app/(landing)/page.tsx
"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import {
  Dumbbell, ArrowRight, CheckCircle, Users, ClipboardList,
  UtensilsCrossed, BarChart3, Bell, CreditCard,
  ShieldCheck, Zap, Star, ChevronDown, Menu, X, TrendingUp,
  Trophy, Lock, Package, Receipt,
  Smartphone, Apple, Play, ChevronRight, MapPin,
  Activity, Globe, Shield, Building2, AlertTriangle,
  UserCheck, Calendar, Banknote, IndianRupee, ShoppingBag, BrainCircuit, Rocket, Headphones,
} from "lucide-react"
import { features } from "process"

// ── Hooks ──────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setInView(true)
    }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function useCounter(target: number, inView: boolean, duration = 2000) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!inView) return
    let raf: number
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(ease * target))
      if (progress < 1) raf = requestAnimationFrame(tick)
      else setCount(target)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, target, duration])
  return count
}

function useMouseGlow() {
  const ref = useRef<HTMLDivElement>(null)
  const handleMove = useCallback((e: MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    el.style.setProperty("--mx", `${x}%`)
    el.style.setProperty("--my", `${y}%`)
  }, [])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener("mousemove", handleMove as any)
    return () => el.removeEventListener("mousemove", handleMove as any)
  }, [handleMove])
  return ref
}

// ── Data ───────────────────────────────────────────────────────────────────────

const NAV_LINKS = ["Features", "How it Works", "App", "Pricing", "FAQ"]

const FEATURES = [
  {
    icon: Users, tag: "Core",
    title: "Member Management",
    // desc: "Full member lifecycle — add, onboard, track plans, renewals, attendance history and health records. Bulk import or self-registration.",
    desc: "Full member lifecycle - add, onboard, track plans, renewals, attendance history. Bulk import or self-registration.",
    color: "#f97316",
  },
  {
    icon: ClipboardList, tag: "Training",
    title: "Workout Plans",
    desc: "Build personalised weekly routines per member. Assign exercises, sets, reps, rest. Members follow live on mobile with day-by-day breakdowns.",
    color: "#3b82f6",
  },
  {
    icon: UtensilsCrossed, tag: "Nutrition",
    title: "Diet & Meal Plans",
    desc: "Design macro-balanced meal plans with per-meal food items. Calorie targets, nutrition breakdowns, and dietary preferences — all tracked.",
    color: "#10b981",
  },
  {
    icon: CreditCard, tag: "Finance",
    title: "Billing & Payments",
    desc: "Automate fee collection, generate invoices, and track full payment history. Multiple plan tiers with built-in expiry reminders and Razorpay.",
    color: "#8b5cf6",
  },
  {
    icon: Receipt, tag: "Finance",
    title: "Expense Tracker",
    desc: "Log gym expenses, categorise spending, and get a full balance sheet. Track rent, equipment, salaries and more — all in one place.",
    color: "#f59e0b",
  },
  {
    icon: Lock, tag: "Facility",
    title: "Locker Management",
    desc: "Assign, track, and manage locker allocations for members. View which lockers are free, occupied, or reserved at a glance.",
    color: "#ef4444",
  },
  {
    icon: Bell, tag: "Automation",
    title: "Smart Push Notifications",
    desc: "Real-time push alerts for expiry, payments, announcements and reminders — sent to Android & iOS. No missed follow-ups.",
    color: "#06b6d4",
  },
  {
    icon: BarChart3, tag: "Insights",
    title: "Analytics & Reports",
    desc: "Revenue, retention, attendance trends, trainer performance — live dashboards and downloadable reports to make data-driven decisions daily.",
    color: "#f97316",
  },
  {
    icon: Package, tag: "Inventory",
    title: "Supplement Store",
    desc: "Manage your in-gym supplement inventory. Track stock, set prices, and record sales to members — all from the owner dashboard.",
    color: "#10b981",
  },
  // {
  //   icon: Wallet, tag: "Growth",
  //   title: "Wallet & Referrals",
  //   desc: "Built-in wallet for members to store credits. Automated referral rewards with cashback — a viral growth engine baked into your gym.",
  //   color: "#8b5cf6",
  // },
  {
    icon: Trophy, tag: "Trainers",
    title: "Trainer Portal",
    desc: "Dedicated dashboards for trainers to manage assigned members, track progress, update workouts and diet plans, view attendance.",
    color: "#3b82f6",
  },
  {
    icon: Smartphone, tag: "Mobile",
    title: "Native Mobile App",
    desc: "Full-featured Android & iOS app for owners, trainers, and members. Works offline, sends push notifications, and hot-reloads instantly.",
    color: "#f59e0b",
  },
]

const ROLES = [
  {
    icon: ShieldCheck, label: "Owner",
    title: "Run your gym like a CEO",
    accent: "#f97316",
    bg: "from-orange-500/10 to-orange-500/3",
    border: "border-orange-500/20",
    points: [
      "Multi-gym management from one account",
      "Revenue analytics & balance sheet",
      "Add & manage trainers with role access",
      "Automated billing, invoicing & Razorpay",
      "Custom membership plans & pricing",
      "Supplement store & locker management",
      "Expense tracking & financial reports",
      "Push announcements to all members",
    ],
  },
  {
    icon: Dumbbell, label: "Trainer",
    title: "Focus on coaching, not paperwork",
    accent: "#3b82f6",
    bg: "from-blue-500/10 to-blue-500/3",
    border: "border-blue-500/20",
    points: [
      "View & manage your assigned members",
      "Build custom workout plans per member",
      "Design personalised meal & diet plans",
      "Track member progress over time",
      "View attendance & check-in history",
      "Receive notifications & gym updates",
      "Member profile access & health data",
      "Mobile app with full trainer dashboard",
    ],
  },
  {
    icon: Star, label: "Member",
    title: "Your fitness, always in your pocket",
    accent: "#10b981",
    bg: "from-emerald-500/10 to-emerald-500/3",
    border: "border-emerald-500/20",
    points: [
      "Personal dashboard with live stats",
      "Day-by-day workout plans on mobile",
      "Meal-by-meal diet plans & nutrition",
      "Attendance & payment history",
      "Membership expiry alerts",
      // "Wallet credits & referral rewards",
      "Gym announcements & notifications",
      "Discover & join new gyms nearby",
    ],
  },
]

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
      { icon: Lock,              label: "Locker management" },
      { icon: Banknote,          label: "Payment management" },
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
      { icon: Lock,              label: "Locker management" },
      { icon: Banknote,          label: "Payment management" },
      { icon: IndianRupee,       label: "Expense management" },
      { icon: Dumbbell,          label: "Workout plans" },
      { icon: UtensilsCrossed,   label: "Diet plans" },
      { icon: BrainCircuit,      label: "AI-powered workout/diet plans" },
      { icon: ShoppingBag,       label: "Supplement management" },
      { icon: BarChart3,         label: "Full reports & analytics" },
      { icon: Bell,              label: "Unlimited Announcements & notifications" },
      { icon: Rocket,            label: "Custom integrations" },
      { icon: Headphones,        label: "Priority support" },
    ],
  },
]

// ── Savings badge helper ─────────────────────────────────────────────────────
function savingsLabel(prices: PlanTier["prices"], interval: DurationInterval): string | null {
  const monthly3 = prices.QUARTERLY  / 3
  const perMonth = prices[interval]  / DURATIONS.find(d => d.interval === interval)!.months
  if (interval === "QUARTERLY") return null
  const pct = Math.round(((monthly3 - perMonth) / monthly3) * 100)
  return pct > 0 ? `Save ${pct}%` : null
}

const FAQS = [
  {
    q: "Can I manage multiple gym locations from one account?",
    a: "Yes. All paid plans support multiple gyms under a single owner account. Switch between locations from one unified dashboard with no extra logins.",
  },
  {
    q: "How does the member self-registration work?",
    a: "Members download the app, create an account, and enter your gym code. They're linked to your gym automatically — you can set auto-approve or manual review.",
  },
  {
    q: "Does the mobile app work on both Android and iOS?",
    a: "Yes. GymStack has a native app for both Android and iOS. Push notifications, offline support, and real-time sync all work on both platforms.",
  },
  {
    q: "Is my gym data secure?",
    a: "All data is encrypted at rest and in transit. We use PostgreSQL with row-level security, and authentication uses industry-standard JWT tokens with refresh rotation.",
  },
  {
    q: "What payment methods are supported?",
    // a: "GymStack supports UPI, credit/debit cards, net banking and wallet credits via Razorpay integration — available on Standard plans and above.",
    a: "GymStack supports UPI, credit/debit cards, net banking via Razorpay integration - available on Standard plans and above."
  },
  {
    q: "Can I track gym expenses and generate a balance sheet?",
    a: "Yes. The built-in expense tracker lets you categorise and log all gym costs. Combined with payment data, you get a full revenue vs expense balance sheet.",
  },
]

const STEPS = [
  { n: "01", icon: ShieldCheck, title: "Create your account", desc: "Sign up as a gym owner in under 2 minutes. No credit card needed." },
  { n: "02", icon: Dumbbell,    title: "Set up your gym",     desc: "Add your gym details, membership plans, and invite your trainers." },
  { n: "03", icon: Users,       title: "Add your members",    desc: "Import existing members or share your gym code for self-registration." },
  { n: "04", icon: TrendingUp,  title: "Grow with data",      desc: "Use live analytics, push alerts, and automated billing to scale." },
]

// ── Subcomponents ──────────────────────────────────────────────────────────────

function GlowOrb({ className }: { className: string }) {
  return <div className={`absolute rounded-full blur-[120px] pointer-events-none ${className}`} />
}

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${className}`}>
      {children}
    </span>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="inline-flex items-center gap-2 mb-4">
      <div className="w-5 h-px bg-[#f97316]" />
      <span className="text-[#f97316] text-xs font-bold uppercase tracking-[0.2em]">{children}</span>
      <div className="w-5 h-px bg-[#f97316]" />
    </div>
  )
}

function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? "bg-[#080c12]/90 backdrop-blur-2xl border-b border-white/5 shadow-2xl shadow-black/40"
        : ""
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-17 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
            <img src="../../logo.png" alt="Logo" className="w-16 h-16" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(item => (
            <a key={item}
              href={`#${item.toLowerCase().replace(/ /g, "-")}`}
              className="text-sm text-white/50 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all">
              {item}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-white/55 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
            Sign In
          </Link>
          <Link href="/signup"
            className="flex items-center gap-2 bg-[#f97316] hover:bg-[#ea580c] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40">
            Get Started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <button onClick={() => setOpen(o => !o)} className="md:hidden p-2 text-white/50 hover:text-white transition-colors">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className={`md:hidden overflow-hidden transition-all duration-300 ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="bg-[#0d1117] border-t border-white/5 px-6 py-4 space-y-1">
          {NAV_LINKS.map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-all">
              {item}
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2 border-t border-white/5 mt-3">
            <Link href="/login" onClick={() => setOpen(false)}
              className="text-center text-sm py-3 rounded-xl border border-white/10 text-white/60 hover:border-white/20 hover:text-white transition-all">
              Sign In
            </Link>
            <Link href="/signup" onClick={() => setOpen(false)}
              className="text-center text-sm font-bold py-3 rounded-xl bg-[#f97316] text-white hover:bg-[#ea580c] transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

function StatTicker({ target, suffix, label, inView, delay = 0 }: {
  target: number; suffix: string; label: string; inView: boolean; delay?: number
}) {
  const [started, setStarted] = useState(false)
  useEffect(() => {
    if (!inView) return
    const t = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(t)
  }, [inView, delay])
  const count = useCounter(target, started)
  return (
    <div className="text-center">
      <div className="text-4xl lg:text-5xl font-black text-white tabular-nums mb-1">
        <span className="bg-linear-to-r from-[#f97316] to-[#fb923c] bg-clip-text text-transparent">
          {count.toLocaleString("en-IN")}
        </span>
        <span className="text-[#f97316]">{suffix}</span>
      </div>
      <div className="text-white/40 text-sm font-medium">{label}</div>
    </div>
  )
}

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{ animationDelay: `${index * 60}ms` }}
      className={`group rounded-2xl border transition-all duration-300 overflow-hidden ${
        open
          ? "border-[#f97316]/40 bg-linear-to-b from-[#f97316]/8 to-[#f97316]/3"
          : "border-white/8 bg-white/2 hover:border-white/16 hover:bg-white/4"
      }`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-7 py-5 text-left gap-4">
        <span className={`font-semibold text-sm leading-snug transition-colors ${open ? "text-white" : "text-white/75 group-hover:text-white"}`}>
          {q}
        </span>
        <div className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 ${
          open ? "border-[#f97316] bg-[#f97316] rotate-45" : "border-white/20"
        }`}>
          <ChevronRight className={`w-3 h-3 transition-all duration-300 ${open ? "text-white -rotate-45" : "text-white/40"}`} />
        </div>
      </button>
      <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <p className="px-7 pb-5 text-white/50 text-sm leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc, tag, color, index, inView }: {
  icon: any; title: string; desc: string; tag: string; color: string; index: number; inView: boolean
}) {
  return (
    <div
      className="group relative rounded-2xl border border-white/8 bg-linear-to-b from-white/4 to-white/1 p-6 overflow-hidden hover:border-white/20 transition-all duration-500 cursor-default"
      style={{
        opacity:    inView ? 1 : 0,
        transform:  inView ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.5s ease ${index * 55}ms, transform 0.5s ease ${index * 55}ms`,
      }}>
      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        style={{ background: `radial-gradient(ellipse at 30% 30%, ${color}15, transparent 70%)` }} />

      <div className="relative">
        <div className="flex items-start justify-between mb-5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}18` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border"
            style={{ color: `${color}cc`, borderColor: `${color}30`, backgroundColor: `${color}10` }}>
            {tag}
          </span>
        </div>
        <h3 className="text-white font-bold text-base mb-2.5 group-hover:text-white transition-colors">{title}</h3>
        <p className="text-white/45 text-sm leading-relaxed group-hover:text-white/60 transition-colors">{desc}</p>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const glowRef       = useMouseGlow()
  const statsRef      = useInView(0.3)
  const featuresRef   = useInView(0.05)
  const howRef        = useInView(0.1)
  const rolesRef      = useInView(0.1)
  const appRef        = useInView(0.1)
  const pricingRef    = useInView(0.05)
  const faqRef        = useInView(0.1)
  const [durations, setDurations] = useState<Record<string, DurationInterval>>({
    basic:      "HALF_YEARLY",
    pro:        "HALF_YEARLY",
    enterprise: "HALF_YEARLY",
  })

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ backgroundColor: "#080c12" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .font-display { font-family: 'Syne', sans-serif; }
        .text-gradient { background: linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fbbf24 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .text-gradient-cool { background: linear-gradient(135deg, #ffffff 0%, #ffffff99 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .card-glow { background: radial-gradient(ellipse at var(--mx, 50%) var(--my, 50%), rgba(249,115,22,0.06) 0%, transparent 60%); }
        .grid-bg { background-image: linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px); background-size: 72px 72px; }
        .dot-bg { background-image: radial-gradient(rgba(255,255,255,.08) 1px, transparent 1px); background-size: 28px 28px; }
        @keyframes float { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(-12px) } }
        @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.4 } 100% { transform: scale(1.8); opacity: 0 } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes shimmer { 0% { background-position: -200% center } 100% { background-position: 200% center } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delay { animation: float 6s ease-in-out 2s infinite; }
        .animate-slide-up { animation: slide-up 0.7s ease forwards; }
        .animate-fade-in { animation: fade-in 1s ease forwards; }
        .shimmer-text { background: linear-gradient(90deg, #f97316, #fbbf24, #f97316); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmer 3s linear infinite; }
        .hero-glow { background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(249,115,22,0.18) 0%, transparent 70%); }
        .pricing-shine { background: linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(251,191,36,0.08) 50%, rgba(249,115,22,0.12) 100%); border: 1px solid rgba(249,115,22,0.35); }
      `}</style>

      <Navbar />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 hero-glow" />
        <div className="absolute inset-0 grid-bg opacity-100" />
        <GlowOrb className="top-1/4 left-1/2 -translate-x-1/2 w-175 h-125 bg-orange-500/10" />
        <GlowOrb className="bottom-0 left-0 w-100 h-100 bg-orange-900/10" />
        <GlowOrb className="top-0 right-0 w-75 h-75 bg-yellow-800/8" />

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Badge */}
          <div className="animate-slide-up" style={{ animationDelay: "0ms" }}>
            <Pill className="border-[#f97316]/30 bg-[#f97316]/8 text-[#f97316] mb-8">
              <Zap className="w-3 h-3" />
              All-in-one Gym Management Platform
            </Pill>
          </div>

          {/* Headline */}
          <h1 className="font-display animate-slide-up" style={{ animationDelay: "100ms", fontSize: "clamp(2.8rem, 7vw, 5.5rem)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em" }}>
            The smarter way to<br />
            <span className="shimmer-text">run your gym</span>
          </h1>

          <p className="animate-slide-up mt-6 text-white/50 leading-relaxed max-w-2xl mx-auto"
            style={{ animationDelay: "200ms", fontSize: "clamp(1rem, 2vw, 1.2rem)" }}>
            Members, trainers, workouts, nutrition, billing, expenses, lockers, supplements and analytics —
            unified in one powerful platform with a native mobile app for everyone.
          </p>

          {/* CTAs */}
          <div className="animate-slide-up mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            style={{ animationDelay: "300ms" }}>
            <Link href="/signup"
              className="group flex items-center gap-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold px-8 py-4 rounded-2xl transition-all text-sm shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105">
              Start Free — No Card Needed
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#how-it-works"
              className="flex items-center gap-2 border border-white/12 text-white/60 hover:text-white hover:border-white/25 font-medium px-8 py-4 rounded-2xl transition-all text-sm hover:bg-white/3">
              See how it works
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>

          <p className="animate-fade-in mt-5 text-white/25 text-xs" style={{ animationDelay: "600ms" }}>
            Free 30-day trial · Android & iOS app · Cancel anytime
          </p>

          {/* Feature tags row */}
          <div className="animate-fade-in mt-14 flex flex-wrap justify-center gap-2" style={{ animationDelay: "500ms" }}>
            {[
              { icon: Users,         label: "Member CRM"       },
              { icon: ClipboardList, label: "Workout Plans"     },
              { icon: UtensilsCrossed, label: "Diet Plans"      },
              { icon: CreditCard,    label: "Payments"          },
              { icon: Bell,          label: "Push Notifications"},
              { icon: BarChart3,     label: "Analytics"         },
              { icon: Lock,          label: "Locker Mgmt"       },
              { icon: Package,       label: "Supplements"       },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-full px-4 py-2 text-xs text-white/55 hover:text-white/80 hover:border-white/16 transition-all">
                <Icon className="w-3.5 h-3.5 text-[#f97316]" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-5 h-5 text-white/20" />
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────────────── */}
      <section ref={statsRef.ref} className="py-20 px-6 border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-[#f97316]/3 to-transparent" />
        <div className="max-w-5xl mx-auto relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <StatTicker target={100}    suffix="+"  label="Gyms Using GymStack"  inView={statsRef.inView} delay={0}   />
            <StatTicker target={10000}  suffix="+"  label="Members Managed"       inView={statsRef.inView} delay={150} />
            <StatTicker target={99}     suffix="%"  label="Uptime Guarantee"      inView={statsRef.inView} delay={300} />
            <StatTicker target={3}      suffix=" platforms" label="Web · Android · iOS" inView={statsRef.inView} delay={450} />
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="features" ref={featuresRef.ref} className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <SectionLabel>Everything you need</SectionLabel>
            <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-5" style={{ letterSpacing: "-0.03em" }}>
              One platform.<br /><span className="text-gradient">Every feature.</span>
            </h2>
            <p className="text-white/45 text-lg max-w-xl mx-auto">
              Stop juggling spreadsheets, WhatsApp groups and paper registers.
              GymStack replaces all of it — web and mobile.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} index={i} inView={featuresRef.inView} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how-it-works" ref={howRef.ref} className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 dot-bg opacity-40" />
        <GlowOrb className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-100 bg-orange-500/6" />

        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-20">
            <SectionLabel>Simple setup</SectionLabel>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4" style={{ letterSpacing: "-0.03em" }}>
              Up and running<br />in minutes
            </h2>
            <p className="text-white/45 text-lg">No technical knowledge needed. Just follow 4 steps.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connector */}
            <div className="hidden md:block absolute top-11 left-[13%] right-[13%] h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.4), rgba(249,115,22,0.4), transparent)" }} />

            {STEPS.map(({ n, icon: Icon, title, desc }, i) => (
              <div key={n}
                className="text-center relative"
                style={{
                  opacity:    howRef.inView ? 1 : 0,
                  transform:  howRef.inView ? "translateY(0)" : "translateY(20px)",
                  transition: `opacity 0.6s ease ${i * 120}ms, transform 0.6s ease ${i * 120}ms`,
                }}>
                <div className="relative inline-block mb-6">
                  <div className="w-22 h-22 rounded-[28px] bg-linear-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center mx-auto shadow-2xl shadow-orange-500/30 relative z-10">
                    <Icon className="w-9 h-9 text-white" />
                  </div>
                  <div className="absolute inset-0 rounded-[28px] bg-[#f97316] opacity-20 scale-110 blur-lg z-0" />
                </div>
                <div className="text-[#f97316]/50 text-xs font-mono font-bold mb-2 tracking-widest">{n}</div>
                <h3 className="text-white font-display font-bold text-base mb-2">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ───────────────────────────────────────────────────────────── */}
      <section ref={rolesRef.ref} className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <SectionLabel>Built for everyone</SectionLabel>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4" style={{ letterSpacing: "-0.03em" }}>
              A perfect experience<br />for every role
            </h2>
            <p className="text-white/45 text-lg max-w-xl mx-auto">
              Owners, trainers, and members each get a tailored dashboard — on web and mobile.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {ROLES.map(({ icon: Icon, label, title, accent, bg, border, points }, i) => (
              <div key={label}
                className={`rounded-3xl border p-8 bg-linear-to-b ${bg} ${border} relative overflow-hidden group transition-all duration-500 hover:scale-[1.02]`}
                style={{
                  opacity:    rolesRef.inView ? 1 : 0,
                  transform:  rolesRef.inView ? "translateY(0)" : "translateY(32px)",
                  transition: `opacity 0.6s ease ${i * 150}ms, transform 0.6s ease ${i * 150}ms`,
                }}>
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 blur-2xl -translate-y-1/2 translate-x-1/2"
                  style={{ backgroundColor: accent }} />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${accent}20` }}>
                      <Icon className="w-6 h-6" style={{ color: accent }} />
                    </div>
                    <Pill className={`text-[10px] text-accent border-${accent}30 bg-${accent}12`}>
                      {label}
                    </Pill>
                  </div>
                  <h3 className="text-xl font-display font-bold text-white mt-4 mb-6 leading-tight">{title}</h3>
                  <ul className="space-y-3">
                    {points.map(pt => (
                      <li key={pt} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: `${accent}20` }}>
                          <CheckCircle className="w-3 h-3" style={{ color: accent }} />
                        </div>
                        <span className="text-white/55 text-sm leading-relaxed">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOBILE APP ──────────────────────────────────────────────────────── */}
      <section id="app" ref={appRef.ref} className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 dot-bg opacity-30" />
        <GlowOrb className="top-1/2 left-0 -translate-y-1/2 w-125 h-125 bg-orange-500/8" />
        <GlowOrb className="top-1/2 right-0 -translate-y-1/2 w-100 h-100 bg-blue-500/6" />

        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — text */}
            <div style={{
              opacity:    appRef.inView ? 1 : 0,
              transform:  appRef.inView ? "translateX(0)" : "translateX(-30px)",
              transition: "opacity 0.7s ease, transform 0.7s ease",
            }}>
              <SectionLabel>Mobile App</SectionLabel>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-5 leading-tight" style={{ letterSpacing: "-0.03em" }}>
                Your gym,<br />
                <span className="text-gradient">in your pocket</span>
              </h2>
              <p className="text-white/50 text-lg leading-relaxed mb-8">
                GymStack is available as a native app for Android and iOS.
                Members check workouts, track diet, view payments and get push notifications
                in real time. Owners and trainers get full dashboards on the go.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  { icon: Bell,      title: "Real-time push notifications",    desc: "Expiry alerts, payment reminders, announcements — delivered instantly." },
                  { icon: Activity,  title: "Full dashboard for every role",    desc: "Owners, trainers, and members each get their complete toolset." },
                  { icon: Globe,     title: "Works offline",                    desc: "View your workouts and diet plans even without an internet connection." },
                  { icon: Shield,    title: "Secure & fast",                    desc: "JWT auth, keychain token storage, and encrypted communication." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4 p-4 rounded-2xl border border-white/6 bg-white/3 hover:border-white/12 hover:bg-white/5 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-[#f97316]/15 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#f97316]" />
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm mb-0.5">{title}</div>
                      <div className="text-white/40 text-xs leading-relaxed">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Download buttons */}
              <div className="flex flex-wrap gap-4">
                <button className="group flex items-center gap-3 bg-white/6 hover:bg-white/10 border border-white/12 hover:border-white/25 rounded-2xl px-6 py-4 transition-all">
                  <Play className="w-6 h-6 text-white fill-white" />
                  <div className="text-left">
                    <div className="text-white/40 text-[10px] uppercase tracking-wider">Coming soon on</div>
                    <div className="text-white font-bold text-sm">Google Play</div>
                  </div>
                </button>
                <button className="group flex items-center gap-3 bg-white/6 hover:bg-white/10 border border-white/12 hover:border-white/25 rounded-2xl px-6 py-4 transition-all">
                  <Apple className="w-6 h-6 text-white" />
                  <div className="text-left">
                    <div className="text-white/40 text-[10px] uppercase tracking-wider">Coming soon on</div>
                    <div className="text-white font-bold text-sm">App Store</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Right — mock phone */}
            <div
              className="flex items-center justify-center"
              style={{
                opacity:    appRef.inView ? 1 : 0,
                transform:  appRef.inView ? "translateX(0)" : "translateX(30px)",
                transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
              }}>
              <div className="relative animate-float">
                {/* Phone frame */}
                <div className="w-70 h-140 rounded-[44px] border-2 border-white/15 bg-linear-to-b from-[#111827] to-[#0d1117] shadow-2xl shadow-black/60 overflow-hidden relative">
                  {/* Status bar */}
                  <div className="h-12 bg-[#111827] flex items-center justify-between px-7 pt-2">
                    <span className="text-white/50 text-[11px] font-medium">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-2 rounded-sm border border-white/30 relative">
                        <div className="absolute inset-0.5 right-0 bg-white/60 rounded-sm w-2/3" />
                      </div>
                    </div>
                  </div>
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#111827] rounded-b-3xl" />

                  {/* App content mockup — Owner Dashboard */}
                  <div className="px-5 pt-2 pb-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-white/40 text-[11px]">Good morning 👋</div>
                        <div className="text-white font-bold text-base font-display">SR Fitness Club</div>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center">
                        <Building2 className="w-4.5 h-4.5 text-white" />
                      </div>
                    </div>

                    {/* Revenue card */}
                    <div className="rounded-2xl p-4 mb-3 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                      <div className="text-white/70 text-[10px] mb-1">Monthly Revenue</div>
                      <div className="text-white font-bold text-lg">₹1,24,500</div>
                      <div className="text-white/70 text-[10px] mt-1 flex items-center gap-1">
                        <span>↑ 18% vs last month</span>
                      </div>
                      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: "Members",    value: "142", icon: Users       },
                        { label: "Check-ins",  value: "38",  icon: Activity    },
                        { label: "Expiring",   value: "5",   icon: AlertTriangle },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="rounded-xl bg-white/5 border border-white/8 p-2.5 text-center">
                          <Icon className="w-3.5 h-3.5 text-[#f97316] mx-auto mb-1" />
                          <div className="text-white font-bold text-sm">{value}</div>
                          <div className="text-white/35 text-[10px]">{label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Recent payments */}
                    <div className="rounded-xl bg-white/5 border border-white/8 p-3">
                      <div className="text-white/40 text-[10px] mb-2">RECENT PAYMENTS</div>
                      {[
                        { name: "Amit Sharma",  amount: "₹2,000", plan: "Monthly" },
                        { name: "Priya Mehta",  amount: "₹5,500", plan: "Quarterly" },
                        { name: "Rohan Gupta",  amount: "₹2,000", plan: "Monthly" },
                      ].map(({ name, amount, plan }) => (
                        <div key={name} className="flex items-center justify-between py-1">
                          <div>
                            <div className="text-white/75 text-[11px] font-medium">{name}</div>
                            <div className="text-white/30 text-[9px]">{plan}</div>
                          </div>
                          <div className="text-[#10b981] text-[11px] font-bold">{amount}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom nav */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#111827] border-t border-white/8 flex items-center justify-around px-4">
                    {[LayoutDashboard, Users, ClipboardList, Bell].map((Icon, i) => (
                      <div key={i} className={`flex flex-col items-center gap-1 ${i === 0 ? "opacity-100" : "opacity-35"}`}>
                        <Icon className={`w-5 h-5 ${i === 0 ? "text-[#f97316]" : "text-white/50"}`} />
                        {i === 0 && <div className="w-1 h-1 rounded-full bg-[#f97316]" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating notification */}
                <div className="absolute -right-8 top-16 bg-[#1a2234] border border-white/10 rounded-2xl p-3 shadow-2xl w-52 animate-float-delay">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#f97316]/20 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4 text-[#f97316]" />
                    </div>
                    <div>
                      <div className="text-white text-[11px] font-bold">Payment Received</div>
                      <div className="text-white/40 text-[10px]">₹2,000 — Pro Plan</div>
                    </div>
                  </div>
                </div>

                {/* Floating stat */}
                <div className="absolute -left-10 bottom-24 bg-[#1a2234] border border-white/10 rounded-2xl p-3 shadow-2xl animate-float">
                  <div className="text-[#10b981] font-black text-xl">↑ 24%</div>
                  <div className="text-white/40 text-[10px]">Revenue this month</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section id="pricing" ref={pricingRef.ref} className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Transparent pricing</SectionLabel>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4" style={{ letterSpacing: "-0.03em" }}>
              Plans that grow with you
            </h2>
            <p className="text-white/45 text-lg mb-8">Start free. Upgrade when you're ready. No hidden fees ever.</p>
          </div>

          {/* Free plan banner */}
          <div
            className="mb-6 rounded-2xl border border-white/8 bg-white/2 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{
              opacity:    pricingRef.inView ? 1 : 0,
              transform:  pricingRef.inView ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 0.5s ease 0ms, transform 0.5s ease 0ms",
            }}
          >
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-white font-display font-bold text-lg">Free</h3>
                <span className="text-xs font-semibold bg-white/8 text-white/50 px-2 py-0.5 rounded-full">1 Month</span>
              </div>
              <p className="text-white/40 text-sm">Try everything that are available in Basic Plan at zero cost — no credit card required.</p>
            </div>
            <div className="flex items-center gap-6 shrink-0">
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold text-white leading-none">₹0</span>
                <span className="text-white/35 text-sm mb-0.5">/ 1 month</span>
              </div>
              <Link href="/signup" className="px-5 py-2.5 rounded-xl border border-white/12 text-white/60 hover:text-white hover:border-white/25 hover:bg-white/4 text-sm font-bold transition-all whitespace-nowrap">
                Start Free
              </Link>
            </div>
          </div>

          {/* Paid tiers */}
          <div className="grid sm:grid-cols-3 gap-5">
            {TIERS.map((tier) => {
              const selectedInterval = durations[tier.key]
              const price            = tier.prices[selectedInterval]
              const selectedDuration = DURATIONS.find(d => d.interval === selectedInterval)!
              const isPopular        = tier.key === "pro"

              return (
                <div
                  key={tier.key}
                  className={`relative bg-linear-to-br ${tier.gradient} border rounded-2xl flex flex-col transition-all hover:border-white/15`}
                  style={{
                    opacity:    pricingRef.inView ? 1 : 0,
                    transform:  pricingRef.inView ? "translateY(0)" : "translateY(24px)",
                    transition: `opacity 0.5s ease 0ms, transform 0.5s ease 0ms`,
                  }}
                >
                  {/* Top badge — centered */}
                  {tier.badge && (
                    <div className="absolute -top-3 inset-x-0 flex justify-center w-full m-auto pointer-events-none">
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap ${tier.badgeClass}`}>
                        {tier.badge}
                      </span>
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
                              <span className={`text-[9px] font-bold leading-tight mt-0.5 ${isSelected ? "text-green-400" : "text-green-500/70"}`}>{sav}</span>
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
                    <Link href="/signup"
                      className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        isPopular
                          ? "bg-linear-to-r from-primary to-orange-400 text-white hover:opacity-90 shadow-lg shadow-primary/20"
                          : tier.key === "enterprise"
                            ? "bg-purple-500 text-white hover:opacity-90"
                            : "bg-white/8 hover:bg-white/15 text-white border border-white/10"
                      }`}>
                      <CreditCard className="w-4 h-4" /> Subscribe — ₹{price.toLocaleString("en-IN")}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section id="faq" ref={faqRef.ref} className="py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>Got questions?</SectionLabel>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4" style={{ letterSpacing: "-0.03em" }}>
              Frequently asked
            </h2>
            <p className="text-white/45">Everything you need to know before getting started.</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FAQItem key={faq.q} {...faq} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-4xl overflow-hidden p-1"
            style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.5), rgba(251,191,36,0.3), rgba(249,115,22,0.5))" }}>
            <div className="rounded-[28px] overflow-hidden relative"
              style={{ background: "linear-gradient(135deg, #1a0f05 0%, #0d1117 50%, #0a0e18 100%)" }}>
              <div className="absolute inset-0"
                style={{ background: "radial-gradient(ellipse 80% 80% at 50% -20%, rgba(249,115,22,0.25), transparent)" }} />
              <div className="absolute inset-0 dot-bg opacity-30" />
              <GlowOrb className="top-0 left-1/4 w-100 h-75 bg-orange-500/15" />
              <GlowOrb className="bottom-0 right-1/4 w-75 h-75 bg-yellow-600/10" />

              <div className="relative z-10 text-center py-24 px-8">
                <Pill className="border-[#f97316]/30 bg-[#f97316]/10 text-[#f97316] mb-6">
                  <Zap className="w-3 h-3" />
                  Start your free trial today
                </Pill>
                <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-5" style={{ letterSpacing: "-0.03em" }}>
                  Ready to level up<br />
                  <span className="text-gradient">your gym business?</span>
                </h2>
                <p className="text-white/55 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
                  Join hundreds of gym owners who trust GymStack to run their business.
                  Web + mobile app. Start free — no credit card needed.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/signup"
                    className="group flex items-center gap-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold px-10 py-4 rounded-2xl transition-all text-base shadow-2xl shadow-orange-500/40 hover:scale-105 hover:shadow-orange-500/60">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link href="/login"
                    className="flex items-center gap-2 border-2 border-white/15 text-white/70 hover:border-white/35 hover:text-white font-semibold px-8 py-4 rounded-2xl transition-all text-base hover:bg-white/4">
                    Sign In
                  </Link>
                </div>
                <p className="mt-6 text-white/25 text-sm">Free 30-day trial · Android & iOS · Cancel anytime</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <img src="../logo.png" alt="Logo" className="w-15 h-15"/>
              </div>
              <p className="text-white/35 text-sm leading-relaxed max-w-xs">
                The all-in-one gym management platform for modern gym owners.
                Web dashboard + native Android & iOS app.
              </p>
            </div>

            <div>
              <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2.5">
                {["Features", "Pricing", "Mobile App", "How it Works"].map(item => (
                  <li key={item}>
                    <a href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                      className="text-sm text-white/35 hover:text-white/70 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Privacy Policy", href: "/legal/privacy" },
                  { label: "Terms of Service", href: "/legal/terms" },
                  { label: "Cookie Policy", href: "/legal/cookies" },
                  { label: "Contact", href: "/legal/contact" },
                ].map(item => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-white/35 hover:text-white/70 transition-colors">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/20 text-sm">© 2025 GymStack. All rights reserved.</p>
            <div className="flex items-center gap-2 text-white/20 text-xs">
              <MapPin className="w-3 h-3" />
              Made in India
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// needed for phone mockup icons
function LayoutDashboard(props: any) { return <Activity {...props} /> }
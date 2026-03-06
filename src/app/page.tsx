// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         />
//         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             To get started, edit the page.tsx file.
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             Looking for a starting point or more instructions? Head over to{" "}
//             <a
//               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Templates
//             </a>{" "}
//             or the{" "}
//             <a
//               href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Learning
//             </a>{" "}
//             center.
//           </p>
//         </div>
//         <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
//           <a
//             className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={16}
//               height={16}
//             />
//             Deploy Now
//           </a>
//           <a
//             className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Documentation
//           </a>
//         </div>
//       </main>
//     </div>
//   );
// }


"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  Dumbbell, ArrowRight, CheckCircle, Users, ClipboardList,
  UtensilsCrossed, BarChart3, Bell, CreditCard, Calendar,
  ShieldCheck, Zap, Star, ChevronDown, Menu, X, TrendingUp,
  Wallet, QrCode, Trophy
} from "lucide-react"

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function useCounter(target: number, inView: boolean, duration = 1800) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration])
  return count
}

// ── Data ──────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Users,
    title: "Member Management",
    desc: "Add members manually or let them self-register. Track membership plans, renewals, attendance history, and health records — all in one place.",
    tag: "Core",
  },
  {
    icon: ClipboardList,
    title: "Workout Plans",
    desc: "Create personalised weekly workout routines for each member. Assign exercises, sets, reps and rest periods. Members follow plans on their mobile dashboard.",
    tag: "Training",
  },
  {
    icon: UtensilsCrossed,
    title: "Diet & Nutrition",
    desc: "Design macro-balanced meal plans tailored to each member's goals. Track calorie targets, nutrition breakdowns, and dietary preferences effortlessly.",
    tag: "Nutrition",
  },
  {
    icon: CreditCard,
    title: "Billing & Payments",
    desc: "Automate fee collection, generate invoices, and track payment history. Support multiple subscription plans with built-in expiry reminders.",
    tag: "Finance",
  },
  {
    icon: Calendar,
    title: "Class Scheduling",
    desc: "Schedule group classes, personal training sessions, and special events. Members can book slots directly from their dashboard.",
    tag: "Scheduling",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    desc: "Get real-time insights on revenue, member retention, attendance trends, and trainer performance. Make data-driven decisions every day.",
    tag: "Insights",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    desc: "Automated alerts for membership expiry, payment dues, class reminders, and gym announcements — delivered to the right person at the right time.",
    tag: "Automation",
  },
  {
    icon: Wallet,
    title: "Wallet & Referrals",
    desc: "Built-in wallet system for members to store credits. Reward referrals automatically with cashback — a viral growth engine built into your gym.",
    tag: "Growth",
  },
  {
    icon: Trophy,
    title: "Trainer Portal",
    desc: "Dedicated dashboards for trainers to manage their assigned members, track workout progress, and communicate diet and training updates.",
    tag: "Trainers",
  },
]

const roles = [
  {
    icon: ShieldCheck,
    title: "Gym Owners",
    color: "text-orange-400",
    border: "border-orange-500/20",
    bg: "bg-orange-500/5",
    points: [
      "Full gym setup and configuration",
      "Multi-gym management from one account",
      "Revenue and retention analytics",
      "Add trainers and manage their access",
      "Automated billing and invoicing",
      "Custom membership plan creation",
    ],
  },
  {
    icon: Dumbbell,
    title: "Trainers",
    color: "text-blue-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
    points: [
      "View and manage assigned members",
      "Create and update workout plans",
      "Design personalised diet plans",
      "Track member progress over time",
      "Class and session scheduling",
      "Direct member communication",
    ],
  },
  {
    icon: Star,
    title: "Members",
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
    points: [
      "Personal dashboard with live stats",
      "View daily workout and diet plans",
      "Book classes and training sessions",
      "Attendance and payment history",
      "Wallet credits and referral rewards",
      "Gym announcements and notifications",
    ],
  },
]

const plans = [
  {
    name: "Starter",
    price: "₹999",
    period: "/month",
    desc: "Perfect for small gyms just getting started.",
    highlight: false,
    features: [
      "Up to 100 members",
      "1 trainer account",
      "Member & payment management",
      "Basic analytics",
      "Email support",
    ],
  },
  {
    name: "Growth",
    price: "₹2,499",
    period: "/month",
    desc: "For growing gyms that need full control.",
    highlight: true,
    features: [
      "Up to 500 members",
      "Up to 10 trainer accounts",
      "Workout & diet plan builder",
      "Advanced analytics & reports",
      "Wallet & referral system",
      "Class scheduling",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "Multi-location chains and franchises.",
    highlight: false,
    features: [
      "Unlimited members",
      "Unlimited trainers",
      "Multi-gym management",
      "White-label option",
      "Dedicated account manager",
      "Custom integrations",
      "SLA-backed support",
    ],
  },
]

const faqs = [
  {
    q: "Can I manage multiple gym locations from one account?",
    a: "Yes. The Growth and Enterprise plans support multiple gyms under a single owner account. Switch between locations from one unified dashboard.",
  },
  {
    q: "How does the member self-registration work?",
    a: "Members can sign up directly on GymStack, enter a referral code or gym code, and get linked to your gym automatically. You approve or auto-approve based on your settings.",
  },
  {
    q: "Is my gym data secure?",
    a: "Absolutely. All data is encrypted at rest and in transit. We use PostgreSQL on Supabase with row-level security, and authentication is handled by NextAuth with industry-standard JWT tokens.",
  },
  {
    q: "Can members access GymStack on mobile?",
    a: "GymStack is fully responsive and works on any device. A dedicated mobile app is on our roadmap for Q3 2025.",
  },
  {
    q: "What payment methods are supported?",
    a: "GymStack supports UPI, credit/debit cards, net banking, and wallet credits for member fee collection. Integration with Razorpay is available on Growth and above.",
  },
]

// ── Components ────────────────────────────────────────────────────────────────

function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-[hsl(220_25%_6%/0.95)] backdrop-blur-xl border-b border-white/5 shadow-xl" : ""
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2 bg-gradient-primary rounded-xl">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold text-white">GymStack</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {["Features", "How it Works", "Pricing", "FAQ"].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
              className="text-sm text-white/55 hover:text-white transition-colors">
              {item}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2">
            Login
          </Link>
          <Link href="/signup"
            className="text-sm font-semibold bg-gradient-primary text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
            Get Started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-white/60 hover:text-white">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[hsl(220_25%_8%)] border-t border-white/5 px-6 py-4 space-y-4">
          {["Features", "How it Works", "Pricing", "FAQ"].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
              onClick={() => setOpen(false)}
              className="block text-sm text-white/60 hover:text-white transition-colors py-1">
              {item}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login" onClick={() => setOpen(false)}
              className="text-center text-sm text-white/60 border border-white/10 rounded-xl py-2.5 hover:border-white/20 transition-colors">
              Login
            </Link>
            <Link href="/signup" onClick={() => setOpen(false)}
              className="text-center text-sm font-semibold bg-gradient-primary text-white rounded-xl py-2.5 hover:opacity-90 transition-opacity">
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

function StatCounter({ target, suffix, label, inView }: { target: number; suffix: string; label: string; inView: boolean }) {
  const count = useCounter(target, inView)
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-display font-bold text-gradient mb-2">
        {count.toLocaleString("en-IN")}{suffix}
      </div>
      <div className="text-white/45 text-sm">{label}</div>
    </div>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${open ? "border-primary/30 bg-primary/5" : "border-white/8 bg-white/3 hover:border-white/15"}`}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left gap-4">
        <span className="text-white/90 font-medium text-sm leading-snug">{q}</span>
        <ChevronDown className={`w-4 h-4 text-white/40 shrink-0 transition-transform duration-300 ${open ? "rotate-180 text-primary" : ""}`} />
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-white/50 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const statsSection = useInView(0.3)
  const featuresSection = useInView(0.1)
  const rolesSection = useInView(0.1)
  const pricingSection = useInView(0.1)
  const faqSection = useInView(0.1)

  return (
    <div className="min-h-screen bg-gradient-dark text-white overflow-x-hidden">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-200 h-200 rounded-full bg-primary/8 blur-[160px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-100 h-100 rounded-full bg-orange-800/10 blur-[120px] pointer-events-none" />

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 text-xs text-white/60">
            <Zap className="w-3 h-3 text-primary" />
            All-in-one gym management platform
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-[1.05] tracking-tight mb-6">
            Transform Your<br />
            <span className="text-gradient">Gym Business</span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 leading-relaxed max-w-2xl mx-auto mb-10">
            Manage members, trainers, workouts, diet plans, payments and analytics
            — all from one powerful dashboard. Built for modern gyms that want to grow.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup"
              className="flex items-center gap-2 bg-gradient-primary text-white font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-opacity text-sm shadow-lg shadow-orange-500/20">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#how-it-works"
              className="flex items-center gap-2 border border-white/15 text-white/70 hover:text-white hover:border-white/30 font-medium px-8 py-4 rounded-xl transition-all text-sm">
              See how it works
            </a>
          </div>

          {/* Trust */}
          <p className="mt-6 text-white/30 text-xs">No credit card required · Free 14-day trial · Cancel anytime</p>
        </div>

        {/* Feature preview cards */}
        <div className="relative z-10 w-full max-w-5xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-3 px-2">
          {[
            { icon: Users, label: "Manage Members" },
            { icon: ClipboardList, label: "Workout Plans" },
            { icon: UtensilsCrossed, label: "Diet Plans" },
            { icon: BarChart3, label: "Analytics" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="glass rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/15 rounded-lg shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-white/80">{label}</span>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="relative z-10 mt-16 animate-bounce">
          <ChevronDown className="w-5 h-5 text-white/20" />
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsSection.ref} className="py-24 px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          <StatCounter target={10000} suffix="+" label="Active Gyms" inView={statsSection.inView} />
          <StatCounter target={500000} suffix="+" label="Members" inView={statsSection.inView} />
          <StatCounter target={50000} suffix="+" label="Trainers" inView={statsSection.inView} />
          <StatCounter target={98} suffix="%" label="Satisfaction Rate" inView={statsSection.inView} />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" ref={featuresSection.ref} className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Everything you need</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              One platform.<br />Every feature.
            </h2>
            <p className="text-white/45 text-lg max-w-xl mx-auto">
              Stop juggling spreadsheets, WhatsApp groups, and paper registers. GymStack replaces all of it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, tag }, i) => (
              <div key={title}
                className={`glass rounded-2xl p-6 group hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 ${
                  featuresSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
                style={{ transitionDelay: featuresSection.inView ? `${i * 60}ms` : "0ms", transitionDuration: "500ms", transitionProperty: "opacity, transform", transitionTimingFunction: "ease" }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-white/30 border border-white/10 rounded-full px-2.5 py-0.5">{tag}</span>
                </div>
                <h3 className="text-white font-display font-semibold mb-2">{title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-28 px-6 bg-white/2">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Simple setup</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Up and running in minutes</h2>
            <p className="text-white/45 text-lg">No technical knowledge required. Just follow these steps.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />

            {[
              { step: "01", icon: ShieldCheck, title: "Create Account", desc: "Sign up as a gym owner in under 2 minutes." },
              { step: "02", icon: Dumbbell, title: "Set Up Your Gym", desc: "Add your gym details, plans, and trainer accounts." },
              { step: "03", icon: Users, title: "Add Members", desc: "Import existing members or let them self-register." },
              { step: "04", icon: TrendingUp, title: "Start Growing", desc: "Track everything and make data-driven decisions." },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-primary mx-auto mb-5 flex items-center justify-center shadow-lg shadow-orange-500/20 relative z-10">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-primary/40 text-xs font-mono font-bold mb-1">{step}</div>
                <h3 className="text-white font-display font-semibold mb-2">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section ref={rolesSection.ref} className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Built for everyone</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">A dashboard for every role</h2>
            <p className="text-white/45 text-lg max-w-xl mx-auto">
              Owners, trainers, and members each get a tailored experience with exactly what they need.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {roles.map(({ icon: Icon, title, color, border, bg, points }, i) => (
              <div key={title}
                className={`rounded-2xl border p-7 ${border} ${bg} transition-all duration-500 ${
                  rolesSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 120}ms`, transitionDuration: "500ms", transitionProperty: "opacity, transform", transitionTimingFunction: "ease" }}>
                <div className={`inline-flex p-3 rounded-xl mb-5 bg-white/5`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className="text-xl font-display font-bold text-white mb-5">{title}</h3>
                <ul className="space-y-3">
                  {points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5">
                      <CheckCircle className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
                      <span className="text-white/60 text-sm">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" ref={pricingSection.ref} className="py-28 px-6 bg-white/2">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Simple pricing</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Plans that grow with you</h2>
            <p className="text-white/45 text-lg">Start free. Upgrade when you are ready. No hidden fees.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map(({ name, price, period, desc, highlight, features: planFeatures }, i) => (
              <div key={name}
                className={`rounded-2xl p-7 border transition-all duration-500 relative ${
                  highlight
                    ? "border-primary/50 bg-linear-to-b from-primary/10 to-primary/5 shadow-2xl shadow-primary/10 scale-105"
                    : "border-white/8 bg-white/3"
                } ${pricingSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${i * 100}ms`, transitionDuration: "500ms", transitionProperty: "opacity, transform", transitionTimingFunction: "ease" }}>
                {highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-display font-bold text-white mb-1">{name}</h3>
                <p className="text-white/40 text-xs mb-5">{desc}</p>
                <div className="flex items-end gap-1 mb-7">
                  <span className="text-4xl font-display font-bold text-white">{price}</span>
                  {period && <span className="text-white/40 text-sm mb-1">{period}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {planFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-white/60 text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup"
                  className={`block text-center text-sm font-semibold py-3 rounded-xl transition-all ${
                    highlight
                      ? "bg-gradient-primary text-white hover:opacity-90 shadow-lg shadow-orange-500/20"
                      : "border border-white/15 text-white/70 hover:border-white/30 hover:text-white"
                  }`}>
                  {price === "Custom" ? "Contact Sales" : "Get Started Free"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" ref={faqSection.ref} className="py-28 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Got questions?</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Frequently asked</h2>
            <p className="text-white/45">Everything you need to know before getting started.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => <FAQItem key={faq.q} {...faq} />)}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-90" />
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
          <div className="relative z-10 text-center py-20 px-8">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Ready to level up your gym?
            </h2>
            <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
              Join thousands of gym owners who trust GymStack to run their business. Start your free trial today — no credit card needed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup"
                className="flex items-center gap-2 bg-white text-orange-600 font-bold px-8 py-4 rounded-xl hover:bg-white/90 transition-colors text-sm shadow-xl">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login"
                className="flex items-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:border-white/60 transition-colors text-sm">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-primary rounded-xl">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-display font-bold text-white">GymStack</span>
            </div>

            <div className="flex items-center gap-8 text-sm text-white/35">
              {["Features", "Pricing", "Privacy Policy", "Terms of Service"].map((item) => (
                <a key={item} href="#" className="hover:text-white/70 transition-colors">{item}</a>
              ))}
            </div>

            <p className="text-white/25 text-sm">© 2025 GymStack. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
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


// "use client"

// import { useEffect, useRef, useState } from "react"
// import Link from "next/link"
// import {
//   Dumbbell, ArrowRight, CheckCircle, Users, ClipboardList,
//   UtensilsCrossed, BarChart3, Bell, CreditCard, Calendar,
//   ShieldCheck, Zap, Star, ChevronDown, Menu, X, TrendingUp,
//   Wallet, QrCode, Trophy
// } from "lucide-react"

// // ── Hooks ─────────────────────────────────────────────────────────────────────

// function useInView(threshold = 0.15) {
//   const ref = useRef<HTMLDivElement>(null)
//   const [inView, setInView] = useState(false)
//   useEffect(() => {
//     const el = ref.current
//     if (!el) return
//     const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
//     obs.observe(el)
//     return () => obs.disconnect()
//   }, [threshold])
//   return { ref, inView }
// }

// function useCounter(target: number, inView: boolean, duration = 1800) {
//   const [count, setCount] = useState(0)
//   useEffect(() => {
//     if (!inView) return
//     let start = 0
//     const step = target / (duration / 16)
//     const timer = setInterval(() => {
//       start += step
//       if (start >= target) { setCount(target); clearInterval(timer) }
//       else setCount(Math.floor(start))
//     }, 16)
//     return () => clearInterval(timer)
//   }, [inView, target, duration])
//   return count
// }

// // ── Data ──────────────────────────────────────────────────────────────────────

// const features = [
//   {
//     icon: Users,
//     title: "Member Management",
//     desc: "Add members manually or let them self-register. Track membership plans, renewals, attendance history, and health records — all in one place.",
//     tag: "Core",
//   },
//   {
//     icon: ClipboardList,
//     title: "Workout Plans",
//     desc: "Create personalised weekly workout routines for each member. Assign exercises, sets, reps and rest periods. Members follow plans on their mobile dashboard.",
//     tag: "Training",
//   },
//   {
//     icon: UtensilsCrossed,
//     title: "Diet & Nutrition",
//     desc: "Design macro-balanced meal plans tailored to each member's goals. Track calorie targets, nutrition breakdowns, and dietary preferences effortlessly.",
//     tag: "Nutrition",
//   },
//   {
//     icon: CreditCard,
//     title: "Billing & Payments",
//     desc: "Automate fee collection, generate invoices, and track payment history. Support multiple subscription plans with built-in expiry reminders.",
//     tag: "Finance",
//   },
//   {
//     icon: Calendar,
//     title: "Class Scheduling",
//     desc: "Schedule group classes, personal training sessions, and special events. Members can book slots directly from their dashboard.",
//     tag: "Scheduling",
//   },
//   {
//     icon: BarChart3,
//     title: "Analytics & Reports",
//     desc: "Get real-time insights on revenue, member retention, attendance trends, and trainer performance. Make data-driven decisions every day.",
//     tag: "Insights",
//   },
//   {
//     icon: Bell,
//     title: "Smart Notifications",
//     desc: "Automated alerts for membership expiry, payment dues, class reminders, and gym announcements — delivered to the right person at the right time.",
//     tag: "Automation",
//   },
//   {
//     icon: Wallet,
//     title: "Wallet & Referrals",
//     desc: "Built-in wallet system for members to store credits. Reward referrals automatically with cashback — a viral growth engine built into your gym.",
//     tag: "Growth",
//   },
//   {
//     icon: Trophy,
//     title: "Trainer Portal",
//     desc: "Dedicated dashboards for trainers to manage their assigned members, track workout progress, and communicate diet and training updates.",
//     tag: "Trainers",
//   },
// ]

// const roles = [
//   {
//     icon: ShieldCheck,
//     title: "Gym Owners",
//     color: "text-orange-400",
//     border: "border-orange-500/20",
//     bg: "bg-orange-500/5",
//     points: [
//       "Full gym setup and configuration",
//       "Multi-gym management from one account",
//       "Revenue and retention analytics",
//       "Add trainers and manage their access",
//       "Automated billing and invoicing",
//       "Custom membership plan creation",
//     ],
//   },
//   {
//     icon: Dumbbell,
//     title: "Trainers",
//     color: "text-blue-400",
//     border: "border-blue-500/20",
//     bg: "bg-blue-500/5",
//     points: [
//       "View and manage assigned members",
//       "Create and update workout plans",
//       "Design personalised diet plans",
//       "Track member progress over time",
//       "Class and session scheduling",
//       "Direct member communication",
//     ],
//   },
//   {
//     icon: Star,
//     title: "Members",
//     color: "text-emerald-400",
//     border: "border-emerald-500/20",
//     bg: "bg-emerald-500/5",
//     points: [
//       "Personal dashboard with live stats",
//       "View daily workout and diet plans",
//       "Book classes and training sessions",
//       "Attendance and payment history",
//       "Wallet credits and referral rewards",
//       "Gym announcements and notifications",
//     ],
//   },
// ]

// const plans = [
//   {
//     name: "Starter",
//     price: "₹999",
//     period: "/month",
//     desc: "Perfect for small gyms just getting started.",
//     highlight: false,
//     features: [
//       "Up to 100 members",
//       "1 trainer account",
//       "Member & payment management",
//       "Basic analytics",
//       "Email support",
//     ],
//   },
//   {
//     name: "Growth",
//     price: "₹2,499",
//     period: "/month",
//     desc: "For growing gyms that need full control.",
//     highlight: true,
//     features: [
//       "Up to 500 members",
//       "Up to 10 trainer accounts",
//       "Workout & diet plan builder",
//       "Advanced analytics & reports",
//       "Wallet & referral system",
//       "Class scheduling",
//       "Priority support",
//     ],
//   },
//   {
//     name: "Enterprise",
//     price: "Custom",
//     period: "",
//     desc: "Multi-location chains and franchises.",
//     highlight: false,
//     features: [
//       "Unlimited members",
//       "Unlimited trainers",
//       "Multi-gym management",
//       "White-label option",
//       "Dedicated account manager",
//       "Custom integrations",
//       "SLA-backed support",
//     ],
//   },
// ]

// const faqs = [
//   {
//     q: "Can I manage multiple gym locations from one account?",
//     a: "Yes. The Growth and Enterprise plans support multiple gyms under a single owner account. Switch between locations from one unified dashboard.",
//   },
//   {
//     q: "How does the member self-registration work?",
//     a: "Members can sign up directly on GymStack, enter a referral code or gym code, and get linked to your gym automatically. You approve or auto-approve based on your settings.",
//   },
//   {
//     q: "Is my gym data secure?",
//     a: "Absolutely. All data is encrypted at rest and in transit. We use PostgreSQL on Supabase with row-level security, and authentication is handled by NextAuth with industry-standard JWT tokens.",
//   },
//   {
//     q: "Can members access GymStack on mobile?",
//     a: "GymStack is fully responsive and works on any device. A dedicated mobile app is on our roadmap for Q3 2025.",
//   },
//   {
//     q: "What payment methods are supported?",
//     a: "GymStack supports UPI, credit/debit cards, net banking, and wallet credits for member fee collection. Integration with Razorpay is available on Growth and above.",
//   },
// ]

// // ── Components ────────────────────────────────────────────────────────────────

// function Navbar() {
//   const [open, setOpen] = useState(false)
//   const [scrolled, setScrolled] = useState(false)

//   useEffect(() => {
//     const fn = () => setScrolled(window.scrollY > 20)
//     window.addEventListener("scroll", fn)
//     return () => window.removeEventListener("scroll", fn)
//   }, [])

//   return (
//     <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
//       scrolled ? "bg-[hsl(220_25%_6%/0.95)] backdrop-blur-xl border-b border-white/5 shadow-xl" : ""
//     }`}>
//       <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
//         {/* Logo */}
//         <Link href="/" className="flex items-center gap-2.5 group">
//           <div className="p-2 bg-gradient-primary rounded-xl">
//             <Dumbbell className="w-5 h-5 text-white" />
//           </div>
//           <span className="text-xl font-display font-bold text-white">GymStack</span>
//         </Link>

//         {/* Desktop nav */}
//         <nav className="hidden md:flex items-center gap-8">
//           {["Features", "How it Works", "Pricing", "FAQ"].map((item) => (
//             <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
//               className="text-sm text-white/55 hover:text-white transition-colors">
//               {item}
//             </a>
//           ))}
//         </nav>

//         {/* CTA */}
//         <div className="hidden md:flex items-center gap-3">
//           <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2">
//             Login
//           </Link>
//           <Link href="/signup"
//             className="text-sm font-semibold bg-gradient-primary text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
//             Get Started <ArrowRight className="w-3.5 h-3.5" />
//           </Link>
//         </div>

//         {/* Mobile menu button */}
//         <button onClick={() => setOpen(!open)} className="md:hidden text-white/60 hover:text-white">
//           {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
//         </button>
//       </div>

//       {/* Mobile menu */}
//       {open && (
//         <div className="md:hidden bg-[hsl(220_25%_8%)] border-t border-white/5 px-6 py-4 space-y-4">
//           {["Features", "How it Works", "Pricing", "FAQ"].map((item) => (
//             <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
//               onClick={() => setOpen(false)}
//               className="block text-sm text-white/60 hover:text-white transition-colors py-1">
//               {item}
//             </a>
//           ))}
//           <div className="pt-2 flex flex-col gap-2">
//             <Link href="/login" onClick={() => setOpen(false)}
//               className="text-center text-sm text-white/60 border border-white/10 rounded-xl py-2.5 hover:border-white/20 transition-colors">
//               Login
//             </Link>
//             <Link href="/signup" onClick={() => setOpen(false)}
//               className="text-center text-sm font-semibold bg-gradient-primary text-white rounded-xl py-2.5 hover:opacity-90 transition-opacity">
//               Get Started Free
//             </Link>
//           </div>
//         </div>
//       )}
//     </header>
//   )
// }

// function StatCounter({ target, suffix, label, inView }: { target: number; suffix: string; label: string; inView: boolean }) {
//   const count = useCounter(target, inView)
//   return (
//     <div className="text-center">
//       <div className="text-4xl md:text-5xl font-display font-bold text-gradient mb-2">
//         {count.toLocaleString("en-IN")}{suffix}
//       </div>
//       <div className="text-white/45 text-sm">{label}</div>
//     </div>
//   )
// }

// function FAQItem({ q, a }: { q: string; a: string }) {
//   const [open, setOpen] = useState(false)
//   return (
//     <div className={`border rounded-xl overflow-hidden transition-colors ${open ? "border-primary/30 bg-primary/5" : "border-white/8 bg-white/3 hover:border-white/15"}`}>
//       <button onClick={() => setOpen(!open)}
//         className="w-full flex items-center justify-between px-6 py-5 text-left gap-4">
//         <span className="text-white/90 font-medium text-sm leading-snug">{q}</span>
//         <ChevronDown className={`w-4 h-4 text-white/40 shrink-0 transition-transform duration-300 ${open ? "rotate-180 text-primary" : ""}`} />
//       </button>
//       {open && (
//         <div className="px-6 pb-5">
//           <p className="text-white/50 text-sm leading-relaxed">{a}</p>
//         </div>
//       )}
//     </div>
//   )
// }

// // ── Page ──────────────────────────────────────────────────────────────────────

// export default function Home() {
//   const statsSection = useInView(0.3)
//   const featuresSection = useInView(0.1)
//   const rolesSection = useInView(0.1)
//   const pricingSection = useInView(0.1)
//   const faqSection = useInView(0.1)

//   return (
//     <div className="min-h-screen bg-gradient-dark text-white overflow-x-hidden">
//       <Navbar />

//       {/* ── HERO ── */}
//       <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-16 overflow-hidden">
//         {/* Background */}
//         <div className="absolute inset-0 bg-gradient-hero" />
//         <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-200 h-200 rounded-full bg-primary/8 blur-[160px] pointer-events-none" />
//         <div className="absolute bottom-0 right-0 w-100 h-100 rounded-full bg-orange-800/10 blur-[120px] pointer-events-none" />

//         {/* Subtle grid */}
//         <div className="absolute inset-0 opacity-[0.03]"
//           style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

//         <div className="relative z-10 max-w-4xl mx-auto">
//           {/* Badge */}
//           <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 text-xs text-white/60">
//             <Zap className="w-3 h-3 text-primary" />
//             All-in-one gym management platform
//           </div>

//           {/* Headline */}
//           <h1 className="text-5xl md:text-7xl font-display font-bold leading-[1.05] tracking-tight mb-6">
//             Transform Your<br />
//             <span className="text-gradient">Gym Business</span>
//           </h1>

//           <p className="text-lg md:text-xl text-white/50 leading-relaxed max-w-2xl mx-auto mb-10">
//             Manage members, trainers, workouts, diet plans, payments and analytics
//             — all from one powerful dashboard. Built for modern gyms that want to grow.
//           </p>

//           {/* CTAs */}
//           <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
//             <Link href="/signup"
//               className="flex items-center gap-2 bg-gradient-primary text-white font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-opacity text-sm shadow-lg shadow-orange-500/20">
//               Start Free Trial <ArrowRight className="w-4 h-4" />
//             </Link>
//             <a href="#how-it-works"
//               className="flex items-center gap-2 border border-white/15 text-white/70 hover:text-white hover:border-white/30 font-medium px-8 py-4 rounded-xl transition-all text-sm">
//               See how it works
//             </a>
//           </div>

//           {/* Trust */}
//           <p className="mt-6 text-white/30 text-xs">No credit card required · Free 14-day trial · Cancel anytime</p>
//         </div>

//         {/* Feature preview cards */}
//         <div className="relative z-10 w-full max-w-5xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-3 px-2">
//           {[
//             { icon: Users, label: "Manage Members" },
//             { icon: ClipboardList, label: "Workout Plans" },
//             { icon: UtensilsCrossed, label: "Diet Plans" },
//             { icon: BarChart3, label: "Analytics" },
//           ].map(({ icon: Icon, label }) => (
//             <div key={label} className="glass rounded-xl p-4 flex items-center gap-3">
//               <div className="p-2 bg-primary/15 rounded-lg shrink-0">
//                 <Icon className="w-4 h-4 text-primary" />
//               </div>
//               <span className="text-sm font-medium text-white/80">{label}</span>
//             </div>
//           ))}
//         </div>

//         {/* Scroll hint */}
//         <div className="relative z-10 mt-16 animate-bounce">
//           <ChevronDown className="w-5 h-5 text-white/20" />
//         </div>
//       </section>

//       {/* ── STATS ── */}
//       <section ref={statsSection.ref} className="py-24 px-6 border-y border-white/5">
//         <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
//           <StatCounter target={10000} suffix="+" label="Active Gyms" inView={statsSection.inView} />
//           <StatCounter target={500000} suffix="+" label="Members" inView={statsSection.inView} />
//           <StatCounter target={50000} suffix="+" label="Trainers" inView={statsSection.inView} />
//           <StatCounter target={98} suffix="%" label="Satisfaction Rate" inView={statsSection.inView} />
//         </div>
//       </section>

//       {/* ── FEATURES ── */}
//       <section id="features" ref={featuresSection.ref} className="py-28 px-6">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-16">
//             <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Everything you need</p>
//             <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
//               One platform.<br />Every feature.
//             </h2>
//             <p className="text-white/45 text-lg max-w-xl mx-auto">
//               Stop juggling spreadsheets, WhatsApp groups, and paper registers. GymStack replaces all of it.
//             </p>
//           </div>

//           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
//             {features.map(({ icon: Icon, title, desc, tag }, i) => (
//               <div key={title}
//                 className={`glass rounded-2xl p-6 group hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 ${
//                   featuresSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
//                 }`}
//                 style={{ transitionDelay: featuresSection.inView ? `${i * 60}ms` : "0ms", transitionDuration: "500ms", transitionProperty: "opacity, transform", transitionTimingFunction: "ease" }}>
//                 <div className="flex items-start justify-between mb-4">
//                   <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
//                     <Icon className="w-5 h-5 text-primary" />
//                   </div>
//                   <span className="text-xs text-white/30 border border-white/10 rounded-full px-2.5 py-0.5">{tag}</span>
//                 </div>
//                 <h3 className="text-white font-display font-semibold mb-2">{title}</h3>
//                 <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── HOW IT WORKS ── */}
//       <section id="how-it-works" className="py-28 px-6 bg-white/2">
//         <div className="max-w-5xl mx-auto">
//           <div className="text-center mb-16">
//             <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Simple setup</p>
//             <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Up and running in minutes</h2>
//             <p className="text-white/45 text-lg">No technical knowledge required. Just follow these steps.</p>
//           </div>

//           <div className="grid md:grid-cols-4 gap-6 relative">
//             {/* Connector line */}
//             <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />

//             {[
//               { step: "01", icon: ShieldCheck, title: "Create Account", desc: "Sign up as a gym owner in under 2 minutes." },
//               { step: "02", icon: Dumbbell, title: "Set Up Your Gym", desc: "Add your gym details, plans, and trainer accounts." },
//               { step: "03", icon: Users, title: "Add Members", desc: "Import existing members or let them self-register." },
//               { step: "04", icon: TrendingUp, title: "Start Growing", desc: "Track everything and make data-driven decisions." },
//             ].map(({ step, icon: Icon, title, desc }) => (
//               <div key={step} className="text-center relative">
//                 <div className="w-20 h-20 rounded-2xl bg-gradient-primary mx-auto mb-5 flex items-center justify-center shadow-lg shadow-orange-500/20 relative z-10">
//                   <Icon className="w-8 h-8 text-white" />
//                 </div>
//                 <div className="text-primary/40 text-xs font-mono font-bold mb-1">{step}</div>
//                 <h3 className="text-white font-display font-semibold mb-2">{title}</h3>
//                 <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── ROLES ── */}
//       <section ref={rolesSection.ref} className="py-28 px-6">
//         <div className="max-w-6xl mx-auto">
//           <div className="text-center mb-16">
//             <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Built for everyone</p>
//             <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">A dashboard for every role</h2>
//             <p className="text-white/45 text-lg max-w-xl mx-auto">
//               Owners, trainers, and members each get a tailored experience with exactly what they need.
//             </p>
//           </div>

//           <div className="grid md:grid-cols-3 gap-6">
//             {roles.map(({ icon: Icon, title, color, border, bg, points }, i) => (
//               <div key={title}
//                 className={`rounded-2xl border p-7 ${border} ${bg} transition-all duration-500 ${
//                   rolesSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
//                 }`}
//                 style={{ transitionDelay: `${i * 120}ms`, transitionDuration: "500ms", transitionProperty: "opacity, transform", transitionTimingFunction: "ease" }}>
//                 <div className={`inline-flex p-3 rounded-xl mb-5 bg-white/5`}>
//                   <Icon className={`w-6 h-6 ${color}`} />
//                 </div>
//                 <h3 className="text-xl font-display font-bold text-white mb-5">{title}</h3>
//                 <ul className="space-y-3">
//                   {points.map((pt) => (
//                     <li key={pt} className="flex items-start gap-2.5">
//                       <CheckCircle className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
//                       <span className="text-white/60 text-sm">{pt}</span>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── PRICING ── */}
//       <section id="pricing" ref={pricingSection.ref} className="py-28 px-6 bg-white/2">
//         <div className="max-w-6xl mx-auto">
//           <div className="text-center mb-16">
//             <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Simple pricing</p>
//             <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Plans that grow with you</h2>
//             <p className="text-white/45 text-lg">Start free. Upgrade when you are ready. No hidden fees.</p>
//           </div>

//           <div className="grid md:grid-cols-3 gap-6 items-start">
//             {plans.map(({ name, price, period, desc, highlight, features: planFeatures }, i) => (
//               <div key={name}
//                 className={`rounded-2xl p-7 border transition-all duration-500 relative ${
//                   highlight
//                     ? "border-primary/50 bg-linear-to-b from-primary/10 to-primary/5 shadow-2xl shadow-primary/10 scale-105"
//                     : "border-white/8 bg-white/3"
//                 } ${pricingSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
//                 style={{ transitionDelay: `${i * 100}ms`, transitionDuration: "500ms", transitionProperty: "opacity, transform", transitionTimingFunction: "ease" }}>
//                 {highlight && (
//                   <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-primary text-white text-xs font-bold px-4 py-1 rounded-full">
//                     Most Popular
//                   </div>
//                 )}
//                 <h3 className="text-lg font-display font-bold text-white mb-1">{name}</h3>
//                 <p className="text-white/40 text-xs mb-5">{desc}</p>
//                 <div className="flex items-end gap-1 mb-7">
//                   <span className="text-4xl font-display font-bold text-white">{price}</span>
//                   {period && <span className="text-white/40 text-sm mb-1">{period}</span>}
//                 </div>
//                 <ul className="space-y-3 mb-8">
//                   {planFeatures.map((f) => (
//                     <li key={f} className="flex items-center gap-2.5">
//                       <CheckCircle className="w-4 h-4 text-primary shrink-0" />
//                       <span className="text-white/60 text-sm">{f}</span>
//                     </li>
//                   ))}
//                 </ul>
//                 <Link href="/signup"
//                   className={`block text-center text-sm font-semibold py-3 rounded-xl transition-all ${
//                     highlight
//                       ? "bg-gradient-primary text-white hover:opacity-90 shadow-lg shadow-orange-500/20"
//                       : "border border-white/15 text-white/70 hover:border-white/30 hover:text-white"
//                   }`}>
//                   {price === "Custom" ? "Contact Sales" : "Get Started Free"}
//                 </Link>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── FAQ ── */}
//       <section id="faq" ref={faqSection.ref} className="py-28 px-6">
//         <div className="max-w-3xl mx-auto">
//           <div className="text-center mb-14">
//             <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Got questions?</p>
//             <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Frequently asked</h2>
//             <p className="text-white/45">Everything you need to know before getting started.</p>
//           </div>
//           <div className="space-y-3">
//             {faqs.map((faq) => <FAQItem key={faq.q} {...faq} />)}
//           </div>
//         </div>
//       </section>

//       {/* ── CTA BANNER ── */}
//       <section className="py-28 px-6">
//         <div className="max-w-4xl mx-auto relative rounded-3xl overflow-hidden">
//           <div className="absolute inset-0 bg-gradient-primary opacity-90" />
//           <div className="absolute inset-0 opacity-10"
//             style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
//           <div className="relative z-10 text-center py-20 px-8">
//             <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
//               Ready to level up your gym?
//             </h2>
//             <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
//               Join thousands of gym owners who trust GymStack to run their business. Start your free trial today — no credit card needed.
//             </p>
//             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
//               <Link href="/signup"
//                 className="flex items-center gap-2 bg-white text-orange-600 font-bold px-8 py-4 rounded-xl hover:bg-white/90 transition-colors text-sm shadow-xl">
//                 Start Free Trial <ArrowRight className="w-4 h-4" />
//               </Link>
//               <Link href="/login"
//                 className="flex items-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:border-white/60 transition-colors text-sm">
//                 Sign In
//               </Link>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ── FOOTER ── */}
//       <footer className="border-t border-white/5 py-12 px-6">
//         <div className="max-w-7xl mx-auto">
//           <div className="flex flex-col md:flex-row items-center justify-between gap-6">
//             <div className="flex items-center gap-2.5">
//               <div className="p-2 bg-gradient-primary rounded-xl">
//                 <Dumbbell className="w-4 h-4 text-white" />
//               </div>
//               <span className="text-lg font-display font-bold text-white">GymStack</span>
//             </div>

//             <div className="flex items-center gap-8 text-sm text-white/35">
//               {["Features", "Pricing", "Privacy Policy", "Terms of Service"].map((item) => (
//                 <a key={item} href="#" className="hover:text-white/70 transition-colors">{item}</a>
//               ))}
//             </div>

//             <p className="text-white/25 text-sm">© 2025 GymStack. All rights reserved.</p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   )
// }

// src/app/(landing)/page.tsx
"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import {
  Dumbbell, ArrowRight, CheckCircle, Users, ClipboardList,
  UtensilsCrossed, BarChart3, Bell, CreditCard, Calendar,
  ShieldCheck, Zap, Star, ChevronDown, Menu, X, TrendingUp,
  Wallet, Trophy, Lock, Package, QrCode, Receipt,
  Smartphone, Apple, Play, ChevronRight, MapPin, Clock,
  Activity, Target, Award, Layers, Globe, Shield,
} from "lucide-react"

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
    desc: "Full member lifecycle — add, onboard, track plans, renewals, attendance history and health records. Bulk import or self-registration.",
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
    desc: "Real-time push alerts for expiry, payments, announcements and reminders — sent to Android & iOS via Expo. No missed follow-ups.",
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
  {
    icon: Wallet, tag: "Growth",
    title: "Wallet & Referrals",
    desc: "Built-in wallet for members to store credits. Automated referral rewards with cashback — a viral growth engine baked into your gym.",
    color: "#8b5cf6",
  },
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
      "Wallet credits & referral rewards",
      "Gym announcements & notifications",
      "Discover & join new gyms nearby",
    ],
  },
]

const PLANS = [
  {
    name: "Free", price: "₹0", period: "1 month",
    desc: "Try everything at zero cost.",
    highlight: false, cta: "Start Free",
    features: ["Up to 100 members", "Workout & diet plans", "Attendance tracking", "Push notifications", "24/7 support"],
  },
  {
    name: "Basic", price: "₹1,000", period: "3 months",
    desc: "More members, all core tools.",
    highlight: false, cta: "Get Basic",
    features: ["Up to 200 members", "Everything in Free", "Diet plan builder", "Expense tracker", "24/7 support"],
  },
  {
    name: "Standard", price: "₹2,000", period: "6 months",
    desc: "Grow your gym with payments & inventory.",
    highlight: true, cta: "Get Standard",
    features: ["Up to 500 members", "Everything in Basic", "Razorpay payments", "Supplement store", "Locker management", "Full analytics & reports"],
  },
  {
    name: "Pro", price: "₹3,000", period: "per year",
    desc: "Unlimited scale.",
    highlight: false, cta: "Get Pro",
    features: ["Unlimited members & trainers", "Everything in Standard", "Priority support", "Free updates forever"],
  },
  {
    name: "Elite", price: "₹4,000", period: "per year",
    desc: "Your brand, your platform.",
    highlight: false, cta: "Get Elite",
    features: ["Everything in Pro", "Custom branding", "WhatsApp integration", "API access"],
  },
  {
    name: "Lifetime", price: "₹10,000", period: "one-time",
    desc: "Pay once, own it forever.",
    highlight: false, cta: "Get Lifetime",
    features: ["Everything in Elite", "Lifetime updates", "Never pay again", "First priority support"],
  },
]

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
    a: "Yes. GymStack has a native Expo app for both Android and iOS. Push notifications, offline support, and real-time sync all work on both platforms.",
  },
  {
    q: "Is my gym data secure?",
    a: "All data is encrypted at rest and in transit. We use PostgreSQL with row-level security, and authentication uses industry-standard JWT tokens with refresh rotation.",
  },
  {
    q: "What payment methods are supported?",
    a: "GymStack supports UPI, credit/debit cards, net banking and wallet credits via Razorpay integration — available on Standard plans and above.",
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
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-shadow">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black text-white tracking-tight">GymStack</span>
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
            <StatTicker target={500}    suffix="+"  label="Gyms Using GymStack"  inView={statsRef.inView} delay={0}   />
            <StatTicker target={50000}  suffix="+"  label="Members Managed"       inView={statsRef.inView} delay={150} />
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
                GymStack is available as a native app for Android and iOS — built with Expo.
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

                  {/* App content mockup */}
                  <div className="px-5 pt-2 pb-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <div className="text-white/40 text-[11px]">Good morning 👋</div>
                        <div className="text-white font-bold text-base font-display">Rahul Singh</div>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center">
                        <Dumbbell className="w-4.5 h-4.5 text-white" />
                      </div>
                    </div>

                    {/* Membership card */}
                    <div className="rounded-2xl p-4 mb-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                      <div className="text-white/70 text-[10px] mb-1">Membership</div>
                      <div className="text-white font-bold text-sm">Pro Plan — Active</div>
                      <div className="text-white/70 text-[10px] mt-2">Expires 28 Feb 2026</div>
                      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { label: "Check-ins", value: "24", icon: Activity },
                        { label: "Workouts", value: "18", icon: Target },
                        { label: "Streak",   value: "7d", icon: Award  },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="rounded-xl bg-white/5 border border-white/8 p-2.5 text-center">
                          <Icon className="w-3.5 h-3.5 text-[#f97316] mx-auto mb-1" />
                          <div className="text-white font-bold text-sm">{value}</div>
                          <div className="text-white/35 text-[10px]">{label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Today's workout */}
                    <div className="rounded-xl bg-white/5 border border-white/8 p-3">
                      <div className="text-white/40 text-[10px] mb-2">TODAY'S WORKOUT</div>
                      {["Bench Press  3×12", "Pull-ups  4×8", "Squats  4×10"].map(ex => (
                        <div key={ex} className="flex items-center gap-2 py-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />
                          <span className="text-white/65 text-[11px]">{ex}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom nav */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#111827] border-t border-white/8 flex items-center justify-around px-4">
                    {[LayoutDashboard, ClipboardList, UtensilsCrossed, Bell].map((Icon, i) => (
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
          <div className="text-center mb-20">
            <SectionLabel>Transparent pricing</SectionLabel>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4" style={{ letterSpacing: "-0.03em" }}>
              Plans that grow with you
            </h2>
            <p className="text-white/45 text-lg">Start free. Upgrade when you're ready. No hidden fees ever.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
            {PLANS.map(({ name, price, period, desc, highlight, cta, features: planF }, i) => (
              <div key={name}
                className={`rounded-3xl p-7 relative overflow-hidden transition-all duration-500 hover:scale-[1.02] ${
                  highlight ? "pricing-shine" : "border border-white/8 bg-white/2"
                }`}
                style={{
                  opacity:    pricingRef.inView ? 1 : 0,
                  transform:  pricingRef.inView ? "translateY(0)" : "translateY(24px)",
                  transition: `opacity 0.5s ease ${i * 80}ms, transform 0.5s ease ${i * 80}ms`,
                }}>
                {highlight && (
                  <>
                    <div className="absolute inset-0 bg-linear-to-b from-[#f97316]/5 to-transparent pointer-events-none" />
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-linear-to-r from-[#f97316] to-[#fb923c] text-white text-xs font-black px-5 py-1.5 rounded-full shadow-lg shadow-orange-500/30">
                      ✦ Most Popular
                    </div>
                  </>
                )}

                <div className="relative">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-white font-display font-bold text-xl">{name}</h3>
                    {highlight && <Zap className="w-4 h-4 text-[#f97316]" />}
                  </div>
                  <p className="text-white/35 text-xs mb-5">{desc}</p>

                  <div className="flex items-end gap-1.5 mb-7">
                    <span className="text-4xl font-black text-white font-display">{price}</span>
                    <span className="text-white/35 text-sm mb-1">/ {period}</span>
                  </div>

                  <ul className="space-y-2.5 mb-8">
                    {planF.map(f => (
                      <li key={f} className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-[#f97316] shrink-0 mt-0.5" />
                        <span className="text-white/55 text-sm">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/signup"
                    className={`block text-center text-sm font-bold py-3.5 rounded-xl transition-all ${
                      highlight
                        ? "bg-[#f97316] hover:bg-[#ea580c] text-white shadow-lg shadow-orange-500/25"
                        : "border border-white/12 text-white/60 hover:text-white hover:border-white/25 hover:bg-white/4"
                    }`}>
                    {cta}
                  </Link>
                </div>
              </div>
            ))}
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
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Dumbbell className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-black text-white">GymStack</span>
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
                {["Privacy Policy", "Terms of Service", "Cookie Policy", "Contact"].map(item => (
                  <li key={item}>
                    <a href="#" className="text-sm text-white/35 hover:text-white/70 transition-colors">{item}</a>
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
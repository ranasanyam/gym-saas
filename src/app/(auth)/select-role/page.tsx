// // src/app/(auth)/select-role/page.tsx
// "use client"

// import { useState, useEffect } from "react"
// import { useRouter } from "next/navigation"
// import { motion, AnimatePresence } from "framer-motion"
// import { Building2, Dumbbell, ArrowRight, Loader2, Check, ClipboardCheck } from "lucide-react"
// import { useSession } from "next-auth/react"
// import { Button } from "@/components/ui/button"
// import { useToast } from "@/hooks/use-toast"
// import { useProfile } from "@/contexts/ProfileContext"

// type Role = "owner" | "member"

// const roles = [
//   {
//     id: "owner" as Role,
//     icon: Building2,
//     title: "Gym Owner",
//     subtitle: "I own or manage a gym",
//     description: "Set up your gym, manage members and trainers, handle billing, and track performance — all from one dashboard.",
//     perks: ["Member & Staff Management", "Automatic Fee Reminders", "Revenue & Attendance Analytics", "Multi-Branch Control", "Digital Ledger (Khaata)"],
//     borderColor: "border-orange-500/40",
//     bgGradient: "from-orange-500/15 to-amber-500/5",
//   },
//   {
//     id: "member" as Role,
//     icon: Dumbbell,
//     title: "Gym Member",
//     subtitle: "I train at a gym",
//     description: "Track your workouts, follow your diet plan, book classes, and monitor your fitness progress over time.",
//     perks: ["Discover Gyms", "Personalized Diet & Workout Plans", "Attendance Tracking","In-App Support", "Digital Check-in"],
//     borderColor: "border-blue-500/40",
//     bgGradient: "from-blue-500/15 to-cyan-500/5",
//   },
//   {
//     id: "trainer" as Role,
//     icon: ClipboardCheck,
//     title: "Gym Trainer",
//     subtitle: "I am a Trainer",
//     description: "Create Workout and diet plans and track clients transformation progress.",
//     perks: ["Client Progress Tracking", "Smart Plan Builder", "Attendance Monitoring", "Broadcast Updates", "Performance Reports"],
//     borderColor: "border-orange-500/40",
//     bgGradient: "from-orange-500/15 to-amber-500/5"
//   }
// ]

// export default function SelectRolePage() {
//   const router = useRouter()
//   const { toast } = useToast()
//   const { update, data: session, status } = useSession()
//   const { refresh } = useProfile()

//   const [selected, setSelected] = useState<Role | null>(null)
//   const [loading, setLoading] = useState(false)

//   // Read role directly from the JWT — available immediately on mount,
//   // no ProfileContext/DB round-trip required.
//   const sessionRole = (session?.user as any)?.role as string | undefined

//   useEffect(() => {
//     if (status !== "authenticated") return
//     if (sessionRole === "owner")   { router.replace("/owner/dashboard");   return }
//     if (sessionRole === "trainer") { router.replace("/trainer/dashboard"); return }
//     if (sessionRole === "member")  { router.replace("/member/dashboard");  return }
//     // sessionRole is null/undefined → new user, stay and pick a role
//   }, [status, sessionRole, router])

//   const handleContinue = async () => {
//     if (!selected) return
//     setLoading(true)

//     try {
//       const res = await fetch("/api/profile/set-role", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ role: selected }),
//       })

//       const data = await res.json()

//       if (!res.ok) {
//         toast({ variant: "destructive", title: "Error", description: data.error ?? "Failed to set role." })
//         return
//       }

//       // Refresh session token + profile context
//       await update()
//       await refresh()

//       router.push(selected === "owner" ? "/owner/setup" : "/member/dashboard")
//     } catch {
//       toast({ variant: "destructive", title: "Something went wrong", description: "Please try again." })
//     } finally {
//       setLoading(false)
//     }
//   }

//   // Don't render the role cards while:
//   // 1. Session is still being loaded from the cookie
//   // 2. A role is already known → redirect is in-flight via the useEffect above
//   // This eliminates the UI flash for returning users.
//   if (status === "loading" || sessionRole) {
//     return (
//       <div className="min-h-screen bg-[hsl(220_25%_6%)] flex items-center justify-center">
//         <Loader2 className="w-6 h-6 text-primary animate-spin" />
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-6 relative overflow-hidden">
//       <div className="absolute top-[-15%] right-[-10%] w-150 h-150 rounded-full bg-primary/8 blur-[140px] pointer-events-none" />
//       <div className="absolute bottom-[-15%] left-[-10%] w-125 h-125 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

//       <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5, ease: "easeOut" }} className="w-full max-w-4xl relative z-10">

//         {/* Logo */}
//         <div className="flex items-center justify-center gap-3 mb-12">
//           <div className="p-2.5 bg-gradient-primary rounded-xl shadow-lg">
//             <Dumbbell className="w-6 h-6 text-white" />
//           </div>
//           <span className="text-2xl font-display font-bold text-white tracking-tight">GymStack</span>
//         </div>

//         {/* Heading */}
//         <div className="text-center mb-10">
//           <h1 className="text-3xl font-display font-bold text-white mb-3">How will you use GymStack?</h1>
//           <p className="text-white/50 text-sm">Choose your role to get started with the right experience</p>
//         </div>

//         {/* Cards */}
//         <div className="grid md:grid-cols-3 gap-5 mb-8">
//           {roles.map((role, i) => {
//             const Icon = role.icon
//             const isSelected = selected === role.id
//             return (
//               <motion.button key={role.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.1 + i * 0.1 }} onClick={() => setSelected(role.id)}
//                 className={`relative text-left rounded-2xl p-6 border transition-all duration-300 overflow-hidden ${
//                   isSelected
//                     ? `${role.borderColor} bg-linear-to-br ${role.bgGradient} shadow-xl`
//                     : "border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20"
//                 }`}>
//                 <AnimatePresence>
//                   {isSelected && (
//                     <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
//                       exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
//                       className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
//                       <Check className="w-3.5 h-3.5 text-white" />
//                     </motion.div>
//                   )}
//                 </AnimatePresence>
//                 <div className={`inline-flex p-3 rounded-xl mb-5 transition-colors ${isSelected ? "bg-white/15" : "bg-white/5"}`}>
//                   <Icon className="w-6 h-6 text-white" />
//                 </div>
//                 <div className="mb-1">
//                   <span className="text-xs font-medium text-white/40 uppercase tracking-widest">{role.subtitle}</span>
//                 </div>
//                 <h3 className="text-xl font-display font-bold text-white mb-2">{role.title}</h3>
//                 <p className="text-white/55 text-sm leading-relaxed mb-5">{role.description}</p>
//                 <ul className="space-y-2">
//                   {role.perks.map((perk) => (
//                     <li key={perk} className="flex items-center gap-2.5">
//                       <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? "bg-primary" : "bg-white/30"}`} />
//                       <span className="text-xs text-white/60">{perk}</span>
//                     </li>
//                   ))}
//                 </ul>
//               </motion.button>
//             )
//           })}
//         </div>

//         {/* Continue */}
//         <div className="flex flex-col items-center gap-3">
//           <motion.div whileHover={selected ? { scale: 1.02 } : {}} whileTap={selected ? { scale: 0.98 } : {}}>
//             <Button onClick={handleContinue} disabled={!selected || loading}
//               className="px-10 h-12 bg-gradient-primary hover:opacity-90 text-white font-semibold text-sm transition-all disabled:opacity-30 gap-2">
//               {loading ? <Loader2 className="w-4 h-4 animate-spin" />
//                 : <><span>Continue</span><ArrowRight className="w-4 h-4" /></>}
//             </Button>
//           </motion.div>
//           <p className="text-white/25 text-xs">⚠️ Your role is permanent and cannot be changed after this step</p>
//         </div>
//       </motion.div>
//     </div>
//   )
// }




// src/app/(auth)/select-role/page.tsx
//
// Role selection — only shown to users who have authenticated but have no role yet.
//
// TWO-LAYER PROTECTION against showing this page to users who already have a role:
//
//   Layer 1 — proxy.ts middleware (server, before page renders):
//     If role is in the JWT, redirects to /{role}/dashboard immediately.
//     99% of cases are caught here — zero flash possible.
//
//   Layer 2 — this page's own server check (if middleware was bypassed):
//     Reads session on the server. If role is already set, redirects before
//     sending ANY HTML to the browser. Zero flash possible from server side.
//
//   Layer 3 — client-side useEffect (last resort):
//     If for some reason layers 1 and 2 didn't catch it (e.g. a direct
//     navigation with stale cache), the useEffect redirects without showing
//     the role cards (loading spinner is shown instead).
//
// The original bug — "SelectRole flash then dashboard" — was caused by
// middleware redirecting /auth-redirect to /select-role (because the JWT
// cookie didn't have role yet immediately after OAuth callback). Fixed in
// proxy.ts by adding /auth-redirect to the SELF_ROUTING bypass list.

import { auth }   from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import SelectRoleClient from "./SelectRoleClient"

// Server component wrapper — reads role from DB before sending any HTML.
// If role is already set, this redirect fires before the client bundle loads.
export default async function SelectRolePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const profile = await prisma.profile.findUnique({
    where:  { id: session.user.id },
    select: { role: true },
  })

  // Already has a role — redirect on the server, zero flash
  if (profile?.role === "owner")   redirect("/owner/dashboard")
  if (profile?.role === "trainer") redirect("/trainer/dashboard")
  if (profile?.role === "member")  redirect("/member/dashboard")

  // No role — render the role picker
  return <SelectRoleClient />
}
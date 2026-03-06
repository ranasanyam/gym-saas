// "use client"

// import { useState } from "react"
// import { useRouter } from "next/navigation"
// import { motion, AnimatePresence } from "framer-motion"
// import {
//   Building2,
//   User,
//   Dumbbell,
//   ArrowRight,
//   Loader2,
//   Check,
//   ChevronRight,
// } from "lucide-react"
// import { useSession } from "next-auth/react"
// import { Button } from "@/components/ui/button"
// // import { useToast } from "@/hooks/use-toast"

// type Role = "owner" | "member"

// const roles = [
//   {
//     id: "owner" as Role,
//     icon: Building2,
//     title: "Gym Owner",
//     subtitle: "I run a gym",
//     description:
//       "Set up your gym, manage members and trainers, handle billing, and track performance — all from one dashboard.",
//     perks: ["Member & trainer management", "Subscription billing", "Class scheduling", "Analytics & reports"],
//     accent: "from-orange-500/20 to-amber-500/10",
//     border: "border-orange-500/40",
//     glow: "shadow-orange-500/20",
//   },
//   {
//     id: "member" as Role,
//     icon: User,
//     title: "Gym Member",
//     subtitle: "I train at a gym",
//     description:
//       "Track your workouts, follow your diet plan, book classes, and monitor your fitness progress over time.",
//     perks: ["Workout & diet plans", "Class booking", "Progress tracking", "Gym history"],
//     accent: "from-blue-500/20 to-cyan-500/10",
//     border: "border-blue-500/40",
//     glow: "shadow-blue-500/20",
//   },
// ]

// export default function SelectRolePage() {
//   const router = useRouter()
// //   const { toast } = useToast()
//   const { data: session, update } = useSession()

//   const [selected, setSelected] = useState<Role | null>(null)
//   const [loading, setLoading] = useState(false)

//   const handleContinue = async () => {
//     if (!selected || !session?.user?.id) return
//     setLoading(true)

//     try {
//       const res = await fetch("/api/auth/set-role", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ role: selected }),
//       })

//       const data = await res.json()

//       if (!res.ok) {
//         // toast({
//         //   variant: "destructive",
//         //   title: "Error",
//         //   description: data.error || "Failed to set role. Please try again.",
//         // })
//         return
//       }

//       await update()

//       if (selected === "owner") {
//         router.push("/owner/setup")
//       } else {
//         router.push("/member/dashboard")
//       }
//     } catch (err) {
//       console.error("Set role error:", err)
//     //   toast({
//     //     variant: "destructive",
//     //     title: "Something went wrong",
//     //     description: "Please try again.",
//     //   })
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-6 relative overflow-hidden">
//       {/* Background orbs */}
//       <div className="absolute top-[-15%] right-[-10%] w-150 h-150 rounded-full bg-primary/8 blur-[140px] pointer-events-none" />
//       <div className="absolute bottom-[-15%] left-[-10%] w-150 h-150 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

//       <motion.div
//         initial={{ opacity: 0, y: 24 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5, ease: "easeOut" }}
//         className="w-full max-w-3xl relative z-10"
//       >
//         {/* Logo */}
//         <div className="flex items-center justify-center gap-3 mb-12">
//           <div className="p-2.5 bg-gradient-primary rounded-xl shadow-lg">
//             <Dumbbell className="w-6 h-6 text-white" />
//           </div>
//           <span className="text-2xl font-display font-bold text-white tracking-tight">
//             GymStack
//           </span>
//         </div>

//         {/* Heading */}
//         <div className="text-center mb-10">
//           <motion.h1
//             initial={{ opacity: 0, y: 12 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.1 }}
//             className="text-3xl font-display font-bold text-white mb-3"
//           >
//             How will you use GymStack?
//           </motion.h1>
//           <motion.p
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ delay: 0.2 }}
//             className="text-white/50 text-sm"
//           >
//             Choose your role to get started with the right experience
//           </motion.p>
//         </div>

//         {/* Role cards */}
//         <div className="grid md:grid-cols-2 gap-5 mb-8">
//           {roles.map((role, i) => {
//             const Icon = role.icon
//             const isSelected = selected === role.id

//             return (
//               <motion.button
//                 key={role.id}
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.15 + i * 0.1 }}
//                 onClick={() => setSelected(role.id)}
//                 className={`relative text-left rounded-2xl p-6 border transition-all duration-300 overflow-hidden group ${
//                   isSelected
//                     ? `${role.border} bg-linear-to-br ${role.accent} shadow-xl ${role.glow}`
//                     : "border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20"
//                 }`}
//               >
//                 {/* Selected checkmark */}
//                 <AnimatePresence>
//                   {isSelected && (
//                     <motion.div
//                       initial={{ scale: 0, opacity: 0 }}
//                       animate={{ scale: 1, opacity: 1 }}
//                       exit={{ scale: 0, opacity: 0 }}
//                       transition={{ type: "spring", stiffness: 300, damping: 20 }}
//                       className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
//                     >
//                       <Check className="w-3.5 h-3.5 text-white" />
//                     </motion.div>
//                   )}
//                 </AnimatePresence>

//                 {/* Icon */}
//                 <div
//                   className={`inline-flex p-3 rounded-xl mb-5 transition-colors ${
//                     isSelected ? "bg-white/15" : "bg-white/5 group-hover:bg-white/8"
//                   }`}
//                 >
//                   <Icon className="w-6 h-6 text-white" />
//                 </div>

//                 {/* Title */}
//                 <div className="mb-1">
//                   <span className="text-xs font-medium text-white/40 uppercase tracking-widest">
//                     {role.subtitle}
//                   </span>
//                 </div>
//                 <h3 className="text-xl font-display font-bold text-white mb-2">
//                   {role.title}
//                 </h3>
//                 <p className="text-white/55 text-sm leading-relaxed mb-5">
//                   {role.description}
//                 </p>

//                 {/* Perks */}
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

//         {/* Continue button */}
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 0.4 }}
//           className="flex justify-center"
//         >
//           <motion.div
//             whileHover={selected ? { scale: 1.02 } : {}}
//             whileTap={selected ? { scale: 0.98 } : {}}
//           >
//             <Button
//               onClick={handleContinue}
//               disabled={!selected || loading}
//               className="px-10 h-12 bg-gradient-primary hover:opacity-90 text-white font-semibold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed gap-2"
//             >
//               {loading ? (
//                 <Loader2 className="w-4 h-4 animate-spin" />
//               ) : (
//                 <>
//                   Continue
//                   <ArrowRight className="w-4 h-4" />
//                 </>
//               )}
//             </Button>
//           </motion.div>
//         </motion.div>

//         {/* Footer note */}
//         <motion.p
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 0.5 }}
//           className="text-center text-white/25 text-xs mt-6"
//         >
//           You can change your role later from settings
//         </motion.p>
//       </motion.div>
//     </div>
//   )
// }

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Building2, User, Dumbbell, ArrowRight, Loader2, Check } from "lucide-react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useProfile } from "@/contexts/ProfileContext"

type Role = "owner" | "member"

const roles = [
  {
    id: "owner" as Role,
    icon: Building2,
    title: "Gym Owner",
    subtitle: "I run a gym",
    description: "Set up your gym, manage members and trainers, handle billing, and track performance — all from one dashboard.",
    perks: ["Member & trainer management", "Subscription billing", "Class scheduling", "Analytics & reports"],
    borderColor: "border-orange-500/40",
    bgGradient: "from-orange-500/15 to-amber-500/5",
  },
  {
    id: "member" as Role,
    icon: User,
    title: "Gym Member",
    subtitle: "I train at a gym",
    description: "Track your workouts, follow your diet plan, book classes, and monitor your fitness progress over time.",
    perks: ["Workout & diet plans", "Class booking", "Progress tracking", "Gym history"],
    borderColor: "border-blue-500/40",
    bgGradient: "from-blue-500/15 to-cyan-500/5",
  },
]

export default function SelectRolePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { update } = useSession()
  const { refresh } = useProfile()

  const [selected, setSelected] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    if (!selected) return
    setLoading(true)

    try {
      const res = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selected }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({ variant: "destructive", title: "Error", description: data.error ?? "Failed to set role." })
        return
      }

      // Refresh session token + profile context
      await update()
      await refresh()

      router.push(selected === "owner" ? "/owner/setup" : "/member/dashboard")
    } catch {
      toast({ variant: "destructive", title: "Something went wrong", description: "Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-15%] right-[-10%] w-150 h-150 rounded-full bg-primary/8 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-150 h-150 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }} className="w-full max-w-3xl relative z-10">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="p-2.5 bg-gradient-primary rounded-xl shadow-lg">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-display font-bold text-white tracking-tight">GymStack</span>
        </div>

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold text-white mb-3">How will you use GymStack?</h1>
          <p className="text-white/50 text-sm">Choose your role to get started with the right experience</p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          {roles.map((role, i) => {
            const Icon = role.icon
            const isSelected = selected === role.id
            return (
              <motion.button key={role.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }} onClick={() => setSelected(role.id)}
                className={`relative text-left rounded-2xl p-6 border transition-all duration-300 overflow-hidden ${
                  isSelected
                    ? `${role.borderColor} bg-linear-to-br ${role.bgGradient} shadow-xl`
                    : "border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20"
                }`}>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className={`inline-flex p-3 rounded-xl mb-5 transition-colors ${isSelected ? "bg-white/15" : "bg-white/5"}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="mb-1">
                  <span className="text-xs font-medium text-white/40 uppercase tracking-widest">{role.subtitle}</span>
                </div>
                <h3 className="text-xl font-display font-bold text-white mb-2">{role.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed mb-5">{role.description}</p>
                <ul className="space-y-2">
                  {role.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? "bg-primary" : "bg-white/30"}`} />
                      <span className="text-xs text-white/60">{perk}</span>
                    </li>
                  ))}
                </ul>
              </motion.button>
            )
          })}
        </div>

        {/* Continue */}
        <div className="flex flex-col items-center gap-3">
          <motion.div whileHover={selected ? { scale: 1.02 } : {}} whileTap={selected ? { scale: 0.98 } : {}}>
            <Button onClick={handleContinue} disabled={!selected || loading}
              className="px-10 h-12 bg-gradient-primary hover:opacity-90 text-white font-semibold text-sm transition-all disabled:opacity-30 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><span>Continue</span><ArrowRight className="w-4 h-4" /></>}
            </Button>
          </motion.div>
          <p className="text-white/25 text-xs">You can change your role later from settings</p>
        </div>
      </motion.div>
    </div>
  )
}
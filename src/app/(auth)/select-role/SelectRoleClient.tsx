// src/app/(auth)/select-role/SelectRoleClient.tsx
// Client component — only rendered when the server confirmed role is null.
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Building2, Dumbbell, ArrowRight, Loader2, Check, ClipboardCheck,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useProfile } from "@/contexts/ProfileContext"

type Role = "owner" | "trainer" | "member"

const ROLES = [
  {
    id: "owner" as Role,
    icon: Building2,
    title: "Gym Owner",
    subtitle: "I own or manage a gym",
    description: "Set up your gym, manage members and trainers, handle billing, and track performance — all from one dashboard.",
    perks: [
      "Member & Staff Management",
      "Automatic Fee Reminders",
      "Revenue & Attendance Analytics",
      "Multi-Branch Control",
      "Digital Ledger (Khaata)",
    ],
    borderColor: "border-orange-500/40",
    bgGradient:  "from-orange-500/15 to-amber-500/5",
  },
  {
    id: "member" as Role,
    icon: Dumbbell,
    title: "Gym Member",
    subtitle: "I train at a gym",
    description: "Track your workouts, follow your diet plan, book classes, and monitor your fitness progress over time.",
    perks: [
      "Discover Gyms",
      "Personalized Diet & Workout Plans",
      "Attendance Tracking",
      "In-App Support",
      "Digital Check-in",
    ],
    borderColor: "border-blue-500/40",
    bgGradient:  "from-blue-500/15 to-cyan-500/5",
  },
  {
    id: "trainer" as Role,
    icon: ClipboardCheck,
    title: "Gym Trainer",
    subtitle: "I am a Trainer",
    description: "Create workout and diet plans and track client transformation progress.",
    perks: [
      "Client Progress Tracking",
      "Smart Plan Builder",
      "Attendance Monitoring",
      "Broadcast Updates",
      "Performance Reports",
    ],
    borderColor: "border-orange-500/40",
    bgGradient:  "from-orange-500/15 to-amber-500/5",
  },
]

export default function SelectRoleClient() {
  const router     = useRouter()
  const { toast }  = useToast()
  useSession()
  useProfile()

  const [selected, setSelected] = useState<Role | null>(null)
  const [loading,  setLoading]  = useState(false)

  // No useEffect redirect needed — the server component already guaranteed
  // this component only renders when role is null.

  const handleContinue = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const res  = await fetch("/api/profile/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selected }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ variant: "destructive", title: "Error", description: data.error ?? "Failed to set role." })
        return
      }

      // router.refresh() re-runs the /select-role server component, which reads
      // the updated role from DB and issues the correct server-side redirect
      // (/owner/choose-plan or /{role}/dashboard). This avoids any stale JWT
      // issues that arise from navigating directly with window.location.href.
      router.refresh()
    } catch {
      toast({ variant: "destructive", title: "Something went wrong", description: "Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-15%] right-[-10%] w-150 h-150 rounded-full bg-primary/8 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-125 h-125 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-4xl relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="p-2.5 bg-gradient-primary rounded-xl shadow-lg">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-display font-bold text-white tracking-tight">GymStack</span>
        </div>

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold text-white mb-3">
            How will you use GymStack?
          </h1>
          <p className="text-white/50 text-sm">
            Choose your role to get started with the right experience
          </p>
        </div>

        {/* Role cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {ROLES.map((role, i) => {
            const Icon       = role.icon
            const isSelected = selected === role.id
            return (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                onClick={() => setSelected(role.id)}
                className={`relative text-left rounded-2xl p-6 border transition-all duration-300 overflow-hidden ${
                  isSelected
                    ? `${role.borderColor} bg-linear-to-br ${role.bgGradient} shadow-xl`
                    : "border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20"
                }`}
              >
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                    >
                      <Check className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className={`inline-flex p-3 rounded-xl mb-5 transition-colors ${isSelected ? "bg-white/15" : "bg-white/5"}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <div className="mb-1">
                  <span className="text-xs font-medium text-white/40 uppercase tracking-widest">
                    {role.subtitle}
                  </span>
                </div>
                <h3 className="text-xl font-display font-bold text-white mb-2">{role.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed mb-5">{role.description}</p>

                <ul className="space-y-2">
                  {role.perks.map(perk => (
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
            <Button
              onClick={handleContinue}
              disabled={!selected || loading}
              className="px-10 h-12 bg-gradient-primary hover:opacity-90 text-white font-semibold text-sm transition-all disabled:opacity-30 gap-2"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><span>Continue</span><ArrowRight className="w-4 h-4" /></>
              }
            </Button>
          </motion.div>
          <p className="text-white/25 text-xs">
            ⚠️ Your role is permanent and cannot be changed after this step
          </p>
        </div>
      </motion.div>
    </div>
  )
}
// "use client"

// import { useState } from "react"
// import Link from "next/link"
// import { motion, AnimatePresence } from "framer-motion"
// import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react"
// import { AuthLayout } from "@/components/auth/AuthLayout"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// // import { useToast } from "@/hooks/use-toast"

// export default function ForgotPasswordPage() {
// //   const { toast } = useToast()
//   const [email, setEmail] = useState("")
//   const [loading, setLoading] = useState(false)
//   const [sent, setSent] = useState(false)

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLoading(true)

//     try {
//       const res = await fetch("/api/auth/forgot-password", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email }),
//       })

//       if (!res.ok) {
//         const data = await res.json()
//         throw new Error(data.error)
//       }

//       setSent(true)
//     } catch {
//     //   toast({
//     //     variant: "destructive",
//     //     title: "Something went wrong",
//     //     description: "Failed to send reset email. Please try again.",
//     //   })
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <AuthLayout
//       title={sent ? "Check your inbox" : "Forgot your password?"}
//       subtitle={
//         sent
//           ? "We've sent reset instructions to your email"
//           : "No worries — we'll send you a reset link"
//       }
//     >
//       <AnimatePresence mode="wait">
//         {sent ? (
//           /* ── Success state ── */
//           <motion.div
//             key="sent"
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -10 }}
//             className="space-y-6"
//           >
//             <div className="flex justify-center py-2">
//               <motion.div
//                 initial={{ scale: 0 }}
//                 animate={{ scale: 1 }}
//                 transition={{ type: "spring", stiffness: 220, damping: 18 }}
//                 className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center"
//               >
//                 <CheckCircle className="w-8 h-8 text-primary" />
//               </motion.div>
//             </div>

//             <div className="text-center space-y-2">
//               <p className="text-white/65 text-sm leading-relaxed">
//                 If an account exists for{" "}
//                 <span className="text-white font-medium">{email}</span>,
//                 you&apos;ll receive an email with a reset link shortly.
//               </p>
//               <p className="text-white/35 text-xs">
//                 Didn&apos;t receive it? Check your spam folder.
//               </p>
//             </div>

//             <div className="space-y-3">
//               <Button
//                 variant="outline"
//                 onClick={() => { setSent(false); setEmail("") }}
//                 className="w-full border-white/10 bg-white/5 text-white hover:bg-white/8 h-11 text-sm"
//               >
//                 Try a different email
//               </Button>
//               <Link href="/login">
//                 <Button
//                   variant="ghost"
//                   className="w-full text-white/45 hover:text-white h-11 text-sm"
//                 >
//                   <ArrowLeft className="w-4 h-4 mr-2" />
//                   Back to sign in
//                 </Button>
//               </Link>
//             </div>
//           </motion.div>
//         ) : (
//           /* ── Form state ── */
//           <motion.form
//             key="form"
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -10 }}
//             onSubmit={handleSubmit}
//             className="space-y-5"
//           >
//             <div className="space-y-1.5">
//               <Label htmlFor="email" className="text-white/65 text-sm">
//                 Email address
//               </Label>
//               <div className="relative">
//                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
//                 <Input
//                   id="email"
//                   type="email"
//                   placeholder="you@example.com"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                   autoComplete="email"
//                   className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11 pl-10"
//                 />
//               </div>
//             </div>

//             <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
//               <Button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 transition-opacity"
//               >
//                 {loading
//                   ? <Loader2 className="w-4 h-4 animate-spin" />
//                   : "Send reset link"
//                 }
//               </Button>
//             </motion.div>

//             <Link href="/login">
//               <Button
//                 type="button"
//                 variant="ghost"
//                 className="w-full text-white/45 hover:text-white h-11 text-sm"
//               >
//                 <ArrowLeft className="w-4 h-4 mr-2" />
//                 Back to sign in
//               </Button>
//             </Link>
//           </motion.form>
//         )}
//       </AnimatePresence>
//     </AuthLayout>
//   )
// }


"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"


export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      setSent(true)
    } catch {
      toast({ variant: "destructive", title: "Something went wrong", description: "Failed to send reset email. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={sent ? "Check your inbox" : "Forgot your password?"}
      subtitle={sent ? "We sent reset instructions to your email" : "No worries — we will send you a reset link"}
    >
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div key="sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex justify-center py-2">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </motion.div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-white/65 text-sm leading-relaxed">
                If an account exists for <span className="text-white font-medium">{email}</span>,
                you will receive a reset link shortly.
              </p>
              <p className="text-white/35 text-xs">Didn&apos;t receive it? Check your spam folder.</p>
            </div>
            <div className="space-y-3">
              <Button variant="outline" onClick={() => { setSent(false); setEmail("") }}
                className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 h-11 text-sm">
                Try a different email
              </Button>
              <Link href="/login">
                <Button variant="ghost" className="w-full text-white/45 hover:text-white h-11 text-sm">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to sign in
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.form key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/65 text-sm">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <Input id="email" type="email" placeholder="you@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11 pl-10" />
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button type="submit" disabled={loading}
                className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 transition-opacity">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send reset link"}
              </Button>
            </motion.div>
            <Link href="/login">
              <Button type="button" variant="ghost" className="w-full text-white/45 hover:text-white h-11 text-sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to sign in
              </Button>
            </Link>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}
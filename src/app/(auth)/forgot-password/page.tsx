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


// src/app/(auth)/forgot-password/page.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Loader2, Mail, CheckCircle, UserPlus, Chrome } from "lucide-react"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

type PageState = "form" | "sent" | "no_account" | "oauth_account"

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [pageState, setPageState] = useState<PageState>("form")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Known error codes — show dedicated screens instead of a generic toast
        if (data.error === "no_account") { setPageState("no_account"); return }
        if (data.error === "oauth_account") { setPageState("oauth_account"); return }
        throw new Error(data.error)
      }

      setPageState("sent")
    } catch {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Failed to send reset email. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setPageState("form"); setEmail("") }

  return (
    <AuthLayout
      title={
        pageState === "sent"         ? "Check your inbox"        :
        pageState === "no_account"   ? "No account found"        :
        pageState === "oauth_account"? "Use Google to sign in"   :
                                       "Forgot your password?"
      }
      subtitle={
        pageState === "sent"         ? "We sent reset instructions to your email" :
        pageState === "no_account"   ? "We couldn't find an account with that email" :
        pageState === "oauth_account"? "This email is linked to a Google account" :
                                       "No worries — we will send you a reset link"
      }
    >
      <AnimatePresence mode="wait">

        {/* ── Email sent ── */}
        {pageState === "sent" && (
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
                A reset link has been sent to{" "}
                <span className="text-white font-medium">{email}</span>.
                It expires in 1 hour.
              </p>
              <p className="text-white/35 text-xs">Didn&apos;t receive it? Check your spam folder.</p>
            </div>
            <div className="space-y-3">
              <Button variant="outline" onClick={reset}
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
        )}

        {/* ── No account found ── */}
        {pageState === "no_account" && (
          <motion.div key="no_account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex justify-center py-2">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="w-16 h-16 rounded-full bg-yellow-500/15 flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-yellow-400" />
              </motion.div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-white/65 text-sm leading-relaxed">
                There&apos;s no FitHub account linked to{" "}
                <span className="text-white font-medium">{email}</span>.
              </p>
              <p className="text-white/40 text-xs">
                Double-check the email or create a new account.
              </p>
            </div>
            <div className="space-y-3">
              <Link href="/signup">
                <Button className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-11">
                  <UserPlus className="w-4 h-4 mr-2" /> Create an account
                </Button>
              </Link>
              <Button variant="outline" onClick={reset}
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
        )}

        {/* ── Google-only account ── */}
        {pageState === "oauth_account" && (
          <motion.div key="oauth_account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex justify-center py-2">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="w-16 h-16 rounded-full bg-blue-500/15 flex items-center justify-center">
                <GoogleIcon />
              </motion.div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-white/65 text-sm leading-relaxed">
                <span className="text-white font-medium">{email}</span> is registered
                via Google. Use the Google button to sign in — no password needed.
              </p>
            </div>
            <div className="space-y-3">
              <Link href="/login">
                <Button className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-11">
                  Go to sign in
                </Button>
              </Link>
              <Button variant="outline" onClick={reset}
                className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 h-11 text-sm">
                Try a different email
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Form ── */}
        {pageState === "form" && (
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

function GoogleIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
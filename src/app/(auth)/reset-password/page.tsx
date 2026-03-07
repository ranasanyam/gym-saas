// "use client"

// import { useState } from "react"
// import { useRouter, useSearchParams } from "next/navigation"
// import Link from "next/link"
// import { motion } from "framer-motion"
// import { Eye, EyeOff, Loader2, Lock, CheckCircle, AlertCircle } from "lucide-react"
// import { AuthLayout } from "@/components/auth/AuthLayout"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// // import { useToast } from "@/hooks/use-toast"

// // Password strength: 0–4
// function getStrength(p: string): number {
//   let s = 0
//   if (p.length >= 8) s++
//   if (p.length >= 12) s++
//   if (/[A-Z]/.test(p) && /[0-9]/.test(p)) s++
//   if (/[^A-Za-z0-9]/.test(p)) s++
//   return s
// }

// const strengthLabel = ["Too short", "Weak", "Fair", "Good", "Strong"]
// const strengthColor = ["bg-white/10", "bg-destructive", "bg-warning", "bg-primary", "bg-success"]

// export default function ResetPasswordPage() {
//   const router = useRouter()
//   const searchParams = useSearchParams()
// //   const { toast } = useToast()
//   const token = searchParams.get("token")

//   const [password, setPassword] = useState("")
//   const [confirm, setConfirm] = useState("")
//   const [showPassword, setShowPassword] = useState(false)
//   const [showConfirm, setShowConfirm] = useState(false)
//   const [loading, setLoading] = useState(false)
//   const [success, setSuccess] = useState(false)

//   const strength = getStrength(password)
//   const mismatch = confirm.length > 0 && password !== confirm
//   const canSubmit = password.length >= 8 && !mismatch

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!canSubmit) return
//     setLoading(true)

//     try {
//       const res = await fetch("/api/auth/reset-password", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ token, password }),
//       })

//       const data = await res.json()

//       if (!res.ok) throw new Error(data.error || "Failed to reset password")

//       setSuccess(true)
//       setTimeout(() => router.push("/login"), 3000)
//     } catch (err: any) {
//     //   toast({
//     //     variant: "destructive",
//     //     title: "Reset failed",
//     //     description: err.message ?? "Please request a new reset link.",
//     //   })
//     } finally {
//       setLoading(false)
//     }
//   }

//   /* ── Invalid / missing token ── */
//   if (!token) {
//     return (
//       <AuthLayout
//         title="Invalid link"
//         subtitle="This reset link is invalid or has expired"
//       >
//         <div className="space-y-6">
//           <div className="flex justify-center py-2">
//             <div className="w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center">
//               <AlertCircle className="w-8 h-8 text-destructive" />
//             </div>
//           </div>
//           <p className="text-center text-white/60 text-sm">
//             Reset links expire after 1 hour. Please request a new one.
//           </p>
//           <Link href="/forgot-password">
//             <Button className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-11">
//               Request new link
//             </Button>
//           </Link>
//         </div>
//       </AuthLayout>
//     )
//   }

//   /* ── Success state ── */
//   if (success) {
//     return (
//       <AuthLayout
//         title="Password updated!"
//         subtitle="Your password has been reset successfully"
//       >
//         <div className="space-y-6">
//           <div className="flex justify-center py-2">
//             <motion.div
//               initial={{ scale: 0 }}
//               animate={{ scale: 1 }}
//               transition={{ type: "spring", stiffness: 220, damping: 18 }}
//               className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center"
//             >
//               <CheckCircle className="w-8 h-8 text-primary" />
//             </motion.div>
//           </div>
//           <p className="text-center text-white/55 text-sm">
//             Redirecting you to sign in...
//           </p>
//           <Button
//             onClick={() => router.push("/login")}
//             className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-11"
//           >
//             Go to sign in
//           </Button>
//         </div>
//       </AuthLayout>
//     )
//   }

//   /* ── Form ── */
//   return (
//     <AuthLayout
//       title="Set new password"
//       subtitle="Choose a strong password for your account"
//     >
//       <form onSubmit={handleSubmit} className="space-y-5">

//         {/* New password */}
//         <div className="space-y-1.5">
//           <Label htmlFor="password" className="text-white/65 text-sm">
//             New password
//           </Label>
//           <div className="relative">
//             <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
//             <Input
//               id="password"
//               type={showPassword ? "text" : "password"}
//               placeholder="Min. 8 characters"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//               autoComplete="new-password"
//               className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11 pl-10 pr-11"
//             />
//             <button
//               type="button"
//               onClick={() => setShowPassword(!showPassword)}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
//             >
//               {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//             </button>
//           </div>

//           {/* Strength bar */}
//           {password.length > 0 && (
//             <div className="space-y-1">
//               <div className="flex gap-1">
//                 {[...Array(4)].map((_, i) => (
//                   <div
//                     key={i}
//                     className={`h-1 flex-1 rounded-full transition-all duration-300 ${
//                       i < strength ? strengthColor[strength] : "bg-white/10"
//                     }`}
//                   />
//                 ))}
//               </div>
//               <p className="text-white/35 text-xs">{strengthLabel[strength]}</p>
//             </div>
//           )}
//         </div>

//         {/* Confirm password */}
//         <div className="space-y-1.5">
//           <Label htmlFor="confirm" className="text-white/65 text-sm">
//             Confirm password
//           </Label>
//           <div className="relative">
//             <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
//             <Input
//               id="confirm"
//               type={showConfirm ? "text" : "password"}
//               placeholder="Repeat your password"
//               value={confirm}
//               onChange={(e) => setConfirm(e.target.value)}
//               required
//               autoComplete="new-password"
//               className={`bg-white/5 text-white placeholder:text-white/25 focus-visible:ring-0 h-11 pl-10 pr-11 transition-colors ${
//                 mismatch
//                   ? "border-destructive focus:border-destructive"
//                   : "border-white/10 focus:border-primary"
//               }`}
//             />
//             <button
//               type="button"
//               onClick={() => setShowConfirm(!showConfirm)}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
//             >
//               {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//             </button>
//           </div>
//           {mismatch && (
//             <p className="text-destructive text-xs">Passwords do not match</p>
//           )}
//         </div>

//         <div className="pt-1">
//           <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
//             <Button
//               type="submit"
//               disabled={loading || !canSubmit}
//               className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 transition-opacity disabled:opacity-35"
//             >
//               {loading
//                 ? <Loader2 className="w-4 h-4 animate-spin" />
//                 : "Update password"
//               }
//             </Button>
//           </motion.div>
//         </div>
//       </form>
//     </AuthLayout>
//   )
// }


"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Eye, EyeOff, Loader2, Lock, CheckCircle, AlertCircle } from "lucide-react"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

function getStrength(p: string): number {
  let s = 0
  if (p.length >= 8) s++
  if (p.length >= 12) s++
  if (/[A-Z]/.test(p) && /[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return s
}

const strengthLabel = ["Too short", "Weak", "Fair", "Good", "Strong"]
const strengthColor = ["bg-white/10", "bg-red-500", "bg-yellow-500", "bg-primary", "bg-green-500"]

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const strength = getStrength(password)
  const mismatch = confirm.length > 0 && password !== confirm
  const canSubmit = password.length >= 8 && !mismatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to reset password")
      setSuccess(true)
      // setTimeout(() => router.push("/login"), 3000)
    } catch (err: any) {
      toast({ variant: "destructive", title: "Reset failed", description: err.message ?? "Please request a new reset link." })
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthLayout title="Invalid link" subtitle="This reset link is invalid or has expired">
        <div className="space-y-6">
          <div className="flex justify-center py-2">
            <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <p className="text-center text-white/60 text-sm">Reset links expire after 1 hour. Please request a new one.</p>
          <Link href="/forgot-password">
            <Button className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-11">Request new link</Button>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  if (success) {
    return (
      <AuthLayout title="Password updated!" subtitle="Your password has been reset successfully">
        <div className="space-y-6">
          <div className="flex justify-center py-2">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
          <p className="text-center text-white/55 text-sm">Redirecting you to sign in...</p>
          <Button onClick={() => router.push("/login")}
            className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-11">
            Go to sign in
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password for your account">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* New password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-white/65 text-sm">New password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters"
              value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11 pl-10 pr-11" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? strengthColor[strength] : "bg-white/10"}`} />
                ))}
              </div>
              <p className="text-white/35 text-xs">{strengthLabel[strength]}</p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-white/65 text-sm">Confirm password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <Input id="confirm" type={showConfirm ? "text" : "password"} placeholder="Repeat your password"
              value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password"
              className={`bg-white/5 text-white placeholder:text-white/25 focus-visible:ring-0 h-11 pl-10 pr-11 transition-colors ${
                mismatch ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-primary"}`} />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {mismatch && <p className="text-red-400 text-xs">Passwords do not match</p>}
        </div>

        <div className="pt-1">
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button type="submit" disabled={loading || !canSubmit}
              className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 transition-opacity disabled:opacity-35">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update password"}
            </Button>
          </motion.div>
        </div>
      </form>
    </AuthLayout>
  )
}
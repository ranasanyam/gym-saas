// src/app/(auth)/signup/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"
import { signIn } from "next-auth/react"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface FormData {
  fullName: string; email: string; password: string
  mobileNumber: string; city: string; gender: string; referralCode: string
}

function SignupContent() {
  const router = useRouter()
  const { toast } = useToast()

  const [form, setForm] = useState<FormData>({
    fullName: "", email: "", password: "",
    mobileNumber: "", city: "", gender: "", referralCode: "",
  })
  const searchParams = useSearchParams()

  // Auto-fill referral code from URL ?ref=CODE
  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref) setForm(p => ({ ...p, referralCode: ref.toUpperCase() }))
  }, [])

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({ variant: "destructive", title: "Signup failed", description: data.error ?? "Something went wrong." })
        return
      }

      // Auto sign-in after registration
      const signInRes = await signIn("credentials", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        redirect: false,
      })

      if (signInRes?.error) {
        toast({ title: "Account created! Please sign in." })
        router.push("/login")
        return
      }

      toast({ title: "Welcome to FitHub! 🎉", description: "Account created successfully." })
      router.push("/select-role")
    } catch {
      toast({ variant: "destructive", title: "Something went wrong", description: "Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join FitHub and manage your gym smarter">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Full name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-white/65 text-sm">Full name <span className="text-primary">*</span></Label>
          <Input id="fullName" placeholder="Rohit Sharma" value={form.fullName} onChange={set("fullName")} required
            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11" />
        </div>

        {/* Mobile + City */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="mobile" className="text-white/65 text-sm">Mobile <span className="text-primary">*</span></Label>
            <Input id="mobile" type="tel" placeholder="9876543210" value={form.mobileNumber} onChange={set("mobileNumber")} required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-white/65 text-sm">City <span className="text-primary">*</span></Label>
            <Input id="city" placeholder="Mumbai" value={form.city} onChange={set("city")} required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11" />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-white/65 text-sm">Email address <span className="text-primary">*</span></Label>
          <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required autoComplete="email"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11" />
        </div>

        {/* Gender */}
        <div className="space-y-1.5">
          <Label className="text-white/65 text-sm">Gender</Label>
          <Select value={form.gender} onValueChange={(v) => setForm((p) => ({ ...p, gender: v }))}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 focus:ring-0 focus:border-primary">
              <SelectValue placeholder="Select gender (optional)" />
            </SelectTrigger>
            <SelectContent className="bg-[hsl(220_25%_10%)] border-white/10 text-white">
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-white/65 text-sm">Password <span className="text-primary">*</span></Label>
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters"
              value={form.password} onChange={set("password")} required minLength={8} autoComplete="new-password"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11 pr-11" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Referral code */}
        <div className="space-y-1.5">
          <Label htmlFor="referral" className="text-white/65 text-sm">
            Referral code <span className="text-white/30 font-normal">(optional)</span>
          </Label>
          <Input id="referral" placeholder="e.g. ROHIT1234"
            value={form.referralCode}
            onChange={(e) => setForm((p) => ({ ...p, referralCode: e.target.value.toUpperCase() }))}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11 tracking-widest uppercase" />
          <p className="text-white/30 text-xs">Enter a referral code to reward whoever invited you.</p>
        </div>

        {/* Submit */}
        <div className="pt-1">
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button type="submit" disabled={loading}
              className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 transition-opacity">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><span>Create account</span><ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Google */}
        <Button type="button" variant="outline"
          onClick={() => signIn("google", { callbackUrl: "/select-role" })}
          className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 h-11 transition-all gap-2.5">
          <GoogleIcon />
          Continue with Google
        </Button>

        <p className="text-center text-sm text-white/40">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

import { Suspense } from "react"

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[hsl(220_25%_6%)]">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}

// src/app/(auth)/signup/page.tsx
// "use client"

// import { useState, useEffect } from "react"
// import { useRouter, useSearchParams } from "next/navigation"
// import Link from "next/link"
// import { motion } from "framer-motion"
// import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"
// import { signIn } from "next-auth/react"
// import { AuthLayout } from "@/components/auth/AuthLayout"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { useToast } from "@/hooks/use-toast"

// interface FormData {
//   fullName: string; email: string; password: string
//   mobileNumber: string; city: string; gender: string; referralCode: string
// }

// export default function SignupPage() {
//   const router = useRouter()
//   const { toast } = useToast()

//   const [form, setForm] = useState<FormData>({
//     fullName: "", email: "", password: "",
//     mobileNumber: "", city: "", gender: "", referralCode: "",
//   })
//   const searchParams = useSearchParams()

//   // Auto-fill referral code from URL ?ref=CODE
//   useEffect(() => {
//     const ref = searchParams.get("ref")
//     if (ref) setForm(p => ({ ...p, referralCode: ref.toUpperCase() }))
//   }, [])

//   const [showPassword, setShowPassword] = useState(false)
//   const [loading, setLoading] = useState(false)

//   const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
//     setForm((p) => ({ ...p, [field]: e.target.value }))

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLoading(true)

//     try {
//       const res = await fetch("/api/auth/register", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(form),
//       })

//       const data = await res.json()

//       if (!res.ok) {
//         toast({ variant: "destructive", title: "Signup failed", description: data.error ?? "Something went wrong." })
//         return
//       }

//       // Auto sign-in after registration
//       const signInRes = await signIn("credentials", {
//         email: form.email.trim().toLowerCase(),
//         password: form.password,
//         redirect: false,
//       })

//       if (signInRes?.error) {
//         toast({ title: "Account created! Please sign in." })
//         router.push("/login")
//         return
//       }

//       toast({ title: "Welcome to GymStack! 🎉", description: "Account created successfully." })
//       router.push("/select-role")
//     } catch {
//       toast({ variant: "destructive", title: "Something went wrong", description: "Please try again." })
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <AuthLayout title="Create your account" subtitle="Join GymStack and manage your gym smarter">
//       <form onSubmit={handleSubmit} className="space-y-4">

//         {/* Full name */}
//         <div className="space-y-1.5">
//           <Label htmlFor="fullName" className="text-white/65 text-sm">Full name <span className="text-primary">*</span></Label>
//           <Input id="fullName" placeholder="Rohit Sharma" value={form.fullName} onChange={set("fullName")} required
//             className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11" />
//         </div>

//         {/* Mobile + City */}
//         <div className="grid grid-cols-2 gap-3">
//           <div className="space-y-1.5">
//             <Label htmlFor="mobile" className="text-white/65 text-sm">Mobile <span className="text-primary">*</span></Label>
//             <Input id="mobile" type="tel" placeholder="9876543210" value={form.mobileNumber} onChange={set("mobileNumber")} required
//               className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11" />
//           </div>
//           <div className="space-y-1.5">
//             <Label htmlFor="city" className="text-white/65 text-sm">City <span className="text-primary">*</span></Label>
//             <Input id="city" placeholder="Mumbai" value={form.city} onChange={set("city")} required
//               className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11" />
//           </div>
//         </div>

//         {/* Email */}
//         <div className="space-y-1.5">
//           <Label htmlFor="email" className="text-white/65 text-sm">Email address <span className="text-primary">*</span></Label>
//           <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required autoComplete="email"
//             className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11" />
//         </div>

//         {/* Gender */}
//         <div className="space-y-1.5">
//           <Label className="text-white/65 text-sm">Gender</Label>
//           <Select value={form.gender} onValueChange={(v) => setForm((p) => ({ ...p, gender: v }))}>
//             <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 focus:ring-0 focus:border-primary">
//               <SelectValue placeholder="Select gender (optional)" />
//             </SelectTrigger>
//             <SelectContent className="bg-[hsl(220_25%_10%)] border-white/10 text-white">
//               <SelectItem value="male">Male</SelectItem>
//               <SelectItem value="female">Female</SelectItem>
//               <SelectItem value="other">Other</SelectItem>
//               <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         {/* Password */}
//         <div className="space-y-1.5">
//           <Label htmlFor="password" className="text-white/65 text-sm">Password <span className="text-primary">*</span></Label>
//           <div className="relative">
//             <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters"
//               value={form.password} onChange={set("password")} required minLength={8} autoComplete="new-password"
//               className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11 pr-11" />
//             <button type="button" onClick={() => setShowPassword(!showPassword)}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
//               {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//             </button>
//           </div>
//         </div>

//         {/* Referral code */}
//         <div className="space-y-1.5">
//           <Label htmlFor="referral" className="text-white/65 text-sm">
//             Referral code <span className="text-white/30 font-normal">(optional)</span>
//           </Label>
//           <Input id="referral" placeholder="e.g. ROHIT1234"
//             value={form.referralCode}
//             onChange={(e) => setForm((p) => ({ ...p, referralCode: e.target.value.toUpperCase() }))}
//             className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11 tracking-widest uppercase" />
//           <p className="text-white/30 text-xs">Enter a referral code to reward whoever invited you.</p>
//         </div>

//         {/* Submit */}
//         <div className="pt-1">
//           <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
//             <Button type="submit" disabled={loading}
//               className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 transition-opacity">
//               {loading ? <Loader2 className="w-4 h-4 animate-spin" />
//                 : <><span>Create account</span><ArrowRight className="w-4 h-4 ml-2" /></>}
//             </Button>
//           </motion.div>
//         </div>

//         {/* Divider */}
//         <div className="relative flex items-center gap-3">
//           <div className="flex-1 h-px bg-white/10" />
//           <span className="text-white/30 text-xs">or</span>
//           <div className="flex-1 h-px bg-white/10" />
//         </div>

//         {/* Google */}
//         <Button type="button" variant="outline"
//           onClick={() => signIn("google", { callbackUrl: "/select-role" })}
//           className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 h-11 transition-all gap-2.5">
//           <GoogleIcon />
//           Continue with Google
//         </Button>

//         <p className="text-center text-sm text-white/40">
//           Already have an account?{" "}
//           <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">Sign in</Link>
//         </p>
//       </form>
//     </AuthLayout>
//   )
// }

// function GoogleIcon() {
//   return (
//     <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
//       <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
//       <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
//       <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
//       <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
//     </svg>
//   )
// }
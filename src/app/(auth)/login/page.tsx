// "use client"

// import { useState } from "react"
// import { useRouter } from "next/navigation"
// import Link from "next/link"
// import { motion } from "framer-motion"
// import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"
// import { signIn } from "next-auth/react"
// import { AuthLayout } from "@/components/auth/AuthLayout"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// // import { useToast } from "@/hooks/use-toast"

// export default function LoginPage() {
//   const router = useRouter()
// //   const { toast } = useToast()

//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [showPassword, setShowPassword] = useState(false)
//   const [loading, setLoading] = useState(false)

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLoading(true)

//     try {
//       const res = await signIn("credentials", {
//         email,
//         password,
//         redirect: false,
//       })

//       if (res?.error) {
//         // toast({
//         //   variant: "destructive",
//         //   title: "Login failed",
//         //   description: "Invalid email or password.",
//         // })
//         return
//       }

//       // Fetch session profile to determine where to redirect
//       const profileRes = await fetch("/api/profile/me")
//       const profile = await profileRes.json()

//       if (profile?.role === "owner") router.push("/owner/dashboard")
//       else if (profile?.role === "trainer") router.push("/trainer/dashboard")
//       else if (profile?.role === "member") router.push("/member/dashboard")
//       else router.push("/select-role")
//     } catch {
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
//     <AuthLayout
//       title="Welcome back"
//       subtitle="Sign in to continue to GymStack"
//     >
//       <form onSubmit={handleSubmit} className="space-y-5">

//         {/* Email */}
//         <div className="space-y-1.5">
//           <Label htmlFor="email" className="text-white/65 text-sm">
//             Email address
//           </Label>
//           <Input
//             id="email"
//             type="email"
//             placeholder="you@example.com"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//             autoComplete="email"
//             className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11"
//           />
//         </div>

//         {/* Password */}
//         <div className="space-y-1.5">
//           <div className="flex items-center justify-between">
//             <Label htmlFor="password" className="text-white/65 text-sm">
//               Password
//             </Label>
//             <Link
//               href="/forgot-password"
//               className="text-xs text-primary hover:text-primary/75 transition-colors"
//             >
//               Forgot password?
//             </Link>
//           </div>
//           <div className="relative">
//             <Input
//               id="password"
//               type={showPassword ? "text" : "password"}
//               placeholder="••••••••"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//               autoComplete="current-password"
//               className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11 pr-11"
//             />
//             <button
//               type="button"
//               onClick={() => setShowPassword(!showPassword)}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
//             >
//               {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//             </button>
//           </div>
//         </div>

//         {/* Submit */}
//         <div className="pt-1">
//           <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
//             <Button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 transition-opacity"
//             >
//               {loading
//                 ? <Loader2 className="w-4 h-4 animate-spin" />
//                 : <> Sign in <ArrowRight className="w-4 h-4 ml-2" /> </>
//               }
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
//         <Button
//           type="button"
//           variant="outline"
//           onClick={() => signIn("google", { callbackUrl: "/select-role" })}
//           className="w-full border-white/10 bg-white/5 text-white hover:bg-white/8 hover:border-white/20 h-11 transition-all gap-2.5"
//         >
//           <GoogleIcon />
//           Continue with Google
//         </Button>

//         <p className="text-center text-sm text-white/40">
//           Don&apos;t have an account?{" "}
//           <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
//             Create one
//           </Link>
//         </p>
//       </form>
//     </AuthLayout>
//   )
// }

// function GoogleIcon() {
//   return (
//     <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
//       <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
//       <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
//       <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
//       <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
//     </svg>
//   )
// }



// src/app/(auth)/login/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"
import { signIn } from "next-auth/react"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useProfile } from "@/contexts/ProfileContext"

function getRolePath(role: string | null): string {
  if (role === "owner") return "/owner/dashboard"
  if (role === "trainer") return "/trainer/dashboard"
  if (role === "member") return "/member/dashboard"
  return "/select-role"
}

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { refresh } = useProfile()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })

      if (res?.error) {
        // res.code contains our typed error code from authorize()
        if (res.code === "oauth_account") {
          toast({
            variant: "destructive",
            title: "Use Google to sign in",
            description: "This account was created with Google. Click \"Continue with Google\" below.",
          })
        } else {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: "Invalid email or password.",
          })
        }
        return
      }

      // Poll /api/profile/me until the session is ready (max 3 attempts)
      let profile: any = null
      for (let i = 0; i < 3; i++) {
        await new Promise(r => setTimeout(r, 300))
        const profileRes = await fetch("/api/profile/me")
        if (profileRes.ok) {
          profile = await profileRes.json()
          break
        }
      }

      await refresh()
      router.push(getRolePath(profile?.role ?? null))
    } catch {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to FitHub">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-white/65 text-sm">Email address</Label>
          <Input
            id="email" type="email" placeholder="you@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
            required autoComplete="email"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-white/65 text-sm">Password</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:text-primary/75 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password" type={showPassword ? "text" : "password"}
              placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)}
              required autoComplete="current-password"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11 pr-11"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-1">
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button type="submit" disabled={loading}
              className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 transition-opacity">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><span>Sign in</span><ArrowRight className="w-4 h-4 ml-2" /></>}
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
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Create one
          </Link>
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
// "use client"

// import Link from "next/link"
// import { motion } from "framer-motion"
// import { Dumbbell } from "lucide-react"

// interface AuthLayoutProps {
//   title: string
//   subtitle: string
//   children: React.ReactNode
// }

// export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
//   return (
//     <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
//       {/* Ambient glow orbs */}
//       <div className="absolute top-[-10%] right-[-5%] w-125 h-125 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
//       <div className="absolute bottom-[-10%] left-[-5%] w-125 h-125 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.45, ease: "easeOut" }}
//         className="w-full max-w-md relative z-10"
//       >
//         {/* Logo */}
//         <Link href="/" className="flex items-center justify-center gap-3 mb-8 group w-fit mx-auto">
//           <div className="p-2.5 bg-gradient-primary rounded-xl shadow-lg group-hover:opacity-90 transition-opacity">
//             <Dumbbell className="w-6 h-6 text-white" />
//           </div>
//           <span className="text-2xl font-display font-bold text-white tracking-tight">
//             GymStack
//           </span>
//         </Link>

//         {/* Card */}
//         <div className="glass rounded-2xl p-8">
//           {/* Page heading */}
//           <div className="mb-7">
//             <h1 className="text-[1.6rem] font-display font-bold text-white leading-tight mb-1">
//               {title}
//             </h1>
//             <p className="text-white/45 text-sm">{subtitle}</p>
//           </div>

//           {children}
//         </div>
//       </motion.div>
//     </div>
//   )
// }


"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Dumbbell } from "lucide-react"

interface AuthLayoutProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
}
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-[-10%] right-[-5%] w-100 h-100 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-100 h-100 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }} className="w-full max-w-md relative z-10">

        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8 group w-fit mx-auto">
          {/* <div className="p-2.5 bg-gradient-primary rounded-xl shadow-lg group-hover:opacity-90 transition-opacity"> */}
            {/* <Dumbbell className="w-6 h-6 text-white" /> */}
            <img src="../../logo.png" alt="logo" className="w-20 h-20" />
          {/* </div> */}
          {/* <span className="text-2xl font-display font-bold text-white tracking-tight">GymStack</span> */}
        </Link>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          {(title || subtitle) && (
            <div className="mb-7">
              {title   && <h1 className="text-[1.6rem] font-display font-bold text-white leading-tight mb-1">{title}</h1>}
              {subtitle && <p className="text-white/45 text-sm">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </motion.div>
    </div>
  )
}
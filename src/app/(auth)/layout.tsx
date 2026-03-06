// "use client"

// import { motion } from "framer-motion"
// import { Dumbbell } from "lucide-react"
// import Link from "next/link"

// interface AuthLayoutProps {
//   title: string
//   subtitle: string
//   children: React.ReactNode
// }

// export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
//   return (
//     <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         className="w-full max-w-md"
//       >
//         {/* Logo */}
//         <Link href="/" className="flex items-center gap-3 mb-10 justify-center">
//           <div className="p-3 bg-gradient-primary rounded-xl">
//             <Dumbbell className="w-7 h-7 text-white" />
//           </div>
//           <span className="text-2xl font-display font-bold text-white">
//             GymStack
//           </span>
//         </Link>

//         {/* Card */}
//         <div className="glass rounded-2xl p-8 space-y-6">
//           <div className="space-y-1">
//             <h1 className="text-2xl font-display font-bold text-white">
//               {title}
//             </h1>
//             <p className="text-white/60 text-sm">{subtitle}</p>
//           </div>

//           {children}
//         </div>
//       </motion.div>
//     </div>
//   )
// }

// export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
//   return children
// }

export default function AuthPagesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
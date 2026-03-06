// // src/app/member/layout.tsx
// "use client"

// import { useState, useEffect } from "react"
// import { usePathname, useRouter } from "next/navigation"
// import Link from "next/link"
// import { signOut } from "next-auth/react"
// import { useProfile } from "@/contexts/ProfileContext"
// import {
//   Dumbbell, LayoutDashboard, Building2, ClipboardList,
//   UtensilsCrossed, CalendarCheck, CreditCard, Bell,
//   Compass, UserCircle, LogOut, Menu, X, Search, Loader2
// } from "lucide-react"

// const navItems = [
//   { label: "Dashboard",     href: "/member/dashboard",      icon: LayoutDashboard },
//   { label: "My Gym",        href: "/member/gym",            icon: Building2 },
//   { label: "Workouts",      href: "/member/workouts",       icon: ClipboardList },
//   { label: "Diet Plan",     href: "/member/diet",           icon: UtensilsCrossed },
//   { label: "Attendance",    href: "/member/attendance",     icon: CalendarCheck },
//   { label: "Payments",      href: "/member/payments",       icon: CreditCard },
//   { label: "Notifications", href: "/member/notifications",  icon: Bell },
//   { label: "Discover Gyms", href: "/member/discover",       icon: Compass },
//   { label: "Profile",       href: "/member/profile",        icon: UserCircle },
// ]

// export default function MemberLayout({ children }: { children: React.ReactNode }) {
//   const pathname  = usePathname()
//   const router    = useRouter()
//   const { profile, loading } = useProfile()
//   const [sidebarOpen, setSidebarOpen] = useState(false)
//   const [signingOut, setSigningOut]   = useState(false)
//   const [unreadCount, setUnreadCount] = useState(0)

//   useEffect(() => {
//     if (!loading && profile && profile.role !== "member") router.replace("/select-role")
//   }, [loading, profile, router])

//   useEffect(() => {
//     fetch("/api/member/notifications?unreadOnly=true")
//       .then(r => r.json())
//       .then(d => setUnreadCount(d.count ?? 0))
//       .catch(() => {})
//   }, [pathname])

//   const handleSignOut = async () => {
//     setSigningOut(true)
//     await signOut({ callbackUrl: "/login" })
//   }

//   const initials = profile?.fullName
//     ? profile.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
//     : "?"

//   if (loading) return (
//     <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
//       <Loader2 className="w-6 h-6 text-primary animate-spin" />
//     </div>
//   )

//   const Sidebar = ({ mobile = false }) => (
//     <aside className={`${mobile ? "flex" : "hidden lg:flex"} flex-col w-54 min-h-screen bg-[hsl(220_25%_7%)] border-r border-white/5`}>
//       <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/5">
//         <div className="p-2 bg-gradient-primary rounded-xl">
//           <Dumbbell className="w-4 h-4 text-white" />
//         </div>
//         <span className="text-lg font-display font-bold text-white">GymStack</span>
//       </div>

//       <div className="flex-1 py-5 px-3 overflow-y-auto">
//         <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest px-3 mb-3">Menu</p>
//         <nav className="space-y-0.5">
//           {navItems.map(({ label, href, icon: Icon }) => {
//             const active = pathname === href || pathname.startsWith(href + "/")
//             return (
//               <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
//                 className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
//                   active
//                     ? "bg-gradient-primary text-white font-medium shadow-sm"
//                     : "text-white/50 hover:text-white hover:bg-white/6"
//                 }`}>
//                 <Icon className="w-4 h-4 shrink-0" />
//                 <span className="truncate">{label}</span>
//                 {label === "Notifications" && unreadCount > 0 && (
//                   <span className="ml-auto bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
//                     {unreadCount > 99 ? "99+" : unreadCount}
//                   </span>
//                 )}
//               </Link>
//             )
//           })}
//         </nav>
//       </div>

//       <div className="p-3 border-t border-white/5 space-y-1">
//         <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
//           <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
//             {initials}
//           </div>
//           <div className="min-w-0 flex-1">
//             <p className="text-white text-xs font-medium truncate">{profile?.fullName ?? "Member"}</p>
//             <p className="text-white/35 text-[10px] truncate">{profile?.email}</p>
//           </div>
//         </div>
//         <button onClick={handleSignOut} disabled={signingOut}
//           className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/8 transition-all text-sm">
//           {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
//           Sign Out
//         </button>
//       </div>
//     </aside>
//   )

//   return (
//     <div className="flex min-h-screen bg-[hsl(220_25%_6%)]">
//       <Sidebar />

//       {/* Mobile overlay */}
//       {sidebarOpen && (
//         <div className="fixed inset-0 z-40 lg:hidden">
//           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
//           <div className="absolute left-0 top-0 bottom-0 z-50"><Sidebar mobile /></div>
//         </div>
//       )}

//       <div className="flex-1 flex flex-col min-w-0">
//         {/* Topbar */}
//         <header className="h-16 bg-[hsl(220_25%_7%)] border-b border-white/5 flex items-center gap-4 px-6 sticky top-0 z-30">
//           <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white/50 hover:text-white">
//             <Menu className="w-5 h-5" />
//           </button>
//           <div className="relative flex-1 max-w-xs hidden sm:block">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
//             <input placeholder="Search..." className="w-full bg-white/5 border border-white/8 text-white text-sm rounded-xl pl-9 pr-4 h-9 focus:outline-none focus:border-primary/50 placeholder:text-white/20" />
//           </div>
//           <div className="ml-auto flex items-center gap-3">
//             <Link href="/member/notifications" className="relative p-2 text-white/40 hover:text-white transition-colors">
//               <Bell className="w-5 h-5" />
//               {unreadCount > 0 && (
//                 <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
//               )}
//             </Link>
//             <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold">
//               {initials}
//             </div>
//           </div>
//         </header>

//         <main className="flex-1 p-6 overflow-auto">
//           {children}
//         </main>
//       </div>
//     </div>
//   )
// }


// src/app/member/layout.tsx
"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { useProfile } from "@/contexts/ProfileContext"
import {
  Dumbbell, LayoutDashboard, Building2, ClipboardList,
  UtensilsCrossed, CalendarCheck, CreditCard, Bell,
  Compass, UserCircle, LogOut, Menu, X, Search, Loader2
} from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"

const navItems = [
  { label: "Dashboard",     href: "/member/dashboard",      icon: LayoutDashboard },
  { label: "My Gym",        href: "/member/gym",            icon: Building2 },
  { label: "Workouts",      href: "/member/workouts",       icon: ClipboardList },
  { label: "Diet Plan",     href: "/member/diet",           icon: UtensilsCrossed },
  { label: "Attendance",    href: "/member/attendance",     icon: CalendarCheck },
  { label: "Payments",      href: "/member/payments",       icon: CreditCard },
  { label: "Notifications", href: "/member/notifications",  icon: Bell },
  { label: "Discover Gyms", href: "/member/discover",       icon: Compass },
  { label: "Profile",       href: "/member/profile",        icon: UserCircle },
]

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const { profile, loading } = useProfile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [signingOut, setSigningOut]   = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!loading && profile && profile.role !== "member") router.replace("/select-role")
  }, [loading, profile, router])

  useEffect(() => {
    fetch("/api/member/notifications?unreadOnly=true")
      .then(r => r.json())
      .then(d => setUnreadCount(d.count ?? 0))
      .catch(() => {})
  }, [pathname])

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut({ callbackUrl: "/login" })
  }

  const initials = profile?.fullName
    ? profile.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  if (loading) return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  )

  const Sidebar = ({ mobile = false }) => (
    <aside className={`${mobile ? "flex" : "hidden lg:flex"} flex-col w-54 min-h-screen bg-[hsl(220_25%_7%)] border-r border-white/5`}>
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/5">
        <div className="p-2 bg-gradient-primary rounded-xl">
          <Dumbbell className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-display font-bold text-white">GymStack</span>
      </div>

      <div className="flex-1 py-5 px-3 overflow-y-auto">
        <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest px-3 mb-3">Menu</p>
        <nav className="space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? "bg-gradient-primary text-white font-medium shadow-sm"
                    : "text-white/50 hover:text-white hover:bg-white/6"
                }`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{label}</span>
                {label === "Notifications" && unreadCount > 0 && (
                  <span className="ml-auto bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-white/5 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <Avatar name={profile?.fullName ?? "Member"} url={profile?.avatarUrl} size={28} />
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-medium truncate">{profile?.fullName ?? "Member"}</p>
            <p className="text-white/35 text-[10px] truncate">{profile?.email}</p>
          </div>
        </div>
        <button onClick={handleSignOut} disabled={signingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/8 transition-all text-sm">
          {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen bg-[hsl(220_25%_6%)]">
      <Sidebar />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 z-50"><Sidebar mobile /></div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-[hsl(220_25%_7%)] border-b border-white/5 flex items-center gap-4 px-6 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white/50 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="relative flex-1 max-w-xs hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
            <input placeholder="Search..." className="w-full bg-white/5 border border-white/8 text-white text-sm rounded-xl pl-9 pr-4 h-9 focus:outline-none focus:border-primary/50 placeholder:text-white/20" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/member/notifications" className="relative p-2 text-white/40 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </Link>
            <Avatar name={profile?.fullName ?? "Member"} url={profile?.avatarUrl} size={32} />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
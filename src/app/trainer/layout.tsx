// src/app/trainer/layout.tsx
"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { useProfile } from "@/contexts/ProfileContext"
import {
  Dumbbell, LayoutDashboard, Users, CalendarCheck,
  ClipboardList, UtensilsCrossed, Bell, UserCircle, Gift,
  LogOut, Menu, X, Loader2
} from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"

const navItems = [
  { label: "Dashboard",     href: "/trainer/dashboard",      icon: LayoutDashboard },
  { label: "My Members",    href: "/trainer/members",         icon: Users },
  { label: "Workout Plans", href: "/trainer/workouts",        icon: ClipboardList },
  { label: "Diet Plans",    href: "/trainer/diets",           icon: UtensilsCrossed },
  { label: "Attendance",    href: "/trainer/attendance",      icon: CalendarCheck },
  { label: "Refer & Earn",  href: "/trainer/referral",        icon: Gift },
  { label: "Notifications", href: "/trainer/notifications",   icon: Bell },
  { label: "My Profile",    href: "/trainer/profile",         icon: UserCircle },
]

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const { profile, loading } = useProfile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [signingOut,  setSigningOut]  = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!loading && profile && profile.role !== "trainer") {
      router.replace("/select-role")
    }
  }, [loading, profile, router])

  useEffect(() => {
    fetch("/api/trainer/notifications?page=1")
      .then(r => r.json())
      .then(d => setUnread((d.notifications ?? []).filter((n: any) => !n.isRead).length))
      .catch(() => {})
  }, [pathname])

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut({ callbackUrl: "/login" })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  const Sidebar = ({ mobile = false }) => (
    <aside className={`${mobile ? "flex" : "hidden lg:flex"} flex-col w-54 min-h-screen bg-[hsl(220_25%_7%)] border-r border-white/5`}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/5">
        <div className="p-2 bg-gradient-primary rounded-xl">
          <Dumbbell className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-lg font-display font-bold text-white">GymStack</span>
          <p className="text-[10px] text-primary/70 -mt-0.5 font-medium">Trainer</p>
        </div>
      </div>

      {/* Gym name */}
      {profile?.gym && (
        <div className="px-5 py-3 border-b border-white/5">
          <p className="text-white/30 text-[10px] uppercase tracking-wider">Gym</p>
          <p className="text-white/70 text-xs font-medium truncate mt-0.5">{profile.gym.name}</p>
        </div>
      )}

      {/* Nav */}
      <div className="flex-1 py-4 px-3 overflow-y-auto">
        <nav className="space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/")
            const isNotif = href === "/trainer/notifications"
            return (
              <Link key={href} href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? "bg-primary text-white font-semibold shadow-lg shadow-primary/20"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {isNotif && unread > 0 && (
                  <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User */}
      <div className="border-t border-white/5 p-3 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <Avatar name={profile?.fullName ?? "Trainer"} url={profile?.avatarUrl} size={32} />
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{profile?.fullName ?? "Trainer"}</p>
            <p className="text-white/35 text-xs">Trainer</p>
          </div>
        </div>
        <button onClick={handleSignOut} disabled={signingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/45 hover:text-white hover:bg-white/5 transition-all">
          {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          Logout
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-[hsl(220_25%_6%)] flex">
      <Sidebar />

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">
            <Sidebar mobile />
          </div>
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-white/60 hover:text-white z-20">
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-white/5 bg-[hsl(220_25%_7%)] flex items-center justify-between px-6 gap-4 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white/50 hover:text-white">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-white font-semibold text-base capitalize hidden sm:block">
              {navItems.find(n => pathname.startsWith(n.href))?.label ?? "Trainer"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/trainer/notifications" className="relative p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
              )}
            </Link>
            <Avatar name={profile?.fullName ?? "Trainer"} url={profile?.avatarUrl} size={32} />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
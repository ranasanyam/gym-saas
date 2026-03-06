"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { useProfile } from "@/contexts/ProfileContext"
import {
  Dumbbell, LayoutDashboard, Building2, Users, UserCheck,
  CalendarCheck, CreditCard, ClipboardList, UtensilsCrossed,
  Bell, BarChart3, Settings, LogOut, Menu, X, Search,
  ChevronRight, Loader2
} from "lucide-react"

const navItems = [
  { label: "Dashboard",     href: "/owner/dashboard",    icon: LayoutDashboard },
  { label: "Gyms",          href: "/owner/gyms",         icon: Building2 },
  { label: "Members",       href: "/owner/members",      icon: Users },
  { label: "Trainers",      href: "/owner/trainers",     icon: UserCheck },
  { label: "Attendance",    href: "/owner/attendance",   icon: CalendarCheck },
  { label: "Payments",      href: "/owner/payments",     icon: CreditCard },
  { label: "Workout Plans", href: "/owner/workouts",     icon: ClipboardList },
  { label: "Diet Plans",    href: "/owner/diets",        icon: UtensilsCrossed },
  { label: "Notifications", href: "/owner/notifications",icon: Bell },
  { label: "Reports",       href: "/owner/reports",      icon: BarChart3 },
  { label: "Settings",      href: "/owner/settings",     icon: Settings },
]

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, loading } = useProfile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  // Redirect non-owners
  useEffect(() => {
    if (!loading && profile && profile.role !== "owner") {
      router.replace("/select-role")
    }
  }, [loading, profile, router])

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut({ callbackUrl: "/login" })
  }

  const initials = profile?.fullName
    ? profile.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?"

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
        <span className="text-lg font-display font-bold text-white">GymStack</span>
      </div>

      {/* Nav */}
      <div className="flex-1 py-5 px-3 overflow-y-auto">
        <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest px-3 mb-3">Menu</p>
        <nav className="space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link key={href} href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? "bg-primary text-white font-semibold shadow-lg shadow-primary/20"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}>
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User */}
      <div className="border-t border-white/5 p-3 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{profile?.fullName ?? "Owner"}</p>
            <p className="text-white/35 text-xs">Owner</p>
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
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-white/5 bg-[hsl(220_25%_7%)] flex items-center justify-between px-6 gap-4 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white/50 hover:text-white">
              <Menu className="w-5 h-5" />
            </button>
            {/* Page title from pathname */}
            <h1 className="text-white font-semibold text-base capitalize hidden sm:block">
              {navItems.find(n => pathname.startsWith(n.href))?.label ?? "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2 w-52">
              <Search className="w-3.5 h-3.5 text-white/30" />
              <input placeholder="Search..." className="bg-transparent text-sm text-white placeholder:text-white/25 outline-none w-full" />
            </div>
            {/* Notifications */}
            <Link href="/owner/notifications" className="relative p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
            </Link>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold cursor-pointer">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
// src/app/owner/layout.tsx
"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { useProfile } from "@/contexts/ProfileContext"
import { SubscriptionProvider, useSubscription } from "@/contexts/SubscriptionContext"
import { SubscriptionBanner } from "@/components/owner/SubscriptionBanner"
import { UsageMeter } from "@/components/owner/UsageMeter"
import {
  Dumbbell, LayoutDashboard, Building2, Users, UserCheck,
  CalendarCheck, CreditCard, ClipboardList, UtensilsCrossed,
  Bell, BarChart3, Settings, LogOut, Menu, Search,
  Loader2, Tag, Gift, ShoppingBag, Lock, Zap, Receipt,
  IndianRupee, CircleUserRound
} from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"

interface NavItem {
  label:       string
  href:        string
  icon:        React.ElementType
  featureKey?: keyof ReturnType<typeof useSubscription>
}

const navItems: NavItem[] = [
  { label: "Dashboard",     href: "/owner/dashboard",    icon: LayoutDashboard },
  { label: "Gyms",          href: "/owner/gyms",         icon: Building2 },
  { label: "Members",       href: "/owner/members",      icon: Users },
  { label: "Trainers",      href: "/owner/trainers",     icon: UserCheck },
  { label: "Attendance",    href: "/owner/attendance",   icon: CalendarCheck,   featureKey: "hasAttendance" },
  { label: "Payments",      href: "/owner/payments",     icon: CreditCard,      featureKey: "hasPayments" },
  { label: "Plans",         href: "/owner/plans",        icon: Tag },
  { label: "Expenses",      href: "/owner/expenses",     icon: IndianRupee },
  { label: "Lockers",       href: "/owner/lockers",      icon: Lock },
  { label: "Supplements",   href: "/owner/supplements",  icon: ShoppingBag,     featureKey: "hasSupplements" },
  { label: "Workout Plans", href: "/owner/workouts",     icon: ClipboardList,   featureKey: "hasWorkoutPlans" },
  { label: "Diet Plans",    href: "/owner/diets",        icon: UtensilsCrossed, featureKey: "hasDietPlans" },
  // { label: "Refer & Earn",  href: "/owner/referral",     icon: Gift,            featureKey: "hasReferAndEarn" },
  { label: "Notifications", href: "/owner/notifications", icon: Bell },
  { label: "Reports",       href: "/owner/reports",      icon: BarChart3,       featureKey: "hasFullReports" },
  { label: "Subscriptions",  href: "/owner/subscriptions",      icon: Zap },
  { label: "Profile",      href: "/owner/profile",     icon: CircleUserRound },
]

function OwnerLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const { profile, loading: profileLoading } = useProfile()
  const sub       = useSubscription()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [signingOut,  setSigningOut]  = useState(false)

  // ── Unread notification count — polls every 60 s ────────────────────────
  const [unreadCount, setUnreadCount] = useState(0)
  useEffect(() => {
    const fetchUnread = () =>
      fetch("/api/notifications/unread-count")
        .then(r => r.json())
        .then(d => setUnreadCount(d.count ?? 0))
        .catch(() => {})
    fetchUnread()
    const interval = setInterval(fetchUnread, 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!profileLoading && profile && profile.role !== "owner") {
      router.replace("/select-role")
    }
  }, [profileLoading, profile, router])

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut({ callbackUrl: "/login" })
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`${mobile ? "flex" : "hidden lg:flex"} flex-col w-54 h-screen sticky top-0 shrink-0 bg-[hsl(220_25%_7%)] border-r border-white/5`}>
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/5 shrink-0">
        <div className="p-2 bg-gradient-primary rounded-xl">
          <Dumbbell className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-display font-bold text-white">GymStack</span>
      </div>

      <div className="flex-1 py-5 px-3 overflow-y-auto">
        <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest px-3 mb-3">Menu</p>
        <nav className="space-y-0.5">
          {navItems.map(({ label, href, icon: Icon, featureKey }) => {
            const isNotif  = label === "Notifications"
            const active   = pathname === href || pathname.startsWith(href + "/")
            const isLocked = featureKey ? !(sub as any)[featureKey] : false
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active     ? "bg-primary text-white font-semibold shadow-lg shadow-primary/20"
                  : isLocked ? "text-white/25 hover:text-white/40 hover:bg-white/3"
                  : "text-white/50 hover:text-white hover:bg-white/5"
                }`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {/* Unread badge on Notifications nav item */}
                {isNotif && unreadCount > 0 && (
                  <span className="ml-auto min-w-5 h-5 bg-primary rounded-full flex items-center justify-center px-1">
                    <span className="text-white text-[9px] font-bold leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  </span>
                )}
                {isLocked && !active && !isNotif && (
                  <Lock className="w-3 h-3 shrink-0 opacity-50" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <UsageMeter />

      <div className="border-t border-white/5 p-3 space-y-1 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <Avatar name={profile?.fullName ?? "Owner"} url={profile?.avatarUrl} size={32} />
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
    <div className="h-screen bg-[hsl(220_25%_6%)] flex overflow-hidden">
      <Sidebar />
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10"><Sidebar mobile /></div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <SubscriptionBanner />
        <header className="h-16 border-b border-white/5 bg-[hsl(220_25%_7%)] flex items-center justify-between px-6 gap-4 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white/50 hover:text-white">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-white font-semibold text-base capitalize hidden sm:block">
              {navItems.find(n => pathname.startsWith(n.href))?.label ?? "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2 w-52">
              <Search className="w-3.5 h-3.5 text-white/30" />
              <input placeholder="Search..." className="bg-transparent text-sm text-white placeholder:text-white/25 outline-none w-full" />
            </div>

            {/* Bell icon with live unread badge */}
            <Link href="/owner/notifications" className="relative p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 bg-primary rounded-full flex items-center justify-center px-1">
                  <span className="text-white text-[9px] font-bold leading-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary/40 rounded-full" />
              )}
            </Link>

            <Avatar name={profile?.fullName ?? "Owner"} url={profile?.avatarUrl} size={32} />
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionProvider>
      <OwnerLayoutInner>{children}</OwnerLayoutInner>
    </SubscriptionProvider>
  )
}
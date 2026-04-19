// src/app/member/notifications/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Bell, Dumbbell, CreditCard, Megaphone, CheckCheck, Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useMemberGym } from "@/contexts/MemberGymContext"
import { NoGymState } from "@/components/member/NoGymState"

const TYPE_ICON: Record<string, typeof Bell> = {
  PLAN_UPDATE:   Dumbbell,
  PAYMENT:       CreditCard,
  ANNOUNCEMENT:  Megaphone,
  GENERAL:       Bell,
  SYSTEM:        Bell,
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)   return "just now"
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-IN", { dateStyle: "medium" })
}

function groupByDate(notifications: any[]) {
  const now       = new Date()
  const todayStr  = now.toDateString()
  const yestDate  = new Date(now); yestDate.setDate(now.getDate() - 1)
  const yestStr   = yestDate.toDateString()
  const weekAgo   = new Date(now); weekAgo.setDate(now.getDate() - 7)

  const groups: Record<string, any[]> = {}
  for (const n of notifications) {
    const d = new Date(n.createdAt)
    let group: string
    if (d.toDateString() === todayStr) group = "Today"
    else if (d.toDateString() === yestStr) group = "Yesterday"
    else if (d >= weekAgo) group = "This Week"
    else group = "Older"
    if (!groups[group]) groups[group] = []
    groups[group].push(n)
  }
  return groups
}

export default function MemberNotificationsPage() {
  const { toast }                         = useToast()
  const { hasGym, gymLoading }            = useMemberGym()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const [loading, setLoading]             = useState(true)
  const [markingAll, setMarkingAll]       = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch("/api/member/notifications?page=1")
      .then(r => r.json())
      .then(d => {
        setNotifications(d.notifications ?? [])
        setUnreadCount(d.unreadCount ?? 0)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const markRead = async (id: string) => {
    const n = notifications.find(x => x.id === id)
    if (!n || n.isRead) return
    const res = await fetch(`/api/member/notifications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setNotifications(prev => prev.map(x => x.id === id ? { ...x, isRead: true } : x))
      setUnreadCount(c => Math.max(0, c - 1))
    }
  }

  const markAllRead = async () => {
    if (!unreadCount) return
    setMarkingAll(true)
    const res = await fetch(`/api/member/notifications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    })
    if (res.ok) {
      setNotifications(prev => prev.map(x => ({ ...x, isRead: true })))
      setUnreadCount(0)
      toast({ variant: "success", title: "All notifications marked as read" })
    } else {
      toast({ variant: "destructive", title: "Failed to mark as read" })
    }
    setMarkingAll(false)
  }

  if (loading || gymLoading) return (
    <div className="max-w-2xl space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-white/5 rounded" />
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-xl" />)}
      </div>
    </div>
  )

  if (!hasGym) return <NoGymState pageName="Notifications" />

  const groups = groupByDate(notifications)
  const groupOrder = ["Today", "Yesterday", "This Week", "Older"]

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h2>
          <p className="text-white/35 text-sm mt-0.5">{notifications.length} total</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} disabled={markingAll}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50">
            {markingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl">
          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center">
            <Bell className="w-7 h-7 text-white/20" />
          </div>
          <h3 className="text-white font-semibold">No notifications</h3>
          <p className="text-white/35 text-sm">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupOrder.map(groupName => {
            const items = groups[groupName]
            if (!items?.length) return null
            return (
              <div key={groupName}>
                <p className="text-white/30 text-xs uppercase tracking-wider font-semibold mb-2 px-1">{groupName}</p>
                <div className="space-y-2">
                  {items.map((n: any) => {
                    const Icon = TYPE_ICON[n.type] ?? Bell
                    return (
                      <button key={n.id} onClick={() => markRead(n.id)}
                        className={`w-full text-left flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                          n.isRead
                            ? "bg-[hsl(220_25%_9%)] border-white/6"
                            : "bg-[hsl(220_25%_10%)] border-primary/15 hover:border-primary/25"
                        }`}>
                        <div className={`p-2 rounded-xl shrink-0 ${n.isRead ? "bg-white/5" : "bg-primary/10"}`}>
                          <Icon className={`w-4 h-4 ${n.isRead ? "text-white/30" : "text-primary"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium truncate ${n.isRead ? "text-white/60" : "text-white"}`}>
                              {n.title}
                            </p>
                            <span className="text-white/25 text-[10px] shrink-0">{timeAgo(n.createdAt)}</span>
                          </div>
                          <p className="text-white/40 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                        {!n.isRead && (
                          <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

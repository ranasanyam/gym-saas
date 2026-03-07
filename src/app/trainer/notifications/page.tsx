// src/app/trainer/notifications/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Bell, Check, Loader2, BellOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const TYPE_EMOJI: Record<string,string> = {
  BILLING: "💳", CLASS_REMINDER: "⏰", PLAN_UPDATE: "💪",
  ANNOUNCEMENT: "📢", REFERRAL: "🎁", SYSTEM: "🔔",
}

export default function TrainerNotificationsPage() {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<any[]>([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [pages,   setPages]   = useState(1)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  const load = (p: number) => {
    setLoading(true)
    fetch(`/api/trainer/notifications?page=${p}`)
      .then(r => r.json())
      .then(d => { setNotifications(d.notifications ?? []); setTotal(d.total ?? 0); setPages(d.pages ?? 1) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load(page) }, [page])

  const markAllRead = async () => {
    setMarking(true)
    await fetch("/api/trainer/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    })
    setNotifications(n => n.map(x => ({ ...x, isRead: true })))
    toast({ variant: "success", title: "All marked as read" })
    setMarking(false)
  }

  const markRead = async (id: string) => {
    await fetch("/api/trainer/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    })
    setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x))
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Notifications</h2>
          {unreadCount > 0 && <p className="text-white/40 text-sm mt-0.5">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} disabled={marking}
            className="flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-50">
            {marking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Mark all read
          </button>
        )}
      </div>

      {loading && notifications.length === 0 ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-3">
          <BellOff className="w-10 h-10 text-white/15" />
          <p className="text-white/30 text-sm">No notifications yet</p>
        </div>
      ) : (
        <>
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl divide-y divide-white/4 overflow-hidden">
            {notifications.map(n => (
              <div key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${!n.isRead ? "bg-primary/4 cursor-pointer hover:bg-primary/6" : ""}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg ${!n.isRead ? "bg-primary/15" : "bg-white/5"}`}>
                  {TYPE_EMOJI[n.type] ?? "🔔"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${n.isRead ? "text-white/60" : "text-white"}`}>{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </div>
                  {n.message && <p className="text-white/35 text-xs mt-1 leading-relaxed">{n.message}</p>}
                  <p className="text-white/25 text-xs mt-1.5">
                    {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}
                    {new Date(n.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white disabled:opacity-30 text-sm">Previous</button>
              <span className="text-white/30 text-sm">{page} / {pages}</span>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white disabled:opacity-30 text-sm">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
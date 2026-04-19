// src/app/trainer/notifications/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Bell, Send, X, Loader2, Trash2, Megaphone, Search, Inbox } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface Announcement {
  id: string; title: string; body: string; targetRole: string | null
  publishedAt: string | null; expiresAt: string | null; createdAt: string
  author: { fullName: string }; gym: { name: string }
}

interface InboxNotification {
  id: string; title: string; message: string | null; type: string
  isRead: boolean; createdAt: string
}

const CATEGORIES = ["General","Reminder","Offer","Holiday","Diet Plan","Workout Plan","Payment"]

const CAT_EMOJI: Record<string, string> = {
  General: "📢", Reminder: "⏰", Offer: "🎁", Holiday: "🏖️",
  "Diet Plan": "🍎", "Workout Plan": "💪", Payment: "💳",
}

const CAT_COLORS: Record<string, string> = {
  General:        "bg-blue-500/15 text-blue-400",
  Reminder:       "bg-yellow-500/15 text-yellow-400",
  Offer:          "bg-green-500/15 text-green-400",
  Holiday:        "bg-purple-500/15 text-purple-400",
  "Diet Plan":    "bg-orange-500/15 text-orange-400",
  "Workout Plan": "bg-cyan-500/15 text-cyan-400",
  Payment:        "bg-pink-500/15 text-pink-400",
}

const TYPE_EMOJI: Record<string, string> = {
  BILLING: "💳", CLASS_REMINDER: "⏰", PLAN_UPDATE: "💪",
  ANNOUNCEMENT: "📢", REFERRAL: "🎁", SYSTEM: "🔔",
}

export default function TrainerNotificationsPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState<"sent" | "inbox">("sent")

  // Sent
  const [sent, setSent]             = useState<Announcement[]>([])
  const [loadingSent, setLoadingSent] = useState(true)
  const [activeFilter, setActiveFilter] = useState("All")
  const [searchQ, setSearchQ]       = useState("")

  // Inbox
  const [inbox, setInbox]               = useState<InboxNotification[]>([])
  const [loadingInbox, setLoadingInbox] = useState(true)
  const [inboxPage, setInboxPage]       = useState(1)
  const [inboxPages, setInboxPages]     = useState(1)
  const [inboxTotal, setInboxTotal]     = useState(0)

  // Form
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [form, setForm]         = useState({ title: "", body: "", category: "General", expiresAt: "" })

  const loadSent = () => {
    setLoadingSent(true)
    fetch("/api/trainer/notifications")
      .then(r => r.json())
      .then(d => setSent(Array.isArray(d) ? d : []))
      .finally(() => setLoadingSent(false))
  }

  const loadInbox = (page = 1) => {
    setLoadingInbox(true)
    fetch(`/api/trainer/notifications?type=inbox&page=${page}`)
      .then(r => r.json())
      .then(d => {
        setInbox(d.notifications ?? [])
        setInboxTotal(d.total ?? 0)
        setInboxPages(d.pages ?? 1)
        setInboxPage(page)
      })
      .finally(() => setLoadingInbox(false))
  }

  useEffect(() => { loadSent(); loadInbox() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) {
      toast({ variant: "destructive", title: "Title and message are required" }); return
    }
    setSaving(true)
    const res = await fetch("/api/trainer/notifications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        body: `[${form.category}] ${form.body}`,
        expiresAt: form.expiresAt || null,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      const count = data.recipientCount ?? 0
      toast({ variant: "success", title: "Notification sent!", description: `Delivered to ${count} assigned member${count !== 1 ? "s" : ""}` })
      setShowForm(false)
      setForm({ title: "", body: "", category: "General", expiresAt: "" })
      loadSent()
    } else {
      const data = await res.json()
      toast({ variant: "destructive", title: data.error ?? "Failed to send" })
    }
    setSaving(false)
  }

  const remove = async (id: string) => {
    await fetch(`/api/trainer/notifications?id=${id}`, { method: "DELETE" })
    setSent(p => p.filter(i => i.id !== id))
    toast({ title: "Deleted" })
  }

  const markAllRead = async () => {
    await fetch("/api/trainer/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    })
    setInbox(p => p.map(n => ({ ...n, isRead: true })))
    toast({ variant: "success", title: "All marked as read" })
  }

  const parseCategory = (body: string) => body.match(/^\[(.+?)\]/)?.[1] ?? "General"
  const parseBody     = (body: string) => body.replace(/^\[.+?\] /, "")

  const filteredSent = sent.filter(item => {
    const cat = parseCategory(item.body)
    const matchCat    = activeFilter === "All" || cat === activeFilter
    const matchSearch = !searchQ || item.title.toLowerCase().includes(searchQ.toLowerCase()) || item.body.toLowerCase().includes(searchQ.toLowerCase())
    return matchCat && matchSearch
  })

  const unread = inbox.filter(n => !n.isRead).length

  const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl text-sm"

  return (
    <div className="max-w-5xl">
      {/* Tab row + actions */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex bg-[hsl(220_25%_7%)] border border-white/5 rounded-xl p-1 gap-1">
          <button onClick={() => setTab("sent")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "sent" ? "bg-[hsl(220_25%_12%)] text-white shadow" : "text-white/40 hover:text-white/70"
            }`}>
            <Megaphone className="w-3.5 h-3.5" /> Sent
          </button>
          <button onClick={() => setTab("inbox")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
              tab === "inbox" ? "bg-[hsl(220_25%_12%)] text-white shadow" : "text-white/40 hover:text-white/70"
            }`}>
            <Inbox className="w-3.5 h-3.5" /> Inbox
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        </div>

        {tab === "sent" && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
              <Input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="Search..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-9 rounded-xl text-sm pl-9 w-44" />
            </div>
            <button onClick={() => setShowForm(true)}
              className="ml-auto flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
              <Send className="w-4 h-4" /> Send Notification
            </button>
          </>
        )}

        {tab === "inbox" && unread > 0 && (
          <button onClick={markAllRead}
            className="ml-auto text-sm text-primary hover:text-primary/80 transition-colors">
            Mark all as read
          </button>
        )}
      </div>

      {/* ── SENT TAB ── */}
      {tab === "sent" && (
        <>
          {/* Category filter tabs */}
          <div className="flex items-center gap-1 bg-[hsl(220_25%_7%)] border border-white/5 rounded-xl p-1 mb-5 overflow-x-auto">
            {["All", ...CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setActiveFilter(cat)}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap font-medium transition-all ${
                  activeFilter === cat
                    ? "bg-[hsl(220_25%_12%)] text-white shadow"
                    : "text-white/40 hover:text-white/70"
                }`}>{cat}</button>
            ))}
          </div>

          {/* Send form */}
          {showForm && (
            <div className="bg-[hsl(220_25%_9%)] border border-primary/20 rounded-2xl p-6 mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-primary" /> New Notification
                </h3>
                <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-white/35 text-xs -mt-2">Will be sent to your assigned members only.</p>
              <form onSubmit={submit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-white/55 text-sm">Category</Label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/55 text-sm">Expires On <span className="text-white/30">(optional)</span></Label>
                    <Input type="datetime-local" value={form.expiresAt}
                      onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                      className={inp} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/55 text-sm">Title <span className="text-primary">*</span></Label>
                  <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. New workout plan available" className={inp} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/55 text-sm">Message <span className="text-primary">*</span></Label>
                  <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} rows={3}
                    placeholder="Write your notification message here..."
                    className="w-full bg-[hsl(220_25%_11%)] border border-white/10 rounded-xl text-white text-sm p-3 focus:outline-none focus:border-primary placeholder:text-white/20 resize-none" />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}
                    className="border-white/10 text-white/60 hover:text-white h-10 bg-white/5 hover:bg-white/10 text-sm">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}
                    className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-10 text-sm px-6 gap-2">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Send</>}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Sent list */}
          {loadingSent ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/3 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="bg-[hsl(220_25%_7%)] border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/6">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-primary" />
                  Sent Notifications ({filteredSent.length})
                </h3>
              </div>
              {filteredSent.length === 0 ? (
                <div className="text-center py-16">
                  <Megaphone className="w-10 h-10 text-white/10 mx-auto mb-3" />
                  <p className="text-white/30 text-sm">
                    {activeFilter === "All" ? "No notifications sent yet." : `No ${activeFilter} notifications found.`}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/4">
                  {filteredSent.map(item => {
                    const cat      = parseCategory(item.body)
                    const body     = parseBody(item.body)
                    const emoji    = CAT_EMOJI[cat] ?? "📢"
                    const catColor = CAT_COLORS[cat] ?? "bg-white/8 text-white/50"
                    return (
                      <div key={item.id} className="flex items-start gap-4 px-5 py-4 hover:bg-white/2 transition-colors group">
                        <div className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-base shrink-0 mt-0.5">
                          {emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-white text-sm font-semibold">{item.title}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor}`}>{cat}</span>
                            <span className="text-xs bg-white/6 text-white/35 px-2 py-0.5 rounded-full">{item.gym.name}</span>
                            <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">Assigned members</span>
                          </div>
                          <p className="text-white/50 text-sm leading-relaxed">{body}</p>
                          <p className="text-white/25 text-xs mt-1.5">
                            {new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                            {item.expiresAt && ` · Expires ${new Date(item.expiresAt).toLocaleDateString("en-IN")}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-white/30 text-xs whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <button onClick={() => remove(item.id)}
                            className="text-white/15 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── INBOX TAB ── */}
      {tab === "inbox" && (
        <div className="bg-[hsl(220_25%_7%)] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/6 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h3 className="text-white font-semibold">Inbox ({inboxTotal})</h3>
            {unread > 0 && (
              <span className="ml-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{unread} unread</span>
            )}
          </div>

          {loadingInbox ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white/3 rounded-xl animate-pulse" />)}
            </div>
          ) : inbox.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">No notifications received yet.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-white/4">
                {inbox.map(n => (
                  <div key={n.id} className={`flex items-start gap-4 px-5 py-4 transition-colors ${n.isRead ? "hover:bg-white/2" : "bg-primary/3 hover:bg-primary/5"}`}>
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.isRead ? "bg-transparent" : "bg-primary"}`} />
                    <div className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-base shrink-0">
                      {TYPE_EMOJI[n.type] ?? "🔔"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${n.isRead ? "text-white/70" : "text-white"}`}>{n.title}</p>
                      {n.message && <p className="text-white/45 text-sm mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>}
                      <p className="text-white/25 text-xs mt-1.5">
                        {new Date(n.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {inboxPages > 1 && (
                <div className="flex items-center justify-center gap-2 px-5 py-4 border-t border-white/5">
                  <button onClick={() => loadInbox(inboxPage - 1)} disabled={inboxPage === 1}
                    className="text-sm text-white/50 hover:text-white disabled:opacity-30 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all">
                    Previous
                  </button>
                  <span className="text-white/30 text-sm">{inboxPage} / {inboxPages}</span>
                  <button onClick={() => loadInbox(inboxPage + 1)} disabled={inboxPage === inboxPages}
                    className="text-sm text-white/50 hover:text-white disabled:opacity-30 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all">
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

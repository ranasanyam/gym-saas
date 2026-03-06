// src/app/owner/notifications/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Bell, Send, X, Loader2, Trash2, Megaphone, Search,
  ChevronDown, Filter
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface Announcement {
  id: string; title: string; body: string; targetRole: string | null
  publishedAt: string | null; expiresAt: string | null; createdAt: string
  author: { fullName: string }; gym: { name: string }
}

// Map from UI category → what goes in announcement body/title as tag
const CATEGORIES = ["General","Reminder","Offer","Holiday","Diet Plan","Workout Plan","Payment"]

// Icon emojis per category (shown in the notification card)
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

const ROLE_BADGE: Record<string, string> = {
  MEMBER:  "bg-blue-500/15 text-blue-400",
  TRAINER: "bg-purple-500/15 text-purple-400",
  OWNER:   "bg-orange-500/15 text-orange-400",
}

export default function NotificationsPage() {
  const { toast } = useToast()
  const [items, setItems]   = useState<Announcement[]>([])
  const [gyms, setGyms]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [activeFilter, setActiveFilter] = useState("All")
  const [selectedGym, setSelectedGym] = useState("")    // for filtering list
  const [searchQ, setSearchQ] = useState("")

  const [form, setForm] = useState({
    gymId: "", title: "", body: "",
    targetRole: "", category: "General",
    expiresAt: "",
  })

  const load = () => {
    Promise.all([
      fetch("/api/owner/notifications").then(r => r.json()),
      fetch("/api/owner/gyms").then(r => r.json()),
    ]).then(([a, g]) => {
      setItems(Array.isArray(a) ? a : [])
      setGyms(g)
      if (g.length > 0) setForm(prev => ({ ...prev, gymId: g[0].id }))
      if (g.length > 0) setSelectedGym("")
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) {
      toast({ variant: "destructive", title: "Title and message are required" }); return
    }
    setSaving(true)
    // Embed category in body as a prefix tag so we can filter it back out
    const res = await fetch("/api/owner/notifications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gymId: form.gymId,
        title: form.title,
        body: `[${form.category}] ${form.body}`,
        targetRole: form.targetRole || null,
        expiresAt: form.expiresAt || null,
      }),
    })
    if (res.ok) {
      toast({ variant: "success", title: "Notification sent!" })
      setShowForm(false)
      setForm(p => ({ ...p, title: "", body: "", targetRole: "", category: "General", expiresAt: "" }))
      load()
    } else toast({ variant: "destructive", title: "Failed to send" })
    setSaving(false)
  }

  const remove = async (id: string) => {
    await fetch(`/api/owner/notifications?id=${id}`, { method: "DELETE" })
    setItems(p => p.filter(i => i.id !== id))
    toast({ title: "Deleted" })
  }

  // Parse category out of body
  const parseCategory = (body: string): string => {
    const match = body.match(/^\[(.+?)\]/)
    return match ? match[1] : "General"
  }
  const parseBody = (body: string): string => body.replace(/^\[.+?\] /, "")

  // Filter items
  const filtered = items.filter(item => {
    const cat = parseCategory(item.body)
    const matchCat  = activeFilter === "All" || cat === activeFilter
    const matchGym  = !selectedGym || item.gym.name === selectedGym
    const matchSearch = !searchQ || item.title.toLowerCase().includes(searchQ.toLowerCase()) || item.body.toLowerCase().includes(searchQ.toLowerCase())
    return matchCat && matchGym && matchSearch
  })

  const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl text-sm"

  return (
    <div className="max-w-5xl">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          <Input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Search..."
            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-9 rounded-xl text-sm pl-9" />
        </div>

        {gyms.length > 1 && (
          <select value={selectedGym} onChange={e => setSelectedGym(e.target.value)}
            className="bg-white/5 border border-white/10 text-white/70 rounded-xl px-3 h-9 text-sm focus:outline-none focus:border-primary">
            <option value="">All Gyms</option>
            {gyms.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
          </select>
        )}

        <button onClick={() => setShowForm(true)}
          className="ml-auto flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
          <Send className="w-4 h-4" /> Send Notification
        </button>
      </div>

      {/* ── Category filter tabs ── */}
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

      {/* ── Send form ── */}
      {showForm && (
        <div className="bg-[hsl(220_25%_9%)] border border-primary/20 rounded-2xl p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" /> New Notification
            </h3>
            <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Gym <span className="text-primary">*</span></Label>
                <select value={form.gymId} onChange={e => setForm(p => ({ ...p, gymId: e.target.value }))}
                  className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary">
                  {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Category</Label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Target Audience</Label>
                <select value={form.targetRole} onChange={e => setForm(p => ({ ...p, targetRole: e.target.value }))}
                  className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-10 text-sm focus:outline-none focus:border-primary">
                  <option value="">Everyone</option>
                  <option value="MEMBER">Members only</option>
                  <option value="TRAINER">Trainers only</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/55 text-sm">Title <span className="text-primary">*</span></Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Gym closed on Sunday" className={inp} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/55 text-sm">Message <span className="text-primary">*</span></Label>
              <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} rows={3}
                placeholder="Write your notification message here..."
                className="w-full bg-[hsl(220_25%_11%)] border border-white/10 rounded-xl text-white text-sm p-3 focus:outline-none focus:border-primary placeholder:text-white/20 resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/55 text-sm">Expires On <span className="text-white/30">(optional)</span></Label>
              <Input type="datetime-local" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                className={`${inp} w-fit`} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}
                className="border-white/10 text-white/60 hover:text-white h-10 text-sm">Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-10 text-sm px-6 gap-2">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Send</>}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Notification list ── */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/3 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-[hsl(220_25%_7%)] border border-white/5 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/6">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Notifications ({filtered.length})
            </h3>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">
                {activeFilter === "All" ? "No notifications yet. Send your first one." : `No ${activeFilter} notifications found.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/4">
              {filtered.map(item => {
                const cat  = parseCategory(item.body)
                const body = parseBody(item.body)
                const emoji = CAT_EMOJI[cat] ?? "📢"
                const catColor = CAT_COLORS[cat] ?? "bg-white/8 text-white/50"
                return (
                  <div key={item.id} className="flex items-start gap-4 px-5 py-4 hover:bg-white/2 transition-colors group">
                    {/* Emoji icon */}
                    <div className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-base shrink-0 mt-0.5">
                      {emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-white text-sm font-semibold">{item.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor}`}>{cat}</span>
                        <span className="text-xs bg-white/6 text-white/35 px-2 py-0.5 rounded-full">{item.gym.name}</span>
                        {item.targetRole && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_BADGE[item.targetRole] ?? ""}`}>
                            {item.targetRole.toLowerCase()}s
                          </span>
                        )}
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
    </div>
  )
}
// src/app/member/announcements/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { Megaphone, Search, ChevronLeft, ChevronRight, Building2 } from "lucide-react"
import { useMemberGym } from "@/contexts/MemberGymContext"
import { NoGymState } from "@/components/member/NoGymState"

const ROLE_STYLE: Record<string, string> = {
  MEMBER:  "bg-blue-500/15 text-blue-400 border-blue-500/20",
  TRAINER: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  OWNER:   "bg-orange-500/15 text-orange-400 border-orange-500/20",
  ALL:     "bg-green-500/15 text-green-400 border-green-500/20",
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

export default function MemberAnnouncementsPage() {
  const { hasGym, gymLoading }            = useMemberGym()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [total, setTotal]   = useState(0)
  const [pages, setPages]   = useState(1)
  const [page, setPage]     = useState(1)
  const [loading, setLoading] = useState(true)
  const [query, setQuery]   = useState("")
  const [search, setSearch] = useState("")

  const load = useCallback((p: number) => {
    setLoading(true)
    fetch(`/api/member/announcements?page=${p}`)
      .then(r => r.json())
      .then(d => {
        setAnnouncements(d.announcements ?? [])
        setTotal(d.total ?? 0)
        setPages(d.pages ?? 1)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(page) }, [load, page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(query)
    setPage(1)
  }

  if (gymLoading) return (
    <div className="max-w-3xl space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-white/5 rounded" />
      <div className="h-11 bg-white/5 rounded-xl" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-2xl" />)}
      </div>
    </div>
  )

  if (!hasGym) return <NoGymState pageName="Announcements" />

  const filtered = search
    ? announcements.filter(a =>
        a.title?.toLowerCase().includes(search.toLowerCase()) ||
        a.body?.toLowerCase().includes(search.toLowerCase())
      )
    : announcements

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-primary" />
          Announcements
        </h2>
        <p className="text-white/35 text-sm mt-0.5">{total} announcement{total !== 1 ? "s" : ""} from your gym</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search announcements…"
          className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl pl-11 pr-4 h-11 text-sm focus:outline-none focus:border-primary placeholder:text-white/25"
        />
      </form>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 space-y-3 animate-pulse">
              <div className="flex items-start justify-between gap-4">
                <div className="h-4 bg-white/5 rounded w-1/2" />
                <div className="h-4 bg-white/5 rounded w-16 shrink-0" />
              </div>
              <div className="h-3 bg-white/5 rounded w-full" />
              <div className="h-3 bg-white/5 rounded w-3/4" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-white/5 rounded-full" />
                <div className="h-5 w-20 bg-white/5 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
            <Megaphone className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-white font-semibold">No announcements</h3>
          <p className="text-white/35 text-sm text-center max-w-xs">
            {search
              ? "No announcements match your search."
              : "Your gym hasn't posted any announcements yet."}
          </p>
          {search && (
            <button
              onClick={() => { setQuery(""); setSearch("") }}
              className="text-primary text-sm hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a: any) => (
            <div key={a.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 space-y-3 hover:border-white/10 transition-colors">
              {/* Title + time */}
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-white font-semibold leading-snug">{a.title}</h3>
                <span className="text-white/30 text-[10px] shrink-0 mt-0.5">
                  {timeAgo(a.publishedAt ?? a.createdAt)}
                </span>
              </div>

              {/* Body */}
              <p className="text-white/55 text-sm leading-relaxed">{a.body}</p>

              {/* Footer */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {a.targetRole && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${ROLE_STYLE[a.targetRole] ?? "bg-white/8 text-white/40 border-white/10"}`}>
                    {a.targetRole === "ALL" ? "Everyone" : a.targetRole}
                  </span>
                )}
                {a.gym?.name && (
                  <span className="flex items-center gap-1 text-[10px] text-white/30">
                    <Building2 className="w-3 h-3" />
                    {a.gym.name}
                  </span>
                )}
                {a.expiresAt && (
                  <span className="text-[10px] text-white/25">
                    Expires {new Date(a.expiresAt).toLocaleDateString("en-IN", { dateStyle: "short" })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/8 text-white/60 hover:text-white disabled:opacity-30 text-sm transition-colors">
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-white/40 text-sm">{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/8 text-white/60 hover:text-white disabled:opacity-30 text-sm transition-colors">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

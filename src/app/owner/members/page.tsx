"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/owner/PageHeader"
import { EmptyState } from "@/components/owner/EmptyState"
import { Users, Search, Filter, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Member {
  id: string; status: string; startDate: string; endDate: string | null
  profile: { fullName: string; email: string; mobileNumber: string | null; avatarUrl: string | null }
  gym: { name: string }
  membershipPlan: { name: string; durationMonths: number } | null
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), ...(search && { search }), ...(status && { status }) })
    fetch(`/api/owner/members?${params}`)
      .then(r => r.json())
      .then(d => { setMembers(d.members); setTotal(d.total); setPages(d.pages) })
      .finally(() => setLoading(false))
  }, [page, search, status])

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-6xl">
      <PageHeader title="Members" subtitle={`${total} total members`}
        action={{ label: "Add Member", href: "/owner/members/new", icon: Plus }} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <Input placeholder="Search by name..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-10 pl-9" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="bg-white/5 border border-white/10 text-white/70 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white/3 rounded-xl animate-pulse" />)}
        </div>
      ) : members.length === 0 ? (
        <EmptyState icon={Users} title="No members found"
          description="Add your first member or adjust your search filters."
          action={{ label: "Add Member", href: "/owner/members/new" }} />
      ) : (
        <>
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_100px] gap-4 px-5 py-3 border-b border-white/5 text-xs text-white/35 font-medium uppercase tracking-wider">
              <span>Member</span><span>Plan</span><span>Gym</span><span>Expires</span><span>Status</span>
            </div>
            <div className="divide-y divide-white/4">
              {members.map(m => (
                <Link key={m.id} href={`/owner/members/${m.id}`}
                  className="grid grid-cols-[1fr_1fr_1fr_1fr_100px] gap-4 px-5 py-4 hover:bg-white/3 transition-colors items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {getInitials(m.profile.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{m.profile.fullName}</p>
                      <p className="text-white/35 text-xs truncate">{m.profile.email}</p>
                    </div>
                  </div>
                  <span className="text-white/60 text-sm truncate">{m.membershipPlan?.name ?? "—"}</span>
                  <span className="text-white/60 text-sm truncate">{m.gym.name}</span>
                  <span className="text-white/60 text-sm">{m.endDate ? new Date(m.endDate).toLocaleDateString("en-IN") : "—"}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium w-fit ${
                    m.status === "ACTIVE" ? "bg-green-500/15 text-green-400"
                    : m.status === "EXPIRED" ? "bg-red-500/15 text-red-400"
                    : "bg-white/8 text-white/40"
                  }`}>{m.status}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <p className="text-white/35 text-sm">{total} members</p>
              <div className="flex items-center gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/20 disabled:opacity-30 transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-white/60 text-sm px-2">Page {page} of {pages}</span>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                  className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/20 disabled:opacity-30 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
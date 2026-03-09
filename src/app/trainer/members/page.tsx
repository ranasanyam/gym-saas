// src/app/trainer/members/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Users, Search, Phone, Mail, ChevronRight, Loader2, Calendar } from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"
import { Input } from "@/components/ui/input"

export default function TrainerMembersPage() {
  const [members, setMembers]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState("")

  const load = useCallback((s: string) => {
    setLoading(true)
    const params = new URLSearchParams(s ? { search: s } : {})
    fetch(`/api/trainer/members?${params}`)
      .then(r => r.json())
      .then(d => setMembers(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load("") }, [load])

  const handleSearch = (val: string) => {
    setSearch(val)
    const t = setTimeout(() => load(val), 300)
    return () => clearTimeout(t)
  }

  const active   = members.filter(m => m.status === "ACTIVE").length
  const expiring = members.filter(m => {
    if (!m.endDate || m.status !== "ACTIVE") return false
    return Math.ceil((new Date(m.endDate).getTime() - Date.now()) / 86400000) <= 7
  }).length

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">My Members</h2>
          <p className="text-white/35 text-sm mt-0.5">{members.length} assigned · {active} active</p>
        </div>
        {expiring > 0 && (
          <span className="text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 px-3 py-1.5 rounded-full font-medium">
            ⚠ {expiring} expiring soon
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
        <Input
          placeholder="Search members..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="bg-[hsl(220_25%_9%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <Users className="w-10 h-10 text-white/15" />
          <p className="text-white/30 text-sm">{search ? "No members found" : "No members assigned to you yet"}</p>
        </div>
      ) : (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/4">
            {members.map(m => {
              const daysLeft = m.endDate
                ? Math.ceil((new Date(m.endDate).getTime() - Date.now()) / 86400000)
                : null
              const nearExpiry = daysLeft !== null && daysLeft <= 7 && m.status === "ACTIVE"
              const lastSeen   = m.attendance?.[0]?.checkInTime

              return (
                <Link key={m.id} href={`/trainer/members/${m.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors group">
                  <Avatar name={m.profile.fullName} url={m.profile.avatarUrl} size={42} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-medium group-hover:text-primary transition-colors">{m.profile.fullName}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        m.status === "ACTIVE"    ? "bg-green-500/15 text-green-400"
                        : m.status === "EXPIRED" ? "bg-red-500/15 text-red-400"
                        : "bg-yellow-500/15 text-yellow-400"
                      }`}>{m.status}</span>
                      {nearExpiry && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-medium">
                          {daysLeft === 0 ? "Expires today" : `${daysLeft}d left`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-white/35 flex-wrap">
                      {m.profile.mobileNumber && (
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{m.profile.mobileNumber}</span>
                      )}
                      {m.membershipPlan && (
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{m.membershipPlan.name}</span>
                      )}
                      {lastSeen && (
                        <span>Last seen: {new Date(lastSeen).toLocaleDateString("en-IN")}</span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-primary transition-colors shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
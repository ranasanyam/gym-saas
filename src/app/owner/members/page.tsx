
// "use client"

// import { useEffect, useState, useCallback } from "react"
// import Link from "next/link"
// import { PageHeader } from "@/components/owner/PageHeader"
// import { EmptyState } from "@/components/owner/EmptyState"
// import { Users, Search, Filter, Plus, ChevronLeft, ChevronRight } from "lucide-react"
// import { Input } from "@/components/ui/input"
// import { Avatar } from "@/components/ui/Avatar"

// interface Member {
//   id: string; status: string; startDate: string; endDate: string | null
//   profile: { fullName: string; email: string; mobileNumber: string | null; avatarUrl: string | null }
//   gym: { name: string }
//   membershipPlan: { name: string; durationMonths: number } | null
// }

// export default function MembersPage() {
//   const [members, setMembers] = useState<Member[]>([])
//   const [total, setTotal] = useState(0)
//   const [pages, setPages] = useState(1)
//   const [page, setPage] = useState(1)
//   const [search, setSearch] = useState("")
//   const [status, setStatus] = useState("")
//   const [loading, setLoading] = useState(true)

//   const load = useCallback(() => {
//     setLoading(true)
//     const params = new URLSearchParams({ page: String(page), ...(search && { search }), ...(status && { status }) })
//     fetch(`/api/owner/members?${params}`)
//       .then(r => r.json())
//       .then(d => { setMembers(d.members); setTotal(d.total); setPages(d.pages) })
//       .finally(() => setLoading(false))
//   }, [page, search, status])

//   useEffect(() => { load() }, [load])

//   return (
//     <div className="max-w-6xl">
//       <PageHeader title="Members" subtitle={`${total} total members`}
//         action={{ label: "Add Member", href: "/owner/members/new", icon: Plus }} />

//       {/* Filters */}
//       <div className="flex flex-col sm:flex-row gap-3 mb-6">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
//           <Input placeholder="Search by name..." value={search}
//             onChange={e => { setSearch(e.target.value); setPage(1) }}
//             className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-10 pl-9" />
//         </div>
//         <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
//           className="bg-white/5 border border-white/10 text-white/70 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary">
//           <option value="">All Status</option>
//           <option value="ACTIVE">Active</option>
//           <option value="EXPIRED">Expired</option>
//           <option value="SUSPENDED">Suspended</option>
//         </select>
//       </div>

//       {/* Table */}
//       {loading ? (
//         <div className="space-y-3">
//           {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white/3 rounded-xl animate-pulse" />)}
//         </div>
//       ) : members.length === 0 ? (
//         <EmptyState icon={Users} title="No members found"
//           description="Add your first member or adjust your search filters."
//           action={{ label: "Add Member", href: "/owner/members/new" }} />
//       ) : (
//         <>
//           <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
//             <div className="grid grid-cols-[1fr_1fr_1fr_1fr_100px] gap-4 px-5 py-3 border-b border-white/5 text-xs text-white/35 font-medium uppercase tracking-wider">
//               <span>Member</span><span>Plan</span><span>Gym</span><span>Expires</span><span>Status</span>
//             </div>
//             <div className="divide-y divide-white/4">
//               {members.map(m => (
//                 <Link key={m.id} href={`/owner/members/${m.id}`}
//                   className="grid grid-cols-[1fr_1fr_1fr_1fr_100px] gap-4 px-5 py-4 hover:bg-white/3 transition-colors items-center">
//                   <div className="flex items-center gap-3 min-w-0">
//                     <Avatar name={m.profile.fullName} url={m.profile.avatarUrl} size={32} />
//                     <div className="min-w-0">
//                       <p className="text-white text-sm font-medium truncate">{m.profile.fullName}</p>
//                       <p className="text-white/35 text-xs truncate">{m.profile.email}</p>
//                     </div>
//                   </div>
//                   <span className="text-white/60 text-sm truncate">{m.membershipPlan?.name ?? "—"}</span>
//                   <span className="text-white/60 text-sm truncate">{m.gym.name}</span>
//                   <span className="text-white/60 text-sm">{m.endDate ? new Date(m.endDate).toLocaleDateString("en-IN") : "—"}</span>
//                   <span className={`text-xs px-2.5 py-1 rounded-full font-medium w-fit ${
//                     m.status === "ACTIVE" ? "bg-green-500/15 text-green-400"
//                     : m.status === "EXPIRED" ? "bg-red-500/15 text-red-400"
//                     : "bg-white/8 text-white/40"
//                   }`}>{m.status}</span>
//                 </Link>
//               ))}
//             </div>
//           </div>

//           {/* Pagination */}
//           {pages > 1 && (
//             <div className="flex items-center justify-between mt-5">
//               <p className="text-white/35 text-sm">{total} members</p>
//               <div className="flex items-center gap-2">
//                 <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
//                   className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/20 disabled:opacity-30 transition-all">
//                   <ChevronLeft className="w-4 h-4" />
//                 </button>
//                 <span className="text-white/60 text-sm px-2">Page {page} of {pages}</span>
//                 <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
//                   className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/20 disabled:opacity-30 transition-all">
//                   <ChevronRight className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   )
// }

// src/app/owner/members/page.tsx
"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/owner/PageHeader"
import { EmptyState } from "@/components/owner/EmptyState"
import { UpgradeButton } from "@/components/owner/PlanGate"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { Users, Search, UserPlus, ChevronDown, Loader2, Lock } from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"

interface Member {
  id: string; status: string; startDate: string; endDate: string | null
  profile: { fullName: string; email: string; mobileNumber: string | null; avatarUrl: string | null }
  membershipPlan: { name: string; price: number } | null
  gym: { name: string }
}

function MembersContent() {
  const { canAddMember, isExpired, limits, usage } = useSubscription()
  const searchParams = useSearchParams()
  const [members, setMembers] = useState<Member[]>([])
  const [gyms, setGyms] = useState<{ id: string; name: string }[]>([])
  const [gymId, setGymId] = useState(searchParams.get("gymId") ?? "")
  const [status, setStatus] = useState("")
  const [search, setSearch] = useState("")
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (gymId) p.set("gymId", gymId)
    if (status) p.set("status", status)
    if (search) p.set("search", search)
    fetch(`/api/owner/members?${p}`).then(r => r.json()).then(d => {
      setMembers(d.members ?? [])
      setTotal(d.total ?? 0)
    }).catch(() => { }).finally(() => setLoading(false))
  }, [gymId, status, search])

  useEffect(() => {
    fetch("/api/owner/gyms").then(r => r.json()).then(g => { if (Array.isArray(g)) setGyms(g) })
  }, [])
  useEffect(() => { load() }, [load])

  const atLimit = !canAddMember

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {gyms.length > 1 && (
          <div className="relative">
            <select value={gymId} onChange={e => setGymId(e.target.value)}
              className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white/70 rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none cursor-pointer">
              <option value="">All Gyms</option>
              {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>
        )}
        <div className="relative">
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white/70 rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none cursor-pointer">
            <option value="">All Status</option>
            {["ACTIVE", "INACTIVE", "EXPIRED", "SUSPENDED"].map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 h-10 flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..."
            className="bg-transparent text-sm text-white placeholder:text-white/25 outline-none w-full" />
        </div>

        {/* Add member button or limit indicator */}
        {atLimit ? (
          <div className="ml-auto flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2 text-white/30 text-xs bg-white/5 border border-white/8 rounded-xl px-3 py-2">
              <Lock className="w-3.5 h-3.5" />
              Member limit ({usage?.members ?? 0}/{limits?.maxMembers})
            </div>
            <UpgradeButton label="Upgrade for more members" />
          </div>
        ) : (
          <div className="ml-auto flex items-center gap-2">
            <Link href="/owner/members/bulk"
              className="flex items-center gap-2 border border-white/10 bg-white/5 text-white/70 hover:text-white text-sm px-4 py-2.5 rounded-xl hover:border-white/20 transition-all">
              <Users className="w-4 h-4" /> Bulk Add
            </Link>
            <Link href="/owner/members/new"
              className="flex items-center gap-2 bg-linear-to-r from-primary to-orange-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90">
              <UserPlus className="w-4 h-4" /> Add Member
            </Link>
          </div>
        )}
      </div>

      <p className="text-white/30 text-xs">{total} total members</p>

      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
      ) : members.length === 0 ? (
        <EmptyState icon={Users} title="No members found" description="Add your first member to get started."
          action={!atLimit ? { label: "Add Member", href: "/owner/members/new" } : undefined} />
      ) : (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
          <div className="overflow-x-scroll">
            <table className="w-full text-sm overflow-x-scroll">
            <thead>
              <tr className="border-b border-white/5">
                {["Member", "Gym", "Plan", "Status", "Expires", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-white/30 text-xs font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {members.map(m => {
                const expiring = m.endDate
                  ? Math.ceil((new Date(m.endDate).getTime() - Date.now()) / 86400000)
                  : null
                return (
                  <tr key={m.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.profile.fullName} url={m.profile.avatarUrl} size={32} />
                        <div>
                          <p className="text-white font-medium text-sm">{m.profile.fullName}</p>
                          <p className="text-white/35 text-xs">{m.profile.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/50">{m.gym.name}</td>
                    <td className="px-4 py-3 text-white/50">{m.membershipPlan?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${m.status === "ACTIVE" ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : m.status === "EXPIRED" ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-white/5 text-white/40 border-white/10"
                        }`}>{m.status}</span>
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs">
                      {m.endDate
                        ? expiring !== null && expiring < 0
                          ? <span className="text-red-400">{Math.abs(expiring)} days ago expired</span>
                          : expiring !== null && expiring <= 7
                          ? <span className="text-yellow-400">⚠ {expiring}d left</span>
                          : new Date(m.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/owner/members/${m.id}`} className="text-xs text-primary hover:underline">View</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MembersPage() {
  return (
    <div className="max-w-6xl space-y-6">
      <PageHeader title="Members" subtitle="Manage your gym's members" />
      <Suspense fallback={<div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>}>
        <MembersContent />
      </Suspense>
    </div>
  )
}
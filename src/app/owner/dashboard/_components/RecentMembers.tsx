// src/app/owner/dashboard/_components/RecentMembers.tsx
// Async Server Component — last 6 members across the filtered gyms.

import Link from "next/link"
import { Users, ArrowRight } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Avatar } from "@/components/ui/Avatar"

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), dy = Math.floor(diff / 86400000)
  if (dy > 0) return `${dy}d ago`
  if (h  > 0) return `${h}h ago`
  return `${Math.max(0, m)}m ago`
}

export async function RecentMembers({ gymIds }: { gymIds: string[] }) {
  const members = await prisma.gymMember.findMany({
    where:   { gymId: { in: gymIds } },
    orderBy: { createdAt: "desc" },
    take:    6,
    select: {
      id: true, createdAt: true, status: true,
      profile: { select: { fullName: true, avatarUrl: true, email: true } },
      gym:     { select: { name: true } },
    },
  })

  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">Recent Members</h3>
        <Link href="/owner/members" className="text-primary text-xs hover:text-primary/80 flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-10">
          <Users className="w-8 h-8 text-white/10 mx-auto mb-2" />
          <p className="text-white/30 text-sm">No members yet</p>
          <Link href="/owner/members/new" className="text-primary text-xs mt-1 inline-block hover:underline">Add your first →</Link>
        </div>
      ) : (
        <div className="space-y-0.5">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/3 transition-colors">
              <Avatar name={m.profile.fullName} url={m.profile.avatarUrl} size={34} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{m.profile.fullName}</p>
                <p className="text-white/35 text-xs">{m.gym.name} · {timeAgo(m.createdAt.toISOString())}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                m.status === "ACTIVE" ? "bg-green-500/15 text-green-400" : "bg-white/8 text-white/40"
              }`}>{m.status === "ACTIVE" ? "Active" : m.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

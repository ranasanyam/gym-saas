// src/app/owner/dashboard/_components/TodayCheckinsClient.tsx
// Client component — displays today's check-ins and polls every 30 s for updates.
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarCheck, ArrowRight } from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"

interface Checkin {
  id:           string
  checkInTime:  string
  checkOutTime: string | null
  member: { profile: { fullName: string; avatarUrl: string | null } }
}

interface Props {
  initialCheckins: Checkin[]
  initialCount:    number
  gymIds:          string[]
}

export function TodayCheckinsClient({ initialCheckins, initialCount, gymIds }: Props) {
  const [checkins, setCheckins] = useState(initialCheckins)
  const [count,    setCount]    = useState(initialCount)

  useEffect(() => {
    if (!gymIds.length) return

    const poll = async () => {
      try {
        const params = new URLSearchParams()
        gymIds.forEach(id => params.append("gymId", id))
        const res = await fetch(`/api/owner/checkins?${params}`)
        if (!res.ok) return
        const data = await res.json()
        setCheckins(data.checkins)
        setCount(data.count)
      } catch { /* silently ignore poll errors */ }
    }

    const id = setInterval(poll, 30_000)
    return () => clearInterval(id)
  }, [gymIds])

  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">Today&apos;s Check-ins</h3>
        <Link href="/owner/attendance" className="text-primary text-xs hover:text-primary/80 flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {checkins.length === 0 ? (
        <div className="text-center py-10">
          <CalendarCheck className="w-8 h-8 text-white/10 mx-auto mb-2" />
          <p className="text-white/30 text-sm">No check-ins today yet</p>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-4xl font-display font-bold text-primary">{count}</span>
            <span className="text-white/30 text-sm">check-ins today</span>
          </div>
          <div className="space-y-0.5">
            {checkins.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/3 transition-colors">
                <Avatar name={c.member.profile.fullName} url={c.member.profile.avatarUrl} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{c.member.profile.fullName}</p>
                  <p className="text-white/35 text-xs">
                    {new Date(c.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className={`w-2 h-2 rounded-full shrink-0 ${c.checkOutTime ? "bg-white/15" : "bg-green-400"}`} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

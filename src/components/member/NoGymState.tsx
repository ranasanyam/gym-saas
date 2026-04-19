// src/components/member/NoGymState.tsx
import Link from "next/link"
import { Compass, Building2 } from "lucide-react"

interface NoGymStateProps {
  pageName?: string
}

export function NoGymState({ pageName }: NoGymStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-16">
      <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <Building2 className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-white font-display font-bold text-xl mb-2">
        You haven't joined any gym yet
      </h2>
      {pageName ? (
        <p className="text-white/45 text-sm max-w-sm leading-relaxed mb-2">
          {pageName} is only available once you're part of a gym.
        </p>
      ) : (
        <p className="text-white/45 text-sm max-w-sm leading-relaxed mb-2">
          All features are unlocked once you join a gym.
        </p>
      )}
      <p className="text-white/30 text-xs mb-8">
        Discover and join a gym, or ask your gym owner to add you.
      </p>
      <Link
        href="/member/discover"
        className="inline-flex items-center gap-2 bg-gradient-primary text-white font-semibold px-7 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
      >
        <Compass className="w-4 h-4" /> Discover Gyms
      </Link>
    </div>
  )
}

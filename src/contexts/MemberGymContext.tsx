// src/contexts/MemberGymContext.tsx
"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

interface MemberGymContextValue {
  hasGym: boolean
  gymLoading: boolean
}

const MemberGymContext = createContext<MemberGymContextValue>({
  hasGym: false,
  gymLoading: true,
})

export function MemberGymProvider({ children }: { children: ReactNode }) {
  const [hasGym, setHasGym]       = useState(false)
  const [gymLoading, setGymLoading] = useState(true)

  useEffect(() => {
    fetch("/api/member/has-gym")
      .then(r => r.json())
      .then(d => setHasGym(d.hasGym ?? false))
      .catch(() => setHasGym(false))
      .finally(() => setGymLoading(false))
  }, [])

  return (
    <MemberGymContext.Provider value={{ hasGym, gymLoading }}>
      {children}
    </MemberGymContext.Provider>
  )
}

export function useMemberGym() {
  return useContext(MemberGymContext)
}

"use client"

import { SessionProvider } from "next-auth/react"
import { ProfileProvider } from "@/contexts/ProfileContext"
import { QueryProvider } from "@/components/QueryProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SessionProvider>
        <ProfileProvider>
          {children}
        </ProfileProvider>
      </SessionProvider>
    </QueryProvider>
  )
}
// src/contexts/ProfileContext.tsx
"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import { useSession } from "next-auth/react"

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = "owner" | "trainer" | "member" | null

export interface GymSummary {
  id: string
  name: string
  isActive: boolean
}

export interface ProfileData {
  id: string
  fullName: string
  email: string
  avatarUrl: string | null
  mobileNumber: string | null
  city: string | null
  gender: string | null
  dateOfBirth: string | null
  role: UserRole
  ownerPlanStatus: "PENDING_SELECTION" | "ACTIVE" | null
  wallet: { balance: number } | null
  referralCode: string | null
  gym: GymSummary | null
}

interface ProfileContextValue {
  profile: ProfileData | null
  role: UserRole
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  // Convenience booleans
  isOwner: boolean
  isTrainer: boolean
  isMember: boolean
  hasGym: boolean
}

// ── Context ───────────────────────────────────────────────────────────────────

const ProfileContext = createContext<ProfileContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (status === "unauthenticated") {
      setProfile(null)
      setLoading(false)
      return
    }
    if (status === "loading") return

    try {
      setLoading(true)
      setError(null)

      const res = await fetch("/api/profile/me")

      if (!res.ok) {
        if (res.status === 401) {
          setProfile(null)
          return
        }
        throw new Error("Failed to fetch profile")
      }

      const data = await res.json()
      setProfile(data)
    } catch (err) {
      console.error("Profile fetch error:", err)
      setError("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const role = profile?.role ?? null

  return (
    <ProfileContext.Provider
      value={{
        profile,
        role,
        loading,
        error,
        refresh: fetchProfile,
        isOwner: role === "owner",
        isTrainer: role === "trainer",
        isMember: role === "member",
        hasGym: !!profile?.gym,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error("useProfile must be used inside <ProfileProvider>")
  return ctx
}

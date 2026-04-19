// src/store/authStore.ts
// Zustand store for auth state — single source of truth for role and plan.
// useRole() and usePlan() hooks read from here; they do NOT make their own API calls.
//
// NOTE: Requires zustand to be installed: npm install zustand

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type UserRole = "owner" | "trainer" | "member" | null

export interface AuthState {
  profileId:   string | null
  role:        UserRole
  planSlug:    string | null
  isExpired:   boolean

  // Setters
  setAuth: (data: { profileId: string; role: UserRole; planSlug?: string | null; isExpired?: boolean }) => void
  setPlan: (planSlug: string | null, isExpired: boolean) => void
  reset:   () => void
}

const INITIAL: Omit<AuthState, "setAuth" | "setPlan" | "reset"> = {
  profileId: null,
  role:      null,
  planSlug:  null,
  isExpired: true,
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...INITIAL,

      setAuth: ({ profileId, role, planSlug = null, isExpired = true }) =>
        set({ profileId, role, planSlug, isExpired }),

      setPlan: (planSlug, isExpired) =>
        set({ planSlug, isExpired }),

      reset: () => set(INITIAL),
    }),
    {
      name: "gymstack-auth",
      // Only persist non-sensitive display fields — never tokens
      partialize: (state) => ({
        profileId: state.profileId,
        role:      state.role,
        planSlug:  state.planSlug,
        isExpired: state.isExpired,
      }),
    }
  )
)

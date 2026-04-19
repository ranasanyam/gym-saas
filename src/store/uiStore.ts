// src/store/uiStore.ts
// Zustand store for UI state that needs to survive navigation.
// Examples: sidebar collapsed state, active gym filter, etc.
//
// NOTE: Requires zustand to be installed: npm install zustand

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UiState {
  sidebarCollapsed: boolean
  activeGymId:      string | null

  // Actions
  toggleSidebar:   () => void
  setSidebarCollapsed: (v: boolean) => void
  setActiveGymId:  (id: string | null) => void
  reset:           () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      activeGymId:      null,

      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setSidebarCollapsed: (v) =>
        set({ sidebarCollapsed: v }),

      setActiveGymId: (id) =>
        set({ activeGymId: id }),

      reset: () =>
        set({ sidebarCollapsed: false, activeGymId: null }),
    }),
    {
      name: "gymstack-ui",
    }
  )
)

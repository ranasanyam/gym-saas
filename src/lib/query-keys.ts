// src/lib/query-keys.ts
// Centralized TanStack Query key definitions.
// All query keys live here to prevent cache key conflicts and duplication.

export const queryKeys = {
  // ── Profile & Auth ─────────────────────────────────────────────────────────
  profile: {
    me:   () => ["profile", "me"] as const,
  },

  // ── Subscription ──────────────────────────────────────────────────────────
  subscription: {
    current: () => ["subscription", "current"] as const,
    plans:   () => ["subscription", "plans"] as const,
  },

  // ── Owner — Gyms ──────────────────────────────────────────────────────────
  gyms: {
    list:   ()          => ["gyms", "list"] as const,
    detail: (id: string) => ["gyms", "detail", id] as const,
  },

  // ── Owner — Members ───────────────────────────────────────────────────────
  members: {
    list:   (filters?: Record<string, unknown>) => ["members", "list", filters ?? {}] as const,
    detail: (id: string)                        => ["members", "detail", id] as const,
  },

  // ── Owner — Trainers ──────────────────────────────────────────────────────
  trainers: {
    list:   (filters?: Record<string, unknown>) => ["trainers", "list", filters ?? {}] as const,
    detail: (id: string)                        => ["trainers", "detail", id] as const,
  },

  // ── Owner — Dashboard ─────────────────────────────────────────────────────
  dashboard: {
    stats:  (gymId: string, range: string) => ["dashboard", "stats", gymId, range] as const,
  },

  // ── Owner — Reports ───────────────────────────────────────────────────────
  reports: {
    data: (filters: Record<string, unknown>) => ["reports", "data", filters] as const,
  },

  // ── Owner — Payments ──────────────────────────────────────────────────────
  payments: {
    list: (filters?: Record<string, unknown>) => ["payments", "list", filters ?? {}] as const,
  },

  // ── Owner — Workouts ──────────────────────────────────────────────────────
  workouts: {
    list:   (gymId?: string) => ["workouts", "list", gymId ?? "all"] as const,
    detail: (id: string)     => ["workouts", "detail", id] as const,
  },

  // ── Owner — Diets ─────────────────────────────────────────────────────────
  diets: {
    list:   (gymId?: string) => ["diets", "list", gymId ?? "all"] as const,
    detail: (id: string)     => ["diets", "detail", id] as const,
  },

  // ── Owner — Expenses ──────────────────────────────────────────────────────
  expenses: {
    list: (filters?: Record<string, unknown>) => ["expenses", "list", filters ?? {}] as const,
  },

  // ── Owner — Supplements ───────────────────────────────────────────────────
  supplements: {
    list:  (gymId?: string) => ["supplements", "list", gymId ?? "all"] as const,
    sales: (gymId?: string) => ["supplements", "sales", gymId ?? "all"] as const,
  },

  // ── Owner — Notifications ─────────────────────────────────────────────────
  notifications: {
    list:        ()        => ["notifications", "list"] as const,
    unreadCount: ()        => ["notifications", "unreadCount"] as const,
  },

  // ── Trainer ───────────────────────────────────────────────────────────────
  trainer: {
    dashboard: () => ["trainer", "dashboard"] as const,
    members:   () => ["trainer", "members"] as const,
    workouts:  () => ["trainer", "workouts"] as const,
    diets:     () => ["trainer", "diets"] as const,
  },

  // ── Member ────────────────────────────────────────────────────────────────
  member: {
    dashboard:  ()        => ["member", "dashboard"] as const,
    attendance: ()        => ["member", "attendance"] as const,
    workouts:   ()        => ["member", "workouts"] as const,
    diet:       ()        => ["member", "diet"] as const,
    gym:        ()        => ["member", "gym"] as const,
    discover:   (q?: string) => ["member", "discover", q ?? ""] as const,
  },
} as const

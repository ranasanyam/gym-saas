// src/components/guards/RoleGate.tsx
// Role guard components — wrap any UI element to restrict visibility by role.
// These are UI-layer guards only. Backend routes MUST independently validate roles.

"use client"

import type { ReactNode } from "react"
import { useProfile } from "@/contexts/ProfileContext"

interface RoleGateProps {
  roles:     string[]
  children:  ReactNode
  fallback?: ReactNode
}

// ── Generic role gate ─────────────────────────────────────────────────────────
export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const { role, loading } = useProfile()

  // While profile is loading, render nothing to avoid flash
  if (loading) return null

  if (!role || !roles.includes(role)) return <>{fallback}</>

  return <>{children}</>
}

// ── Convenience wrappers ──────────────────────────────────────────────────────

export function OwnerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGate roles={["owner"]} fallback={fallback}>{children}</RoleGate>
}

export function TrainerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGate roles={["trainer"]} fallback={fallback}>{children}</RoleGate>
}

export function MemberOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGate roles={["member"]} fallback={fallback}>{children}</RoleGate>
}

export function NotMember({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGate roles={["owner", "trainer"]} fallback={fallback}>{children}</RoleGate>
}

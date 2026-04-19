// src/hooks/useRole.ts
// Returns the current user's role from ProfileContext.
// Always reads from a single source of truth — never from multiple API calls.

"use client"

import { useProfile } from "@/contexts/ProfileContext"

export type UserRole = "owner" | "trainer" | "member" | null

export function useRole(): UserRole {
  const { role } = useProfile()
  return role as UserRole
}

export function useIsOwner():   boolean { return useRole() === "owner"   }
export function useIsTrainer(): boolean { return useRole() === "trainer" }
export function useIsMember():  boolean { return useRole() === "member"  }

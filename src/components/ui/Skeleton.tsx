// src/components/ui/Skeleton.tsx
// Base skeleton component and named variants.
// Every data-fetching component should use these as Suspense fallbacks.

import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

// ── Base pulse block ──────────────────────────────────────────────────────────
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-white/5",
        className
      )}
    />
  )
}

// ── Stat card skeleton (matches StatsSection card shape) ──────────────────────
export function SkeletonStat({ className }: SkeletonProps) {
  return (
    <div className={cn("bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

// ── Stats grid skeleton ───────────────────────────────────────────────────────
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStat key={i} />
      ))}
    </div>
  )
}

// ── Table row skeleton ────────────────────────────────────────────────────────
export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

// ── Table skeleton ────────────────────────────────────────────────────────────
export function SkeletonTable({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/6 flex items-center gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16 ml-auto" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-2 text-left">
                <Skeleton className="h-3 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Card skeleton ─────────────────────────────────────────────────────────────
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 space-y-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  )
}

// ── List skeleton (recent members / check-ins) ────────────────────────────────
export function SkeletonList({ rows = 5, className }: { rows?: number } & SkeletonProps) {
  return (
    <div className={cn("bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden", className)}>
      <div className="px-5 py-4 border-b border-white/6">
        <Skeleton className="h-5 w-36" />
      </div>
      <div className="divide-y divide-white/5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Form skeleton ─────────────────────────────────────────────────────────────
export function SkeletonForm({ fields = 4, className }: { fields?: number } & SkeletonProps) {
  return (
    <div className={cn("space-y-5", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  )
}

// ── Page header skeleton ──────────────────────────────────────────────────────
export function SkeletonPageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-10 w-28 rounded-xl" />
    </div>
  )
}

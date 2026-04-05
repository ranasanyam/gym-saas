// src/app/owner/dashboard/_components/Skeletons.tsx
// Skeleton fallbacks for every Suspense boundary in the dashboard.

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-2xl ${className}`} />
}

export function StatsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Today stats row */}
      <div>
        <div className="h-3 w-16 bg-white/8 rounded animate-pulse mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Pulse key={i} className="h-28" />)}
        </div>
      </div>
      {/* Range stats row */}
      <div>
        <div className="h-3 w-24 bg-white/8 rounded animate-pulse mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Pulse key={i} className="h-28" />)}
        </div>
      </div>
      {/* Chart placeholder */}
      <Pulse className="h-52" />
    </div>
  )
}

export function AlertsSkeleton() {
  return <Pulse className="h-12" />
}

export function MembersSkeleton() {
  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
      <div className="h-4 w-32 bg-white/8 rounded animate-pulse mb-4" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <Pulse key={i} className="h-11" />)}
      </div>
    </div>
  )
}

export function CheckinsSkeleton() {
  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
      <div className="h-4 w-36 bg-white/8 rounded animate-pulse mb-4" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <Pulse key={i} className="h-11" />)}
      </div>
    </div>
  )
}

export function ExpensesSkeleton() {
  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
      <div className="h-4 w-36 bg-white/8 rounded animate-pulse mb-4" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <Pulse key={i} className="h-12" />)}
      </div>
    </div>
  )
}

export function SuppSkeleton() {
  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
      <div className="h-4 w-44 bg-white/8 rounded animate-pulse mb-4" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {[...Array(3)].map((_, i) => <Pulse key={i} className="h-16" />)}
      </div>
    </div>
  )
}

export function LowStockSkeleton() {
  return <Pulse className="h-32" />
}
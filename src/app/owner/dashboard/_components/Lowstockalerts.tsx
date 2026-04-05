// src/app/owner/dashboard/_components/LowStockAlerts.tsx
// Async Server Component — streams in via Suspense.
// Shows supplements whose stockQty <= lowStockAt threshold.
// Three severity levels:
//   OUT OF STOCK : stockQty === 0
//   CRITICAL     : 0 < stockQty <= floor(lowStockAt / 2)
//   LOW STOCK    : stockQty > floor(lowStockAt / 2) but <= lowStockAt

import Link         from "next/link"
import { Package, AlertTriangle, ArrowRight, ShoppingBag } from "lucide-react"
import { prisma }   from "@/lib/prisma"

interface Props {
  gymIds:    string[]
  multiGym?: boolean   // show gym name column when owner has multiple gyms
}

type Severity = "out" | "critical" | "low"

function getSeverity(qty: number, threshold: number): Severity {
  if (qty === 0)                           return "out"
  if (qty <= Math.floor(threshold / 2))   return "critical"
  return "low"
}

const SEV = {
  out:      { label: "Out of Stock", bg: "bg-red-500/10",    border: "border-red-500/25",    text: "text-red-400",    dot: "bg-red-400",    pulse: true  },
  critical: { label: "Critical",     bg: "bg-orange-500/10", border: "border-orange-500/25", text: "text-orange-400", dot: "bg-orange-400", pulse: true  },
  low:      { label: "Low Stock",    bg: "bg-yellow-500/8",  border: "border-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-400", pulse: false },
}

export async function LowStockAlerts({ gymIds, multiGym = false }: Props) {
  if (!gymIds.length) return null

  // Fetch all active supplements for these gyms.
  // Prisma does not support column-to-column comparisons in where clauses,
  // so we fetch all active supplements and filter in JS.
  // This is safe — supplement counts per gym are small (tens, not thousands).
  const all = await prisma.supplement.findMany({
    where: {
      gymId:    { in: gymIds },
      isActive: true,
    },
    select: {
      id:        true,
      name:      true,
      brand:     true,
      category:  true,
      stockQty:  true,
      lowStockAt:true,
      gym:       { select: { name: true } },
    },
    orderBy: [
      { stockQty: "asc" },    // most urgent first (0 at top)
      { name:     "asc" },
    ],
  })

  // Filter: only show items at or below their alert threshold
  const items = all.filter(s => s.stockQty <= s.lowStockAt)

  if (items.length === 0) return null

  // Annotate with severity
  const annotated = items.map(item => ({
    ...item,
    severity: getSeverity(item.stockQty, item.lowStockAt),
  }))

  const outCount      = annotated.filter(i => i.severity === "out").length
  const criticalCount = annotated.filter(i => i.severity === "critical").length

  // Header badge: show the worst severity
  const headerSeverity = outCount > 0 ? "out" : criticalCount > 0 ? "critical" : "low"
  const headerSev      = SEV[headerSeverity]

  return (
    <div className={`rounded-2xl border ${headerSev.border} overflow-hidden`}>
      {/* Header */}
      <div className={`${headerSev.bg} px-5 py-4 flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${headerSev.bg} border ${headerSev.border} flex items-center justify-center shrink-0`}>
            <AlertTriangle className={`w-4 h-4 ${headerSev.text}`} />
          </div>
          <div>
            <p className={`font-semibold text-sm ${headerSev.text}`}>
              Low Stock Alerts
            </p>
            <p className="text-white/35 text-xs mt-0.5">
              {annotated.length} supplement{annotated.length > 1 ? "s" : ""} need restocking
              {outCount > 0 && (
                <span className="text-red-400 font-medium"> · {outCount} out of stock</span>
              )}
            </p>
          </div>
        </div>
        <Link
          href="/owner/supplements"
          className={`flex items-center gap-1.5 text-xs font-medium ${headerSev.text} hover:opacity-80 transition-opacity shrink-0`}
        >
          Manage <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Items list */}
      <div className="bg-[hsl(220_25%_9%)] divide-y divide-white/5">
        {annotated.map(item => {
          const sev         = SEV[item.severity]
          const stockPct    = item.lowStockAt > 0
            ? Math.min((item.stockQty / item.lowStockAt) * 100, 100)
            : 0

          return (
            <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors">
              {/* Icon */}
              <div className={`w-9 h-9 rounded-xl ${sev.bg} flex items-center justify-center shrink-0`}>
                <ShoppingBag className={`w-4 h-4 ${sev.text}`} />
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-medium truncate">{item.name}</p>
                  {item.brand && (
                    <span className="text-white/30 text-xs shrink-0">· {item.brand}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.category && (
                    <span className="text-white/30 text-[11px]">{item.category}</span>
                  )}
                  {multiGym && (
                    <span className="text-white/25 text-[11px]">· {item.gym.name}</span>
                  )}
                </div>
              </div>

              {/* Stock progress bar */}
              <div className="hidden sm:flex flex-col gap-1 w-28 shrink-0">
                <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.severity === "out"      ? "bg-red-500" :
                      item.severity === "critical" ? "bg-orange-500" :
                                                     "bg-yellow-500"
                    }`}
                    style={{ width: item.stockQty === 0 ? "3px" : `${stockPct}%` }}
                  />
                </div>
                <p className="text-white/30 text-[10px]">
                  {item.stockQty} / {item.lowStockAt} units
                </p>
              </div>

              {/* Severity badge */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${sev.bg} border ${sev.border} shrink-0`}>
                <div className={`w-1.5 h-1.5 rounded-full ${sev.dot} ${sev.pulse ? "animate-pulse" : ""}`} />
                <span className={`text-[11px] font-semibold ${sev.text} whitespace-nowrap`}>
                  {item.stockQty === 0 ? "Out of Stock" : `${item.stockQty} left`}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer CTA */}
      <div className={`${headerSev.bg} px-5 py-2.5 border-t ${headerSev.border}`}>
        <Link
          href="/owner/supplements"
          className="flex items-center justify-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          <Package className="w-3.5 h-3.5" />
          View all supplements & update stock
        </Link>
      </div>
    </div>
  )
}
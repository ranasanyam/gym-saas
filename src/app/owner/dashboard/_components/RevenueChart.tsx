// src/app/owner/dashboard/_components/RevenueChart.tsx
"use client"

type ChartBucket = { date: string; membershipRevenue: number; supplementRevenue: number; expense: number }

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toLocaleString("en-IN")}`
}

const C = {
  membership: "hsl(24 95% 53%)",
  supplement: "#22c55e",
  expense:    "#3b82f6",
}

interface Props {
  membership: { date: string; amount: number }[]
  supplement: { date: string; amount: number }[]
  expenses:   { date: string; amount: number }[]
  rangeLabel: string
  hasPremium?: boolean
}

export function RevenueChart({ membership, supplement, expenses, rangeLabel, hasPremium = false }: Props) {
  // Merge arrays into buckets
  const suppMap: Record<string, number> = {}
  const expMap:  Record<string, number> = {}
  for (const s of supplement) suppMap[s.date] = s.amount
  for (const e of expenses)   expMap[e.date]  = e.amount

  const buckets: ChartBucket[] = membership.map(d => ({
    date:              d.date,
    membershipRevenue: d.amount,
    supplementRevenue: suppMap[d.date] ?? 0,
    expense:           expMap[d.date]  ?? 0,
  }))

  if (!buckets.length) return null

  const max = Math.max(
    ...buckets.flatMap(b => [b.membershipRevenue, b.supplementRevenue, b.expense]),
    1
  )
  const totalMem  = buckets.reduce((s, b) => s + b.membershipRevenue, 0)
  const totalSupp = buckets.reduce((s, b) => s + b.supplementRevenue, 0)
  const totalExp  = buckets.reduce((s, b) => s + b.expense, 0)
  const net       = totalMem + totalSupp - totalExp

  const showEvery = buckets.length > 10 ? Math.ceil(buckets.length / 7) : 1

  // Premium: taller chart, glowing bars, gradient border on card
  const chartHeight = hasPremium ? 36 : 28
  const cardClass   = hasPremium
    ? "bg-[hsl(220_25%_9%)] border border-white/10 rounded-2xl p-5 shadow-lg"
    : "bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5"

  return (
    <div className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-white font-semibold text-sm">{rangeLabel}</p>
          <p className="text-white/35 text-xs mt-0.5">Membership · Supplements · Expenses</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {([
            { color: C.membership, label: "Membership"  },
            { color: C.supplement, label: "Supplements" },
            { color: C.expense,    label: "Expenses"    },
          ] as const).map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color, opacity: 0.85 }} />
              <span className="text-white/40 text-xs">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-0.5" style={{ height: `${chartHeight * 4}px` }}>
        {buckets.map((b, i) => {
          const memH  = b.membershipRevenue > 0 ? Math.max((b.membershipRevenue / max) * 100, 2) : 2
          const suppH = b.supplementRevenue > 0 ? Math.max((b.supplementRevenue / max) * 100, 2) : 2
          const expH  = b.expense           > 0 ? Math.max((b.expense           / max) * 100, 2) : 2
          const memOp  = b.membershipRevenue > 0 ? 0.85 : 0.12
          const suppOp = b.supplementRevenue > 0 ? 0.85 : 0.12
          const expOp  = b.expense           > 0 ? 0.85 : 0.12
          return (
            <div key={i} className="flex-1 h-full flex items-end gap-px group relative min-w-0">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none
                bg-[hsl(220_25%_13%)] border border-white/10 rounded-xl px-3 py-2 shadow-xl
                text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white/50 font-medium mb-1">{b.date}</p>
                <div className="space-y-0.5">
                  <p style={{ color: C.membership }}>Membership:  {fmt(b.membershipRevenue)}</p>
                  <p style={{ color: C.supplement }}>Supplements: {fmt(b.supplementRevenue)}</p>
                  <p style={{ color: C.expense    }}>Expenses:    {fmt(b.expense)}</p>
                </div>
                <p className="text-white/35 border-t border-white/8 mt-1.5 pt-1.5">
                  Net:{" "}
                  <span className={b.membershipRevenue + b.supplementRevenue - b.expense >= 0 ? "text-green-400" : "text-red-400"}>
                    {fmt(b.membershipRevenue + b.supplementRevenue - b.expense)}
                  </span>
                </p>
              </div>

              {/* Bars */}
              <div
                className={`flex-1 rounded-t-sm cursor-default transition-opacity ${hasPremium ? "hover:opacity-100" : ""}`}
                style={{ height: `${memH}%`, backgroundColor: C.membership, opacity: memOp, minHeight: "2px" }}
              />
              <div
                className="flex-1 rounded-t-sm cursor-default"
                style={{ height: `${suppH}%`, backgroundColor: C.supplement, opacity: suppOp, minHeight: "2px" }}
              />
              <div
                className="flex-1 rounded-t-sm cursor-default"
                style={{ height: `${expH}%`, backgroundColor: C.expense, opacity: expOp, minHeight: "2px" }}
              />
            </div>
          )
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex mt-2">
        {buckets.map((b, i) => (
          <span key={i} className="flex-1 text-center text-white/20 text-[10px] truncate">
            {i % showEvery === 0 ? b.date : ""}
          </span>
        ))}
      </div>

      {/* Summary footer */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 pt-3 border-t border-white/6 text-xs">
        <span className="text-white/40">Membership: <span className="font-semibold" style={{ color: C.membership }}>{fmt(totalMem)}</span></span>
        <span className="text-white/40">Supplements: <span className="font-semibold" style={{ color: C.supplement }}>{fmt(totalSupp)}</span></span>
        <span className="text-white/40">Expenses: <span className="font-semibold" style={{ color: C.expense }}>−{fmt(totalExp)}</span></span>
        <span className="text-white/40 ml-auto">Net: <span className={`font-semibold ${net >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(net)}</span></span>
      </div>

      {/* Premium: net revenue trend line (SVG) */}
      {hasPremium && buckets.length >= 2 && (() => {
        const netSeries = buckets.map(b => b.membershipRevenue + b.supplementRevenue - b.expense)
        const netMax    = Math.max(...netSeries.map(Math.abs), 1)
        const H         = 32
        const pts       = netSeries.map((v, i) => ({
          x: (i / (netSeries.length - 1)) * 100,
          y: H / 2 - (v / netMax) * (H / 2 - 3),
        }))
        const path  = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
        const color = net >= 0 ? "#4ade80" : "#f87171"
        return (
          <div className="mt-3">
            <p className="text-white/20 text-[10px] mb-1">Net revenue trend</p>
            <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className="w-full h-8">
              <defs>
                <linearGradient id="net-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1={H / 2} x2="100" y2={H / 2} stroke="white" strokeOpacity="0.06" strokeWidth="0.5" />
              <path d={`${path} L 100 ${H} L 0 ${H} Z`} fill="url(#net-grad)" />
              <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )
      })()}
    </div>
  )
}

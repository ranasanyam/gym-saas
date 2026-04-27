"use client"

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts"

type ChartBucket = {
  date: string
  membershipRevenue: number
  supplementRevenue: number
  expense: number
}

function fmt(n: number) {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000)   return `₹${(n / 1_000).toFixed(1)}K`
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

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const [mem, supp, exp] = [payload[0]?.value ?? 0, payload[1]?.value ?? 0, payload[2]?.value ?? 0]
  const net = mem + supp - exp
  return (
    <div className="bg-[hsl(220_25%_13%)] border border-white/10 rounded-xl px-3 py-2.5 shadow-xl text-xs">
      <p className="text-white/50 font-medium mb-1.5">{label}</p>
      <p style={{ color: C.membership }}>Membership: {fmt(mem)}</p>
      <p style={{ color: C.supplement }}>Supplements: {fmt(supp)}</p>
      <p style={{ color: C.expense }}>Expenses: {fmt(exp)}</p>
      <p className={`font-semibold mt-1.5 pt-1.5 border-t border-white/10 ${net >= 0 ? "text-green-400" : "text-red-400"}`}>
        Net: {fmt(net)}
      </p>
    </div>
  )
}

export function RevenueChart({ membership, supplement, expenses, rangeLabel, hasPremium = false }: Props) {
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

  const totalMem  = buckets.reduce((s, b) => s + b.membershipRevenue, 0)
  const totalSupp = buckets.reduce((s, b) => s + b.supplementRevenue, 0)
  const totalExp  = buckets.reduce((s, b) => s + b.expense, 0)
  const net       = totalMem + totalSupp - totalExp

  const cardClass = hasPremium
    ? "bg-[hsl(220_25%_9%)] border border-white/10 rounded-2xl p-5 shadow-lg"
    : "bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5"

  return (
    <div className={cardClass}>
      {/* Header + legend */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-white font-semibold text-sm">{rangeLabel}</p>
          <p className="text-white/35 text-xs mt-0.5">Membership · Supplements · Expenses</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {[
            { color: C.membership, label: "Membership"  },
            { color: C.supplement, label: "Supplements" },
            { color: C.expense,    label: "Expenses"    },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
              <span className="text-white/40 text-xs">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={hasPremium ? 220 : 180}>
        <BarChart data={buckets} barCategoryGap="28%" barGap={2} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={fmt}
            tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={54}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="membershipRevenue" name="Membership" fill={C.membership} radius={[3, 3, 0, 0]} />
          <Bar dataKey="supplementRevenue" name="Supplements" fill={C.supplement} radius={[3, 3, 0, 0]} />
          <Bar dataKey="expense"           name="Expenses"    fill={C.expense}    radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary footer */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 pt-3 border-t border-white/6 text-xs">
        <span className="text-white/40">Membership: <span className="font-semibold" style={{ color: C.membership }}>{fmt(totalMem)}</span></span>
        <span className="text-white/40">Supplements: <span className="font-semibold" style={{ color: C.supplement }}>{fmt(totalSupp)}</span></span>
        <span className="text-white/40">Expenses: <span className="font-semibold" style={{ color: C.expense }}>−{fmt(totalExp)}</span></span>
        <span className="text-white/40 ml-auto">Net: <span className={`font-semibold ${net >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(net)}</span></span>
      </div>
    </div>
  )
}

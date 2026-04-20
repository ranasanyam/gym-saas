// src/app/owner/dashboard/_components/RecentExpenses.tsx
// Async Server Component — recent expenses in the selected range.

import Link from "next/link"
import { Receipt, ArrowRight } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getRangeWindow } from "@/lib/dashboard-queries"
import type { DashRange } from "@/lib/dashboard-queries"

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toLocaleString("en-IN")}`
}

interface Props {
  gymIds:      string[]
  range:       DashRange
  customStart?: string
  customEnd?:   string
}

export async function RecentExpenses({ gymIds, range, customStart, customEnd }: Props) {
  const { start, end } = getRangeWindow(range, customStart, customEnd)

  const expenses = await prisma.gymExpense.findMany({
    where:   { gymId: { in: gymIds }, expenseDate: { gte: start, lt: end } },
    orderBy: { expenseDate: "desc" },
    take:    5,
    select:  { id: true, title: true, amount: true, category: true, expenseDate: true, gym: { select: { name: true } } },
  })


  if (expenses.length === 0) return null

  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Receipt size={16} className="text-red-400" />
          <p className="text-white font-semibold text-sm">Recent Expenses</p>
        </div>
        <a href="/owner/expenses" className="text-primary text-xs hover:underline flex items-center gap-1">
          View all <ArrowRight size={12} />
        </a>
      </div>
      <div className="space-y-0.5">
        {expenses.map(e => (
          <div key={e.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <Receipt className="w-3.5 h-3.5 text-red-400" />
              </div>
              <div>
                <p className="text-white/80 text-sm">{e.title}</p>
                <p className="text-white/30 text-xs">
                  {e.gym?.name} · {e.category} · {new Date(e.expenseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
            </div>
            <span className="text-red-400 font-semibold text-sm shrink-0">−{fmt(Number(e.amount))}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

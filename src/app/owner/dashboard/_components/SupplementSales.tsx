// src/app/owner/dashboard/_components/SupplementSales.tsx
// Async Server Component — recent supplement sales.

import Link from "next/link"
import { ShoppingBag, ArrowRight } from "lucide-react"
import { prisma } from "@/lib/prisma"

export async function SupplementSales({ gymIds }: { gymIds: string[] }) {
  const sales = await prisma.supplementSale.findMany({
    where:   { gymId: { in: gymIds } },
    orderBy: { soldAt: "desc" },
    take:    6,
    select: {
      id: true, qty: true, totalAmount: true, memberName: true, soldAt: true,
      supplement: { select: { name: true, unitSize: true } },
      member:     { select: { profile: { select: { fullName: true } } } },
    },
  })

  if (sales.length === 0) return null

  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-green-400" />
          <h3 className="text-white font-semibold text-sm">Recent Supplement Sales</h3>
        </div>
        <Link href="/owner/supplements" className="text-primary text-xs hover:text-primary/80 flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {sales.map(s => (
          <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/4">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-3.5 h-3.5 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{s.supplement.name}</p>
              <p className="text-white/35 text-[11px]">
                {s.member?.profile.fullName ?? s.memberName ?? "Walk-in"} · {s.qty}×
              </p>
            </div>
            <p className="text-green-400 text-xs font-semibold shrink-0">
              ₹{Number(s.totalAmount).toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

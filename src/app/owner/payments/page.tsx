// src/app/owner/payments/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { PageHeader } from "@/components/owner/PageHeader"
import { CreditCard, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react"

interface Payment {
  id: string; amount: number; status: string; createdAt: string; paymentDate: string | null
  member: { profile: { fullName: string } }
  gym: { name: string }
  membershipPlan: { name: string } | null
}

function formatCurrency(n: number) {
  if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n/1000).toFixed(1)}K`
  return `₹${n}`
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [monthTotal, setMonthTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/owner/payments?page=${page}`)
      .then(r => r.json())
      .then(d => { setPayments(d.payments); setTotal(d.total); setPages(d.pages); setMonthTotal(d.monthTotal) })
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-6xl">
      <PageHeader title="Payments" subtitle="Member fee collection and history" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-7">
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-2.5 bg-primary/10 rounded-xl"><TrendingUp className="w-5 h-5 text-primary" /></div>
          <div>
            <p className="text-white/40 text-xs mb-0.5">This Month</p>
            <p className="text-white text-2xl font-display font-bold">{formatCurrency(monthTotal)}</p>
          </div>
        </div>
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-2.5 bg-white/5 rounded-xl"><CreditCard className="w-5 h-5 text-white/40" /></div>
          <div>
            <p className="text-white/40 text-xs mb-0.5">Total Transactions</p>
            <p className="text-white text-2xl font-display font-bold">{total}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white/3 rounded-xl animate-pulse" />)}</div>
      ) : (
        <>
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_1fr_120px_100px] gap-4 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
              <span>Member</span><span>Plan</span><span>Gym</span><span>Amount</span><span>Status</span>
            </div>
            <div className="divide-y divide-white/4">
              {payments.map(p => (
                <div key={p.id} className="grid grid-cols-[1fr_1fr_1fr_120px_100px] gap-4 px-5 py-4 items-center hover:bg-white/2 transition-colors">
                  <div>
                    <p className="text-white text-sm font-medium">{p.member.profile.fullName}</p>
                    <p className="text-white/35 text-xs">{new Date(p.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <span className="text-white/55 text-sm">{p.membershipPlan?.name ?? "—"}</span>
                  <span className="text-white/55 text-sm truncate">{p.gym.name}</span>
                  <span className="text-white font-semibold text-sm">₹{Number(p.amount).toLocaleString("en-IN")}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium w-fit ${
                    p.status === "COMPLETED" ? "bg-green-500/15 text-green-400"
                    : p.status === "PENDING" ? "bg-yellow-500/15 text-yellow-400"
                    : "bg-red-500/15 text-red-400"
                  }`}>{p.status}</span>
                </div>
              ))}
            </div>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <p className="text-white/35 text-sm">{total} transactions</p>
              <div className="flex items-center gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white disabled:opacity-30 transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-white/60 text-sm px-2">Page {page} of {pages}</span>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                  className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white disabled:opacity-30 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
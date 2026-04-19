// src/app/member/payments/page.tsx
"use client"

import { useEffect, useState } from "react"
import { CreditCard, CheckCircle2, XCircle, Clock, IndianRupee } from "lucide-react"
import { useMemberGym } from "@/contexts/MemberGymContext"
import { NoGymState } from "@/components/member/NoGymState"

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: "bg-green-500/15 text-green-400",
  PENDING:   "bg-yellow-500/15 text-yellow-400",
  FAILED:    "bg-red-500/15 text-red-400",
}
const STATUS_ICON: Record<string, typeof CheckCircle2> = {
  COMPLETED: CheckCircle2,
  PENDING:   Clock,
  FAILED:    XCircle,
}

export default function MemberPaymentsPage() {
  const { hasGym, gymLoading }  = useMemberGym()
  const [payments, setPayments] = useState<any[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [pages, setPages]       = useState(1)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/member/payments?page=${page}`)
      .then(r => r.json())
      .then(d => {
        setPayments(d.payments ?? [])
        setTotal(d.total ?? 0)
        setPages(d.pages ?? 1)
      })
      .finally(() => setLoading(false))
  }, [page])

  const thisYear = new Date().getFullYear()
  const totalThisYear = payments
    .filter(p => new Date(p.createdAt).getFullYear() === thisYear && p.status === "COMPLETED")
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0)

  const activePlan = payments.find(p => p.status === "COMPLETED")

  if (loading || gymLoading) return (
    <div className="max-w-3xl space-y-5 animate-pulse">
      <div className="h-8 w-40 bg-white/5 rounded" />
      <div className="h-24 bg-white/5 rounded-2xl" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-xl" />)}
      </div>
    </div>
  )

  if (!hasGym) return <NoGymState pageName="Payments" />

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">Payments</h2>
        <p className="text-white/35 text-sm mt-0.5">{total} transaction{total !== 1 ? "s" : ""}</p>
      </div>

      {/* Summary */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-white/40 text-xs mb-1">Total Paid ({thisYear})</p>
            <p className="text-white font-display font-bold text-2xl flex items-center gap-1">
              <IndianRupee className="w-5 h-5 text-white/40" />
              {totalThisYear.toLocaleString("en-IN")}
            </p>
          </div>
          {activePlan && (
            <div>
              <p className="text-white/40 text-xs mb-1">Current Plan</p>
              <p className="text-white font-semibold text-sm">{activePlan.membershipPlan?.name ?? "—"}</p>
              <p className="text-white/35 text-xs mt-0.5">{activePlan.gym?.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl">
          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center">
            <CreditCard className="w-7 h-7 text-white/20" />
          </div>
          <h3 className="text-white font-semibold">No payments yet</h3>
          <p className="text-white/35 text-sm text-center max-w-xs">
            Your payment history will appear here once you join a gym.
          </p>
        </div>
      ) : (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-4 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
            <span className="col-span-2">Plan</span><span>Amount</span><span>Status</span>
          </div>
          <div className="divide-y divide-white/4">
            {payments.map((p: any) => {
              const StatusIcon = STATUS_ICON[p.status] ?? Clock
              return (
                <div key={p.id} className="grid grid-cols-4 px-5 py-4 items-center">
                  <div className="col-span-2">
                    <p className="text-white text-sm font-medium">{p.membershipPlan?.name ?? "—"}</p>
                    <p className="text-white/35 text-xs mt-0.5">
                      {new Date(p.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      {p.gym?.name && ` · ${p.gym.name}`}
                    </p>
                  </div>
                  <p className="text-white font-semibold">
                    ₹{Number(p.amount ?? 0).toLocaleString("en-IN")}
                  </p>
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium w-fit ${STATUS_STYLE[p.status] ?? "bg-white/10 text-white/50"}`}>
                    <StatusIcon className="w-3 h-3" />
                    {p.status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/8 text-white/60 hover:text-white disabled:opacity-30 text-sm">
            ← Prev
          </button>
          <span className="text-white/40 text-sm">{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/8 text-white/60 hover:text-white disabled:opacity-30 text-sm">
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

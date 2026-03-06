// src/app/member/payments/page.tsx
"use client"

import { useEffect, useState } from "react"
import { CreditCard, CheckCircle2, XCircle, Clock, Loader2, IndianRupee } from "lucide-react"

const STATUS_STYLE: Record<string,{icon:any,color:string,bg:string}> = {
  COMPLETED: { icon: CheckCircle2, color: "text-green-400",  bg: "bg-green-500/10"  },
  PENDING:   { icon: Clock,        color: "text-yellow-400", bg: "bg-yellow-500/10" },
  FAILED:    { icon: XCircle,      color: "text-red-400",    bg: "bg-red-500/10"    },
  REFUNDED:  { icon: XCircle,      color: "text-blue-400",   bg: "bg-blue-500/10"   },
}

export default function MemberPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [total, setTotal]   = useState(0)
  const [page, setPage]     = useState(1)
  const [pages, setPages]   = useState(1)
  const [loading, setLoading] = useState(true)

  const load = (p: number) => {
    setLoading(true)
    fetch(`/api/member/payments?page=${p}`)
      .then(r => r.json())
      .then(d => { setPayments(d.payments ?? []); setTotal(d.total ?? 0); setPages(d.pages ?? 1) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page) }, [page])

  const totalPaid = payments
    .filter(p => p.status === "COMPLETED")
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-white">Payment History</h2>
        <div className="flex items-center gap-2 bg-[hsl(220_25%_9%)] border border-white/6 rounded-xl px-4 py-2">
          <IndianRupee className="w-4 h-4 text-primary" />
          <span className="text-white font-semibold text-sm">{totalPaid.toLocaleString("en-IN")}</span>
          <span className="text-white/40 text-xs">total paid</span>
        </div>
      </div>

      {loading && payments.length === 0 ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-3">
          <CreditCard className="w-10 h-10 text-white/15" />
          <p className="text-white/30 text-sm">No payments yet</p>
        </div>
      ) : (
        <>
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-4 px-5 py-3 border-b border-white/5 text-xs text-white/30 uppercase tracking-wider">
              <span className="col-span-2">Details</span><span className="text-right">Amount</span><span className="text-right">Status</span>
            </div>
            <div className="divide-y divide-white/4">
              {payments.map(p => {
                const s = STATUS_STYLE[p.status] ?? STATUS_STYLE.PENDING
                const Icon = s.icon
                const date = new Date(p.paymentDate ?? p.createdAt)
                return (
                  <div key={p.id} className="grid grid-cols-4 items-center px-5 py-4">
                    <div className="col-span-2 flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${s.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{p.planNameSnapshot ?? p.membershipPlan?.name ?? "Membership"}</p>
                        <p className="text-white/35 text-xs">{p.gym?.name} · {date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                    </div>
                    <p className="text-right text-white font-semibold text-sm">₹{Number(p.amount).toLocaleString("en-IN")}</p>
                    <div className="flex justify-end">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.bg} ${s.color}`}>{p.status}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white disabled:opacity-30 text-sm">Previous</button>
              <span className="text-white/30 text-sm">{page} / {pages}</span>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white disabled:opacity-30 text-sm">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
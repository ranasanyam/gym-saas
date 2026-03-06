"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/owner/PageHeader"
import { TrendingUp, Users, CreditCard, CalendarCheck, Building2, Loader2 } from "lucide-react"

interface ReportData {
  revenue: { month: string; revenue: number }[]
  memberGrowth: { month: string; members: number }[]
  topGyms: { name: string; members: number; revenue: number; attendance: number }[]
  summary: { totalMembers: number; totalRevenue: number; totalAttendance: number }
}

function formatCurrency(n: number) {
  if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n/1000).toFixed(1)}K`
  return `₹${n}`
}

function BarChart({ data, valueKey, color }: { data: any[]; valueKey: string; color: string }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-white/30 text-[9px]">{d[valueKey] > 0 ? (valueKey === "revenue" ? formatCurrency(d[valueKey]) : d[valueKey]) : ""}</span>
          <div className="w-full rounded-t-sm transition-all duration-700" style={{ height: `${(d[valueKey] / max) * 64}px`, background: color, minHeight: d[valueKey] > 0 ? "4px" : "2px" }} />
          <span className="text-white/35 text-[10px]">{d.month}</span>
        </div>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/owner/reports").then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
  )

  return (
    <div className="max-w-6xl space-y-6">
      <PageHeader title="Reports & Analytics" subtitle="Performance overview for the last 6 months" />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Active Members", value: data?.summary.totalMembers ?? 0, format: (n: number) => n.toString() },
          { icon: CreditCard, label: "Revenue This Month", value: data?.summary.totalRevenue ?? 0, format: formatCurrency },
          { icon: CalendarCheck, label: "Attendance This Month", value: data?.summary.totalAttendance ?? 0, format: (n: number) => n.toString() },
        ].map(({ icon: Icon, label, value, format }) => (
          <div key={label} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 flex items-start justify-between">
            <div>
              <p className="text-white/40 text-xs mb-2">{label}</p>
              <p className="text-white text-3xl font-display font-bold">{format(value)}</p>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-xl"><Icon className="w-5 h-5 text-primary" /></div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
          <h3 className="text-white font-semibold text-sm mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Monthly Revenue
          </h3>
          <BarChart data={data?.revenue ?? []} valueKey="revenue" color="hsl(24 95% 53%)" />
        </div>
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
          <h3 className="text-white font-semibold text-sm mb-5 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" /> New Members / Month
          </h3>
          <BarChart data={data?.memberGrowth ?? []} valueKey="members" color="hsl(220 80% 60%)" />
        </div>
      </div>

      {/* Per-gym breakdown */}
      {(data?.topGyms?.length ?? 0) > 0 && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Per Gym Breakdown (This Month)
            </h3>
          </div>
          <div className="grid grid-cols-4 px-5 py-3 border-b border-white/5 text-xs text-white/35 uppercase tracking-wider">
            <span>Gym</span><span>Active Members</span><span>Revenue</span><span>Attendance</span>
          </div>
          <div className="divide-y divide-white/4">
            {data?.topGyms.map(gym => (
              <div key={gym.name} className="grid grid-cols-4 px-5 py-4 text-sm items-center hover:bg-white/2 transition-colors">
                <span className="text-white font-medium">{gym.name}</span>
                <span className="text-white/60">{gym.members}</span>
                <span className="text-white font-semibold">{formatCurrency(gym.revenue)}</span>
                <span className="text-white/60">{gym.attendance}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
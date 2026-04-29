// src/app/owner/dashboard/_components/Controls.tsx
"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Calendar, ChevronDown, RefreshCw } from "lucide-react"
import type { DashRange } from "@/lib/dashboard-queries"

const RANGE_OPTIONS: { value: DashRange; label: string }[] = [
  { value: "today",          label: "Today"                    },
  { value: "last_7_days",    label: "Last 7 Days"              },
  { value: "last_30_days",   label: "Last 30 Days"             },
  { value: "last_90_days",   label: "This Quarter (90 days)"   },
  { value: "financial_year", label: "Financial Year (Apr–Mar)" },
  { value: "custom",         label: "Custom Range"             },
]

interface Gym { id: string; name: string; city: string | null }

export function Controls({ gyms, ownerName }: { gyms: Gym[]; ownerName: string }) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentGym   = searchParams.get("gymId")   ?? ""
  const currentRange = (searchParams.get("range")   ?? "last_30_days") as DashRange
  const currentCs    = searchParams.get("customStart") ?? ""
  const currentCe    = searchParams.get("customEnd")   ?? ""

  // Range picker dropdown state
  const [open,    setOpen]    = useState(false)
  const [customS, setCustomS] = useState(currentCs)
  const [customE, setCustomE] = useState(currentCe)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(params)) {
      if (v) sp.set(k, v)
      else   sp.delete(k)
    }
    startTransition(() => router.push(`?${sp.toString()}`))
  }

  function applyRange(range: DashRange, cs?: string, ce?: string) {
    const params: Record<string, string> = { range }
    if (range === "custom" && cs && ce) {
      params.customStart = cs
      params.customEnd   = ce
    } else {
      params.customStart = ""
      params.customEnd   = ""
    }
    navigate(params)
    setOpen(false)
  }

  function handleRefresh() {
    startTransition(() => router.refresh())
  }

  const rangeLabel = RANGE_OPTIONS.find(o => o.value === currentRange)?.label ?? "Select range"

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const firstName = ownerName.split(" ")[0]

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">{greeting}, {firstName} 👋</h1>
        {/* <p className="text-white/35 text-sm mt-0.5">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p> */}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Gym filter */}
        {gyms.length > 1 && (
          <div className="relative">
            <select
              value={currentGym}
              onChange={e => navigate({ gymId: e.target.value })}
              className="appearance-none bg-[hsl(220_25%_11%)] border border-white/10 text-white/80 rounded-xl pl-4 pr-9 h-10 text-sm focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">All Gyms</option>
              {gyms.map(g => (
                <option key={g.id} value={g.id}>{g.name}{g.city ? ` (${g.city})` : ""}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>
        )}

        {/* Range picker */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2 bg-[hsl(220_25%_11%)] border border-white/10 text-white/80 rounded-xl px-3.5 h-10 text-sm hover:border-primary/40 transition-colors focus:outline-none"
          >
            <Calendar className="w-3.5 h-3.5 text-white/40 shrink-0" />
            <span className="truncate max-w-40">{rangeLabel}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-white/30 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-60 bg-[hsl(220_25%_10%)] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-1.5">
                {RANGE_OPTIONS.filter(o => o.value !== "custom").map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => applyRange(opt.value)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                      currentRange === opt.value
                        ? "bg-primary/12 text-primary font-semibold"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Custom range */}
              <div className="border-t border-white/6 p-3">
                <p className={`text-xs font-semibold mb-2.5 ${currentRange === "custom" ? "text-primary" : "text-white/40"}`}>
                  Custom Range
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customS}
                      onChange={e => setCustomS(e.target.value)}
                      max={customE || undefined}
                      className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/70 focus:outline-none focus:border-primary/40"
                      style={{ colorScheme: "dark" }}
                    />
                    <span className="text-white/20 text-xs shrink-0">→</span>
                    <input
                      type="date"
                      value={customE}
                      onChange={e => setCustomE(e.target.value)}
                      min={customS || undefined}
                      className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/70 focus:outline-none focus:border-primary/40"
                      style={{ colorScheme: "dark" }}
                    />
                  </div>
                  <button
                    disabled={!customS || !customE}
                    onClick={() => applyRange("custom", customS, customE)}
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-primary text-white disabled:opacity-35 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                  >
                    Apply Custom Range
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          disabled={isPending}
          title="Refresh"
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  )
}

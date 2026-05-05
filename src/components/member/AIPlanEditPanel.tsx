"use client"

import { useEffect, useState } from "react"
import { Sparkles, Clock, Loader2, CheckCircle2, AlertCircle, Send, Info } from "lucide-react"

interface GeneratedPlanInfo {
  found: boolean
  id?: string
  planType?: string
  generatedAt?: string
  withinWindow?: boolean
  minutesLeft?: number
  lastChangeRequest?: string
}

interface AIPlanEditPanelProps {
  planId: string
  onUpdate: () => void
}

export function AIPlanEditPanel({ planId, onUpdate }: AIPlanEditPanelProps) {
  const [info, setInfo]       = useState<GeneratedPlanInfo | null>(null)
  const [query, setQuery]     = useState("")
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/member/ai-plan/by-plan/${planId}`)
      .then(r => r.json())
      .then(setInfo)
      .catch(() => setInfo({ found: false }))
      .finally(() => setLoading(false))
  }, [planId])

  if (loading || !info?.found) return null

  const handleSubmit = async () => {
    if (!query.trim() || !info.id) return
    setError(null)
    setUpdating(true)

    try {
      const res = await fetch(`/api/member/ai-plan/${info.id}/update`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ changeRequest: query.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Update failed. Please try again.")
        return
      }

      setDone(true)
      setQuery("")
      onUpdate()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setUpdating(false)
    }
  }

  if (done) return (
    <div className="bg-green-500/8 border border-green-500/20 rounded-2xl p-5 flex items-center gap-3">
      <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
      <div>
        <p className="text-green-400 font-semibold text-sm">Plan Updated!</p>
        <p className="text-white/40 text-xs mt-0.5">Your changes have been applied by AI.</p>
      </div>
      <button
        onClick={() => setDone(false)}
        className="ml-auto text-xs text-white/30 hover:text-white/60 transition-colors"
      >
        Edit again
      </button>
    </div>
  )

  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-white font-semibold text-sm">Request AI Changes</h3>
        {info.withinWindow ? (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            Free · {info.minutesLeft}m left
          </span>
        ) : (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-full">
            <Info className="w-3 h-3" />
            1 credit
          </span>
        )}
      </div>

      {/* Info strip */}
      <div className={`text-xs px-3 py-2.5 rounded-xl flex items-start gap-2 leading-relaxed ${
        info.withinWindow
          ? "bg-green-500/8 border border-green-500/15 text-green-400/80"
          : "bg-white/4 border border-white/8 text-white/40"
      }`}>
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        {info.withinWindow
          ? `Free edits for the next ${info.minutesLeft} minute${info.minutesLeft !== 1 ? "s" : ""}. After that, each edit costs 1 credit.`
          : "The 2-hour free edit window has passed. This change will use 1 credit from your subscription."
        }
      </div>

      {/* Previous change request, if any */}
      {info.lastChangeRequest && (
        <p className="text-white/25 text-xs italic truncate">
          Last: "{info.lastChangeRequest}"
        </p>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Input */}
      <textarea
        rows={3}
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={
          info.planType === "diet"
            ? "e.g. Replace all chicken with paneer, reduce calories to 1800, add more protein…"
            : "e.g. Add more chest exercises, replace squats with lunges, reduce to 4 days…"
        }
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-primary/40 resize-none transition-colors leading-relaxed"
      />

      <button
        onClick={handleSubmit}
        disabled={!query.trim() || updating}
        className="w-full flex items-center justify-center gap-2 bg-primary/15 hover:bg-primary/25 disabled:opacity-40 disabled:cursor-not-allowed text-primary border border-primary/25 font-semibold text-sm py-2.5 rounded-xl transition-all"
      >
        {updating
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating Plan…</>
          : <><Send className="w-4 h-4" /> Update Plan with AI</>
        }
      </button>
    </div>
  )
}

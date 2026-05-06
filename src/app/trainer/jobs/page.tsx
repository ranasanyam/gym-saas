"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Briefcase, MapPin, Clock, Lock, Search, Loader2,
  CheckCircle2, ChevronRight, BadgeCheck, Zap
} from "lucide-react"

const JOB_TYPE_LABEL: Record<string, string> = {
  FULL_TIME: "Full Time", PART_TIME: "Part Time",
  CONTRACT: "Contract", FREELANCE: "Freelance",
}
const WORK_MODE_LABEL: Record<string, string> = {
  ON_SITE: "On-site", HYBRID: "Hybrid", REMOTE: "Remote",
}

interface Job {
  id: string
  title: string
  jobType: string
  workMode: string
  specializations: string[]
  salaryCurrency: string
  salaryMin: number | null
  salaryMax: number | null
  city: string | null
  state: string | null
  shortDescription: string | null
  applicationCount: number
  createdAt: string
  hasApplied: boolean
  gym: { id: string; name: string; city: string | null }
  // gated
  fullDescription?: string
  contactEmail?: string
  contactPhone?: string
}

interface JobsResponse {
  jobs: Job[]
  total: number
  page: number
  pages: number
  isSubscribed: boolean
}

export default function TrainerJobsPage() {
  const [data, setData]       = useState<JobsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState("")
  const [page, setPage]       = useState(1)

  const load = useCallback(async (q: string, p: number) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (q) params.set("q", q)
    const res = await fetch(`/api/trainer/jobs?${params}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [])

  useEffect(() => { load(search, page) }, [page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    load(search, 1)
  }

  const formatSalary = (job: Job) => {
    if (!job.salaryMin && !job.salaryMax) return null
    const fmt = (n: number) => `₹${(n / 1000).toFixed(0)}k`
    if (job.salaryMin && job.salaryMax) return `${fmt(job.salaryMin)}–${fmt(job.salaryMax)}/mo`
    if (job.salaryMin) return `${fmt(job.salaryMin)}+/mo`
    return `Up to ${fmt(job.salaryMax!)}/mo`
  }

  const isSubscribed = data?.isSubscribed ?? false

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" /> Job Board
          </h2>
          <p className="text-white/35 text-sm mt-0.5">Browse gym job openings across India</p>
        </div>
        {!isSubscribed && (
          <Link href="/trainer/subscription"
            className="flex items-center gap-2 bg-primary/10 border border-primary/25 text-primary rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/20 transition-all">
            <BadgeCheck className="w-4 h-4" /> Get Full Access
          </Link>
        )}
      </div>

      {/* Subscription notice */}
      {!isSubscribed && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 flex items-start gap-3">
          <Lock className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 text-sm font-semibold">Limited view — subscribe for full details</p>
            <p className="text-white/40 text-xs mt-0.5">
              You can see job titles and basic info. Subscribe to view full descriptions, contact details, and apply.
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or city…"
            className="w-full bg-[hsl(220_25%_10%)] border border-white/10 text-white placeholder:text-white/25 rounded-xl pl-9 pr-4 h-10 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <button type="submit" className="bg-primary text-white px-4 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
          Search
        </button>
      </form>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : !data?.jobs.length ? (
        <div className="text-center py-16 text-white/30">
          <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No jobs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.jobs.map(job => {
            const salary = formatSalary(job)
            return (
              <Link key={job.id} href={`/trainer/jobs/${job.id}`}
                className="block bg-[hsl(220_25%_9%)] border border-white/8 rounded-2xl p-4 hover:border-white/15 hover:bg-[hsl(220_25%_10%)] transition-all group">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-semibold text-sm group-hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                      {job.hasApplied && (
                        <span className="bg-green-500/15 text-green-400 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Applied
                        </span>
                      )}
                    </div>
                    <p className="text-white/45 text-xs mt-0.5">{job.gym.name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                      <span className="text-white/40 text-xs">{JOB_TYPE_LABEL[job.jobType] ?? job.jobType}</span>
                      <span className="text-white/20 text-xs">·</span>
                      <span className="text-white/40 text-xs">{WORK_MODE_LABEL[job.workMode] ?? job.workMode}</span>
                      {(job.city || job.state) && (
                        <>
                          <span className="text-white/20 text-xs">·</span>
                          <span className="text-white/40 text-xs flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {[job.city, job.state].filter(Boolean).join(", ")}
                          </span>
                        </>
                      )}
                      {salary && (
                        <>
                          <span className="text-white/20 text-xs">·</span>
                          <span className="text-primary/80 text-xs font-semibold">{salary}</span>
                        </>
                      )}
                    </div>
                    {job.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {job.specializations.slice(0, 3).map((s, i) => (
                          <span key={i} className="bg-white/5 text-white/45 text-[10px] px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                        {job.specializations.length > 3 && (
                          <span className="text-white/25 text-[10px]">+{job.specializations.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {!isSubscribed && <Lock className="w-3.5 h-3.5 text-white/20" />}
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                    <span className="text-white/25 text-[10px]">{job.applicationCount} applied</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {(data?.pages ?? 0) > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg bg-white/5 text-white/50 text-sm disabled:opacity-30 hover:bg-white/10 transition-colors">
            Prev
          </button>
          <span className="text-white/30 text-sm">{page} / {data?.pages}</span>
          <button
            onClick={() => setPage(p => Math.min(data?.pages ?? 1, p + 1))}
            disabled={page === data?.pages}
            className="px-3 py-1.5 rounded-lg bg-white/5 text-white/50 text-sm disabled:opacity-30 hover:bg-white/10 transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  )
}

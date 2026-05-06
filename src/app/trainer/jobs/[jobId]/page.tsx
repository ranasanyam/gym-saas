"use client"

import { use, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  MapPin, Mail, Phone, Lock, Loader2,
  CheckCircle2, ChevronLeft, Send, BadgeCheck, Building2,
  CalendarCheck, Users
} from "lucide-react"

const JOB_TYPE_LABEL: Record<string, string> = {
  FULL_TIME: "Full Time", PART_TIME: "Part Time",
  CONTRACT: "Contract", FREELANCE: "Freelance",
}
const WORK_MODE_LABEL: Record<string, string> = {
  ON_SITE: "On-site", HYBRID: "Hybrid", REMOTE: "Remote",
}

interface JobDetail {
  id: string
  title: string
  jobType: string
  workMode: string
  specializations: string[]
  salaryCurrency: string
  salaryMin: number | null
  salaryMax: number | null
  experienceMin: number | null
  city: string | null
  state: string | null
  shortDescription: string | null
  requirements: string[]
  benefits: string[]
  applicationCount: number
  viewCount: number
  createdAt: string
  // gated
  fullDescription?: string
  contactEmail?: string
  contactPhone?: string
  applicationInstructions?: string
  location?: string
  gym: {
    id: string
    name: string
    city: string | null
    address?: string
    phone?: string
    email?: string
  }
}

interface PageData {
  job: JobDetail
  isSubscribed: boolean
  application: { id: string; status: string; createdAt: string } | null
}

const APP_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING:     { label: "Application Pending",   color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  REVIEWED:    { label: "Application Reviewed",  color: "text-blue-400   bg-blue-500/10   border-blue-500/20"  },
  SHORTLISTED: { label: "Shortlisted!",           color: "text-green-400  bg-green-500/10  border-green-500/20" },
  REJECTED:    { label: "Not Selected",          color: "text-red-400    bg-red-500/10    border-red-500/20"   },
  HIRED:       { label: "Hired!",                color: "text-primary    bg-primary/10    border-primary/25"   },
}

export default function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const router    = useRouter()

  const [data, setData]             = useState<PageData | null>(null)
  const [loading, setLoading]       = useState(true)
  const [coverLetter, setCoverLetter] = useState("")
  const [applying, setApplying]     = useState(false)
  const [error, setError]           = useState("")

  const load = useCallback(async () => {
    const res = await fetch(`/api/trainer/jobs/${jobId}`)
    if (res.status === 404 || res.status === 410) { router.replace("/trainer/jobs"); return }
    const json = await res.json()
    setData(json)
  }, [jobId, router])

  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  const handleApply = async () => {
    setApplying(true)
    setError("")
    const res = await fetch(`/api/trainer/jobs/${jobId}/apply`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ coverLetter }),
    })
    const json = await res.json()
    if (res.ok) { await load() }
    else { setError(json.error ?? "Failed to apply") }
    setApplying(false)
  }

  if (loading) return (
    <div className="max-w-2xl space-y-4">
      <div className="h-8 w-64 bg-white/5 rounded animate-pulse" />
      <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
    </div>
  )
  if (!data) return null

  const { job, isSubscribed, application } = data
  const salary = (() => {
    if (!job.salaryMin && !job.salaryMax) return null
    const fmt = (n: number) => `₹${(n / 1000).toFixed(0)}k`
    if (job.salaryMin && job.salaryMax) return `${fmt(job.salaryMin)}–${fmt(job.salaryMax)}/mo`
    if (job.salaryMin) return `${fmt(job.salaryMin)}+/mo`
    return `Up to ${fmt(job.salaryMax!)}/mo`
  })()

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back */}
      <Link href="/trainer/jobs" className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors w-fit">
        <ChevronLeft className="w-4 h-4" /> All Jobs
      </Link>

      {/* Job header */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/8 rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-display font-bold text-white">{job.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Building2 className="w-3.5 h-3.5 text-white/30" />
              <span className="text-white/50 text-sm">{job.gym.name}</span>
            </div>
          </div>
          {salary && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-2 text-primary font-bold text-sm shrink-0">
              {salary}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="bg-white/8 text-white/60 text-xs px-3 py-1.5 rounded-lg">{JOB_TYPE_LABEL[job.jobType] ?? job.jobType}</span>
          <span className="bg-white/8 text-white/60 text-xs px-3 py-1.5 rounded-lg">{WORK_MODE_LABEL[job.workMode] ?? job.workMode}</span>
          {(job.city || job.state) && (
            // <span className="bg-white/8 text-white/60 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            //   <MapPin className="w-3 h-3" />
            //   {[job.city, job.state].filter(Boolean).join(", ")}
            // </span>
            <span className="bg-white/8 text-white/60 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              {job.state}
            </span>
          )}
          {job.experienceMin != null && (
            <span className="bg-white/8 text-white/60 text-xs px-3 py-1.5 rounded-lg">
              {job.experienceMin}+ yrs experience
            </span>
          )}
        </div>

        {job.specializations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {job.specializations.map((s, i) => (
              <span key={i} className="bg-primary/8 text-primary/70 text-xs px-2.5 py-1 rounded-full border border-primary/15">{s}</span>
            ))}
          </div>
        )}

        {/* Exact address — shown inline in the overview card for subscribers */}
        {isSubscribed && job.location && (
          <div className="flex items-start gap-2 bg-primary/5 border border-primary/15 rounded-xl px-3 py-2.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary/60" />
            <span className="text-white/60 text-xs leading-relaxed">{job.location}</span>
          </div>
        )}

        <div className="flex items-center gap-4 text-white/30 text-xs pt-1 border-t border-white/5">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{job.applicationCount} applied</span>
          <span className="flex items-center gap-1"><CalendarCheck className="w-3.5 h-3.5" />
            Posted {new Date(job.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        </div>
      </div>

      {/* Subscription gate */}
      {!isSubscribed && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-yellow-400" />
            <p className="text-yellow-300 font-semibold text-sm">Subscribe to unlock full details</p>
          </div>
          <p className="text-white/40 text-xs">
            Get the full job description, contact information, and application instructions by subscribing to the Job Portal.
          </p>
          <Link href="/trainer/subscription"
            className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors">
            <BadgeCheck className="w-4 h-4" /> View Plans
          </Link>
        </div>
      )}

      {/* Short description (always visible) */}
      {job.shortDescription && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/8 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-2 text-sm">Overview</h2>
          <p className="text-white/55 text-sm leading-relaxed">{job.shortDescription}</p>
        </div>
      )}

      {/* Full description (gated) */}
      {isSubscribed && job.fullDescription && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/8 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-3 text-sm">Job Description</h2>
          <p className="text-white/55 text-sm leading-relaxed whitespace-pre-wrap">{job.fullDescription}</p>
        </div>
      )}

      {/* Requirements & Benefits (shown to all if present) */}
      {job.requirements.length > 0 && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/8 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-3 text-sm">Requirements</h2>
          <ul className="space-y-2">
            {job.requirements.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/55">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary/60" /> {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {job.benefits.length > 0 && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/8 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-3 text-sm">Benefits</h2>
          <ul className="space-y-2">
            {job.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/55">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-green-400/60" /> {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Contact info (gated) — location address is shown in overview card above */}
      {isSubscribed && (job.contactEmail || job.contactPhone) && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/8 rounded-2xl p-5 space-y-3">
          <h2 className="text-white font-semibold text-sm">Contact Information</h2>
          {job.contactEmail && (
            <div className="flex items-center gap-2.5 text-sm text-white/55">
              <Mail className="w-4 h-4 shrink-0 text-white/30" />
              <a href={`mailto:${job.contactEmail}`} className="hover:text-primary transition-colors">{job.contactEmail}</a>
            </div>
          )}
          {job.contactPhone && (
            <div className="flex items-center gap-2.5 text-sm text-white/55">
              <Phone className="w-4 h-4 shrink-0 text-white/30" />
              <a href={`tel:${job.contactPhone}`} className="hover:text-primary transition-colors">{job.contactPhone}</a>
            </div>
          )}
        </div>
      )}

      {/* Application instructions (gated) */}
      {isSubscribed && job.applicationInstructions && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/8 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-2 text-sm">How to Apply</h2>
          <p className="text-white/55 text-sm leading-relaxed whitespace-pre-wrap">{job.applicationInstructions}</p>
        </div>
      )}

      {/* Application section */}
      {isSubscribed && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/8 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-semibold text-sm">Apply Now</h2>
          {application ? (
            <div className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-semibold ${APP_STATUS_LABEL[application.status]?.color ?? "text-white/60 bg-white/5 border-white/10"}`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {APP_STATUS_LABEL[application.status]?.label ?? application.status}
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-white/50 text-xs">Cover Letter (optional)</label>
                <textarea
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  placeholder="Introduce yourself and explain why you're a great fit…"
                  rows={4}
                  className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white placeholder:text-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex items-center gap-2 bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {applying ? "Submitting…" : "Submit Application"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

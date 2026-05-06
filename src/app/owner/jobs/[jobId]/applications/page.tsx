"use client"

import { use, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, Users, Loader2, Mail, Phone, MessageSquare, CheckCircle2, ChevronDown } from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"

interface Applicant {
  id: string
  status: string
  coverLetter: string | null
  createdAt: string
  updatedAt: string
  profile: {
    id: string
    fullName: string
    email: string
    mobileNumber: string | null
    avatarUrl: string | null
  }
}

interface JobMeta { id: string; title: string }

const STATUSES = ["PENDING","REVIEWED","SHORTLISTED","REJECTED","HIRED"] as const
type AppStatus = (typeof STATUSES)[number]

const STATUS_STYLES: Record<AppStatus, { chip: string; dot: string }> = {
  PENDING:     { chip: "bg-white/8 text-white/50",             dot: "bg-white/30"        },
  REVIEWED:    { chip: "bg-blue-500/15 text-blue-400",         dot: "bg-blue-400"        },
  SHORTLISTED: { chip: "bg-yellow-500/15 text-yellow-400",     dot: "bg-yellow-400"      },
  REJECTED:    { chip: "bg-red-500/15 text-red-400",           dot: "bg-red-400"         },
  HIRED:       { chip: "bg-green-500/15 text-green-400",       dot: "bg-green-400"       },
}

function StatusBadge({ status }: { status: string }) {
  const st = STATUS_STYLES[status as AppStatus] ?? STATUS_STYLES.PENDING
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.chip}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
      {status}
    </span>
  )
}

export default function JobApplicationsPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = use(params)

  const [job, setJob]           = useState<JobMeta | null>(null)
  const [apps, setApps]         = useState<Applicant[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res  = await fetch(`/api/owner/jobs/${jobId}/applications`)
    const data = await res.json()
    if (res.ok) {
      setJob(data.job)
      setApps(data.applications)
    }
  }, [jobId])

  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  const updateStatus = async (applicationId: string, status: string) => {
    setUpdating(applicationId)
    await fetch(`/api/owner/jobs/${jobId}/applications`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ applicationId, status }),
    })
    await load()
    setUpdating(null)
  }

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = apps.filter(a => a.status === s).length
    return acc
  }, {} as Record<string, number>)

  if (loading) return (
    <div className="max-w-3xl space-y-4">
      <div className="h-6 w-48 bg-white/5 rounded animate-pulse" />
      {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <Link href="/owner/jobs"
          className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors w-fit mb-3">
          <ChevronLeft className="w-4 h-4" /> All Job Postings
        </Link>
        <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> Applicants
        </h2>
        {job && <p className="text-white/40 text-sm mt-0.5">{job.title}</p>}
      </div>

      {/* Status summary pills */}
      {apps.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {STATUSES.filter(s => counts[s] > 0).map(s => (
            <span key={s} className={`text-xs px-3 py-1.5 rounded-full font-semibold ${STATUS_STYLES[s].chip}`}>
              {counts[s]} {s.charAt(0) + s.slice(1).toLowerCase()}
            </span>
          ))}
        </div>
      )}

      {/* List */}
      {!apps.length ? (
        <div className="text-center py-16 text-white/30">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No applications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map(app => {
            const isExpanded = expanded === app.id
            return (
              <div key={app.id} className="bg-[hsl(220_25%_9%)] border border-white/8 rounded-2xl overflow-hidden">
                {/* Applicant row */}
                <div className="flex items-center gap-3 p-4">
                  <Avatar name={app.profile.fullName} url={app.profile.avatarUrl} size={40} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold text-sm">{app.profile.fullName}</p>
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <a href={`mailto:${app.profile.email}`}
                        className="flex items-center gap-1 text-white/40 hover:text-primary text-xs transition-colors">
                        <Mail className="w-3 h-3" /> {app.profile.email}
                      </a>
                      {app.profile.mobileNumber && (
                        <a href={`tel:${app.profile.mobileNumber}`}
                          className="flex items-center gap-1 text-white/40 hover:text-primary text-xs transition-colors">
                          <Phone className="w-3 h-3" /> {app.profile.mobileNumber}
                        </a>
                      )}
                    </div>
                    <p className="text-white/25 text-[11px] mt-0.5">
                      Applied {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>

                  {/* Status selector + expand */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      {updating === app.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                      ) : (
                        <select
                          value={app.status}
                          onChange={e => updateStatus(app.id, e.target.value)}
                          className="appearance-none bg-white/5 border border-white/10 text-white/60 text-xs rounded-lg pl-3 pr-7 h-7 focus:outline-none focus:border-primary cursor-pointer"
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                    </div>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : app.id)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded cover letter */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-white/5">
                    <div className="flex items-center gap-2 mb-2 pt-3">
                      <MessageSquare className="w-3.5 h-3.5 text-white/30" />
                      <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">Cover Letter</span>
                    </div>
                    {app.coverLetter ? (
                      <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{app.coverLetter}</p>
                    ) : (
                      <p className="text-white/25 text-sm italic">No cover letter provided</p>
                    )}

                    {/* Quick action buttons */}
                    <div className="flex gap-2 mt-4 flex-wrap">
                      {(["REVIEWED","SHORTLISTED","REJECTED","HIRED"] as AppStatus[])
                        .filter(s => s !== app.status)
                        .map(s => {
                          const st = STATUS_STYLES[s]
                          return (
                            <button key={s}
                              onClick={() => updateStatus(app.id, s)}
                              disabled={updating === app.id}
                              className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all disabled:opacity-40 ${st.chip} border-current/20 hover:brightness-125`}
                            >
                              <CheckCircle2 className="w-3 h-3" /> Mark {s.charAt(0) + s.slice(1).toLowerCase()}
                            </button>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

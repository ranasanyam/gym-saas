"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Briefcase, Plus, X, Loader2, MapPin, Users, Eye,
  Pencil, Trash2, CheckCircle2, Navigation
} from "lucide-react"

const JOB_TYPES  = ["FULL_TIME","PART_TIME","CONTRACT","FREELANCE"]
const WORK_MODES = ["ON_SITE","HYBRID","REMOTE"]
const JOB_STATUS = ["OPEN","PAUSED","CLOSED","FILLED"]

const JOB_TYPE_LABEL: Record<string,string> = {
  FULL_TIME:"Full Time", PART_TIME:"Part Time", CONTRACT:"Contract", FREELANCE:"Freelance",
}
const WORK_MODE_LABEL: Record<string,string> = { ON_SITE:"On-site", HYBRID:"Hybrid", REMOTE:"Remote" }
const STATUS_COLORS: Record<string,string> = {
  OPEN:   "bg-green-500/15 text-green-400",
  PAUSED: "bg-yellow-500/15 text-yellow-400",
  CLOSED: "bg-white/10 text-white/40",
  FILLED: "bg-blue-500/15 text-blue-400",
}

interface Gym { id: string; name: string }
interface Job {
  id: string; title: string; jobType: string; workMode: string; status: string
  city: string|null; state: string|null; location: string|null
  applicationCount: number; viewCount: number
  createdAt: string; expiresAt: string|null; gym: { id: string; name: string }
}

const EMPTY_FORM = {
  gymId:"", title:"", jobType:"FULL_TIME", workMode:"ON_SITE",
  specializations:"", salaryCurrency:"INR", salaryMin:"", salaryMax:"",
  experienceMin:"", city:"", state:"", location:"", shortDescription:"",
  fullDescription:"", requirements:"", benefits:"",
  contactEmail:"", contactPhone:"", applicationInstructions:"",
  expiresAt:"",
}

const inp = "bg-[hsl(220_25%_11%)] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-primary rounded-xl px-4 h-10 text-sm w-full"
const ta  = "bg-[hsl(220_25%_11%)] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-primary rounded-xl px-4 py-3 text-sm w-full resize-none"

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest pt-1">{children}</p>
  )
}

function JobForm({ gyms, form, setForm, onSubmit, onCancel, saving, mode }: any) {
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p: any) => ({ ...p, [k]: e.target.value }))

  return (
    <div className="bg-[hsl(220_25%_9%)] border border-primary/20 rounded-2xl p-6 mb-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-white font-semibold">{mode === "edit" ? "Edit Job Posting" : "Post a New Job"}</h3>
          <p className="text-white/35 text-xs mt-0.5">Fill in the details for the position</p>
        </div>
        <button onClick={onCancel} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">

        {/* ── Basic info ── */}
        <div className="space-y-3">
          <SectionLabel>Basic Info</SectionLabel>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs">Gym *</label>
              <select value={form.gymId} onChange={set("gymId")} className={inp}>
                <option value="">— Select gym —</option>
                {gyms.map((g: Gym) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs">Job Title *</label>
              <input value={form.title} onChange={set("title")} placeholder="e.g. Personal Trainer" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs">Job Type *</label>
              <select value={form.jobType} onChange={set("jobType")} className={inp}>
                {JOB_TYPES.map(t => <option key={t} value={t}>{JOB_TYPE_LABEL[t]}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs">Work Mode *</label>
              <select value={form.workMode} onChange={set("workMode")} className={inp}>
                {WORK_MODES.map(m => <option key={m} value={m}>{WORK_MODE_LABEL[m]}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs">Specializations <span className="text-white/25">(comma-separated)</span></label>
              <input value={form.specializations} onChange={set("specializations")}
                placeholder="Weight Training, Yoga, CrossFit" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs">Min Experience (years)</label>
              <input type="number" value={form.experienceMin} onChange={set("experienceMin")} placeholder="1" className={inp} />
            </div>
          </div>
        </div>

        {/* ── Location ── */}
        <div className="space-y-3">
          <SectionLabel>Location</SectionLabel>
          <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-white/50 text-xs">City</label>
                <input value={form.city} onChange={set("city")} placeholder="e.g. Mumbai" className={inp} />
              </div>
              <div className="space-y-1.5">
                <label className="text-white/50 text-xs">State</label>
                <input value={form.state} onChange={set("state")} placeholder="e.g. Maharashtra" className={inp} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs flex items-center gap-1.5">
                <Navigation className="w-3 h-3 text-primary/60" />
                Exact Address
                <span className="text-primary/60 font-normal normal-case tracking-normal">(visible to subscribed trainers only)</span>
              </label>
              <textarea
                value={form.location}
                onChange={set("location")}
                placeholder={"Line 1: Building name, Floor/Unit no.\nLine 2: Street name, Area\nLine 3: Landmark (optional)\nCity – Pin code"}
                rows={4}
                className={ta}
              />
              <p className="text-white/20 text-[11px]">
                Example: "2nd Floor, Fitness Hub Tower, MG Road, near Inorbit Mall, Malad West – Mumbai 400064"
              </p>
            </div>
          </div>
        </div>

        {/* ── Salary ── */}
        <div className="space-y-3">
          <SectionLabel>Salary</SectionLabel>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs">Min Salary (₹/mo)</label>
              <input type="number" value={form.salaryMin} onChange={set("salaryMin")} placeholder="20000" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs">Max Salary (₹/mo)</label>
              <input type="number" value={form.salaryMax} onChange={set("salaryMax")} placeholder="50000" className={inp} />
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        <div className="space-y-3">
          <SectionLabel>Description</SectionLabel>
          <div className="space-y-1.5">
            <label className="text-white/50 text-xs">Short Description <span className="text-white/25">(public preview)</span></label>
            <textarea value={form.shortDescription} onChange={set("shortDescription")}
              placeholder="A brief summary visible to all trainers…" rows={2} className={ta} />
          </div>
          <div className="space-y-1.5">
            <label className="text-white/50 text-xs">Full Description * <span className="text-primary/60">(subscribers only)</span></label>
            <textarea value={form.fullDescription} onChange={set("fullDescription")}
              placeholder="Detailed job description, responsibilities, and expectations…" rows={4} className={ta} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-white/50 text-xs">Requirements <span className="text-white/25">(one per line)</span></label>
            <textarea value={form.requirements} onChange={set("requirements")}
              placeholder={"ACE/NSCA certified\n2+ years experience"} rows={3} className={ta} />
          </div>
          <div className="space-y-1.5">
            <label className="text-white/50 text-xs">Benefits <span className="text-white/25">(one per line)</span></label>
            <textarea value={form.benefits} onChange={set("benefits")}
              placeholder={"Free gym membership\nPerformance bonus"} rows={3} className={ta} />
          </div>
        </div>

        {/* ── Contact (gated) ── */}
        <div className="space-y-3">
          <SectionLabel>Contact Info <span className="text-primary/40 normal-case tracking-normal font-normal">(subscribers only)</span></SectionLabel>
          <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-white/50 text-xs">Contact Email</label>
                <input value={form.contactEmail} onChange={set("contactEmail")} placeholder="hr@yourgym.com" className={inp} />
              </div>
              <div className="space-y-1.5">
                <label className="text-white/50 text-xs">Contact Phone</label>
                <input value={form.contactPhone} onChange={set("contactPhone")} placeholder="+91 XXXXX XXXXX" className={inp} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs">Application Instructions</label>
              <textarea value={form.applicationInstructions} onChange={set("applicationInstructions")}
                placeholder="How should candidates apply? What documents to include?" rows={3} className={ta} />
            </div>
          </div>
        </div>

        {/* ── Misc ── */}
        <div className="space-y-3">
          <SectionLabel>Other</SectionLabel>
          <div className="space-y-1.5 max-w-xs">
            <label className="text-white/50 text-xs">Expires At</label>
            <input type="date" value={form.expiresAt} onChange={set("expiresAt")} className={inp} />
          </div>
        </div>

        <div className="flex gap-3 pt-1 border-t border-white/5">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {mode === "edit" ? "Save Changes" : "Post Job"}
          </button>
          <button type="button" onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-sm text-white/40 hover:text-white border border-white/8 hover:border-white/20 transition-all">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default function OwnerJobsPage() {
  const [jobs, setJobs]       = useState<Job[]>([])
  const [gyms, setGyms]       = useState<Gym[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]   = useState<string|null>(null)
  const [form, setForm]       = useState({ ...EMPTY_FORM })
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState("")
  const [deletingId, setDeletingId] = useState<string|null>(null)

  const load = useCallback(async () => {
    const [jobsRes, gymsRes] = await Promise.all([
      fetch("/api/owner/jobs"),
      fetch("/api/owner/gyms"),
    ])
    const [jobsData, gymsData] = await Promise.all([jobsRes.json(), gymsRes.json()])
    setJobs(Array.isArray(jobsData) ? jobsData : [])
    setGyms(Array.isArray(gymsData) ? gymsData : (gymsData.gyms ?? []))
  }, [])

  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  const openCreate = () => {
    setEditId(null)
    setForm({ ...EMPTY_FORM, gymId: gyms[0]?.id ?? "" })
    setShowForm(true)
    setError("")
  }

  const openEdit = async (jobId: string) => {
    setEditId(jobId)
    setShowForm(true)
    setError("")
    // Fetch full details so all gated fields (location, contact, etc.) pre-fill correctly
    const res  = await fetch(`/api/owner/jobs/${jobId}`)
    const data = await res.json()
    setForm({
      ...EMPTY_FORM,
      gymId:                   data.gymId ?? "",
      title:                   data.title ?? "",
      jobType:                 data.jobType ?? "FULL_TIME",
      workMode:                data.workMode ?? "ON_SITE",
      specializations:         (data.specializations ?? []).join(", "),
      salaryCurrency:          data.salaryCurrency ?? "INR",
      salaryMin:               data.salaryMin != null ? String(data.salaryMin) : "",
      salaryMax:               data.salaryMax != null ? String(data.salaryMax) : "",
      experienceMin:           data.experienceMin != null ? String(data.experienceMin) : "",
      city:                    data.city ?? "",
      state:                   data.state ?? "",
      location:                data.location ?? "",
      shortDescription:        data.shortDescription ?? "",
      fullDescription:         data.fullDescription ?? "",
      requirements:            (data.requirements ?? []).join("\n"),
      benefits:                (data.benefits ?? []).join("\n"),
      contactEmail:            data.contactEmail ?? "",
      contactPhone:            data.contactPhone ?? "",
      applicationInstructions: data.applicationInstructions ?? "",
      expiresAt:               data.expiresAt ? data.expiresAt.slice(0, 10) : "",
    })
  }

  const buildPayload = (f: typeof EMPTY_FORM) => ({
    gymId:                   f.gymId,
    title:                   f.title,
    jobType:                 f.jobType,
    workMode:                f.workMode,
    specializations:         f.specializations.split(",").map(s => s.trim()).filter(Boolean),
    salaryCurrency:          f.salaryCurrency,
    salaryMin:               f.salaryMin ? parseInt(f.salaryMin) : null,
    salaryMax:               f.salaryMax ? parseInt(f.salaryMax) : null,
    experienceMin:           f.experienceMin ? parseInt(f.experienceMin) : null,
    city:                    f.city || null,
    state:                   f.state || null,
    location:                f.location || null,
    shortDescription:        f.shortDescription || null,
    fullDescription:         f.fullDescription,
    requirements:            f.requirements.split("\n").map(s => s.trim()).filter(Boolean),
    benefits:                f.benefits.split("\n").map(s => s.trim()).filter(Boolean),
    contactEmail:            f.contactEmail || null,
    contactPhone:            f.contactPhone || null,
    applicationInstructions: f.applicationInstructions || null,
    expiresAt:               f.expiresAt || null,
  })

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const url    = editId ? `/api/owner/jobs/${editId}` : "/api/owner/jobs"
      const method = editId ? "PATCH" : "POST"
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(buildPayload(form)),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to save"); return }
      await load()
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (jobId: string) => {
    if (!confirm("Delete this job posting?")) return
    setDeletingId(jobId)
    await fetch(`/api/owner/jobs/${jobId}`, { method: "DELETE" })
    await load()
    setDeletingId(null)
  }

  const handleStatusChange = async (jobId: string, status: string) => {
    await fetch(`/api/owner/jobs/${jobId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    })
    await load()
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
      {[...Array(3)].map((_,i) => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" /> Job Postings
          </h2>
          <p className="text-white/35 text-sm mt-0.5">Manage job openings for your gyms</p>
        </div>
        {!showForm && (
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Post Job
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {showForm && (
        <JobForm
          gyms={gyms} form={form} setForm={setForm}
          onSubmit={handleSubmit} onCancel={() => setShowForm(false)}
          saving={saving} mode={editId ? "edit" : "create"}
        />
      )}

      {!jobs.length ? (
        <div className="text-center py-16 text-white/30">
          <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No job postings yet. Click "Post Job" to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.id} className="bg-[hsl(220_25%_9%)] border border-white/8 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white font-semibold text-sm">{job.title}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status] ?? "bg-white/10 text-white/40"}`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-white/45 text-xs mt-0.5">{job.gym.name}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-white/35 text-xs">
                    <span>{JOB_TYPE_LABEL[job.jobType]}</span>
                    <span>·</span>
                    <span>{WORK_MODE_LABEL[job.workMode]}</span>
                    {(job.city || job.state) && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {[job.city, job.state].filter(Boolean).join(", ")}
                        </span>
                      </>
                    )}
                    <span>·</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{job.applicationCount} applied</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{job.viewCount} views</span>
                  </div>
                  {job.location && (
                    <p className="text-white/25 text-[11px] mt-1.5 flex items-start gap-1">
                      <Navigation className="w-3 h-3 shrink-0 mt-0.5" />
                      <span className="truncate">{job.location}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                                      <Link href={`/owner/jobs/${job.id}/applications`}
                    className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-white/40 hover:text-primary hover:bg-primary/10 border border-white/8 hover:border-primary/20 text-xs transition-all">
                    <Users className="w-3.5 h-3.5" />
                    {job.applicationCount > 0 ? job.applicationCount : "0"}
                  </Link>
                  <select
                    value={job.status}
                    onChange={e => handleStatusChange(job.id, e.target.value)}
                    className="bg-white/5 border border-white/10 text-white/50 text-xs rounded-lg px-2 h-7 focus:outline-none focus:border-primary cursor-pointer">
                    {JOB_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => openEdit(job.id)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(job.id)} disabled={deletingId === job.id}
                    className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40">
                    {deletingId === job.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

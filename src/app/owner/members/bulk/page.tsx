// src/app/owner/members/bulk/page.tsx
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft, Plus, Trash2, Loader2, Upload, FileSpreadsheet,
  CheckCircle2, XCircle, Users, RefreshCw, AlertTriangle, Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Gym {
  id: string; name: string
  membershipPlans: { id: string; name: string; price: number; durationMonths: number }[]
}

interface BulkRow {
  name: string
  mobile: string
  startDate: string
  endDate: string
  membershipPlanId: string
  paymentReceived: boolean | null
  mobileStatus: "idle" | "checking" | "ok" | "cross_dup"
  errors: Partial<Record<"name" | "mobile" | "plan" | "payment", string>>
}

interface ConfirmRow {
  name: string
  mobile: string
  normMobile?: string
  startDate?: string
  endDate?: string
  membershipPlanId?: string
  paymentReceived?: boolean
}

interface InvalidRow { name: string; mobile: string; reason: string }

interface BulkPreview {
  newUsers:    ConfirmRow[]
  invited:     ConfirmRow[]
  onGymStack:  ConfirmRow[]
  alreadyHere: ConfirmRow[]
  invalid:     InvalidRow[]
}

type Step = "form" | "preview" | "done"
type InputMode = "rows" | "excel"

// ── Helpers ───────────────────────────────────────────────────────────────────

function addMonths(dateStr: string, months: number): string {
  const d   = new Date(dateStr)
  const day = d.getDate()
  d.setMonth(d.getMonth() + months)
  if (d.getDate() !== day) d.setDate(0)
  return d.toISOString().split("T")[0]
}

function normMobile(mobile: string): string {
  return mobile.replace(/\D/g, "").slice(-10)
}

function today(): string {
  return new Date().toISOString().split("T")[0]
}

function makeEmptyRow(): BulkRow {
  return {
    name: "", mobile: "", startDate: today(), endDate: "",
    membershipPlanId: "", paymentReceived: null,
    mobileStatus: "idle", errors: {},
  }
}

function parsePastedText(text: string): { name: string; mobile: string }[] {
  const mobileRe = /(?:\+91)?[6-9]\d{9}/g
  return text
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const mobiles = line.match(mobileRe)
      if (!mobiles) return null
      const mobile = mobiles[0].replace(/\+91/, "")
      const name   = line.replace(mobileRe, "").replace(/[,\t|;]+/g, " ").trim()
      return { name: name || "Unknown", mobile }
    })
    .filter(Boolean) as { name: string; mobile: string }[]
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
        <div className="h-11 bg-white/8 rounded-xl" />
      </div>
      <div className="h-12 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4 space-y-2.5">
            <div className="flex gap-2">
              <div className="h-10 flex-1 bg-white/8 rounded-xl" />
              <div className="h-10 flex-1 bg-white/8 rounded-xl" />
              <div className="h-10 w-8 bg-white/8 rounded-lg" />
            </div>
            <div className="grid grid-cols-[1.5fr_110px_110px_auto] gap-2">
              <div className="h-10 bg-white/8 rounded-xl" />
              <div className="h-10 bg-white/8 rounded-xl" />
              <div className="h-10 bg-white/8 rounded-xl" />
              <div className="h-10 w-16 bg-white/8 rounded-xl" />
            </div>
            <div className="h-8 w-48 bg-white/8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

function CategoryCard({
  title, color, icon, rows, subtitle,
}: {
  title: string; color: string; icon: React.ReactNode
  rows: { name: string; mobile: string }[]; subtitle?: string
}) {
  const [open, setOpen] = useState(false)
  if (rows.length === 0) return null
  return (
    <div className={`border rounded-2xl overflow-hidden ${color}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <span className="text-white font-medium text-sm">{rows.length} {title}</span>
            {subtitle && <p className="text-white/45 text-xs mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <span className="text-white/40 text-xs">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="border-t border-white/8 divide-y divide-white/5 max-h-60 overflow-y-auto">
          {rows.map((r, i) => (
            <div key={i} className="px-5 py-2.5 flex items-center justify-between">
              <span className="text-white/80 text-sm">{r.name}</span>
              <span className="text-white/40 text-xs font-mono">{r.mobile}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PaymentRadio({ value, onChange }: {
  value: boolean | null
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-3 h-7 rounded-lg text-xs font-medium transition-all border ${
          value === true
            ? "bg-green-500/20 border-green-500/50 text-green-300"
            : "border-white/10 text-white/35 hover:border-white/25 hover:text-white/60"
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-3 h-7 rounded-lg text-xs font-medium transition-all border ${
          value === false
            ? "bg-red-500/15 border-red-500/35 text-red-300"
            : "border-white/10 text-white/35 hover:border-white/25 hover:text-white/60"
        }`}
      >
        No
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BulkAddMembersPage() {
  const router    = useRouter()
  const { toast } = useToast()

  const [gyms,        setGyms]        = useState<Gym[]>([])
  const [gymsLoading, setGymsLoading] = useState(true)
  const [gymId,       setGymId]       = useState("")

  const [step,      setStep]      = useState<Step>("form")
  const [inputMode, setInputMode] = useState<InputMode>("rows")
  const [loading,   setLoading]   = useState(false)
  const [canExcel,  setCanExcel]  = useState(false)

  const [rows, setRows] = useState<BulkRow[]>([
    makeEmptyRow(), makeEmptyRow(), makeEmptyRow(),
  ])

  const fileRef    = useRef<HTMLInputElement>(null)
  const [file,     setFile]     = useState<File | null>(null)
  const [fileName, setFileName] = useState("")

  const [preview,       setPreview]       = useState<BulkPreview | null>(null)
  const [confirmedRows, setConfirmedRows] = useState<ConfirmRow[]>([])
  const [doneResult,    setDoneResult]    = useState<{
    added: number; skipped: number; total: number
    failed: { name: string; mobile: string; reason: string }[]
  } | null>(null)

  const debounceTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-10 rounded-xl text-sm"
  const sel = "w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-primary"

  useEffect(() => {
    Promise.all([
      fetch("/api/owner/gyms").then(r => r.json()),
      fetch("/api/owner/members/upload-excel").then(r => r.json()).catch(() => ({ canUpload: false })),
    ]).then(([data, excelCheck]) => {
      if (Array.isArray(data)) {
        setGyms(data)
        if (data.length > 0) setGymId(data[0].id)
      }
      if (excelCheck.canUpload) setCanExcel(true)
    }).finally(() => setGymsLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedGym = gyms.find(g => g.id === gymId)

  // ── Cross-row duplicate detection ───────────────────────────────────────────

  const recomputeCrossRowDups = useCallback((current: BulkRow[]): BulkRow[] => {
    const count = new Map<string, number>()
    for (const r of current) {
      const n = normMobile(r.mobile)
      if (n.length === 10) count.set(n, (count.get(n) ?? 0) + 1)
    }
    return current.map(r => {
      const n = normMobile(r.mobile)
      if (n.length === 10 && (count.get(n) ?? 0) > 1) {
        if (r.mobileStatus !== "cross_dup") {
          return {
            ...r,
            mobileStatus: "cross_dup" as const,
            errors: { ...r.errors, mobile: "Duplicate mobile in this batch" },
          }
        }
      } else if (r.mobileStatus === "cross_dup") {
        return {
          ...r,
          mobileStatus: "idle" as const,
          errors: { ...r.errors, mobile: undefined },
        }
      }
      return r
    })
  }, [])

  // ── Row management ──────────────────────────────────────────────────────────

  const updateRow = (i: number, patch: Partial<BulkRow>) =>
    setRows(prev => {
      const next = prev.map((r, idx) => {
        if (idx !== i) return r
        const updated = { ...r, ...patch }
        // Auto-compute end date when start date or plan changes
        if (patch.startDate !== undefined || patch.membershipPlanId !== undefined) {
          if (updated.membershipPlanId && updated.startDate) {
            const plan = selectedGym?.membershipPlans.find(p => p.id === updated.membershipPlanId)
            if (plan) updated.endDate = addMonths(updated.startDate, plan.durationMonths)
          }
        }
        return updated
      })
      return recomputeCrossRowDups(next)
    })

  const handleMobileChange = (i: number, val: string) => {
    // Clear existing debounce timer
    const existing = debounceTimers.current.get(i)
    if (existing) clearTimeout(existing)

    setRows(prev => {
      const next = prev.map((r, idx) =>
        idx === i
          ? { ...r, mobile: val, mobileStatus: "idle" as const, errors: { ...r.errors, mobile: undefined } }
          : r
      )
      return recomputeCrossRowDups(next)
    })

    // Debounced DB status check (informational)
    const norm = normMobile(val)
    if (norm.length === 10) {
      const timer = setTimeout(async () => {
        setRows(prev => prev.map((r, idx) =>
          idx === i && r.mobileStatus !== "cross_dup"
            ? { ...r, mobileStatus: "checking" }
            : r
        ))
        try {
          const res  = await fetch(`/api/auth/check-mobile-status?mobile=${encodeURIComponent(norm)}`)
          const data = await res.json()
          setRows(prev => prev.map((r, idx) => {
            if (idx !== i || r.mobileStatus === "cross_dup") return r
            return { ...r, mobileStatus: data.status === "NOT_FOUND" ? "ok" : "ok" }
          }))
        } catch {
          setRows(prev => prev.map((r, idx) =>
            idx === i && r.mobileStatus === "checking"
              ? { ...r, mobileStatus: "idle" }
              : r
          ))
        }
      }, 500)
      debounceTimers.current.set(i, timer)
    }
  }

  const removeRow = (i: number) => {
    debounceTimers.current.get(i) && clearTimeout(debounceTimers.current.get(i)!)
    debounceTimers.current.delete(i)
    setRows(prev => recomputeCrossRowDups(prev.filter((_, idx) => idx !== i)))
  }

  const addRow = () => setRows(prev => [...prev, makeEmptyRow()])

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const parsed = parsePastedText(e.clipboardData.getData("text"))
    if (parsed.length === 0) return
    const t = today()
    setRows(prev => {
      const filled   = prev.filter(r => r.name.trim() || r.mobile.trim())
      const newRows  = parsed.map(p => ({ ...makeEmptyRow(), name: p.name, mobile: p.mobile, startDate: t }))
      return recomputeCrossRowDups([...filled, ...newRows])
    })
    toast({ title: `Parsed ${parsed.length} rows from pasted text` })
  }

  // ── Validate before preview ─────────────────────────────────────────────────

  const validateRows = (): boolean => {
    let valid = true
    setRows(prev =>
      recomputeCrossRowDups(prev.map(r => {
        if (!r.name.trim() && !r.mobile.trim()) return r // completely empty rows are fine (filtered out)
        const errors: BulkRow["errors"] = { ...r.errors }
        if (!r.name.trim())            { errors.name    = "Name is required";          valid = false }
        if (!normMobile(r.mobile).length) { errors.mobile = "Mobile is required";       valid = false }
        else if (normMobile(r.mobile).length !== 10) { errors.mobile = "Enter a valid 10-digit mobile"; valid = false }
        if (!r.membershipPlanId)       { errors.plan    = "Select a plan";             valid = false }
        if (r.paymentReceived === null) { errors.payment = "Select Yes or No";          valid = false }
        if (r.mobileStatus === "cross_dup") { errors.mobile = errors.mobile ?? "Duplicate mobile in this batch"; valid = false }
        return { ...r, errors }
      }))
    )
    return valid
  }

  // ── Step 1 → 2: Preview ────────────────────────────────────────────────────

  const handlePreview = async () => {
    if (!gymId) { toast({ variant: "destructive", title: "Please select a gym" }); return }

    const validRows = rows.filter(r => r.name.trim() || r.mobile.trim())
    if (validRows.length === 0 && inputMode === "rows") {
      toast({ variant: "destructive", title: "Please enter at least one member" })
      return
    }

    if (inputMode === "rows" && !validateRows()) {
      toast({ variant: "destructive", title: "Fix errors in the rows below" })
      return
    }

    if (inputMode === "rows") {
      const hasPending = validRows.some(r => r.mobileStatus === "checking")
      if (hasPending) {
        toast({ variant: "destructive", title: "Wait for mobile checks to complete" })
        return
      }
    }

    setLoading(true)
    try {
      if (inputMode === "rows") {
        const filled = rows.filter(r => r.name.trim() && r.mobile.trim())

        const metaMap = new Map(filled.map(r => [
          normMobile(r.mobile),
          {
            startDate:        r.startDate,
            endDate:          r.endDate,
            membershipPlanId: r.membershipPlanId,
            paymentReceived:  r.paymentReceived as boolean,
          },
        ]))

        const res  = await fetch("/api/owner/members/bulk", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ gymId, rows: filled.map(r => ({ name: r.name, mobile: r.mobile })) }),
        })
        const data = await res.json()
        if (!res.ok) {
          if (data.upgradeRequired) {
            toast({ variant: "destructive", title: "Upgrade required", description: data.error })
          } else {
            throw new Error(data.error)
          }
          return
        }

        const attachMeta = (arr: ConfirmRow[]) =>
          arr.map(r => ({ ...r, ...(metaMap.get(r.normMobile ?? normMobile(r.mobile)) ?? {}) }))

        const preview: BulkPreview = {
          newUsers:    attachMeta(data.preview.newUsers    ?? []),
          invited:     attachMeta(data.preview.invited     ?? []),
          onGymStack:  attachMeta(data.preview.onGymStack  ?? []),
          alreadyHere: attachMeta(data.preview.alreadyHere ?? []),
          invalid:     data.preview.invalid ?? [],
        }
        setPreview(preview)
        setConfirmedRows([...preview.newUsers, ...preview.invited, ...preview.onGymStack])
        setStep("preview")

      } else {
        if (!file) { toast({ variant: "destructive", title: "Please select a file" }); return }
        const fd = new FormData()
        fd.append("file",  file)
        fd.append("gymId", gymId)
        const res  = await fetch("/api/owner/members/upload-excel", { method: "POST", body: fd })
        const data = await res.json()
        if (!res.ok) {
          if (data.upgradeRequired) {
            toast({ variant: "destructive", title: "Upgrade required", description: data.error })
          } else {
            throw new Error(data.error)
          }
          return
        }
        setPreview(data.preview)
        setConfirmedRows([
          ...(data.preview.newUsers   ?? []),
          ...(data.preview.invited    ?? []),
          ...(data.preview.onGymStack ?? []),
        ])
        setStep("preview")
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: err.message ?? "Something went wrong" })
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2 → 3: Confirm ────────────────────────────────────────────────────

  const handleConfirm = async () => {
    if (confirmedRows.length === 0) {
      toast({ variant: "destructive", title: "No actionable rows to add" })
      return
    }
    setLoading(true)
    try {
      const res  = await fetch("/api/owner/members/bulk/confirm", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          gymId,
          rows: confirmedRows.map(r => ({
            name:             r.name,
            mobile:           r.mobile,
            startDate:        r.startDate,
            endDate:          r.endDate,
            membershipPlanId: r.membershipPlanId,
            paymentReceived:  r.paymentReceived,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.conflicts) {
          const msg = data.conflicts.map((c: any) => `Row ${c.row + 1}: ${c.mobile} — ${c.reason}`).join("\n")
          toast({ variant: "destructive", title: "Conflicts found", description: msg })
        } else {
          throw new Error(data.error)
        }
        return
      }
      setDoneResult(data)
      setStep("done")
    } catch (err: any) {
      toast({ variant: "destructive", title: err.message ?? "Something went wrong" })
    } finally {
      setLoading(false)
    }
  }

  // ── Template download ─────────────────────────────────────────────────────

  const downloadTemplate = () => {
    const csv = [
      "Name,Mobile,Membership Plan,Start Date,End Date,Payment Received",
      "John Doe,9876543210,Monthly Plan,2026-04-18,2026-05-18,Yes",
      "Jane Smith,9123456789,Quarterly Plan,2026-04-18,2026-07-18,No",
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url; a.download = "members_template.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Validation summary ────────────────────────────────────────────────────

  const filledRows     = rows.filter(r => r.name.trim() || r.mobile.trim())
  const hasCrossDup    = filledRows.some(r => r.mobileStatus === "cross_dup")
  const hasErrors      = filledRows.some(r => Object.values(r.errors).some(Boolean))
  const hasPendingCheck = filledRows.some(r => r.mobileStatus === "checking")
  const previewBlocked = hasCrossDup || hasErrors || hasPendingCheck

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl">

      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => step === "form" ? router.back() : setStep("form")}
          className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-white">
            {step === "form" ? "Bulk Add Members" : step === "preview" ? "Review & Confirm" : "Done!"}
          </h2>
          <p className="text-white/40 text-sm">
            {step === "form"    ? "Add multiple members at once"
           : step === "preview" ? `${confirmedRows.length} members will be added`
           : "Members have been processed"}
          </p>
        </div>
      </div>

      {/* ── STEP: FORM ─────────────────────────────────────────────────────── */}
      {step === "form" && (
        gymsLoading ? <FormSkeleton /> : (
          <div className="space-y-5">

            {/* Gym selector (only when multiple gyms) */}
            {gyms.length > 1 && (
              <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
                <div className="space-y-1.5">
                  <Label className="text-white/55 text-sm">Gym<span className="text-primary ml-0.5">*</span></Label>
                  <select value={gymId} onChange={e => setGymId(e.target.value)}
                    className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-11 text-sm focus:outline-none focus:border-primary">
                    {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Input mode tabs */}
            <div className="flex bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
              {(["rows", "excel"] as InputMode[]).map(mode => (
                <button key={mode} type="button"
                  onClick={() => setInputMode(mode)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
                    inputMode === mode
                      ? "bg-primary/15 text-primary border-b-2 border-primary"
                      : "text-white/40 hover:text-white/70"
                  }`}>
                  {mode === "rows"
                    ? <><Users className="w-4 h-4" /> Manual Entry</>
                    : <><FileSpreadsheet className="w-4 h-4" /> Excel / CSV {!canExcel && <span className="text-xs text-white/30 ml-1">(Pro+)</span>}</>
                  }
                </button>
              ))}
            </div>

            {/* ── Manual rows ──────────────────────────────────────────────── */}
            {inputMode === "rows" && (
              <div className="space-y-3">
                {rows.map((row, i) => {
                  const plan = selectedGym?.membershipPlans.find(p => p.id === row.membershipPlanId)
                  return (
                    <div key={i} className={`bg-[hsl(220_25%_9%)] border rounded-2xl p-4 space-y-2.5 transition-colors ${
                      Object.values(row.errors).some(Boolean) || row.mobileStatus === "cross_dup"
                        ? "border-red-500/25"
                        : "border-white/6"
                    }`}>

                      {/* Row header: row number + delete */}
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-white/25 text-xs font-mono">Member {i + 1}</span>
                        <button type="button" onClick={() => removeRow(i)}
                          className="p-1 text-white/20 hover:text-red-400 transition-colors rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Name + Mobile */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Input
                            value={row.name}
                            onChange={e => updateRow(i, { name: e.target.value, errors: { ...row.errors, name: undefined } })}
                            placeholder="Full name"
                            className={`${inp} ${row.errors.name ? "border-red-500/50" : ""}`}
                          />
                          {row.errors.name && (
                            <p className="text-red-400 text-xs mt-1">{row.errors.name}</p>
                          )}
                        </div>
                        <div>
                          <div className="relative">
                            <Input
                              value={row.mobile}
                              onChange={e => handleMobileChange(i, e.target.value)}
                              placeholder="9876543210"
                              type="tel"
                              className={`${inp} pr-8 ${row.errors.mobile ? "border-red-500/50" : ""}`}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {row.mobileStatus === "checking" && <Loader2 className="w-3 h-3 animate-spin text-white/30" />}
                              {row.mobileStatus === "ok"       && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                              {row.mobileStatus === "cross_dup" && <AlertTriangle className="w-3 h-3 text-yellow-400" />}
                            </div>
                          </div>
                          {row.errors.mobile && (
                            <p className="text-red-400 text-xs mt-1">{row.errors.mobile}</p>
                          )}
                        </div>
                      </div>

                      {/* Plan + Start + End + Total */}
                      <div className="grid grid-cols-[1.5fr_105px_105px] gap-2">
                        <div>
                          <select
                            value={row.membershipPlanId}
                            onChange={e => updateRow(i, { membershipPlanId: e.target.value, errors: { ...row.errors, plan: undefined } })}
                            className={`${sel} ${row.errors.plan ? "border-red-500/50" : ""}`}
                          >
                            <option value="">Select plan *</option>
                            {selectedGym?.membershipPlans.map(p => (
                              <option key={p.id} value={p.id}>{p.name} — ₹{p.price}</option>
                            ))}
                          </select>
                          {row.errors.plan && (
                            <p className="text-red-400 text-xs mt-1">{row.errors.plan}</p>
                          )}
                        </div>
                        <Input
                          type="date"
                          value={row.startDate}
                          onChange={e => updateRow(i, { startDate: e.target.value })}
                          className={inp}
                        />
                        <Input
                          type="date"
                          value={row.endDate}
                          onChange={e => updateRow(i, { endDate: e.target.value })}
                          className={inp}
                        />
                      </div>

                      {/* Plan fee + Payment radio */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-white/40 text-xs">Payment received?</span>
                          <span className="text-white/20 text-xs">*</span>
                          <PaymentRadio
                            value={row.paymentReceived}
                            onChange={v => updateRow(i, { paymentReceived: v, errors: { ...row.errors, payment: undefined } })}
                          />
                        </div>
                        {plan && (
                          <div className="text-right shrink-0">
                            <span className="text-white/70 text-sm font-medium">
                              ₹{Number(plan.price).toLocaleString("en-IN")}
                            </span>
                            <span className="text-white/30 text-xs ml-1">total</span>
                          </div>
                        )}
                      </div>
                      {row.errors.payment && (
                        <p className="text-red-400 text-xs -mt-1">{row.errors.payment}</p>
                      )}

                    </div>
                  )
                })}

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={addRow} size="sm"
                    className="border-white/10 text-white/60 hover:text-white h-9 text-xs gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </Button>
                  <div className="relative flex-1">
                    <textarea
                      placeholder="Or paste names + numbers here (one per line)..."
                      onPaste={handlePaste}
                      rows={1}
                      className="w-full bg-[hsl(220_25%_11%)] border border-white/10 rounded-xl text-white text-xs p-2.5 focus:outline-none focus:border-primary placeholder:text-white/20 resize-none"
                    />
                  </div>
                </div>

                {hasCrossDup && (
                  <div className="flex items-center gap-2 bg-yellow-500/8 border border-yellow-500/20 rounded-xl px-4 py-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    <p className="text-yellow-300/80 text-xs">Duplicate mobile numbers found in this batch — each mobile must be unique.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Excel upload ─────────────────────────────────────────────── */}
            {inputMode === "excel" && (
              <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 space-y-4">
                {!canExcel ? (
                  <div className="flex items-start gap-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl p-4">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-yellow-300 text-sm font-medium">Pro plan required</p>
                      <p className="text-yellow-400/70 text-xs mt-0.5">
                        Excel/CSV upload is available on the Pro plan and above.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-medium">Upload Excel or CSV</p>
                        <p className="text-white/40 text-xs mt-0.5">
                          Columns: Name, Mobile, Membership Plan, Start Date, End Date, Payment Received
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}
                        className="border-white/10 bg-white/10 hover:bg-white/10 text-white/60 hover:text-white h-8 text-xs gap-1.5">
                        <Download className="w-3.5 h-3.5" /> Template
                      </Button>
                    </div>
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                        file ? "border-primary/40 bg-primary/5" : "border-white/10 hover:border-white/25 bg-white/2"
                      }`}>
                      {file ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileSpreadsheet className="w-5 h-5 text-primary" />
                          <span className="text-primary text-sm font-medium">{fileName}</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 text-white/25 mx-auto" />
                          <p className="text-white/50 text-sm">Click to upload .xlsx, .xls, or .csv</p>
                          <p className="text-white/25 text-xs">Max 2,000 rows</p>
                        </div>
                      )}
                    </button>
                    <input
                      ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) { setFile(f); setFileName(f.name) }
                      }}
                    />
                  </>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pb-4">
              <Button variant="outline" onClick={() => router.back()}
                className="border-white/10 bg-white/5 text-white hover:bg-white/8 h-11 px-6">
                Cancel
              </Button>
              <Button
                onClick={handlePreview}
                disabled={loading || (inputMode === "rows" && previewBlocked && filledRows.length > 0)}
                className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 px-8 disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Preview"}
              </Button>
            </div>
          </div>
        )
      )}

      {/* ── STEP: PREVIEW ──────────────────────────────────────────────────── */}
      {step === "preview" && preview && (
        <div className="space-y-4">
          <CategoryCard
            title="new members will be added (SMS invite sent)"
            color="bg-green-500/5 border-green-500/20"
            icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
            rows={preview.newUsers}
            subtitle="Brand new to GymStack — will receive an SMS to complete their profile"
          />
          <CategoryCard
            title="members will be re-invited"
            color="bg-blue-500/5 border-blue-500/20"
            icon={<RefreshCw className="w-4 h-4 text-blue-400" />}
            rows={preview.invited}
            subtitle="Already invited (by another gym) — a fresh SMS will be sent"
          />
          <CategoryCard
            title="existing GymStack users will be linked"
            color="bg-primary/5 border-primary/20"
            icon={<Users className="w-4 h-4 text-primary" />}
            rows={preview.onGymStack}
            subtitle="Already on GymStack — will be added silently with an in-app notification"
          />
          <CategoryCard
            title="already in this gym (skipped)"
            color="bg-yellow-500/5 border-yellow-500/20"
            icon={<AlertTriangle className="w-4 h-4 text-yellow-400" />}
            rows={preview.alreadyHere}
          />
          <CategoryCard
            title="invalid rows (skipped)"
            color="bg-red-500/5 border-red-500/20"
            icon={<XCircle className="w-4 h-4 text-red-400" />}
            rows={preview.invalid}
          />

          {confirmedRows.length === 0 && (
            <div className="flex items-center gap-3 bg-yellow-500/8 border border-yellow-500/20 rounded-2xl p-4">
              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
              <p className="text-yellow-300/90 text-sm">No actionable rows — all members are already in this gym or have invalid numbers.</p>
            </div>
          )}

          {/* Per-row payment summary */}
          {confirmedRows.length > 0 && (
            <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4 space-y-1.5">
              <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">
                Applied to {confirmedRows.length} member{confirmedRows.length !== 1 ? "s" : ""}
              </p>
              {confirmedRows.slice(0, 5).map((r, i) => {
                const paid = r.paymentReceived === true
                return (
                  <div key={i} className="flex items-center justify-between py-0.5">
                    <span className="text-white/70 text-sm">{r.name}</span>
                    <span className={`text-xs font-medium ${paid ? "text-green-400" : "text-white/35"}`}>
                      {paid ? "Payment received" : "Pending"}
                    </span>
                  </div>
                )
              })}
              {confirmedRows.length > 5 && (
                <p className="text-white/30 text-xs pt-1">+{confirmedRows.length - 5} more</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pb-4">
            <Button variant="outline" onClick={() => setStep("form")}
              className="border-white/10 bg-white/5 text-white hover:bg-white/8 h-11 px-6">
              Back
            </Button>
            <Button onClick={handleConfirm} disabled={loading || confirmedRows.length === 0}
              className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 px-8">
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : `Confirm — Add ${confirmedRows.length} Member${confirmedRows.length !== 1 ? "s" : ""}`
              }
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP: DONE ─────────────────────────────────────────────────────── */}
      {step === "done" && doneResult && (
        <div className="space-y-5">
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-green-500/15 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Bulk add complete</h3>
                <p className="text-white/45 text-sm">{doneResult.total} rows processed</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-3 text-center">
                <p className="text-green-400 text-2xl font-display font-bold">{doneResult.added}</p>
                <p className="text-white/50 text-xs mt-0.5">Added</p>
              </div>
              <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-xl p-3 text-center">
                <p className="text-yellow-400 text-2xl font-display font-bold">{doneResult.skipped}</p>
                <p className="text-white/50 text-xs mt-0.5">Skipped</p>
              </div>
              <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3 text-center">
                <p className="text-red-400 text-2xl font-display font-bold">{doneResult.failed.length}</p>
                <p className="text-white/50 text-xs mt-0.5">Failed</p>
              </div>
            </div>
          </div>

          {doneResult.failed.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/8">
                <p className="text-red-300 text-sm font-medium">Failed rows</p>
              </div>
              <div className="divide-y divide-white/5 max-h-60 overflow-y-auto">
                {doneResult.failed.map((f, i) => (
                  <div key={i} className="px-5 py-2.5 flex items-center justify-between gap-4">
                    <span className="text-white/70 text-sm">{f.name} ({f.mobile})</span>
                    <span className="text-red-400/70 text-xs text-right">{f.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pb-4">
            <Button variant="outline"
              onClick={() => { setStep("form"); setFile(null); setFileName(""); setPreview(null); setRows([makeEmptyRow(), makeEmptyRow(), makeEmptyRow()]) }}
              className="border-white/10 bg-white/5 text-white hover:bg-white/8 h-11 px-6">
              Add More
            </Button>
            <Button onClick={() => router.push("/owner/members")}
              className="flex-1 bg-gradient-primary hover:opacity-90 text-white font-semibold h-11">
              View All Members
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

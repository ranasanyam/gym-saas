// src/app/member/profile/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { useProfile } from "@/contexts/ProfileContext"
import { useToast } from "@/hooks/use-toast"
import {
  Lock, Save, Loader2, Eye, EyeOff, Camera,
  TrendingUp, TrendingDown, Minus, Activity, CalendarCheck,
  Dumbbell, UtensilsCrossed,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/Avatar"

const GENDER_OPTIONS = ["MALE", "FEMALE", "OTHER"]

export default function MemberProfilePage() {
  const { profile, refresh } = useProfile()
  const { toast }            = useToast()

  const [tab, setTab]     = useState<"profile" | "password">("profile")
  const [saving, setSaving]               = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [metrics, setMetrics]             = useState<any[]>([])
  const [dashData, setDashData]           = useState<any>(null)

  const [form, setForm] = useState({
    fullName:     "",
    mobileNumber: "",
    city:         "",
    gender:       "",
  })
  const [pwForm, setPwForm]   = useState({ current: "", next: "", confirm: "" })
  const [showPw, setShowPw]   = useState({ current: false, next: false, confirm: false })

  useEffect(() => {
    if (profile) {
      setForm({
        fullName:     profile.fullName     ?? "",
        mobileNumber: profile.mobileNumber ?? "",
        city:         profile.city         ?? "",
        gender:       (profile as any).gender ?? "",
      })
    }
  }, [profile])

  const loadExtras = useCallback(() => {
    Promise.all([
      fetch("/api/member/body-metrics").then(r => r.json()),
      fetch("/api/member/dashboard").then(r => r.json()),
    ]).then(([m, d]) => {
      setMetrics(Array.isArray(m) ? m : [])
      setDashData(d)
    }).catch(() => {})
  }, [])

  useEffect(() => { loadExtras() }, [loadExtras])

  const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-11 rounded-xl"

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const fd = new FormData(); fd.append("file", file)
      const upRes  = await fetch("/api/upload", { method: "POST", body: fd })
      const upData = await upRes.json()
      if (!upRes.ok) throw new Error(upData.error ?? "Upload failed")
      const saveRes = await fetch("/api/profile/update", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: upData.url }),
      })
      if (!saveRes.ok) throw new Error("Failed to save avatar")
      await refresh()
      toast({ variant: "success", title: "Profile photo updated!" })
    } catch (err: any) {
      toast({ variant: "destructive", title: err.message ?? "Upload failed" })
    } finally {
      setAvatarUploading(false); e.target.value = ""
    }
  }

  const saveProfile = async () => {
    if (!form.fullName.trim()) { toast({ variant: "destructive", title: "Name is required" }); return }
    setSaving(true)
    const res = await fetch("/api/profile/update", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) { await refresh(); toast({ variant: "success", title: "Profile updated!" }) }
    else toast({ variant: "destructive", title: "Failed to update profile" })
    setSaving(false)
  }

  const changePassword = async () => {
    if (!pwForm.current || !pwForm.next) { toast({ variant: "destructive", title: "Fill in all fields" }); return }
    if (pwForm.next !== pwForm.confirm)  { toast({ variant: "destructive", title: "Passwords don't match" }); return }
    if (pwForm.next.length < 8)          { toast({ variant: "destructive", title: "Password must be at least 8 characters" }); return }
    setSaving(true)
    const res = await fetch("/api/profile/change-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
    })
    if (res.ok) {
      toast({ variant: "success", title: "Password changed!" })
      setPwForm({ current: "", next: "", confirm: "" })
    } else {
      const d = await res.json()
      toast({ variant: "destructive", title: d.error ?? "Failed to change password" })
    }
    setSaving(false)
  }

  // Body metrics trend helper
  const latest = metrics[0]
  const prev   = metrics[1]

  const trendIcon = (curr: number | null, prevVal: number | null, lowerIsBetter = false) => {
    if (curr == null || prevVal == null) return null
    const diff = curr - prevVal
    if (Math.abs(diff) < 0.01) return { Icon: Minus, color: "text-white/40", label: "—" }
    const improving = lowerIsBetter ? diff < 0 : diff > 0
    return improving
      ? { Icon: TrendingUp,   color: "text-green-400", label: `${diff > 0 ? "+" : ""}${diff.toFixed(1)}` }
      : { Icon: TrendingDown, color: "text-red-400",   label: `${diff > 0 ? "+" : ""}${diff.toFixed(1)}` }
  }

  const streak      = dashData?.streak ?? { current: 0, longest: 0, total: 0 }
  const activeMem   = dashData?.activeMembership
  const memberSince = activeMem?.startDate

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">My Profile</h2>
        <p className="text-white/35 text-sm mt-0.5">Manage your account settings</p>
      </div>

      {/* Avatar + identity */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar name={profile?.fullName ?? "Member"} url={profile?.avatarUrl} size={72} rounded="lg" />
            <label className={`absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[hsl(220_25%_14%)] border border-white/15 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors ${avatarUploading ? "opacity-50 pointer-events-none" : ""}`}>
              {avatarUploading ? <Loader2 className="w-3.5 h-3.5 text-white/60 animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white/60" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <div>
            <p className="text-white font-semibold text-lg">{profile?.fullName}</p>
            <p className="text-white/40 text-sm mt-0.5">{profile?.email}</p>
            <p className="text-white/25 text-xs mt-1">Member · {activeMem?.gym?.name ?? "No gym"}</p>
            {memberSince && (
              <p className="text-white/25 text-xs mt-0.5">
                Since {new Date(memberSince).toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </p>
            )}
          </div>
        </div>

        {/* Progress stats */}
        <div className="grid grid-cols-4 gap-2 mt-5 pt-5 border-t border-white/6">
          {[
            { icon: CalendarCheck, label: "Streak",     value: `🔥 ${streak.current}` },
            { icon: Activity,      label: "Total",      value: streak.total },
            { icon: Dumbbell,      label: "Workouts",   value: dashData?.stats?.workoutPlans ?? 0 },
            { icon: UtensilsCrossed, label: "Diets",    value: dashData?.stats?.dietPlans   ?? 0 },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="text-center p-2.5 bg-white/3 rounded-xl">
              <Icon className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
              <p className="text-white font-semibold text-sm">{value}</p>
              <p className="text-white/30 text-[10px]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/4 rounded-xl p-1 w-fit">
        {[["profile","Profile Info"],["password","Change Password"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key ? "bg-[hsl(220_25%_12%)] text-white shadow" : "text-white/40 hover:text-white/70"
            }`}>{label}</button>
        ))}
      </div>

      {/* Profile form */}
      {tab === "profile" && (
        <div className="space-y-5">
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
            <h3 className="text-white font-semibold text-sm">Personal Information</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Full Name</Label>
                <Input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Your full name" className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Mobile Number</Label>
                <Input value={form.mobileNumber} disabled onChange={e => setForm(p => ({ ...p, mobileNumber: e.target.value }))}
                  placeholder="+91 98765 43210" className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">City</Label>
                <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  placeholder="Your city" className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/55 text-sm">Gender</Label>
                <div className="flex gap-2">
                  {GENDER_OPTIONS.map(g => (
                    <button key={g} type="button" onClick={() => setForm(p => ({ ...p, gender: g }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        form.gender === g
                          ? "bg-primary/15 border-primary text-primary"
                          : "bg-white/3 border-white/8 text-white/40 hover:text-white hover:border-white/15"
                      }`}>
                      {g.charAt(0) + g.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={saveProfile} disabled={saving}
                className="bg-gradient-primary hover:opacity-90 text-white h-10 px-6">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-3.5 h-3.5 mr-1.5" />Save Changes</>}
              </Button>
            </div>
          </div>

          {/* Body Metrics (read-only) */}
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Body Metrics
              </h3>
              <span className="text-white/25 text-xs">Logged by your trainer</span>
            </div>

            {!latest ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <Activity className="w-7 h-7 text-white/15" />
                <p className="text-white/30 text-sm">No body metrics recorded yet</p>
                <p className="text-white/20 text-xs">Your trainer will log these during sessions</p>
              </div>
            ) : (
              <>
                <p className="text-white/35 text-xs">
                  Last recorded: {new Date(latest.recordedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {([
                    ["Weight",      latest.weightKg,     prev?.weightKg,     "kg", true ],
                    ["Body Fat",    latest.bodyFatPct,    prev?.bodyFatPct,   "%",  true ],
                    ["Muscle Mass", latest.muscleMassKg,  prev?.muscleMassKg, "kg", false],
                    ["BMI",         latest.bmi,           prev?.bmi,          "",   true ],
                    ["Chest",       latest.chestCm,       prev?.chestCm,      "cm", false],
                    ["Waist",       latest.waistCm,       prev?.waistCm,      "cm", true ],
                  ] as [string, number|null, number|null, string, boolean][]).map(([label, curr, prevVal, unit, lowerBetter]) => {
                    if (curr == null) return null
                    const t = trendIcon(curr, prevVal, lowerBetter)
                    return (
                      <div key={label} className="bg-white/3 rounded-xl p-3">
                        <p className="text-white/35 text-[10px] mb-1">{label}</p>
                        <p className="text-white font-semibold">
                          {Number(curr).toFixed(1)}<span className="text-white/35 text-xs ml-0.5">{unit}</span>
                        </p>
                        {t && (
                          <div className={`flex items-center gap-1 mt-1 ${t.color}`}>
                            <t.Icon className="w-3 h-3" />
                            <span className="text-[10px]">{t.label}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Account info */}
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-3">
            <h3 className="text-white font-semibold text-sm">Account Information</h3>
            {[
              ["Email",      profile?.email],
              ["Role",       "Member"],
              ["Member ID",  profile?.id],
            ].map(([label, val]) => val && (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-white/40">{label}</span>
                <span className="text-white/70 font-mono text-xs truncate max-w-48">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Password form */}
      {tab === "password" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-primary" />
            <h3 className="text-white font-semibold text-sm">Change Password</h3>
          </div>
          {([
            ["current", "Current Password"],
            ["next",    "New Password"],
            ["confirm", "Confirm New Password"],
          ] as [keyof typeof pwForm, string][]).map(([field, label]) => (
            <div key={field} className="space-y-1.5">
              <Label className="text-white/55 text-sm">{label}</Label>
              <div className="relative">
                <Input
                  type={showPw[field] ? "text" : "password"}
                  value={pwForm[field]}
                  onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                  placeholder="••••••••"
                  className={`${inp} pr-10`}
                />
                <button type="button"
                  onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPw[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button onClick={changePassword} disabled={saving}
              className="bg-gradient-primary hover:opacity-90 text-white h-10 px-6">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

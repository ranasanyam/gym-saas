// src/app/trainer/profile/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useProfile } from "@/contexts/ProfileContext"
import { useToast } from "@/hooks/use-toast"
import { Lock, Save, Loader2, Eye, EyeOff, Camera, Building2, Users, Dumbbell, UtensilsCrossed } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/Avatar"

export default function TrainerProfilePage() {
  const { profile, refresh } = useProfile()
  const { toast }            = useToast()

  const [tab, setTab]         = useState<"profile" | "password">("profile")
  const [saving, setSaving]   = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [stats, setStats]     = useState<any>(null)

  const [form, setForm] = useState({
    fullName:     profile?.fullName     ?? "",
    mobileNumber: profile?.mobileNumber ?? "",
    city:         profile?.city         ?? "",
  })

  const [pwForm, setPwForm]   = useState({ current: "", next: "", confirm: "" })
  const [showPw, setShowPw]   = useState({ current: false, next: false, confirm: false })

  useEffect(() => {
    if (profile) {
      setForm({
        fullName:     profile.fullName     ?? "",
        mobileNumber: profile.mobileNumber ?? "",
        city:         profile.city         ?? "",
      })
    }
  }, [profile])

  useEffect(() => {
    fetch("/api/trainer/dashboard")
      .then(r => r.json())
      .then(d => setStats(d.stats))
      .catch(() => {})
  }, [])

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

  const gymName = (profile as any)?.gym?.name ?? (profile as any)?.gymName ?? null

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">My Profile</h2>
        <p className="text-white/35 text-sm mt-0.5">Manage your trainer account</p>
      </div>

      {/* Avatar + identity */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar name={profile?.fullName ?? "Trainer"} url={profile?.avatarUrl} size={72} rounded="lg" />
            <label className={`absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[hsl(220_25%_14%)] border border-white/15 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors ${avatarUploading ? "opacity-50 pointer-events-none" : ""}`}>
              {avatarUploading ? <Loader2 className="w-3.5 h-3.5 text-white/60 animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white/60" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <div>
            <p className="text-white font-semibold text-lg">{profile?.fullName}</p>
            <p className="text-white/40 text-sm mt-0.5">{profile?.email}</p>
            {gymName && (
              <p className="text-primary/80 text-xs mt-1.5 flex items-center gap-1.5">
                <Building2 className="w-3 h-3" /> {gymName} · Trainer
              </p>
            )}
            <p className="text-white/25 text-xs mt-1">
              Member since {(profile as any)?.createdAt ? new Date((profile as any).createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—"}
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/6">
            {[
              { icon: Users,           label: "Total Members",  value: stats.totalMembers  ?? 0 },
              { icon: Dumbbell,        label: "Workout Plans",  value: stats.workoutPlans  ?? 0 },
              { icon: UtensilsCrossed, label: "Diet Plans",     value: stats.dietPlans     ?? 0 },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center p-3 bg-white/3 rounded-xl">
                <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-white font-semibold text-lg">{value}</p>
                <p className="text-white/35 text-[10px]">{label}</p>
              </div>
            ))}
          </div>
        )}
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
              <Input value={form.mobileNumber} onChange={e => setForm(p => ({ ...p, mobileNumber: e.target.value }))}
                placeholder="+91 98765 43210" className={inp} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/55 text-sm">City</Label>
              <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                placeholder="Your city" className={inp} />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={saveProfile} disabled={saving}
              className="bg-gradient-primary hover:opacity-90 text-white h-10 px-6">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-3.5 h-3.5 mr-1.5" />Save Changes</>}
            </Button>
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

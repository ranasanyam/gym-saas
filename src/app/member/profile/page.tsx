// src/app/member/profile/page.tsx
"use client"

import { useState } from "react"
import { useProfile } from "@/contexts/ProfileContext"
import { useToast } from "@/hooks/use-toast"
import { User, Lock, Save, Loader2, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-white/55 text-sm">{label}</Label>
    {children}
  </div>
)

export default function MemberProfilePage() {
  const { profile, refresh } = useProfile()
  const { toast } = useToast()

  const [tab, setTab] = useState<"profile" | "password">("profile")
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    fullName:    profile?.fullName    ?? "",
    email:       profile?.email       ?? "",
    mobileNumber: profile?.mobileNumber ?? "",
    city:        profile?.city        ?? "",
    gender:      profile?.gender      ?? "",
    dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.split("T")[0] : "",
  })

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" })
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false })

  const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-11 rounded-xl"

  const saveProfile = async () => {
    setSaving(true)
    const res = await fetch("/api/profile/update", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) { await refresh(); toast({ variant: "success", title: "Profile updated" }) }
    else toast({ variant: "destructive", title: "Failed to update profile" })
    setSaving(false)
  }

  const changePassword = async () => {
    if (pwForm.next.length < 8) { toast({ variant: "destructive", title: "Password must be at least 8 characters" }); return }
    if (pwForm.next !== pwForm.confirm) { toast({ variant: "destructive", title: "Passwords do not match" }); return }
    setSaving(true)
    const res = await fetch("/api/profile/change-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
    })
    const data = await res.json()
    if (res.ok) {
      toast({ variant: "success", title: "Password changed" })
      setPwForm({ current: "", next: "", confirm: "" })
    } else toast({ variant: "destructive", title: data.error ?? "Failed to change password" })
    setSaving(false)
  }

  const initials = profile?.fullName
    ? profile.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  return (
    <div className="max-w-xl space-y-5">
      <h2 className="text-2xl font-display font-bold text-white">My Profile</h2>

      {/* Avatar */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-white text-2xl font-display font-bold shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-white font-semibold">{profile?.fullName}</p>
          <p className="text-white/40 text-sm mt-0.5">{profile?.email}</p>
          <span className="inline-block mt-2 text-xs bg-blue-500/15 text-blue-400 px-3 py-1 rounded-full">Member</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/4 p-1 rounded-xl w-fit">
        {(["profile", "password"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t ? "bg-[hsl(220_25%_12%)] text-white shadow" : "text-white/40 hover:text-white/70"
            }`}>{t === "profile" ? "Personal Info" : "Change Password"}</button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name">
              <Input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} className={inp} />
            </Field>
            <Field label="Mobile Number">
              <Input value={form.mobileNumber} onChange={e => setForm(p => ({ ...p, mobileNumber: e.target.value }))} type="tel" className={inp} />
            </Field>
            <Field label="Email">
              <Input value={form.email} disabled className={`${inp} opacity-50 cursor-not-allowed`} />
            </Field>
            <Field label="Gender">
              <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-11 text-sm focus:outline-none focus:border-primary">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Date of Birth">
              <Input type="date" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} className={inp} />
            </Field>
            <Field label="City">
              <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className={inp} />
            </Field>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={saveProfile} disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white h-10 px-6">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
            </Button>
          </div>
        </div>
      )}

      {tab === "password" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
          {[
            { key: "current", label: "Current Password" },
            { key: "next",    label: "New Password" },
            { key: "confirm", label: "Confirm New Password" },
          ].map(({ key, label }) => (
            <Field key={key} label={label}>
              <div className="relative">
                <Input
                  type={showPw[key as keyof typeof showPw] ? "text" : "password"}
                  value={pwForm[key as keyof typeof pwForm]}
                  onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                  className={`${inp} pr-10`} />
                <button type="button" onClick={() => setShowPw(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPw[key as keyof typeof showPw] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
          ))}
          <div className="flex justify-end pt-2">
            <Button onClick={changePassword} disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white h-10 px-6">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-4 h-4 mr-2" />Update Password</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
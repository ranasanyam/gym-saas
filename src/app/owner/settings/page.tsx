// "use client"

// import { useState } from "react"
// import { useProfile } from "@/contexts/ProfileContext"
// import { PageHeader } from "@/components/owner/PageHeader"
// import { useToast } from "@/hooks/use-toast"
// import { Loader2, User, Lock, Bell, Shield } from "lucide-react"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Button } from "@/components/ui/button"

// export default function SettingsPage() {
//   const { profile, refresh } = useProfile()
//   const { toast } = useToast()
//   const [tab, setTab] = useState("Profile")
//   const [saving, setSaving] = useState(false)
//   const [profileForm, setProfileForm] = useState({
//     fullName: profile?.fullName ?? "",
//     mobileNumber: profile?.mobileNumber ?? "",
//     city: profile?.city ?? "",
//   })
//   const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })

//   const saveProfile = async () => {
//     setSaving(true)
//     const res = await fetch("/api/profile/update", {
//       method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profileForm),
//     })
//     if (res.ok) { toast({ variant: "success", title: "Profile updated" }); refresh() }
//     else toast({ variant: "destructive", title: "Failed to update profile" })
//     setSaving(false)
//   }

//   const changePassword = async () => {
//     if (passwordForm.newPassword !== passwordForm.confirmPassword) {
//       toast({ variant: "destructive", title: "Passwords do not match" }); return
//     }
//     if (passwordForm.newPassword.length < 8) {
//       toast({ variant: "destructive", title: "Password must be at least 8 characters" }); return
//     }
//     setSaving(true)
//     const res = await fetch("/api/profile/change-password", {
//       method: "POST", headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
//     })
//     const data = await res.json()
//     if (res.ok) { toast({ variant: "success", title: "Password changed successfully" }); setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" }) }
//     else toast({ variant: "destructive", title: data.error ?? "Failed to change password" })
//     setSaving(false)
//   }

//   const TABS = [
//     { id: "Profile", icon: User },
//     { id: "Security", icon: Lock },
//   ]

//   return (
//     <div className="max-w-2xl">
//       <PageHeader title="Settings" subtitle="Manage your account preferences" />

//       {/* Tab strip */}
//       <div className="flex gap-1 bg-white/4 rounded-xl p-1 w-fit mb-7">
//         {TABS.map(({ id, icon: Icon }) => (
//           <button key={id} onClick={() => setTab(id)}
//             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? "bg-[hsl(220_25%_12%)] text-white shadow" : "text-white/40 hover:text-white/70"}`}>
//             <Icon className="w-3.5 h-3.5" />{id}
//           </button>
//         ))}
//       </div>

//       {tab === "Profile" && (
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-7 space-y-5">
//           <h3 className="text-white font-semibold text-sm">Personal Information</h3>

//           {/* Avatar */}
//           <div className="flex items-center gap-4">
//             <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-bold text-xl">
//               {(profile?.fullName ?? "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
//             </div>
//             <div>
//               <p className="text-white font-medium">{profile?.fullName}</p>
//               <p className="text-white/40 text-sm">{profile?.email}</p>
//             </div>
//           </div>

//           <div className="space-y-4">
//             {[["fullName","Full Name","text"],["mobileNumber","Mobile Number","tel"],["city","City","text"]].map(([field, label, type]) => (
//               <div key={field} className="space-y-1.5">
//                 <Label className="text-white/50 text-xs">{label}</Label>
//                 <Input type={type} value={(profileForm as any)[field]}
//                   onChange={e => setProfileForm(p => ({ ...p, [field]: e.target.value }))}
//                   className="bg-white/5 border-white/10 text-white focus:border-primary focus-visible:ring-0 h-11" />
//               </div>
//             ))}
//           </div>

//           <div className="pt-2">
//             <Button onClick={saveProfile} disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 px-8">
//               {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
//             </Button>
//           </div>
//         </div>
//       )}

//       {tab === "Security" && (
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-7 space-y-5">
//           <h3 className="text-white font-semibold text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Change Password</h3>
//           <div className="space-y-4">
//             {[["currentPassword","Current Password"],["newPassword","New Password"],["confirmPassword","Confirm New Password"]].map(([field, label]) => (
//               <div key={field} className="space-y-1.5">
//                 <Label className="text-white/50 text-xs">{label}</Label>
//                 <Input type="password" value={(passwordForm as any)[field]}
//                   onChange={e => setPasswordForm(p => ({ ...p, [field]: e.target.value }))}
//                   className="bg-white/5 border-white/10 text-white focus:border-primary focus-visible:ring-0 h-11" />
//               </div>
//             ))}
//           </div>
//           <Button onClick={changePassword} disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 px-8">
//             {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
//           </Button>
//         </div>
//       )}
//     </div>
//   )
// }


// src/app/owner/settings/page.tsx
"use client"

import { useState } from "react"
import { useProfile } from "@/contexts/ProfileContext"
import { PageHeader } from "@/components/owner/PageHeader"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, Lock, Shield, Camera } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  const { profile, refresh } = useProfile()
  const { toast }            = useToast()
  const [tab, setTab]        = useState("Profile")
  const [saving, setSaving]  = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const [profileForm, setProfileForm] = useState({
    fullName:     profile?.fullName     ?? "",
    mobileNumber: profile?.mobileNumber ?? "",
    city:         profile?.city         ?? "",
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  })

  const initials = (profile?.fullName ?? "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

  // Upload then immediately save avatar
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
      setAvatarUploading(false)
      e.target.value = ""
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    const res = await fetch("/api/profile/update", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profileForm),
    })
    if (res.ok) { toast({ variant: "success", title: "Profile updated" }); refresh() }
    else toast({ variant: "destructive", title: "Failed to update profile" })
    setSaving(false)
  }

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ variant: "destructive", title: "Passwords do not match" }); return
    }
    if (passwordForm.newPassword.length < 8) {
      toast({ variant: "destructive", title: "Password must be at least 8 characters" }); return
    }
    setSaving(true)
    const res = await fetch("/api/profile/change-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
    })
    const data = await res.json()
    if (res.ok) {
      toast({ variant: "success", title: "Password changed successfully" })
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } else toast({ variant: "destructive", title: data.error ?? "Failed to change password" })
    setSaving(false)
  }

  const TABS = [
    { id: "Profile",  icon: User },
    { id: "Security", icon: Lock },
  ]

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account preferences" />

      <div className="flex gap-1 bg-white/4 rounded-xl p-1 w-fit mb-7">
        {TABS.map(({ id, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? "bg-[hsl(220_25%_12%)] text-white shadow" : "text-white/40 hover:text-white/70"}`}>
            <Icon className="w-3.5 h-3.5" />{id}
          </button>
        ))}
      </div>

      {tab === "Profile" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-7 space-y-6">
          <h3 className="text-white font-semibold text-sm">Personal Information</h3>

          {/* Avatar upload */}
          <div className="flex items-center gap-5">
            <label className="relative cursor-pointer group shrink-0">
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.fullName}
                  className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-bold text-xl">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {avatarUploading
                  ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                  : <Camera className="w-5 h-5 text-white" />}
              </div>
            </label>
            <div>
              <p className="text-white font-medium">{profile?.fullName}</p>
              <p className="text-white/40 text-sm">{profile?.email}</p>
              <p className="text-white/30 text-xs mt-1">Click photo to change</p>
            </div>
          </div>

          <div className="space-y-4">
            {[["fullName","Full Name","text"],["mobileNumber","Mobile Number","tel"],["city","City","text"]].map(([field, label, type]) => (
              <div key={field} className="space-y-1.5">
                <Label className="text-white/50 text-xs">{label}</Label>
                <Input type={type} value={(profileForm as any)[field]}
                  onChange={e => setProfileForm(p => ({ ...p, [field]: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white focus:border-primary focus-visible:ring-0 h-11" />
              </div>
            ))}
          </div>

          <Button onClick={saveProfile} disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 px-8">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      )}

      {tab === "Security" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-7 space-y-5">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Change Password</h3>
          <div className="space-y-4">
            {[["currentPassword","Current Password"],["newPassword","New Password"],["confirmPassword","Confirm New Password"]].map(([field, label]) => (
              <div key={field} className="space-y-1.5">
                <Label className="text-white/50 text-xs">{label}</Label>
                <Input type="password" value={(passwordForm as any)[field]}
                  onChange={e => setPasswordForm(p => ({ ...p, [field]: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white focus:border-primary focus-visible:ring-0 h-11" />
              </div>
            ))}
          </div>
          <Button onClick={changePassword} disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 px-8">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
          </Button>
        </div>
      )}
    </div>
  )
}
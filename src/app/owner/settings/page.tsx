
// // src/app/owner/settings/page.tsx
// "use client"

// import { useState } from "react"
// import { useProfile } from "@/contexts/ProfileContext"
// import { PageHeader } from "@/components/owner/PageHeader"
// import { useToast } from "@/hooks/use-toast"
// import { Loader2, User, Lock, Shield, Camera } from "lucide-react"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Button } from "@/components/ui/button"

// export default function SettingsPage() {
//   const { profile, refresh } = useProfile()
//   const { toast }            = useToast()
//   const [tab, setTab]        = useState("Profile")
//   const [saving, setSaving]  = useState(false)
//   const [avatarUploading, setAvatarUploading] = useState(false)

//   const [profileForm, setProfileForm] = useState({
//     fullName:     profile?.fullName     ?? "",
//     mobileNumber: profile?.mobileNumber ?? "",
//     city:         profile?.city         ?? "",
//   })
//   const [passwordForm, setPasswordForm] = useState({
//     currentPassword: "", newPassword: "", confirmPassword: "",
//   })

//   const initials = (profile?.fullName ?? "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

//   // Upload then immediately save avatar
//   const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (!file) return
//     setAvatarUploading(true)
//     try {
//       const fd = new FormData(); fd.append("file", file)
//       const upRes  = await fetch("/api/upload", { method: "POST", body: fd })
//       const upData = await upRes.json()
//       if (!upRes.ok) throw new Error(upData.error ?? "Upload failed")

//       const saveRes = await fetch("/api/profile/update", {
//         method: "PATCH", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ avatarUrl: upData.url }),
//       })
//       if (!saveRes.ok) throw new Error("Failed to save avatar")
//       await refresh()
//       toast({ variant: "success", title: "Profile photo updated!" })
//     } catch (err: any) {
//       toast({ variant: "destructive", title: err.message ?? "Upload failed" })
//     } finally {
//       setAvatarUploading(false)
//       e.target.value = ""
//     }
//   }

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
//     if (res.ok) {
//       toast({ variant: "success", title: "Password changed successfully" })
//       setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
//     } else toast({ variant: "destructive", title: data.error ?? "Failed to change password" })
//     setSaving(false)
//   }

//   const TABS = [
//     { id: "Profile",  icon: User },
//     { id: "Security", icon: Lock },
//   ]

//   return (
//     <div className="max-w-2xl">
//       <PageHeader title="Settings" subtitle="Manage your account preferences" />

//       <div className="flex gap-1 bg-white/4 rounded-xl p-1 w-fit mb-7">
//         {TABS.map(({ id, icon: Icon }) => (
//           <button key={id} onClick={() => setTab(id)}
//             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? "bg-[hsl(220_25%_12%)] text-white shadow" : "text-white/40 hover:text-white/70"}`}>
//             <Icon className="w-3.5 h-3.5" />{id}
//           </button>
//         ))}
//       </div>

//       {tab === "Profile" && (
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-7 space-y-6">
//           <h3 className="text-white font-semibold text-sm">Personal Information</h3>

//           {/* Avatar upload */}
//           <div className="flex items-center gap-5">
//             <label className="relative cursor-pointer group shrink-0">
//               <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
//               {profile?.avatarUrl ? (
//                 <img src={profile.avatarUrl} alt={profile.fullName}
//                   className="w-16 h-16 rounded-2xl object-cover" />
//               ) : (
//                 <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-bold text-xl">
//                   {initials}
//                 </div>
//               )}
//               <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
//                 {avatarUploading
//                   ? <Loader2 className="w-5 h-5 text-white animate-spin" />
//                   : <Camera className="w-5 h-5 text-white" />}
//               </div>
//             </label>
//             <div>
//               <p className="text-white font-medium">{profile?.fullName}</p>
//               <p className="text-white/40 text-sm">{profile?.email}</p>
//               <p className="text-white/30 text-xs mt-1">Click photo to change</p>
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

//           <Button onClick={saveProfile} disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 px-8">
//             {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
//           </Button>
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

import { useState, useEffect } from "react"
import { useProfile } from "@/contexts/ProfileContext"
import { PageHeader } from "@/components/owner/PageHeader"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, Lock, Shield, Camera, MessageCircle, Check, Phone } from "lucide-react"
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

  // WhatsApp settings
  const [gyms,           setGyms]           = useState<{ id: string; name: string; whatsappNumber: string | null }[]>([])
  const [waGymId,        setWaGymId]        = useState("")
  const [waNumber,       setWaNumber]       = useState("")
  const [waSaving,       setWaSaving]       = useState(false)
  const [waSaved,        setWaSaved]        = useState(false)
  const [gymsLoaded,     setGymsLoaded]     = useState(false)

  const initials = (profile?.fullName ?? "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

  // Load gyms + their whatsapp numbers when WhatsApp tab is opened
  const loadGyms = async () => {
    if (gymsLoaded) return
    const res = await fetch("/api/owner/gyms")
    const data = await res.json()
    const list = Array.isArray(data) ? data : []
    setGyms(list)
    if (list.length) {
      setWaGymId(list[0].id)
      setWaNumber(list[0].whatsappNumber ?? "")
    }
    setGymsLoaded(true)
  }

  const handleWaGymChange = (id: string) => {
    setWaGymId(id)
    const gym = gyms.find(g => g.id === id)
    setWaNumber(gym?.whatsappNumber ?? "")
    setWaSaved(false)
  }

  const saveWhatsApp = async () => {
    setWaSaving(true)
    const res = await fetch("/api/owner/gyms/whatsapp", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gymId: waGymId, whatsappNumber: waNumber }),
    })
    const data = await res.json()
    if (res.ok) {
      setWaSaved(true)
      setGyms(prev => prev.map(g => g.id === waGymId ? { ...g, whatsappNumber: data.whatsappNumber } : g))
      toast({ variant: "success", title: "WhatsApp number saved!" })
    } else {
      toast({ variant: "destructive", title: data.error ?? "Failed to save" })
    }
    setWaSaving(false)
  }

  // Upload then immediately save avatar
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const fd = new FormData(); fd.append("file", file)
      const upRes  = await fetch("/api/upload?folder=avatars", { method: "POST", body: fd })
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
    { id: "Profile",   icon: User },
    { id: "Security",  icon: Lock },
    { id: "WhatsApp",  icon: MessageCircle },
  ]

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account preferences" />

      <div className="flex gap-1 bg-white/4 rounded-xl p-1 w-fit mb-7">
        {TABS.map(({ id, icon: Icon }) => (
          <button key={id} onClick={() => { setTab(id); if (id === "WhatsApp") loadGyms() }}
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

      {tab === "WhatsApp" && (
        <div className="space-y-5">
          {/* Info banner */}
          <div className="bg-green-500/8 border border-green-500/20 rounded-2xl p-5 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">WhatsApp Broadcast</p>
              <p className="text-white/45 text-xs mt-1 leading-relaxed">
                Save your WhatsApp number below. When sending notifications, you can open a pre-filled WhatsApp message to broadcast to all members at once — using WhatsApp&apos;s own share flow.
              </p>
            </div>
          </div>

          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-7 space-y-5">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-400" /> Gym WhatsApp Number
            </h3>

            {gyms.length > 1 && (
              <div className="space-y-1.5">
                <Label className="text-white/50 text-xs">Select Gym</Label>
                <select value={waGymId} onChange={e => handleWaGymChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 h-11 text-sm focus:outline-none focus:border-primary">
                  {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-white/50 text-xs">WhatsApp Number</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">+</span>
                <Input
                  type="tel"
                  value={waNumber}
                  onChange={e => { setWaNumber(e.target.value); setWaSaved(false) }}
                  placeholder="91XXXXXXXXXX  or  9XXXXXXXXX"
                  className="bg-white/5 border-white/10 text-white focus:border-green-500/60 focus-visible:ring-0 h-11 pl-7"
                />
              </div>
              <p className="text-white/25 text-xs">Enter with country code (e.g. 919876543210) or just 10 digits — we&apos;ll add +91 automatically.</p>
            </div>

            {/* Preview wa.me link */}
            {waNumber && (
              <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                <p className="text-white/30 text-xs mb-1">Preview link</p>
                <p className="text-green-400 text-sm font-mono break-all">
                  https://wa.me/{waNumber.replace(/[\s\-()]/g, "").replace(/^\+/, "")}
                </p>
              </div>
            )}

            <Button
              onClick={saveWhatsApp}
              disabled={waSaving || !waGymId || !waNumber}
              className="bg-green-600 hover:bg-green-500 text-white font-semibold h-11 px-8 gap-2">
              {waSaving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : waSaved
                ? <><Check className="w-4 h-4" /> Saved</>
                : "Save WhatsApp Number"}
            </Button>
          </div>

          {/* How it works */}
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
            <p className="text-white font-medium text-sm">How it works</p>
            <div className="space-y-3">
              {[
                { step: "1", text: "Save your WhatsApp number for each gym above." },
                { step: "2", text: "Go to Notifications → create and send an in-app notification." },
                { step: "3", text: "Click 'Send on WhatsApp' — a wa.me link opens with your message pre-filled." },
                { step: "4", text: "WhatsApp opens. Paste or share to your member broadcast list or group." },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-green-500/15 text-green-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{s.step}</span>
                  <p className="text-white/50 text-sm">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
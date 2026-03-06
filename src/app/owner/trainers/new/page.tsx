// // src/app/owner/trainers/new/page.tsx
// "use client"

// import { useEffect, useState } from "react"
// import { useRouter } from "next/navigation"
// import { useToast } from "@/hooks/use-toast"
// import { Loader2, ArrowLeft, Upload, Search } from "lucide-react"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Button } from "@/components/ui/button"

// const SPECIALIZATIONS = [
//   "Weight Training","Cardio","Yoga","Zumba","CrossFit",
//   "Boxing","HIIT","Pilates","Nutrition","Swimming",
//   "Personal Training","Stretching","Rehabilitation","Dance Fitness","Martial Arts"
// ]

// // Defined OUTSIDE component — prevents input focus loss on every keystroke
// const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
//   <div className="space-y-1.5">
//     <Label className="text-white/55 text-sm">{label}{required && <span className="text-primary ml-0.5">*</span>}</Label>
//     {children}
//   </div>
// )

// export default function AddTrainerPage() {
//   const router = useRouter()
//   const { toast } = useToast()
//   const [gyms, setGyms]     = useState<any[]>([])
//   const [loading, setLoading] = useState(false)
//   const [profileSearch, setProfileSearch] = useState("")
//   const [profileResults, setProfileResults] = useState<any[]>([])
//   const [selectedProfile, setSelectedProfile] = useState<any>(null)
//   const [searching, setSearching] = useState(false)

//   const [form, setForm] = useState({
//     gymId: "",
//     fullName: "", mobileNumber: "", email: "", gender: "",
//     dateOfBirth: "", city: "",
//     bio: "", experienceYears: "0",
//     specializations: [] as string[],
//     certifications: "",
//     joiningDate: new Date().toISOString().split("T")[0],
//     salary: "",
//   })
//   const [createNew, setCreateNew] = useState(false) // toggle: create new user vs search existing

//   useEffect(() => {
//     fetch("/api/owner/gyms").then(r => r.json())
//       .then((data: any[]) => { setGyms(data); if (data.length > 0) setForm(p => ({ ...p, gymId: data[0].id })) })
//   }, [])

//   const searchProfile = async () => {
//     if (!profileSearch.trim()) return
//     setSearching(true)
//     const res = await fetch(`/api/owner/search-profiles?q=${encodeURIComponent(profileSearch)}`)
//     setProfileResults(await res.json())
//     setSearching(false)
//   }

//   const toggle = (arr: string[], val: string) =>
//     arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!createNew && !selectedProfile) { toast({ variant: "destructive", title: "Please select or create a trainer profile" }); return }
//     if (!form.gymId) { toast({ variant: "destructive", title: "Please select a gym" }); return }
//     if (createNew && !form.fullName.trim()) { toast({ variant: "destructive", title: "Full name is required" }); return }
//     if (createNew && !form.mobileNumber.trim()) { toast({ variant: "destructive", title: "Mobile number is required" }); return }
//     setLoading(true)
//     try {
//       let profileId = selectedProfile?.id
//       if (createNew) {
//         const profileRes = await fetch("/api/owner/create-member-profile", {
//           method: "POST", headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             fullName: form.fullName, mobileNumber: form.mobileNumber,
//             email: form.email || null, gender: form.gender || null,
//             dateOfBirth: form.dateOfBirth || null, city: form.city || null,
//           }),
//         })
//         const profileData = await profileRes.json()
//         if (!profileRes.ok) throw new Error(profileData.error)
//         profileId = profileData.id
//       }
//       const res = await fetch("/api/owner/trainers", {
//         method: "POST", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           gymId: form.gymId,
//           profileId,
//           bio: form.bio,
//           experienceYears: parseInt(form.experienceYears) || 0,
//           specializations: form.specializations,
//           certifications: form.certifications ? form.certifications.split(",").map(s => s.trim()).filter(Boolean) : [],
//         }),
//       })
//       const data = await res.json()
//       if (!res.ok) throw new Error(data.error)
//       toast({ variant: "success", title: "Trainer added successfully!" })
//       router.push("/owner/trainers")
//     } catch (err: any) {
//       toast({ variant: "destructive", title: err.message ?? "Failed to add trainer" })
//     } finally { setLoading(false) }
//   }

//   const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-11 rounded-xl"

//   return (
//     <div className="max-w-2xl">
//       {/* Header */}
//       <div className="flex items-center gap-3 mb-7">
//         <button onClick={() => router.back()}
//           className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-all">
//           <ArrowLeft className="w-4 h-4" />
//         </button>
//         <div>
//           <h2 className="text-2xl font-display font-bold text-white">Add Trainer</h2>
//           <p className="text-white/40 text-sm">Add a trainer to your gym</p>
//         </div>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-5">

//         {/* Mode toggle */}
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
//           <div className="flex gap-2">
//             {[{ id: false, label: "Search Existing User" }, { id: true, label: "Create New Profile" }].map(opt => (
//               <button key={String(opt.id)} type="button" onClick={() => { setCreateNew(opt.id); setSelectedProfile(null); setProfileResults([]) }}
//                 className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
//                   createNew === opt.id ? "bg-gradient-primary text-white" : "bg-white/5 text-white/50 hover:text-white/80"
//                 }`}>{opt.label}</button>
//             ))}
//           </div>
//         </div>

//         {/* Search existing */}
//         {!createNew && (
//           <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
//             <h3 className="text-white font-semibold text-sm">Find Existing Profile</h3>
//             <div className="flex gap-2">
//               <div className="relative flex-1">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
//                 <Input value={profileSearch} onChange={e => setProfileSearch(e.target.value)}
//                   onKeyDown={e => e.key === "Enter" && (e.preventDefault(), searchProfile())}
//                   placeholder="Search by name, email or mobile..."
//                   className={`${inp} pl-9`} />
//               </div>
//               <Button type="button" onClick={searchProfile} disabled={searching}
//                 className="bg-white/8 hover:bg-white/12 text-white border border-white/10 h-11">
//                 {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
//               </Button>
//             </div>
//             {profileResults.length > 0 && (
//               <div className="space-y-2 max-h-48 overflow-y-auto">
//                 {profileResults.map((p: any) => (
//                   <button type="button" key={p.id} onClick={() => { setSelectedProfile(p); setProfileResults([]) }}
//                     className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/6 bg-white/3 hover:bg-white/5 transition-all text-left">
//                     <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
//                       {p.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
//                     </div>
//                     <div>
//                       <p className="text-white text-sm font-medium">{p.fullName}</p>
//                       <p className="text-white/40 text-xs">{p.email} · {p.mobileNumber}</p>
//                     </div>
//                   </button>
//                 ))}
//               </div>
//             )}
//             {selectedProfile && (
//               <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/8">
//                 <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
//                   {selectedProfile.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
//                 </div>
//                 <div className="flex-1">
//                   <p className="text-white text-sm font-semibold">{selectedProfile.fullName}</p>
//                   <p className="text-white/50 text-xs">{selectedProfile.email}</p>
//                 </div>
//                 <button type="button" onClick={() => setSelectedProfile(null)} className="text-white/30 hover:text-white/60 text-lg">✕</button>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Create new profile */}
//         {createNew && (
//           <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
//             <div className="flex items-center gap-4 mb-2">
//               <div className="w-16 h-16 rounded-2xl bg-white/5 border-2 border-dashed border-white/15 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-colors group">
//                 <Upload className="w-5 h-5 text-white/25 group-hover:text-primary/60" />
//                 <span className="text-white/25 text-[10px] mt-1">Photo</span>
//               </div>
//               <div>
//                 <p className="text-primary text-sm font-semibold">Upload Photo</p>
//                 <p className="text-white/35 text-xs">JPG, PNG up to 5MB</p>
//               </div>
//             </div>
//             <h3 className="text-white font-semibold text-sm">Personal Information</h3>
//             <div className="grid grid-cols-2 gap-4">
//               <Field label="Full Name" required>
//                 <Input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="Enter full name" className={inp} />
//               </Field>
//               <Field label="Mobile Number" required>
//                 <Input value={form.mobileNumber} onChange={e => setForm(p => ({ ...p, mobileNumber: e.target.value }))} placeholder="Enter mobile number" type="tel" className={inp} />
//               </Field>
//               <Field label="Email">
//                 <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Enter email" type="email" className={inp} />
//               </Field>
//               <Field label="Gender">
//                 <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
//                   className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-11 text-sm focus:outline-none focus:border-primary">
//                   <option value="">Select gender</option>
//                   <option value="Male">Male</option>
//                   <option value="Female">Female</option>
//                   <option value="Other">Other</option>
//                 </select>
//               </Field>
//               <Field label="Date of Birth">
//                 <Input type="date" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} className={inp} />
//               </Field>
//               <Field label="City">
//                 <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Enter city" className={inp} />
//               </Field>
//             </div>
//           </div>
//         )}

//         {/* Gym & Professional Details */}
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
//           <h3 className="text-white font-semibold text-sm">Professional Details</h3>
//           <div className="grid grid-cols-2 gap-4">
//             <Field label="Gym" required>
//               <select value={form.gymId} onChange={e => setForm(p => ({ ...p, gymId: e.target.value }))}
//                 className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-11 text-sm focus:outline-none focus:border-primary">
//                 {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
//               </select>
//             </Field>
//             <Field label="Years of Experience">
//               <Input type="number" min="0" value={form.experienceYears} onChange={e => setForm(p => ({ ...p, experienceYears: e.target.value }))} className={inp} />
//             </Field>
//             <Field label="Joining Date">
//               <Input type="date" value={form.joiningDate} onChange={e => setForm(p => ({ ...p, joiningDate: e.target.value }))} className={inp} />
//             </Field>
//             <Field label="Monthly Salary (₹)">
//               <Input type="number" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} placeholder="e.g. 25000" className={inp} />
//             </Field>
//           </div>
//           <Field label="Bio">
//             <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={2}
//               placeholder="Brief introduction about the trainer..."
//               className="w-full bg-[hsl(220_25%_11%)] border border-white/10 rounded-xl text-white text-sm p-3 focus:outline-none focus:border-primary placeholder:text-white/20 resize-none" />
//           </Field>
//           <Field label="Certifications (comma separated)">
//             <Input value={form.certifications} onChange={e => setForm(p => ({ ...p, certifications: e.target.value }))}
//               placeholder="ACE, NASM, ISSA..." className={inp} />
//           </Field>
//           <div className="space-y-2">
//             <Label className="text-white/55 text-sm">Specializations</Label>
//             <div className="flex flex-wrap gap-2">
//               {SPECIALIZATIONS.map(s => (
//                 <button type="button" key={s}
//                   onClick={() => setForm(p => ({ ...p, specializations: toggle(p.specializations, s) }))}
//                   className={`text-sm px-3 py-1.5 rounded-full border transition-all ${
//                     form.specializations.includes(s)
//                       ? "bg-primary/15 border-primary/40 text-primary font-medium"
//                       : "bg-white/4 border-white/10 text-white/50 hover:border-white/20"
//                   }`}>{s}</button>
//               ))}
//             </div>
//           </div>
//         </div>

//         <div className="flex justify-end gap-3 pb-4">
//           <Button type="button" variant="outline" onClick={() => router.back()}
//             className="border-white/10 bg-white/5 text-white hover:bg-white/8 h-11 px-6">Cancel</Button>
//           <Button type="submit" disabled={loading} className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 px-8">
//             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Trainer"}
//           </Button>
//         </div>
//       </form>
//     </div>
//   )
// }


// src/app/owner/trainers/new/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/ui/ImageUpload"

const SPECIALIZATIONS = [
  "Weight Training","Cardio","Yoga","Zumba","CrossFit",
  "Boxing","HIIT","Pilates","Nutrition","Swimming",
  "Personal Training","Stretching","Rehabilitation","Dance Fitness","Martial Arts"
]

// Defined OUTSIDE component — prevents input focus loss on every keystroke
const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-white/55 text-sm">{label}{required && <span className="text-primary ml-0.5">*</span>}</Label>
    {children}
  </div>
)

export default function AddTrainerPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [gyms, setGyms]     = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [profileSearch, setProfileSearch] = useState("")
  const [profileResults, setProfileResults] = useState<any[]>([])
  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const [searching, setSearching] = useState(false)

  const [form, setForm] = useState({
    gymId: "",
    fullName: "", mobileNumber: "", email: "", gender: "",
    dateOfBirth: "", city: "",
    bio: "", experienceYears: "0",
    specializations: [] as string[],
    certifications: "",
    joiningDate: new Date().toISOString().split("T")[0],
    salary: "",
  })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [createNew, setCreateNew] = useState(false)

  useEffect(() => {
    fetch("/api/owner/gyms").then(r => r.json())
      .then((data: any[]) => { setGyms(data); if (data.length > 0) setForm(p => ({ ...p, gymId: data[0].id })) })
  }, [])

  const searchProfile = async () => {
    if (!profileSearch.trim()) return
    setSearching(true)
    const res = await fetch(`/api/owner/search-profiles?q=${encodeURIComponent(profileSearch)}`)
    setProfileResults(await res.json())
    setSearching(false)
  }

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createNew && !selectedProfile) { toast({ variant: "destructive", title: "Please select or create a trainer profile" }); return }
    if (!form.gymId) { toast({ variant: "destructive", title: "Please select a gym" }); return }
    if (createNew && !form.fullName.trim()) { toast({ variant: "destructive", title: "Full name is required" }); return }
    if (createNew && !form.mobileNumber.trim()) { toast({ variant: "destructive", title: "Mobile number is required" }); return }
    setLoading(true)
    try {
      let profileId = selectedProfile?.id
      if (createNew) {
        // Create a new profile using the register endpoint logic
        const profileRes = await fetch("/api/auth/register", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: form.fullName, mobileNumber: form.mobileNumber,
            email: form.email || `${form.mobileNumber.replace(/\D/g,"")}@gymstack.local`,
            password: crypto.randomUUID(), // temp password, they'll reset via email
            city: form.city || "Unknown",
            gender: form.gender || null,
            role: "trainer",
          }),
        })
        const profileData = await profileRes.json()
        if (!profileRes.ok) throw new Error(profileData.error)
        profileId = profileData.profileId

        // Store avatar if uploaded
        if (avatarUrl) {
          await fetch("/api/profile/update", {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatarUrl }),
          })
        }
      }
      const res = await fetch("/api/owner/trainers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gymId: form.gymId,
          profileId,
          bio: form.bio,
          experienceYears: parseInt(form.experienceYears) || 0,
          specializations: form.specializations,
          certifications: form.certifications ? form.certifications.split(",").map(s => s.trim()).filter(Boolean) : [],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ variant: "success", title: "Trainer added successfully!" })
      router.push("/owner/trainers")
    } catch (err: any) {
      toast({ variant: "destructive", title: err.message ?? "Failed to add trainer" })
    } finally { setLoading(false) }
  }

  const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-11 rounded-xl"

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => router.back()}
          className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Add Trainer</h2>
          <p className="text-white/40 text-sm">Add a trainer to your gym</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Mode toggle */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex gap-2">
            {[{ id: false, label: "Search Existing User" }, { id: true, label: "Create New Profile" }].map(opt => (
              <button key={String(opt.id)} type="button" onClick={() => { setCreateNew(opt.id); setSelectedProfile(null); setProfileResults([]) }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  createNew === opt.id ? "bg-gradient-primary text-white" : "bg-white/5 text-white/50 hover:text-white/80"
                }`}>{opt.label}</button>
            ))}
          </div>
        </div>

        {/* Search existing */}
        {!createNew && (
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
            <h3 className="text-white font-semibold text-sm">Find Existing Profile</h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <Input value={profileSearch} onChange={e => setProfileSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), searchProfile())}
                  placeholder="Search by name, email or mobile..."
                  className={`${inp} pl-9`} />
              </div>
              <Button type="button" onClick={searchProfile} disabled={searching}
                className="bg-white/8 hover:bg-white/12 text-white border border-white/10 h-11">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </Button>
            </div>
            {profileResults.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {profileResults.map((p: any) => (
                  <button type="button" key={p.id} onClick={() => { setSelectedProfile(p); setProfileResults([]) }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/6 bg-white/3 hover:bg-white/5 transition-all text-left">
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {p.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{p.fullName}</p>
                      <p className="text-white/40 text-xs">{p.email} · {p.mobileNumber}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedProfile && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/8">
                <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {selectedProfile.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">{selectedProfile.fullName}</p>
                  <p className="text-white/50 text-xs">{selectedProfile.email}</p>
                </div>
                <button type="button" onClick={() => setSelectedProfile(null)} className="text-white/30 hover:text-white/60 text-lg">✕</button>
              </div>
            )}
          </div>
        )}

        {/* Create new profile */}
        {createNew && (
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-4 mb-2">
              <ImageUpload value={avatarUrl} onChange={setAvatarUrl} shape="circle" size={64} placeholder="Photo" />
              <div>
                <p className="text-primary text-sm font-semibold">Upload Photo</p>
                <p className="text-white/35 text-xs">JPG, PNG or WebP · Max 2MB</p>
              </div>
            </div>
            <h3 className="text-white font-semibold text-sm">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name" required>
                <Input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="Enter full name" className={inp} />
              </Field>
              <Field label="Mobile Number" required>
                <Input value={form.mobileNumber} onChange={e => setForm(p => ({ ...p, mobileNumber: e.target.value }))} placeholder="Enter mobile number" type="tel" className={inp} />
              </Field>
              <Field label="Email">
                <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Enter email" type="email" className={inp} />
              </Field>
              <Field label="Gender">
                <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                  className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-11 text-sm focus:outline-none focus:border-primary">
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Date of Birth">
                <Input type="date" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} className={inp} />
              </Field>
              <Field label="City">
                <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Enter city" className={inp} />
              </Field>
            </div>
          </div>
        )}

        {/* Gym & Professional Details */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm">Professional Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Gym" required>
              <select value={form.gymId} onChange={e => setForm(p => ({ ...p, gymId: e.target.value }))}
                className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-11 text-sm focus:outline-none focus:border-primary">
                {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </Field>
            <Field label="Years of Experience">
              <Input type="number" min="0" value={form.experienceYears} onChange={e => setForm(p => ({ ...p, experienceYears: e.target.value }))} className={inp} />
            </Field>
            <Field label="Joining Date">
              <Input type="date" value={form.joiningDate} onChange={e => setForm(p => ({ ...p, joiningDate: e.target.value }))} className={inp} />
            </Field>
            <Field label="Monthly Salary (₹)">
              <Input type="number" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} placeholder="e.g. 25000" className={inp} />
            </Field>
          </div>
          <Field label="Bio">
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={2}
              placeholder="Brief introduction about the trainer..."
              className="w-full bg-[hsl(220_25%_11%)] border border-white/10 rounded-xl text-white text-sm p-3 focus:outline-none focus:border-primary placeholder:text-white/20 resize-none" />
          </Field>
          <Field label="Certifications (comma separated)">
            <Input value={form.certifications} onChange={e => setForm(p => ({ ...p, certifications: e.target.value }))}
              placeholder="ACE, NASM, ISSA..." className={inp} />
          </Field>
          <div className="space-y-2">
            <Label className="text-white/55 text-sm">Specializations</Label>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map(s => (
                <button type="button" key={s}
                  onClick={() => setForm(p => ({ ...p, specializations: toggle(p.specializations, s) }))}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-all ${
                    form.specializations.includes(s)
                      ? "bg-primary/15 border-primary/40 text-primary font-medium"
                      : "bg-white/4 border-white/10 text-white/50 hover:border-white/20"
                  }`}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-4">
          <Button type="button" variant="outline" onClick={() => router.back()}
            className="border-white/10 bg-white/5 text-white hover:bg-white/8 h-11 px-6">Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 px-8">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Trainer"}
          </Button>
        </div>
      </form>
    </div>
  )
}
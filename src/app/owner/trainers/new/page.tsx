
// // src/app/owner/trainers/new/page.tsx
// "use client"

// import { useEffect, useState } from "react"
// import { useRouter } from "next/navigation"
// import { useToast } from "@/hooks/use-toast"
// import { Loader2, ArrowLeft, UserCheck } from "lucide-react"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Button } from "@/components/ui/button"
// import { ImageUpload } from "@/components/ui/ImageUpload"

// const SPECIALIZATIONS = [
//   "Weight Training","Cardio","Yoga","Zumba","CrossFit",
//   "Boxing","HIIT","Pilates","Nutrition","Swimming",
//   "Personal Training","Stretching","Rehabilitation","Dance Fitness","Martial Arts",
// ]

// const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
//   <div className="space-y-1.5">
//     <Label className="text-white/55 text-sm">{label}{required && <span className="text-primary ml-0.5">*</span>}</Label>
//     {children}
//   </div>
// )

// export default function AddTrainerPage() {
//   const router   = useRouter()
//   const { toast } = useToast()
//   const [gyms, setGyms]       = useState<any[]>([])
//   const [loading, setLoading] = useState(false)
//   const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

//   const [form, setForm] = useState({
//     gymId:           "",
//     fullName:        "",
//     mobileNumber:    "",
//     email:           "",
//     gender:          "",
//     dateOfBirth:     "",
//     city:            "",
//     bio:             "",
//     experienceYears: "0",
//     specializations: [] as string[],
//     certifications:  "",
//   })

//   const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-11 rounded-xl"
//   const sel = "w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-11 text-sm focus:outline-none focus:border-primary"

//   useEffect(() => {
//     fetch("/api/owner/gyms").then(r => r.json()).then((data: any[]) => {
//       setGyms(data)
//       if (data.length > 0) setForm(p => ({ ...p, gymId: data[0].id }))
//     })
//   }, [])

//   const toggle = (val: string) =>
//     setForm(p => ({
//       ...p,
//       specializations: p.specializations.includes(val)
//         ? p.specializations.filter(x => x !== val)
//         : [...p.specializations, val],
//     }))

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!form.gymId)          { toast({ variant: "destructive", title: "Please select a gym" }); return }
//     if (!form.fullName.trim()) { toast({ variant: "destructive", title: "Full name is required" }); return }
//     if (!form.mobileNumber.trim()) { toast({ variant: "destructive", title: "Mobile number is required" }); return }
//     if (!form.email.trim())   { toast({ variant: "destructive", title: "Email is required to send login credentials" }); return }

//     setLoading(true)
//     try {
//       const res = await fetch("/api/owner/trainers", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           ...form,
//           avatarUrl,
//           certifications: form.certifications
//             ? form.certifications.split(",").map(s => s.trim()).filter(Boolean)
//             : [],
//           experienceYears: parseInt(form.experienceYears) || 0,
//         }),
//       })
//       const data = await res.json()
//       if (!res.ok) throw new Error(data.error)
//       toast({ variant: "success", title: "Trainer added!", description: `${form.fullName} has been added and sent a welcome email.` })
//       router.push("/owner/trainers")
//     } catch (err: any) {
//       toast({ variant: "destructive", title: err.message ?? "Failed to add trainer" })
//     } finally {
//       setLoading(false)
//     }
//   }

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
//           <p className="text-white/40 text-sm">They will receive a welcome email to set their password</p>
//         </div>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-5">

//         {/* Avatar + Personal Info */}
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-5">
//           <h3 className="text-white font-semibold text-sm flex items-center gap-2">
//             <UserCheck className="w-4 h-4 text-primary" /> Personal Information
//           </h3>

//           {/* Avatar upload */}
//           <div className="flex items-center gap-4">
//             <ImageUpload value={avatarUrl} onChange={setAvatarUrl} shape="circle" size={72} placeholder="Photo" />
//             <div>
//               <p className="text-white text-sm font-medium">Profile Photo</p>
//               <p className="text-white/35 text-xs mt-0.5">JPG, PNG or WebP · Max 2MB</p>
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <Field label="Full Name" required>
//               <Input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
//                 placeholder="Enter full name" className={inp} />
//             </Field>
//             <Field label="Mobile Number" required>
//               <Input value={form.mobileNumber} onChange={e => setForm(p => ({ ...p, mobileNumber: e.target.value }))}
//                 placeholder="Enter mobile number" type="tel" className={inp} />
//             </Field>
//             <Field label="Email" required>
//               <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
//                 placeholder="Enter email address" type="email" className={inp} />
//             </Field>
//             <Field label="Gender">
//               <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} className={sel}>
//                 <option value="">Select gender</option>
//                 <option value="Male">Male</option>
//                 <option value="Female">Female</option>
//                 <option value="Other">Other</option>
//               </select>
//             </Field>
//             <Field label="Date of Birth">
//               <Input type="date" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} className={inp} />
//             </Field>
//             <Field label="City">
//               <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
//                 placeholder="Enter city" className={inp} />
//             </Field>
//           </div>
//         </div>

//         {/* Professional Details */}
//         <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-5">
//           <h3 className="text-white font-semibold text-sm">Professional Details</h3>

//           <div className="grid grid-cols-2 gap-4">
//             <Field label="Gym" required>
//               <select value={form.gymId} onChange={e => setForm(p => ({ ...p, gymId: e.target.value }))} className={sel}>
//                 <option value="">Select gym</option>
//                 {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
//               </select>
//             </Field>
//             <Field label="Years of Experience">
//               <Input type="number" min="0" value={form.experienceYears}
//                 onChange={e => setForm(p => ({ ...p, experienceYears: e.target.value }))} className={inp} />
//             </Field>
//           </div>

//           <Field label="Bio">
//             <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3}
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
//                 <button type="button" key={s} onClick={() => toggle(s)}
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
//           <Button type="submit" disabled={loading}
//             className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 px-8">
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
import { Loader2, ArrowLeft, UserCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/ui/ImageUpload"

const SPECIALIZATIONS = [
  "Weight Training","Cardio","Yoga","Zumba","CrossFit",
  "Boxing","HIIT","Pilates","Nutrition","Swimming",
  "Personal Training","Stretching","Rehabilitation","Dance Fitness","Martial Arts",
]

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-white/55 text-sm">{label}{required && <span className="text-primary ml-0.5">*</span>}</Label>
    {children}
  </div>
)

export default function AddTrainerPage() {
  const router   = useRouter()
  const { toast } = useToast()
  const [gyms, setGyms]       = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const [form, setForm] = useState({
    gymId:           "",
    fullName:        "",
    mobileNumber:    "",
    email:           "",
    gender:          "",
    dateOfBirth:     "",
    city:            "",
    bio:             "",
    experienceYears: "0",
    specializations: [] as string[],
    certifications:  "",
  })

  const inp = "bg-[hsl(220_25%_11%)] border-white/10 text-white placeholder:text-white/20 focus:border-primary focus-visible:ring-0 h-11 rounded-xl"
  const sel = "w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl px-4 h-11 text-sm focus:outline-none focus:border-primary"

  useEffect(() => {
    fetch("/api/owner/gyms").then(r => r.json()).then((data: any[]) => {
      setGyms(data)
      if (data.length > 0) setForm(p => ({ ...p, gymId: data[0].id }))
    })
  }, [])

  const toggle = (val: string) =>
    setForm(p => ({
      ...p,
      specializations: p.specializations.includes(val)
        ? p.specializations.filter(x => x !== val)
        : [...p.specializations, val],
    }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.gymId)          { toast({ variant: "destructive", title: "Please select a gym" }); return }
    if (!form.fullName.trim()) { toast({ variant: "destructive", title: "Full name is required" }); return }
    if (!form.mobileNumber.trim()) { toast({ variant: "destructive", title: "Mobile number is required" }); return }
    if (!form.email.trim())   { toast({ variant: "destructive", title: "Email is required to send login credentials" }); return }

    setLoading(true)
    try {
      const res = await fetch("/api/owner/trainers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          avatarUrl,
          certifications: form.certifications
            ? form.certifications.split(",").map(s => s.trim()).filter(Boolean)
            : [],
          experienceYears: parseInt(form.experienceYears) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ variant: "success", title: "Trainer added!", description: `${form.fullName} has been added and sent a welcome email.` })
      router.push("/owner/trainers")
    } catch (err: any) {
      toast({ variant: "destructive", title: err.message ?? "Failed to add trainer" })
    } finally {
      setLoading(false)
    }
  }

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
          <p className="text-white/40 text-sm">They will receive a welcome email to set their password</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Avatar + Personal Info */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-5">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" /> Personal Information
          </h3>

          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <ImageUpload value={avatarUrl} onChange={setAvatarUrl} shape="circle" size={72} placeholder="Photo" folder="avatars" />
            <div>
              <p className="text-white text-sm font-medium">Profile Photo</p>
              <p className="text-white/35 text-xs mt-0.5">JPG, PNG or WebP · Max 2MB</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" required>
              <Input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                placeholder="Enter full name" className={inp} />
            </Field>
            <Field label="Mobile Number" required>
              <Input value={form.mobileNumber} onChange={e => setForm(p => ({ ...p, mobileNumber: e.target.value }))}
                placeholder="Enter mobile number" type="tel" className={inp} />
            </Field>
            <Field label="Email" required>
              <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="Enter email address" type="email" className={inp} />
            </Field>
            <Field label="Gender">
              <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} className={sel}>
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
              <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                placeholder="Enter city" className={inp} />
            </Field>
          </div>
        </div>

        {/* Professional Details */}
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 space-y-5">
          <h3 className="text-white font-semibold text-sm">Professional Details</h3>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Gym" required>
              <select value={form.gymId} onChange={e => setForm(p => ({ ...p, gymId: e.target.value }))} className={sel}>
                <option value="">Select gym</option>
                {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </Field>
            <Field label="Years of Experience">
              <Input type="number" min="0" value={form.experienceYears}
                onChange={e => setForm(p => ({ ...p, experienceYears: e.target.value }))} className={inp} />
            </Field>
          </div>

          <Field label="Bio">
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3}
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
                <button type="button" key={s} onClick={() => toggle(s)}
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
          <Button type="submit" disabled={loading}
            className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 px-8">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Trainer"}
          </Button>
        </div>
      </form>
    </div>
  )
}
// "use client"

// import { useState } from "react"
// import { useRouter } from "next/navigation"
// import { PageHeader } from "@/components/owner/PageHeader"
// import { useToast } from "@/hooks/use-toast"
// import { Loader2 } from "lucide-react"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Button } from "@/components/ui/button"

// const SERVICES = ["Weight Training","Cardio","Yoga","Zumba","CrossFit","Boxing","Swimming","Cycling","Pilates","HIIT"]
// const FACILITIES = ["Locker Room","Shower","Parking","AC","WiFi","Cafeteria","Steam Room","Sauna","Pro Shop","Child Care"]

// export default function NewGymPage() {
//   const router = useRouter()
//   const { toast } = useToast()
//   const [loading, setLoading] = useState(false)
//   const [form, setForm] = useState({
//     name: "", address: "", city: "", state: "", pincode: "", contactNumber: "",
//     services: [] as string[], facilities: [] as string[],
//   })

//   const toggle = (arr: string[], val: string) =>
//     arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!form.name.trim()) { toast({ variant: "destructive", title: "Gym name is required" }); return }
//     setLoading(true)
//     try {
//       const res = await fetch("/api/owner/gyms", {
//         method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
//       })
//       const data = await res.json()
//       if (!res.ok) throw new Error(data.error)
//       toast({ variant: "success", title: "Gym created!", description: `${form.name} has been added.` })
//       router.push(`/owner/gyms/${data.id}`)
//     } catch (err: any) {
//       toast({ variant: "destructive", title: "Failed to create gym", description: err.message })
//     } finally { setLoading(false) }
//   }

//   return (
//     <div className="max-w-2xl">
//       <PageHeader title="Add New Gym" subtitle="Set up a new gym location"
//         breadcrumb={[{ label: "Gyms", href: "/owner/gyms" }]} />

//       <form onSubmit={handleSubmit} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-7 space-y-6">

//         {/* Basic Info */}
//         <div className="space-y-4">
//           <h3 className="text-white font-semibold text-sm border-b border-white/5 pb-3">Basic Information</h3>
//           <div className="space-y-1.5">
//             <Label className="text-white/65 text-sm">Gym Name <span className="text-primary">*</span></Label>
//             <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. PowerFit Andheri"
//               className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11" />
//           </div>
//           <div className="space-y-1.5">
//             <Label className="text-white/65 text-sm">Address</Label>
//             <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Street address"
//               className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11" />
//           </div>
//           <div className="grid grid-cols-3 gap-3">
//             {(["city","state","pincode"] as const).map(field => (
//               <div key={field} className="space-y-1.5">
//                 <Label className="text-white/65 text-sm capitalize">{field}</Label>
//                 <Input value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
//                   placeholder={field === "pincode" ? "400001" : field === "state" ? "Maharashtra" : "Mumbai"}
//                   className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11" />
//               </div>
//             ))}
//           </div>
//           <div className="space-y-1.5">
//             <Label className="text-white/65 text-sm">Contact Number</Label>
//             <Input value={form.contactNumber} onChange={e => setForm(p => ({ ...p, contactNumber: e.target.value }))}
//               type="tel" placeholder="9876543210"
//               className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11" />
//           </div>
//         </div>

//         {/* Services */}
//         <div className="space-y-3">
//           <h3 className="text-white font-semibold text-sm border-b border-white/5 pb-3">Services Offered</h3>
//           <div className="flex flex-wrap gap-2">
//             {SERVICES.map(s => (
//               <button type="button" key={s} onClick={() => setForm(p => ({ ...p, services: toggle(p.services, s) }))}
//                 className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
//                   form.services.includes(s) ? "bg-primary/15 border-primary/40 text-primary" : "bg-white/4 border-white/8 text-white/50 hover:border-white/20"
//                 }`}>{s}</button>
//             ))}
//           </div>
//         </div>

//         {/* Facilities */}
//         <div className="space-y-3">
//           <h3 className="text-white font-semibold text-sm border-b border-white/5 pb-3">Facilities Available</h3>
//           <div className="flex flex-wrap gap-2">
//             {FACILITIES.map(f => (
//               <button type="button" key={f} onClick={() => setForm(p => ({ ...p, facilities: toggle(p.facilities, f) }))}
//                 className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
//                   form.facilities.includes(f) ? "bg-primary/15 border-primary/40 text-primary" : "bg-white/4 border-white/8 text-white/50 hover:border-white/20"
//                 }`}>{f}</button>
//             ))}
//           </div>
//         </div>

//         <div className="flex justify-end gap-3 pt-2">
//           <Button type="button" variant="outline" onClick={() => router.back()}
//             className="border-white/10 bg-white/5 text-white hover:bg-white/8 h-11">Cancel</Button>
//           <Button type="submit" disabled={loading} className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 px-8">
//             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Gym"}
//           </Button>
//         </div>
//       </form>
//     </div>
//   )
// }



// src/app/owner/gyms/new/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/owner/PageHeader"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/ui/ImageUpload"
import { MultiImageUpload } from "@/components/ui/MultiUpload"

const SERVICES = ["Weight Training","Cardio","Yoga","Zumba","CrossFit","Boxing","Swimming","Cycling","Pilates","HIIT"]
const FACILITIES = ["Locker Room","Shower","Parking","AC","WiFi","Cafeteria","Steam Room","Sauna","Pro Shop","Child Care"]

export default function NewGymPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [gymImages, setGymImages] = useState<string[]>([])
  const [ownerAvatar, setOwnerAvatar] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "", address: "", city: "", state: "", pincode: "", contactNumber: "",
    services: [] as string[], facilities: [] as string[],
  })

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast({ variant: "destructive", title: "Gym name is required" }); return }
    setLoading(true)
    try {
      const res = await fetch("/api/owner/gyms", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, gymImages }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Update owner's profile avatar if uploaded
      if (ownerAvatar) {
        await fetch("/api/profile/update", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarUrl: ownerAvatar }),
        })
      }
      toast({ variant: "success", title: "Gym created!", description: `${form.name} has been added.` })
      router.push(`/owner/gyms/${data.id}`)
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to create gym", description: err.message })
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Add New Gym" subtitle="Set up a new gym location"
        breadcrumb={[{ label: "Gyms", href: "/owner/gyms" }]} />

      <form onSubmit={handleSubmit} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-7 space-y-6">

        {/* Owner Profile Photo */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-sm border-b border-white/5 pb-3">Your Profile Photo</h3>
          <div className="flex items-center gap-4">
            <ImageUpload value={ownerAvatar} onChange={setOwnerAvatar} shape="circle" size={72} placeholder="Photo" />
            <p className="text-white/35 text-xs leading-relaxed">Upload your profile photo.<br/>This will be visible to members.</p>
          </div>
        </div>

        {/* Gym Images */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-sm border-b border-white/5 pb-3">Gym Photos <span className="text-white/30 font-normal">(up to 8)</span></h3>
          <MultiImageUpload values={gymImages} onChange={setGymImages} max={8} />
          <p className="text-white/25 text-xs">These photos will appear on your gym's detail page.</p>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold text-sm border-b border-white/5 pb-3">Basic Information</h3>
          <div className="space-y-1.5">
            <Label className="text-white/65 text-sm">Gym Name <span className="text-primary">*</span></Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. PowerFit Andheri"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/65 text-sm">Address</Label>
            <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Street address"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(["city","state","pincode"] as const).map(field => (
              <div key={field} className="space-y-1.5">
                <Label className="text-white/65 text-sm capitalize">{field}</Label>
                <Input value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                  placeholder={field === "pincode" ? "400001" : field === "state" ? "Maharashtra" : "Mumbai"}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11" />
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/65 text-sm">Contact Number</Label>
            <Input value={form.contactNumber} onChange={e => setForm(p => ({ ...p, contactNumber: e.target.value }))}
              type="tel" placeholder="9876543210"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus-visible:ring-0 h-11" />
          </div>
        </div>

        {/* Services */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-sm border-b border-white/5 pb-3">Services Offered</h3>
          <div className="flex flex-wrap gap-2">
            {SERVICES.map(s => (
              <button type="button" key={s} onClick={() => setForm(p => ({ ...p, services: toggle(p.services, s) }))}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  form.services.includes(s) ? "bg-primary/15 border-primary/40 text-primary" : "bg-white/4 border-white/8 text-white/50 hover:border-white/20"
                }`}>{s}</button>
            ))}
          </div>
        </div>

        {/* Facilities */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-sm border-b border-white/5 pb-3">Facilities Available</h3>
          <div className="flex flex-wrap gap-2">
            {FACILITIES.map(f => (
              <button type="button" key={f} onClick={() => setForm(p => ({ ...p, facilities: toggle(p.facilities, f) }))}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  form.facilities.includes(f) ? "bg-primary/15 border-primary/40 text-primary" : "bg-white/4 border-white/8 text-white/50 hover:border-white/20"
                }`}>{f}</button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()}
            className="border-white/10 bg-white/5 text-white hover:bg-white/8 h-11">Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-gradient-primary hover:opacity-90 text-white font-semibold h-11 px-8">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Gym"}
          </Button>
        </div>
      </form>
    </div>
  )
}
"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { PageHeader } from "@/components/owner/PageHeader"
import { useToast } from "@/hooks/use-toast"
import { Users, Star, Mail, Phone, Edit, Save, X, Loader2, Award } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/Avatar"

const SPECIALIZATIONS = ["Weight Training","Cardio","Yoga","Zumba","CrossFit","Boxing","HIIT","Pilates","Nutrition","Swimming"]

export default function TrainerDetailPage() {
  const { trainerId } = useParams<{ trainerId: string }>()
  const { toast } = useToast()
  const [trainer, setTrainer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const load = () => {
    fetch(`/api/owner/trainers/${trainerId}`)
      .then(r => r.json())
      .then(d => {
        setTrainer(d)
        setForm({ specializations: d.specializations, certifications: d.certifications, bio: d.bio ?? "", experienceYears: d.experienceYears, isAvailable: d.isAvailable })
      })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [trainerId])

  const save = async () => {
    setSaving(true)
    const res = await fetch(`/api/owner/trainers/${trainerId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    })
    if (res.ok) { toast({ variant: "success", title: "Trainer updated" }); setEditing(false); load() }
    else toast({ variant: "destructive", title: "Failed to update" })
    setSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
  if (!trainer) return <div className="text-white/40 text-center py-20">Trainer not found</div>

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={trainer.profile.fullName}
        subtitle={`Trainer at ${trainer.gym.name}`}
        breadcrumb={[{ label: "Trainers", href: "/owner/trainers" }]}
        action={editing
          ? { label: saving ? "Saving..." : "Save", onClick: save, icon: Save }
          : { label: "Edit", onClick: () => setEditing(true), icon: Edit }
        }
      />

      {/* Status + rating row */}
      <div className="flex items-center gap-3 mb-6">
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${trainer.isAvailable ? "bg-green-500/15 text-green-400" : "bg-white/8 text-white/40"}`}>
          {trainer.isAvailable ? "Available" : "Busy"}
        </span>
        <span className="flex items-center gap-1 text-sm text-white/50">
          <Star className="w-3.5 h-3.5 text-primary" /> {Number(trainer.rating).toFixed(1)} ({trainer.totalReviews} reviews)
        </span>
        <span className="text-white/30 text-sm">{trainer.experienceYears}y experience</span>
        {editing && (
          <>
            <label className="flex items-center gap-1.5 ml-auto cursor-pointer">
              <input type="checkbox" checked={form.isAvailable} onChange={e => setForm((p: any) => ({...p, isAvailable: e.target.checked}))} className="w-3.5 h-3.5 accent-orange-500" />
              <span className="text-white/60 text-xs">Available</span>
            </label>
            <button onClick={() => setEditing(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
          </>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Contact + bio */}
        <div className="space-y-4">
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
            <div className="flex items-center gap-4 mb-5">
              <Avatar name={trainer.profile.fullName} url={trainer.profile.avatarUrl} size={56} rounded="lg" />
              <div>
                <h3 className="text-white font-semibold">{trainer.profile.fullName}</h3>
                <p className="text-white/40 text-sm">{trainer.gym.name}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5"><Mail className="w-4 h-4 text-white/30" /><span className="text-white/60 text-sm">{trainer.profile.email}</span></div>
              {trainer.profile.mobileNumber && <div className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-white/30" /><span className="text-white/60 text-sm">{trainer.profile.mobileNumber}</span></div>}
            </div>
          </div>

          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Bio</h3>
            {editing ? (
              <textarea value={form.bio} onChange={e => setForm((p: any)=>({...p,bio:e.target.value}))} rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-sm p-3 focus:outline-none focus:border-primary resize-none placeholder:text-white/20"
                placeholder="Write trainer bio..." />
            ) : <p className="text-white/50 text-sm">{trainer.bio || "No bio added"}</p>}
          </div>
        </div>

        {/* Skills + members */}
        <div className="space-y-4">
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Specializations</h3>
            {editing ? (
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map(s => (
                  <button type="button" key={s} onClick={() => setForm((p: any) => ({ ...p, specializations: toggle(p.specializations, s) }))}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      form.specializations.includes(s) ? "bg-primary/15 border-primary/40 text-primary" : "bg-white/4 border-white/8 text-white/50 hover:border-white/20"
                    }`}>{s}</button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {trainer.specializations.length > 0 ? trainer.specializations.map((s: string) => (
                  <span key={s} className="text-xs bg-primary/10 border border-primary/20 text-primary/80 px-2.5 py-1 rounded-full">{s}</span>
                )) : <p className="text-white/30 text-sm">None added</p>}
              </div>
            )}
          </div>

          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" /> Certifications
            </h3>
            {editing ? (
              <Input value={form.certifications?.join(", ") ?? ""} onChange={e => setForm((p: any)=>({...p,certifications:e.target.value.split(",").map((s: string)=>s.trim()).filter(Boolean)}))}
                placeholder="ACE, NASM, ISSA..."
                className="bg-white/5 border-white/10 text-white focus:border-primary focus-visible:ring-0 h-9 text-sm" />
            ) : (
              <div className="flex flex-wrap gap-2">
                {trainer.certifications.length > 0 ? trainer.certifications.map((c: string) => (
                  <span key={c} className="text-xs bg-white/6 border border-white/10 text-white/55 px-2.5 py-1 rounded-full">{c}</span>
                )) : <p className="text-white/30 text-sm">None added</p>}
              </div>
            )}
          </div>

          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-white/40" /> Assigned Members ({trainer.assignedMembers?.length ?? 0})
            </h3>
            {trainer.assignedMembers?.length === 0 ? (
              <p className="text-white/30 text-sm">No members assigned</p>
            ) : (
              <div className="space-y-2">
                {trainer.assignedMembers?.slice(0,5).map((m: any) => (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <Avatar name={m.profile.fullName} url={m.profile.avatarUrl} size={28} />
                    <span className="text-white/65 text-sm">{m.profile.fullName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
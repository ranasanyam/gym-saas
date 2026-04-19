"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/owner/PageHeader"
import { useToast } from "@/hooks/use-toast"
import { Users, Star, Mail, Phone, Edit, Save, X, Loader2, ListChecks, Award, BicepsFlexed, ArrowLeft, Ruler, MapPin, Calendar, User2, Weight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/Avatar"

const SPECIALIZATIONS = ["Weight Training","Cardio","Yoga","Zumba","CrossFit","Boxing","HIIT","Pilates","Nutrition","Swimming"]

const TABS = ["Profile", "Members"];
export default function TrainerDetailPage() {
  const router = useRouter();
  const { trainerId } = useParams<{ trainerId: string }>()
  const [trainer, setTrainer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("Profile");



  const load = () => {
    fetch(`/api/owner/trainers/${trainerId}`)
      .then(r => r.json())
      .then(d => {
        setTrainer(d)
      })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [trainerId])



  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
  if (!trainer) return <div className="text-white/40 text-center py-20">Trainer not found</div>

  console.log("trainer", trainer);
  return (
    <div className="max-w-4xl">

        <div className="flex items-center gap-4 mb-5 justify-center">
            <button onClick={() => router.push("/owner/trainers")} className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-all shrink-0">
              <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-display font-bold text-white">{trainer.profile.fullName}</h2>
              
            </div>
            <p className="text-white/40 text-sm mt-0.5 flex items-center gap-1.5">Trainer at {trainer.gym.name}</p>
          </div>
        </div>
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6 mb-5">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-5">
              <Avatar name={trainer.profile.fullName} url={trainer.profile.avatarUrl} size={100} />
              <div>
                <h3 className="text-white font-semibold">{trainer.profile.fullName}</h3>
                <p className="text-white/40 text-sm">{trainer.profile.email}</p>
                <p className="text-white/40 text-sm">{trainer.profile.mobileNumber}</p>
              </div>
            </div>
             <div className="flex-end flex flex-col items-end gap-5">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${trainer.isAvailable ? "bg-green-500/15 text-green-400" : "bg-white/8 text-white/40"}`}>
                {trainer.isAvailable ? "Available" : "Busy"}
              </span>
            </div>
          </div>
          <div className="bg-white/4 rounded-lg mb-5 px-5 py-2 flex items-center justify-around">
            <div className="text-white text-center">
              <p className="text-white/35 text-xs mb-1">Rating</p>
              <p className="text-white/80 text-sm flex items-center gap-1"><Star className="w-3.5 h-3.5 text-primary" /> {Number(trainer.rating).toFixed(1)}</p>
            </div>
            <div className="w-0.5 bg-white/10 h-10" />
            <div className="text-white text-center">
              <p className="text-white/35 text-xs mb-1">Members</p>
              <p className="text-white/80 text-sm">{trainer.assignedMembers?.length ?? 0}</p>
            </div>
            <div className="w-0.5 bg-white/10 h-10" />
            <div className="text-white text-center">
              <p className="text-white/35 text-xs mb-1">Experience</p>
              <p className="text-white/80 text-sm">{trainer.experienceYears}y</p>
            </div>
          </div>
        </div>

        <div className="flex gap-1 bg-white/4 rounded-full p-1 w-full mb-6">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm w-full font-medium transition-all ${tab === t ? "bg-gradient-primary text-white shadow" : "text-white/40 hover:text-white/70"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "Profile" && (
                  <div >
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3 py-4 border-b-2 border-white/6">
                  <Phone className="w-4 h-4 text-green-400" />
                <div className="flex justify-between w-full">
                  <p className="text-white/35 text-xs">Phone Number</p>
                  <p className="text-white/80 text-sm">
                    {trainer.profile.mobileNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-4 border-b-2 border-white/6">
                  <User2 className="w-4 h-4 text-blue-400" />
                <div className="flex justify-between w-full">
                  <p className="text-white/35 text-xs">Gender</p>
                  <p className="text-white/80 text-sm">
                    {trainer?.profile.gender?.toUpperCase() ?? "Not Provided"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-4 border-b-2 border-white/6">
                  <Calendar className="w-4 h-4 text-primary" />
                <div className="flex justify-between w-full">
                  <p className="text-white/35 text-xs">Date Of Birth</p>
                  <p className="text-white/80 text-sm">
                    {new Date(trainer?.profile?.dateOfBirth ?? "").toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    }) ?? "Not Provided"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-4 border-b-2 border-white/6">
                <MapPin className="w-4 h-4 text-blue-400" />
                <div className="flex justify-between w-full">
                  <p className="text-white/35 text-xs">City</p>
                  <p className="text-white/80 text-sm">
                    {trainer.profile.city ?? "Not Provided"}
                  </p>
                </div>
              </div> 
            </div>
          </div>
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 my-5">
            <div className="flex items-center gap-2 mb-4">
              <BicepsFlexed className="w-4 h-4 text-primary" />
            <h3 className="text-white font-semibold text-sm">Specializations</h3>
            </div>

              <div className="flex flex-wrap gap-2">
                {trainer.specializations.length > 0 ? trainer.specializations.map((s: string) => (
                  <span key={s} className="text-xs bg-primary/10 border border-primary/20 text-primary/80 px-2.5 py-1 rounded-full">{s}</span>
                )) : <p className="text-white/30 text-sm">None added</p>}
              </div>
            
          </div>
          <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 my-5">
            <div className="flex items-center gap-2 mb-4">
              <ListChecks className="w-4 h-4 text-primary" />
              <h3 className="text-white font-semibold text-sm">Bio</h3>
            </div>
            <p className="text-white/50 text-sm">{trainer.bio || "No bio added"}</p>
          </div>
           <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 my-5">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" /> Certifications
            </h3>
              <div className="flex flex-wrap gap-2">
                {trainer.certifications.length > 0 ? trainer.certifications.map((c: string) => (
                  <span key={c} className="text-xs bg-white/6 border border-white/10 text-white/55 px-2.5 py-1 rounded-full">{c}</span>
                )) : <p className="text-white/30 text-sm">No Certifications Added</p>}
              </div>
          </div>
        </div>
        )}

        {tab === "Members" && (
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
        )}

    </div>
  )
}
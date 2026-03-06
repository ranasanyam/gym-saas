// src/app/member/discover/[gymId]/page.tsx
"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Building2, MapPin, Phone, Users, Star,
  ChevronLeft, ChevronRight, Image as ImageIcon, Loader2,
  CheckCircle2, UserCheck
} from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"

function GymImageCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % images.length), 3500)
  }

  useEffect(() => {
    if (images.length < 2) return
    start()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [images.length])

  const go = (dir: 1 | -1) => { setIdx(i => (i + dir + images.length) % images.length); start() }

  if (images.length === 0) return (
    <div className="h-56 bg-[hsl(220_25%_6%)] flex flex-col items-center justify-center gap-2 rounded-2xl">
      <ImageIcon className="w-10 h-10 text-white/10" />
      <span className="text-white/20 text-sm">No gym photos</span>
    </div>
  )

  return (
    <div className="relative h-64 rounded-2xl overflow-hidden bg-black">
      <img src={images[idx]} alt="Gym" className="w-full h-full object-cover" />
      {images.length > 1 && (
        <>
          <button onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => { setIdx(i); start() }}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "bg-white w-5" : "bg-white/40 w-1.5"}`} />
            ))}
          </div>
          <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">{idx + 1}/{images.length}</div>
        </>
      )}
    </div>
  )
}

export default function GymDiscoverDetailPage() {
  const { gymId } = useParams<{ gymId: string }>()
  const router    = useRouter()
  const [gym, setGym]       = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/member/discover?gymId=${gymId}`)
      .then(r => r.json())
      .then(d => {
        const found = (d.gyms ?? []).find((g: any) => g.id === gymId) ?? d.gym ?? null
        setGym(found)
      })
      .finally(() => setLoading(false))
  }, [gymId])

  // Fallback: fetch all and find by id
  useEffect(() => {
    if (loading) return
    if (!gym) {
      fetch("/api/member/discover")
        .then(r => r.json())
        .then(d => setGym((d.gyms ?? []).find((g: any) => g.id === gymId) ?? null))
    }
  }, [loading])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  )
  if (!gym) return (
    <div className="text-center py-20">
      <Building2 className="w-12 h-12 text-white/15 mx-auto mb-4" />
      <p className="text-white/40">Gym not found</p>
      <Link href="/member/discover" className="text-primary hover:underline text-sm mt-2 inline-block">← Back to Discover</Link>
    </div>
  )

  const contactNumber = gym.contactNumber || gym.owner?.mobileNumber

  return (
    <div className="max-w-3xl space-y-5">
      {/* Back button */}
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Discover
      </button>

      {/* Image Carousel */}
      <GymImageCarousel images={gym.gymImages ?? []} />

      {/* Gym name & status */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-white text-xl font-display font-bold">{gym.name}</h2>
              {gym.isEnrolled && (
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  gym.isActive ? "bg-green-500/15 text-green-400" : "bg-white/8 text-white/40"
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  {gym.isActive ? "Active Member" : "Past Member"}
                </span>
              )}
            </div>
            <p className="text-white/40 text-sm mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {[gym.address, gym.city, gym.state].filter(Boolean).join(", ")}
            </p>
            <div className="flex items-center gap-4 mt-2 flex-wrap text-xs">
              <span className="flex items-center gap-1 text-white/35"><Users className="w-3 h-3" />{gym._count?.members ?? 0} members</span>
              {contactNumber && (
                <a href={`tel:${contactNumber}`}
                  className="flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors">
                  <Phone className="w-3 h-3" /> {contactNumber}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Owner */}
      {gym.owner && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={gym.owner.fullName} url={gym.owner.avatarUrl} size={42} />
            <div>
              <p className="text-white/40 text-xs">Gym Owner</p>
              <p className="text-white font-semibold text-sm">{gym.owner.fullName}</p>
            </div>
          </div>
          {gym.owner.mobileNumber && (
            <a href={`tel:${gym.owner.mobileNumber}`}
              className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 bg-green-500/10 px-3 py-2 rounded-xl transition-colors">
              <Phone className="w-4 h-4" /> Call Owner
            </a>
          )}
        </div>
      )}

      {/* Membership Plans */}
      {gym.membershipPlans?.length > 0 && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Membership Plans</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {gym.membershipPlans.map((plan: any) => (
              <div key={plan.id} className="bg-[hsl(220_25%_12%)] rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-white font-medium">{plan.name}</p>
                  <p className="text-primary font-bold">₹{Number(plan.price).toLocaleString("en-IN")}</p>
                </div>
                <p className="text-white/35 text-xs mb-2">{plan.durationMonths} month{plan.durationMonths > 1 ? "s" : ""}</p>
                {plan.features?.length > 0 && (
                  <ul className="space-y-1">
                    {plan.features.slice(0, 4).map((f: string) => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-white/45">
                        <Star className="w-2.5 h-2.5 text-primary/50 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services + Facilities */}
      {gym.services?.length > 0 && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-3">Services</h3>
          <div className="flex flex-wrap gap-2">
            {gym.services.map((s: string) => (
              <span key={s} className="text-xs bg-primary/10 border border-primary/15 text-primary/80 px-3 py-1.5 rounded-full">{s}</span>
            ))}
          </div>
        </div>
      )}

      {gym.facilities?.length > 0 && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-3">Facilities</h3>
          <div className="flex flex-wrap gap-2">
            {gym.facilities.map((f: string) => (
              <span key={f} className="text-xs bg-white/5 border border-white/8 text-white/45 px-3 py-1.5 rounded-full">{f}</span>
            ))}
          </div>
        </div>
      )}

      <div className="pb-4 text-center">
        <p className="text-white/25 text-xs">To join this gym, ask the gym owner to add you as a member.</p>
      </div>
    </div>
  )
}
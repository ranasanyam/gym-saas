"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Building2, MapPin, Phone, Star,
  ChevronLeft, ChevronRight, Image as ImageIcon, Loader2,
  CheckCircle2, Pencil, X
} from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"

// ── Image Carousel ────────────────────────────────────────────────────────────

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

// ── Star display ──────────────────────────────────────────────────────────────

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const px = size === "lg" ? "w-6 h-6" : "w-3.5 h-3.5"
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`${px} ${s <= rating ? "text-amber-400 fill-amber-400" : "text-white/15 fill-white/5"}`} />
      ))}
    </div>
  )
}

// ── Interactive star picker ───────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="focus:outline-none"
        >
          <Star className={`w-8 h-8 transition-colors ${s <= display ? "text-amber-400 fill-amber-400" : "text-white/20 fill-white/5"}`} />
        </button>
      ))}
    </div>
  )
}

// ── Review card ───────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: any }) {
  const date = new Date(review.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  })
  return (
    <div className="flex gap-3 py-4 border-b border-white/6 last:border-0">
      <Avatar name={review.profile.fullName} url={review.profile.avatarUrl} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-semibold">{review.profile.fullName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              review.role === "trainer"
                ? "bg-blue-500/15 text-blue-400"
                : "bg-primary/15 text-primary"
            }`}>
              {review.role === "trainer" ? "Trainer" : "Member"}
            </span>
          </div>
          <span className="text-white/30 text-xs">{date}</span>
        </div>
        <div className="mt-1">
          <StarDisplay rating={review.rating} />
        </div>
        {review.comment && (
          <p className="text-white/55 text-sm mt-2 leading-relaxed">{review.comment}</p>
        )}
      </div>
    </div>
  )
}

// ── Review modal ──────────────────────────────────────────────────────────────

function ReviewModal({
  gymId, existing, onClose, onSuccess,
}: {
  gymId: string; existing: any | null; onClose: () => void; onSuccess: (review: any) => void;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [comment, setComment] = useState(existing?.comment ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"]

  const submit = async () => {
    if (rating < 1) { setError("Please select a rating"); return }
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/member/gyms/${gymId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return }
      onSuccess(data)
      onClose()
    } catch {
      setError("Failed to submit review")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[hsl(220_25%_10%)] border border-white/8 rounded-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">{existing ? "Update Review" : "Write a Review"}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <StarPicker value={rating} onChange={setRating} />
          {rating > 0 && (
            <span className="text-primary text-sm font-medium">{ratingLabels[rating]}</span>
          )}
        </div>

        <div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={500}
            placeholder="Share your experience (optional)"
            rows={4}
            className="w-full bg-[hsl(220_25%_6%)] border border-white/8 rounded-xl p-3 text-white text-sm placeholder-white/25 resize-none focus:outline-none focus:border-primary/50 transition-colors"
          />
          <p className="text-white/25 text-xs text-right mt-1">{comment.length}/500</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:border-white/20 transition-colors text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading || rating < 1}
            className="flex-1 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {existing ? "Update" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GymDiscoverDetailPage() {
  const { gymId } = useParams<{ gymId: string }>()
  const router    = useRouter()
  const [gym, setGym]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/member/discover/${gymId}`)
      .then(r => r.json())
      .then(d => setGym(d.error ? null : d))
      .finally(() => setLoading(false))
  }, [gymId])

  const handleReviewSuccess = (newReview: any) => {
    setGym((prev: any) => {
      if (!prev) return prev
      const existingIdx = prev.recentReviews?.findIndex((r: any) => r.id === newReview.id) ?? -1
      const recentReviews = existingIdx >= 0
        ? prev.recentReviews.map((r: any) => r.id === newReview.id ? newReview : r)
        : [newReview, ...(prev.recentReviews ?? [])].slice(0, 5)
      return { ...prev, myReview: newReview, recentReviews }
    })
    // Refresh to get updated averageRating / totalReviews from server
    fetch(`/api/member/discover/${gymId}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setGym(d) })
  }

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
  const avg = Number(gym.averageRating ?? 0)
  const totalReviews: number = gym.totalReviews ?? 0
  const recentReviews: any[] = gym.recentReviews ?? []

  return (
    <div className="max-w-3xl space-y-5">
      {/* Back */}
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Discover
      </button>

      {/* Carousel */}
      <GymImageCarousel images={gym.gymImages ?? []} />

      {/* Gym name & status */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-white text-xl font-display font-bold">{gym.name}</h2>
              {gym.isEnrolled && (
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  gym.memberIsActive ? "bg-green-500/15 text-green-400" : "bg-white/8 text-white/40"
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  {gym.memberIsActive ? "Active Member" : "Past Member"}
                </span>
              )}
            </div>
            <p className="text-white/40 text-sm mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {[gym.address, gym.city, gym.state].filter(Boolean).join(", ")}
            </p>
            <div className="flex items-center gap-4 mt-2 flex-wrap text-xs">
              {contactNumber && (
                <a href={`tel:${contactNumber}`}
                  className="flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors">
                  <Phone className="w-3 h-3" /> {contactNumber}
                </a>
              )}
              {avg > 0 && (
                <span className="flex items-center gap-1.5 text-white/40">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-white/70 font-medium">{avg.toFixed(1)}</span>
                  <span>({totalReviews} {totalReviews === 1 ? "review" : "reviews"})</span>
                </span>
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

      {/* Services */}
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

      {/* Facilities */}
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

      {/* Reviews */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-white font-semibold text-sm">Reviews</h3>
            {avg > 0 && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-white text-2xl font-bold">{avg.toFixed(1)}</span>
                <StarDisplay rating={Math.round(avg)} />
                <span className="text-white/35 text-xs">({totalReviews})</span>
              </div>
            )}
          </div>
          {gym.isEnrolled && (
            <button
              onClick={() => setReviewModalOpen(true)}
              className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3 py-1.5 rounded-full font-semibold transition-colors shrink-0"
            >
              <Pencil className="w-3 h-3" />
              {gym.myReview ? "Edit Review" : "Write Review"}
            </button>
          )}
        </div>

        {recentReviews.length > 0 ? (
          <div>
            {recentReviews.map((r: any) => <ReviewCard key={r.id} review={r} />)}
          </div>
        ) : (
          <div className="text-center py-8">
            <Star className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-white/30 text-sm">No reviews yet. Be the first!</p>
          </div>
        )}
      </div>

      <div className="pb-4 text-center">
        <p className="text-white/25 text-xs">To join this gym, ask the gym owner to add you as a member.</p>
      </div>

      {reviewModalOpen && (
        <ReviewModal
          gymId={gymId}
          existing={gym.myReview ?? null}
          onClose={() => setReviewModalOpen(false)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  )
}

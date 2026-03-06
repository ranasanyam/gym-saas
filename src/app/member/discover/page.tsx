// src/app/member/discover/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Search, MapPin, Users, Building2, Star, ChevronDown, ChevronUp, Loader2, CheckCircle2 } from "lucide-react"

export default function DiscoverGymsPage() {
  const [gyms, setGyms]         = useState<any[]>([])
  const [memberCity, setMemberCity] = useState("")
  const [search, setSearch]     = useState("")
  const [city, setCity]         = useState("")
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = (s: string, c: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (s) params.set("search", s)
    if (c) params.set("city", c)
    fetch(`/api/member/discover?${params}`)
      .then(r => r.json())
      .then(d => { setGyms(d.gyms ?? []); if (d.memberCity && !city) setCity(d.memberCity ?? ""); setMemberCity(d.memberCity ?? "") })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load("", "") }, [])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(search, city) }

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">Discover Gyms</h2>
        <p className="text-white/40 text-sm mt-1">Browse gyms in your city and find the right fit</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search gyms by name..."
            className="w-full bg-[hsl(220_25%_9%)] border border-white/10 text-white text-sm rounded-xl pl-10 pr-4 h-11 focus:outline-none focus:border-primary/50 placeholder:text-white/20" />
        </div>
        <div className="relative w-40">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
          <input value={city} onChange={e => setCity(e.target.value)}
            placeholder={memberCity || "City"}
            className="w-full bg-[hsl(220_25%_9%)] border border-white/10 text-white text-sm rounded-xl pl-9 pr-4 h-11 focus:outline-none focus:border-primary/50 placeholder:text-white/20" />
        </div>
        <button type="submit"
          className="bg-gradient-primary text-white text-sm font-semibold px-5 h-11 rounded-xl hover:opacity-90 transition-opacity">
          Search
        </button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : gyms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-3">
          <Building2 className="w-10 h-10 text-white/15" />
          <p className="text-white/30 text-sm">No gyms found{city ? ` in ${city}` : ""}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-white/35 text-sm">{gyms.length} gym{gyms.length !== 1 ? "s" : ""} found{city ? ` in ${city}` : ""}</p>
          {gyms.map(gym => {
            const isOpen = expanded === gym.id
            const cheapestPlan = gym.membershipPlans?.[0]
            return (
              <div key={gym.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
                {/* Gym header */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-semibold">{gym.name}</h3>
                        {gym.isEnrolled && (
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                            gym.isActive ? "bg-green-500/15 text-green-400" : "bg-white/8 text-white/40"
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {gym.isActive ? "Active Member" : "Past Member"}
                          </span>
                        )}
                      </div>
                      <p className="text-white/40 text-xs mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {[gym.address, gym.city, gym.state].filter(Boolean).join(", ")}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-white/35">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{gym._count.members} members</span>
                        {cheapestPlan && <span className="text-primary font-medium">from ₹{Number(cheapestPlan.price).toLocaleString("en-IN")}/mo</span>}
                      </div>
                    </div>
                    <button onClick={() => setExpanded(isOpen ? null : gym.id)}
                      className="text-white/30 hover:text-white p-1 transition-colors shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Services preview */}
                  {gym.services?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {gym.services.slice(0, 5).map((s: string) => (
                        <span key={s} className="text-xs bg-white/5 border border-white/8 text-white/40 px-2.5 py-1 rounded-full">{s}</span>
                      ))}
                      {gym.services.length > 5 && (
                        <span className="text-xs text-white/25 px-2 py-1">+{gym.services.length - 5} more</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded — Plans */}
                {isOpen && (
                  <div className="border-t border-white/6 p-5 space-y-4">
                    {/* Owner info */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white text-xs font-bold">
                        {gym.owner.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-white/60 text-xs">Gym Owner</p>
                        <p className="text-white text-sm font-medium">{gym.owner.fullName}</p>
                      </div>
                    </div>

                    {/* Membership Plans */}
                    {gym.membershipPlans?.length > 0 ? (
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Membership Plans</p>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {gym.membershipPlans.map((plan: any) => (
                            <div key={plan.id} className="bg-[hsl(220_25%_12%)] rounded-xl p-4">
                              <div className="flex items-start justify-between mb-2">
                                <p className="text-white font-medium text-sm">{plan.name}</p>
                                <p className="text-primary font-bold text-sm">₹{Number(plan.price).toLocaleString("en-IN")}</p>
                              </div>
                              <p className="text-white/35 text-xs mb-2">{plan.durationMonths} month{plan.durationMonths > 1 ? "s" : ""}</p>
                              {plan.features?.length > 0 && (
                                <ul className="space-y-1">
                                  {plan.features.slice(0, 3).map((f: string) => (
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
                    ) : (
                      <p className="text-white/30 text-sm">No plans listed — contact the gym directly</p>
                    )}

                    {/* Facilities */}
                    {gym.facilities?.length > 0 && (
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Facilities</p>
                        <div className="flex flex-wrap gap-1.5">
                          {gym.facilities.map((f: string) => (
                            <span key={f} className="text-xs bg-white/5 border border-white/8 text-white/45 px-2.5 py-1 rounded-full">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-white/6">
                      <p className="text-white/25 text-xs">To join this gym, ask the gym owner to add you or visit in person.</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
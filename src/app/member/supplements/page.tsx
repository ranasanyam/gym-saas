// src/app/member/supplements/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { ShoppingBag, Search, Package, Info
  } from "lucide-react"
import { IndianRupee } from "lucide-react"
import { useMemberGym } from "@/contexts/MemberGymContext"
import { NoGymState } from "@/components/member/NoGymState"

function SkeletonCard() {
  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 space-y-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-white/5 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/5 rounded w-2/3" />
          <div className="h-3 bg-white/5 rounded w-1/3" />
        </div>
      </div>
      <div className="h-3 bg-white/5 rounded w-full" />
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-white/5 rounded-full" />
        <div className="h-6 w-12 bg-white/5 rounded-full" />
      </div>
    </div>
  )
}

export default function MemberSupplementsPage() {
  const { hasGym, gymLoading }        = useMemberGym()
  const [supplements, setSupplements] = useState<any[]>([])
  const [categories, setCategories]   = useState<string[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState("")
  const [activeCategory, setCategory] = useState("")
  const [query, setQuery]             = useState("")

  const load = useCallback((s: string, c: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (s) params.set("search", s)
    if (c) params.set("category", c)
    fetch(`/api/member/supplements?${params}`)
      .then(r => r.json())
      .then(d => {
        setSupplements(d.supplements ?? [])
        if (d.categories?.length) setCategories(d.categories)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load("", "") }, [load])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCategory("")
    load(query, "")
    setSearch(query)
  }

  const handleCategory = (cat: string) => {
    setCategory(cat)
    setQuery("")
    setSearch("")
    load("", cat)
  }

  const allCategories = ["All", ...categories]

  if (gymLoading) return (
    <div className="max-w-4xl space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-white/5 rounded" />
      <div className="h-12 bg-white/5 rounded-xl" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-white/5 rounded-2xl" />)}
      </div>
    </div>
  )

  if (!hasGym) return <NoGymState pageName="Supplements" />

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary" />
          Supplements
        </h2>
        <p className="text-white/35 text-sm mt-0.5">Browse available supplements at your gym</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-primary/8 border border-primary/20 rounded-2xl px-5 py-4">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-primary/80 text-sm">
          This is a browse-only view. To purchase a supplement, ask your trainer or the front desk.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search supplements…"
          className="w-full bg-[hsl(220_25%_11%)] border border-white/10 text-white rounded-xl pl-11 pr-4 h-11 text-sm focus:outline-none focus:border-primary placeholder:text-white/25"
        />
      </form>

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategory(cat === "All" ? "" : cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                (cat === "All" && !activeCategory) || activeCategory === cat
                  ? "bg-primary text-white"
                  : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >

              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : supplements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
            <Package className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-white font-semibold">No supplements found</h3>
          <p className="text-white/35 text-sm text-center max-w-xs">
            {search || activeCategory
              ? "Try a different search or category."
              : "Your gym hasn't listed any supplements yet."}
          </p>
          {(search || activeCategory) && (
            <button
              onClick={() => { setQuery(""); setCategory(""); setSearch(""); load("", "") }}
              className="text-primary text-sm hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {supplements.map((s: any) => (
            <div key={s.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 space-y-3 hover:border-white/10 transition-colors">
              {/* Top */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  {s.imageUrl
                    ? <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover rounded-xl" />
                    : <ShoppingBag className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm leading-tight truncate">{s.name}</p>
                  {s.brand && <p className="text-white/40 text-xs mt-0.5">{s.brand}</p>}
                </div>
              </div>

              {/* Description */}
              {s.description && (
                <p className="text-white/40 text-xs line-clamp-2">{s.description}</p>
              )}

              {/* Badges + price row */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {s.category && (
                    <span className="text-[10px] bg-primary/10 border border-primary/15 text-primary/80 px-2 py-0.5 rounded-full font-medium">
                      {s.category}
                    </span>
                  )}
                  {s.unitSize && (
                    <span className="text-[10px] bg-white/5 border border-white/8 text-white/50 px-2 py-0.5 rounded-full">
                      {s.unitSize}
                    </span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    s.stockQty > (s.lowStockAt ?? 5)
                      ? "bg-green-500/10 text-green-400"
                      : "bg-yellow-500/10 text-yellow-400"
                  }`}>
                    {s.stockQty > (s.lowStockAt ?? 5) ? "In Stock" : "Low Stock"}
                  </span>
                </div>
                <p className="text-white font-bold text-sm flex items-center gap-0.5">
                  <IndianRupee className="w-3.5 h-3.5 text-white/50" />
                  {Number(s.price).toLocaleString("en-IN")}
                </p>
              </div>

              {/* Gym badge */}
              {s.gym?.name && (
                <p className="text-white/25 text-[10px] border-t border-white/5 pt-2.5">{s.gym.name}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

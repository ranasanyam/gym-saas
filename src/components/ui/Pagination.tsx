"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  page: number
  pages: number
  total: number
  limit: number
  onChange: (page: number) => void
  className?: string
}

export function Pagination({ page, pages, total, limit, onChange, className = "" }: PaginationProps) {
  if (total === 0) return null
  const start = (page - 1) * limit + 1
  const end   = Math.min(page * limit, total)
  return (
    <div className={`flex items-center justify-between py-1 ${className}`}>
      <p className="text-white/30 text-xs">Showing {start}–{end} of {total}</p>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange(page - 1)}
            disabled={page === 1}
            className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white/40 text-sm px-2 tabular-nums">{page} / {pages}</span>
          <button
            onClick={() => onChange(page + 1)}
            disabled={page === pages}
            className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

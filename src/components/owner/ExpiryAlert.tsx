"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"

interface ExpiryAlertProps {
  names?: string[]
  count: number
  days: number
}

export function ExpiryAlert({ names, count, days }: ExpiryAlertProps) {
  if (!count) return null

  // Determine colors and message based on days
  let bgClass: string
  let borderClass: string
  let iconClass: string
  let textClass: string
  let message: string

  if (days < 0) {
    // Expired (red)
    bgClass = "bg-red-500/8"
    borderClass = "border-red-500/25"
    iconClass = "text-red-400"
    textClass = "text-red-300"
    message = `${count} expired membership${count > 1 ? "s" : ""}`
  } else if (days === 0) {
    // Expiring today (red)
    bgClass = "bg-red-500/8"
    borderClass = "border-red-500/25"
    iconClass = "text-red-400"
    textClass = "text-red-300"
    message = `Last day today: ${names?.join(", ") ?? count + " membership" + (count > 1 ? "s" : "")}`
  } else if (days <= 3) {
    // Expiring in 3 days (yellow)
    bgClass = "bg-yellow-500/8"
    borderClass = "border-yellow-500/20"
    iconClass = "text-yellow-400"
    textClass = "text-yellow-300"
    message = `${count} membership${count > 1 ? "s" : ""} expiring in ${days} day${days !== 1 ? "s" : ""}`
  } else {
    // Expiring in 7 days (light yellow)
    bgClass = "bg-yellow-500/5"
    borderClass = "border-yellow-500/12"
    iconClass = "text-yellow-500/60"
    textClass = "text-yellow-400/60"
    message = `${count} membership${count > 1 ? "s" : ""} expiring within 7 days`
  }

  return (
    <div className={`${bgClass} border ${borderClass} rounded-2xl px-5 py-3.5 flex items-center gap-3`}>
      <AlertTriangle className={`w-4 h-4 ${iconClass} shrink-0`} />
      <p className={`${textClass} text-sm flex-1`}>
        <span className="font-semibold">{message}</span>
      </p>
      <Link
        href="/owner/members?filter=expiring"
        className={`${days < 1 ? "text-red-400 hover:underline" : days <= 3 ? "text-yellow-400 hover:underline" : "text-yellow-500/60 hover:text-yellow-400"} text-xs shrink-0`}
      >
        View →
      </Link>
    </div>
  )
}

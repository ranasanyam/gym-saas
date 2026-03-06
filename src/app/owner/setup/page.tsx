"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

// Redirect /owner/setup → /owner/gyms/new for new owners post-registration
export default function OwnerSetupPage() {
  const router = useRouter()
  useEffect(() => { router.replace("/owner/gyms/new") }, [router])
  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  )
}
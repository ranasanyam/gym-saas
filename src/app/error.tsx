"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[GlobalError]", error)
  }, [error])

  const router = useRouter()

  return (
    <div className="min-h-screen bg-[hsl(220_25%_6%)] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-white/50 text-sm mb-8">
          An unexpected error occurred. Our team has been notified.
          {error.digest && (
            <span className="block mt-1 text-white/30 text-xs font-mono">
              Error ID: {error.digest}
            </span>
          )}
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={reset}
            className="gap-2 bg-gradient-primary hover:opacity-90 text-white"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="gap-2 border-white/10 text-white/70 hover:text-white hover:bg-white/5"
          >
            <Home className="w-4 h-4" />
            Go home
          </Button>
        </div>
      </div>
    </div>
  )
}

import Link from "next/link"
import { Home, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[hsl(220_25%_6%)] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-6">
          <SearchX className="w-8 h-8 text-white/40" />
        </div>

        <p className="text-5xl font-bold text-white/10 mb-4 font-mono">404</p>
        <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-white/50 text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Button
          asChild
          className="gap-2 bg-gradient-primary hover:opacity-90 text-white"
        >
          <Link href="/">
            <Home className="w-4 h-4" />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  )
}

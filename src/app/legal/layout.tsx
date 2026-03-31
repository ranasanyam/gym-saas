// src/app/legal/layout.tsx
import Link from "next/link"
import { Dumbbell, ArrowLeft } from "lucide-react"

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#080c12" }}>
      {/* Nav */}
      <nav className="border-b border-white/5 sticky top-0 z-50 backdrop-blur-md" style={{ background: "rgba(8,12,18,0.85)" }}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg" style={{ fontFamily: "Syne, sans-serif" }}>GymStack</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-sm">© 2025 GymStack. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link href="/legal/privacy" className="hover:text-white/70 transition-colors">Privacy Policy</Link>
            <Link href="/legal/terms" className="hover:text-white/70 transition-colors">Terms of Service</Link>
            <Link href="/legal/cookies" className="hover:text-white/70 transition-colors">Cookie Policy</Link>
            <Link href="/legal/contact" className="hover:text-white/70 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

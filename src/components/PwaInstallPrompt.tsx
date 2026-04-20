// src/components/PwaInstallPrompt.tsx
// Shows a native-style install banner when the browser fires beforeinstallprompt
"use client"

import { useEffect, useState } from "react"
import { Download, X, Smartphone } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}


export function PwaInstallPrompt() {
  const [prompt,    setPrompt]    = useState<BeforeInstallPromptEvent | null>(null)
  const [visible,   setVisible]   = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true)
      return
    }

    // Dismissed within last 7 days — don't show again
    const dismissed = localStorage.getItem("pwa-install-dismissed")
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      // Show the banner after a short delay so it doesn't feel intrusive
      setTimeout(() => setVisible(true), 3000)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const install = async () => {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === "accepted") setInstalled(true)
    setVisible(false)
  }

  const dismiss = () => {
    localStorage.setItem("pwa-install-dismissed", String(Date.now()))
    setVisible(false)
  }

  if (!visible || installed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-9999 sm:left-auto sm:right-4 sm:w-80 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[hsl(220_25%_10%)] border border-white/12 rounded-2xl p-4 shadow-2xl shadow-black/50">


<button onClick={dismiss} className="text-white/20 absolute top-5 right-5 hover:text-white/50 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        <div className="flex items-center gap-5 my-2 min-w-0">
          <img src="../../logo.png" alt="logo" className="w-8 h-8" />

          <p className="text-white font-semibold text-sm">Install GymStack</p>
        </div>

          <p className="text-white/45 text-xs mt-0.5 leading-relaxed">
            Add to your home screen for faster access — works offline too.
          </p>

          <div className="flex items-center justify-between gap-2 mt-3">
            <button
              onClick={install}
              className="flex items-center gap-1.5 bg-linear-to-r from-primary to-orange-400 hover:opacity-90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">
              <Download className="w-3 h-3" /> Install
            </button>
            <button
              onClick={dismiss}
              className="text-white/30 hover:text-white/60 text-xs px-2 py-1.5 rounded-lg transition-all">
              Not now
            </button>
          </div>
      </div>
    </div>
  )
}
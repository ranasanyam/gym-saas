// src/app/owner/dashboard/_components/AnimatedCounter.tsx
// Lightweight client-side number counter used on Pro/Enterprise dashboards.
"use client"

import { useEffect, useRef, useState } from "react"

interface Props {
  value:    number
  duration?: number   // ms, default 900
  prefix?:  string
  suffix?:  string
}

export function AnimatedCounter({ value, duration = 900, prefix = "", suffix = "" }: Props) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const start     = performance.now()
    const from      = display   // animate from current displayed value
    const to        = value

    const step = (now: number) => {
      const elapsed  = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const ease     = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (to - from) * ease))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  return <>{prefix}{display.toLocaleString("en-IN")}{suffix}</>
}

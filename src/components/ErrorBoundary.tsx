// src/components/ErrorBoundary.tsx
// Class-based error boundary that catches render-time errors in its subtree.
// Wrap major page sections with this to prevent the whole page from crashing.

"use client"

import { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children:  ReactNode
  fallback?: ReactNode
  label?:    string
}

interface State {
  hasError: boolean
  error:    Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", this.props.label ?? "unknown section", error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <div>
            <p className="text-white font-semibold text-sm">Something went wrong</p>
            <p className="text-white/50 text-xs mt-1">
              {this.props.label
                ? `Failed to load: ${this.props.label}`
                : "This section failed to load."}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// ── Functional wrapper for convenience ───────────────────────────────────────
export function WithErrorBoundary({
  children,
  fallback,
  label,
}: {
  children: ReactNode
  fallback?: ReactNode
  label?:   string
}) {
  return (
    <ErrorBoundary fallback={fallback} label={label}>
      {children}
    </ErrorBoundary>
  )
}

// src/hooks/useApiError.ts
// Standardizes how API errors are parsed and surfaced.
// - Network errors, 4xx, 5xx each resolve to a structured ErrorState.
// - Use with toast notifications for non-blocking errors.
// - Use the returned `fieldErrors` map for inline form field errors.

"use client"

import { useCallback, useState } from "react"

export interface ApiErrorState {
  message:     string
  code:        string | null
  status:      number | null
  fieldErrors: Record<string, string>
}

const DEFAULT_MESSAGES: Record<number, string> = {
  400: "Invalid request. Please check your input.",
  401: "You must be logged in to do that.",
  403: "You don't have permission to do that.",
  404: "The requested resource was not found.",
  409: "This item already exists.",
  422: "Validation failed. Please check your input.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our end. Please try again later.",
}

// Parses a fetch Response into a structured error state.
export async function parseApiError(res: Response): Promise<ApiErrorState> {
  let body: any = null
  try { body = await res.json() } catch {}

  // Our standard error shape: { success: false, error: { code, message, details } }
  if (body?.error && typeof body.error === "object") {
    const details = body.error.details
    const fieldErrors: Record<string, string> = {}

    // Zod issues array → field-level errors
    if (Array.isArray(details)) {
      for (const issue of details) {
        const field = issue?.path?.[0]
        if (field) fieldErrors[field] = issue.message
      }
    }

    return {
      message:     body.error.message ?? DEFAULT_MESSAGES[res.status] ?? "An error occurred.",
      code:        body.error.code ?? null,
      status:      res.status,
      fieldErrors,
    }
  }

  // Legacy shape: { error: "string" }
  if (typeof body?.error === "string") {
    return { message: body.error, code: null, status: res.status, fieldErrors: {} }
  }

  return {
    message:     DEFAULT_MESSAGES[res.status] ?? "An error occurred.",
    code:        null,
    status:      res.status,
    fieldErrors: {},
  }
}

// Hook for use in components that call APIs directly.
export function useApiError() {
  const [error, setError] = useState<ApiErrorState | null>(null)

  const handleError = useCallback(async (res: Response | Error | unknown): Promise<ApiErrorState> => {
    let state: ApiErrorState

    if (res instanceof Error) {
      // Network / fetch error
      state = { message: "Network error. Check your connection.", code: "NETWORK_ERROR", status: null, fieldErrors: {} }
    } else if (res instanceof Response) {
      state = await parseApiError(res)
    } else {
      state = { message: "An unexpected error occurred.", code: null, status: null, fieldErrors: {} }
    }

    setError(state)
    return state
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { error, handleError, clearError }
}

// src/lib/api-response.ts
// Centralized API response utility — every route uses these helpers.
// Enforces a consistent response contract across the entire API.

import { NextResponse } from "next/server"

// ── Standard response shape ───────────────────────────────────────────────────
export interface ApiSuccess<T = unknown> {
  success: true
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

// ── Error codes ───────────────────────────────────────────────────────────────
export const ERROR_CODES = {
  UNAUTHORIZED:         "UNAUTHORIZED",
  FORBIDDEN:            "FORBIDDEN",
  PLAN_LIMIT_REACHED:   "PLAN_LIMIT_REACHED",
  PLAN_FEATURE_BLOCKED: "PLAN_FEATURE_BLOCKED",
  SUBSCRIPTION_EXPIRED: "SUBSCRIPTION_EXPIRED",
  VALIDATION_ERROR:     "VALIDATION_ERROR",
  NOT_FOUND:            "NOT_FOUND",
  CONFLICT:             "CONFLICT",
  RATE_LIMITED:         "RATE_LIMITED",
  INTERNAL_ERROR:       "INTERNAL_ERROR",
  BAD_REQUEST:          "BAD_REQUEST",
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

// ── Response builders ─────────────────────────────────────────────────────────

export function successResponse<T>(data: T, options?: { status?: number; message?: string }) {
  const body: ApiSuccess<T> = { success: true, data }
  if (options?.message) body.message = options.message
  return NextResponse.json(body, { status: options?.status ?? 200 })
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  options?: { status?: number; details?: unknown }
) {
  const body: ApiError = {
    success: false,
    error: { code, message, ...(options?.details !== undefined ? { details: options.details } : {}) },
  }
  return NextResponse.json(body, { status: options?.status ?? 400 })
}

// ── Shorthand helpers ─────────────────────────────────────────────────────────

export const unauthorized = (msg = "Unauthorized") =>
  errorResponse(ERROR_CODES.UNAUTHORIZED, msg, { status: 401 })

export const forbidden = (msg = "Forbidden") =>
  errorResponse(ERROR_CODES.FORBIDDEN, msg, { status: 403 })

export const notFound = (resource = "Resource") =>
  errorResponse(ERROR_CODES.NOT_FOUND, `${resource} not found`, { status: 404 })

export const conflict = (msg: string) =>
  errorResponse(ERROR_CODES.CONFLICT, msg, { status: 409 })

export const badRequest = (msg: string, details?: unknown) =>
  errorResponse(ERROR_CODES.BAD_REQUEST, msg, { status: 400, details })

export const validationError = (details: unknown) =>
  errorResponse(ERROR_CODES.VALIDATION_ERROR, "Validation failed", { status: 422, details })

export const planLimitReached = (msg: string) =>
  errorResponse(ERROR_CODES.PLAN_LIMIT_REACHED, msg, { status: 403 })

export const planFeatureBlocked = (msg: string) =>
  errorResponse(ERROR_CODES.PLAN_FEATURE_BLOCKED, msg, { status: 403 })

export const subscriptionExpired = (msg = "Your subscription has expired. Please renew to continue.") =>
  errorResponse(ERROR_CODES.SUBSCRIPTION_EXPIRED, msg, { status: 403 })

export const internalError = (err: unknown, routeLabel?: string) => {
  const msg = err instanceof Error ? err.message : String(err)
  if (routeLabel) console.error(`[${routeLabel}]`, msg)
  return errorResponse(ERROR_CODES.INTERNAL_ERROR, "Internal server error", { status: 500 })
}

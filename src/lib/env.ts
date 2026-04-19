// src/lib/env.ts
// Validates all required environment variables at startup using Zod.
// Import this file in any module that needs env vars — it throws at boot
// if something is missing rather than failing silently at runtime.

import { z } from "zod"

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // NextAuth
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL:    z.string().url("NEXTAUTH_URL must be a valid URL"),

  // JWT (mobile auth)
  JWT_SECRET:         z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_REFRESH_SECRET: z.string().min(16).optional(),

  // Razorpay (optional — can be empty in dev/test)
  RAZORPAY_KEY_ID:     z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  // Cloudinary (optional)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY:    z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Google OAuth (optional — only required when Google login is enabled)
  GOOGLE_CLIENT_ID:     z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Node env
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
})

type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const missing = result.error.issues.map(i => `  • ${i.path.join(".")}: ${i.message}`).join("\n")
    throw new Error(`Environment validation failed:\n${missing}`)
  }
  return result.data
}

// Singleton — validated once at module load time.
// In Next.js this happens on first import in any server context.
let _env: Env | null = null

export function getEnv(): Env {
  if (!_env) _env = validateEnv()
  return _env
}

// Named exports for convenience — import { env } from "@/lib/env"
export const env = new Proxy({} as Env, {
  get(_, key: string) {
    return getEnv()[key as keyof Env]
  },
})

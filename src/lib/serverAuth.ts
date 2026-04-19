import { NextRequest } from "next/server"
import { auth } from "@/auth"

export async function resolveWebProfileId(_req?: NextRequest): Promise<string | null> {
  try {
    const session = await auth()
    return session?.user?.id ?? null
  } catch {
    return null
  }
}

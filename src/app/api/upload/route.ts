// src/app/api/upload/route.ts
// Stores images as base64 data URLs directly in the DB.
// For production, swap the storage call to Cloudinary / S3 / Supabase Storage
// and store only the returned URL.
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB per file
const ALLOWED_TYPES  = ["image/jpeg","image/png","image/webp","image/gif"]

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await req.formData()
    const files = formData.getAll("file") as File[]

    if (!files.length) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const urls: string[] = []

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type))
        return NextResponse.json({ error: `Invalid file type: ${file.type}` }, { status: 400 })
      if (file.size > MAX_SIZE_BYTES)
        return NextResponse.json({ error: `File too large (max 2MB): ${file.name}` }, { status: 400 })

      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString("base64")
      urls.push(`data:${file.type};base64,${base64}`)
    }

    // Single file → return { url }; multiple → return { urls }
    return NextResponse.json(
      urls.length === 1 ? { url: urls[0] } : { urls },
      { status: 201 }
    )
  } catch (err: any) {
    console.error("Upload error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
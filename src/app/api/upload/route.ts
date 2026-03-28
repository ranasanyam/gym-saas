// src/app/api/upload/route.ts
// Stores images as base64 data URLs directly in the DB.
// For production, swap the storage call to Cloudinary / S3 / Supabase Storage
// and store only the returned URL.
// import { NextRequest, NextResponse } from "next/server"
// import { auth } from "@/auth"

// const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB per file
// const ALLOWED_TYPES  = ["image/jpeg","image/png","image/webp","image/gif"]

// export async function POST(req: NextRequest) {
//   const session = await auth()
//   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//   try {
//     const formData = await req.formData()
//     const files = formData.getAll("file") as File[]

//     if (!files.length) return NextResponse.json({ error: "No file provided" }, { status: 400 })

//     const urls: string[] = []

//     for (const file of files) {
//       if (!ALLOWED_TYPES.includes(file.type))
//         return NextResponse.json({ error: `Invalid file type: ${file.type}` }, { status: 400 })
//       if (file.size > MAX_SIZE_BYTES)
//         return NextResponse.json({ error: `File too large (max 2MB): ${file.name}` }, { status: 400 })

//       const buffer = await file.arrayBuffer()
//       const base64 = Buffer.from(buffer).toString("base64")
//       urls.push(`data:${file.type};base64,${base64}`)
//     }

//     // Single file → return { url }; multiple → return { urls }
//     return NextResponse.json(
//       urls.length === 1 ? { url: urls[0] } : { urls },
//       { status: 201 }
//     )
//   } catch (err: any) {
//     console.error("Upload error:", err)
//     return NextResponse.json({ error: "Upload failed" }, { status: 500 })
//   }
// }





// src/app/api/upload/route.ts
// Central upload endpoint — replaces the old base64 stub.
// Accepts multipart/form-data with one or more "file" fields.
// Returns { url, publicId } for single or { urls, results } for multiple.
//
// Optional query param:
//   ?folder=avatars|gymImages|gymLogos|supplements|receipts

import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId }          from "@/lib/mobileAuth"
import {
  uploadToCloudinary,
  uploadManyToCloudinary,
  validateImageFile,
  FOLDERS,
  type UploadFolder,
} from "@/lib/cloudinary"

const FOLDER_MAP: Record<string, UploadFolder> = {
  avatars:     FOLDERS.avatars,
  gymImages:   FOLDERS.gymImages,
  gymLogos:    FOLDERS.gymLogos,
  supplements: FOLDERS.supplements,
  receipts:    FOLDERS.receipts,
}

export async function POST(req: NextRequest) {
  const profileId = await resolveProfileId(req)
  if (!profileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const folderKey = searchParams.get("folder") ?? "gymImages"
    const folder    = FOLDER_MAP[folderKey] ?? FOLDERS.gymImages

    const formData = await req.formData()
    const files    = formData.getAll("file") as File[]

    if (!files.length) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    for (const file of files) {
      const err = validateImageFile(file)
      if (err) return NextResponse.json({ error: err }, { status: 400 })
    }

    const buffers = await Promise.all(
      files.map(async f => Buffer.from(await f.arrayBuffer()))
    )

    if (buffers.length === 1) {
      const result = await uploadToCloudinary(buffers[0], folder)
      return NextResponse.json({
        url:      result.url,
        publicId: result.publicId,
        width:    result.width,
        height:   result.height,
        bytes:    result.bytes,
      }, { status: 201 })
    }

    const results = await uploadManyToCloudinary(buffers, folder)
    return NextResponse.json({
      urls:    results.map(r => r.url),
      results: results.map(r => ({
        url:      r.url,
        publicId: r.publicId,
        width:    r.width,
        height:   r.height,
        bytes:    r.bytes,
      })),
    }, { status: 201 })

  } catch (err: any) {
    console.error("[Upload API]", err?.message ?? err)
    return NextResponse.json(
      { error: err?.message ?? "Upload failed" },
      { status: 500 }
    )
  }
}
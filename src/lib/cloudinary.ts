// src/lib/cloudinary.ts
// Server-side Cloudinary helper.
// All image uploads in the application go through this file.
// Never expose CLOUDINARY_API_SECRET to the client.

import { v2 as cloudinary } from "cloudinary"

// ── Configure once (module-level, safe for serverless) ───────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure:     true,
})

// ── Folder map — keeps Cloudinary Media Library organized ────────────────────
export const FOLDERS = {
  avatars:     "gymstack/avatars",
  gymImages:   "gymstack/gyms",
  gymLogos:    "gymstack/logos",
  supplements: "gymstack/supplements",
  receipts:    "gymstack/receipts",
} as const

export type UploadFolder = typeof FOLDERS[keyof typeof FOLDERS]

// ── Transformation presets ────────────────────────────────────────────────────
const TRANSFORMS = {
  avatar: {
    width: 400, height: 400,
    crop: "fill", gravity: "face",
    quality: "auto", fetch_format: "auto",
  },
  gymImage: {
    width: 1280, height: 720,
    crop: "fill",
    quality: "auto:good", fetch_format: "auto",
  },
  gymLogo: {
    width: 400, height: 400,
    crop: "fit",
    quality: "auto", fetch_format: "auto",
    background: "transparent",
  },
  supplement: {
    width: 600, height: 600,
    crop: "fill",
    quality: "auto", fetch_format: "auto",
  },
  receipt: {
    width: 1200,
    crop: "limit",
    quality: "auto:good", fetch_format: "auto",
  },
}

// ── Upload a single file Buffer to Cloudinary ─────────────────────────────────
export interface UploadResult {
  url:       string    // final HTTPS URL stored in DB
  publicId:  string    // used to delete later
  width:     number
  height:    number
  format:    string
  bytes:     number
}

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: UploadFolder,
  options?: {
    publicId?:       string       // override auto-generated ID
    overwrite?:      boolean
    transformation?: object
  }
): Promise<UploadResult> {
  // Pick transformation based on folder
  const transform =
    options?.transformation ??
    folder === FOLDERS.avatars     ? TRANSFORMS.avatar     :
    folder === FOLDERS.gymImages   ? TRANSFORMS.gymImage   :
    folder === FOLDERS.gymLogos    ? TRANSFORMS.gymLogo    :
    folder === FOLDERS.supplements ? TRANSFORMS.supplement :
    folder === FOLDERS.receipts    ? TRANSFORMS.receipt    :
    {}

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id:      options?.publicId,
        overwrite:      options?.overwrite ?? false,
        transformation: transform,
        // Always deliver via secure HTTPS
        secure: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(new Error(error?.message ?? "Cloudinary upload failed"))
          return
        }
        resolve({
          url:      result.secure_url,
          publicId: result.public_id,
          width:    result.width,
          height:   result.height,
          format:   result.format,
          bytes:    result.bytes,
        })
      }
    )
    stream.end(buffer)
  })
}

// ── Upload multiple files ─────────────────────────────────────────────────────
export async function uploadManyToCloudinary(
  buffers: Buffer[],
  folder:  UploadFolder
): Promise<UploadResult[]> {
  return Promise.all(buffers.map(buf => uploadToCloudinary(buf, folder)))
}

// ── Delete an image from Cloudinary by its public_id ─────────────────────────
// Call this when an image is replaced or deleted in the DB
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (err) {
    // Non-fatal — log but don't crash the request
    console.error(`[Cloudinary] Failed to delete ${publicId}:`, err)
  }
}

// ── Delete multiple images ────────────────────────────────────────────────────
export async function deleteManyFromCloudinary(publicIds: string[]): Promise<void> {
  if (!publicIds.length) return
  try {
    await cloudinary.api.delete_resources(publicIds)
  } catch (err) {
    console.error("[Cloudinary] Bulk delete failed:", err)
  }
}

// ── Extract public_id from a Cloudinary URL ───────────────────────────────────
// Useful when you have the URL stored in DB but need the public_id to delete
// Example URL: https://res.cloudinary.com/mycloud/image/upload/v1234/gymstack/avatars/abc123.webp
export function extractPublicId(cloudinaryUrl: string): string | null {
  try {
    // Match everything after /upload/vXXXX/ (version is optional)
    const match = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

// ── Validate file before upload ───────────────────────────────────────────────
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
export const MAX_FILE_SIZE  = 10 * 1024 * 1024  // 10 MB (Cloudinary handles compression)

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `File type not allowed. Use JPEG, PNG, WebP or GIF.`
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large (max 10MB). Got ${(file.size / 1024 / 1024).toFixed(1)}MB.`
  }
  return null
}
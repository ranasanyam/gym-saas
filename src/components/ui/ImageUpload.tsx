// src/components/ui/ImageUpload.tsx
"use client"
import { useRef, useState } from "react"
import { Upload, X, Loader2 } from "lucide-react"

interface Props {
  value: string | null
  onChange: (url: string | null) => void
  shape?: "circle" | "square"
  size?: number       // px
  placeholder?: string
}

export function ImageUpload({ value, onChange, shape = "square", size = 80, placeholder = "Upload Photo" }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const upload = async (file: File) => {
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res  = await fetch("/api/upload", { method: "POST", body: fd })
    const data = await res.json()
    setUploading(false)
    if (res.ok) onChange(data.url)
  }

  const borderRadius = shape === "circle" ? "9999px" : "12px"
  const style = { width: size, height: size, borderRadius, flexShrink: 0 }

  if (value) return (
    <div className="relative inline-flex" style={style}>
      <img src={value} alt="upload" className="w-full h-full object-cover" style={{ borderRadius }} />
      <button type="button" onClick={() => onChange(null)}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-400 transition-colors">
        <X className="w-3 h-3 text-white" />
      </button>
    </div>
  )

  return (
    <>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }} />
      <button type="button" onClick={() => ref.current?.click()}
        disabled={uploading}
        className="flex flex-col items-center justify-center bg-white/5 border-2 border-dashed border-white/15 hover:border-primary/40 transition-colors cursor-pointer"
        style={style}>
        {uploading
          ? <Loader2 className="w-5 h-5 text-primary animate-spin" />
          : <><Upload className="w-5 h-5 text-white/25 mb-1" /><span className="text-white/25 text-[10px]">{placeholder}</span></>}
      </button>
    </>
  )
}
// src/components/ui/MultiImageUpload.tsx
"use client"
import { useRef, useState } from "react"
import { Upload, X, Loader2, Plus } from "lucide-react"

interface Props {
  values: string[]
  onChange: (urls: string[]) => void
  max?: number
}

export function MultiImageUpload({ values, onChange, max = 8 }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const upload = async (files: FileList) => {
    setUploading(true)
    const fd = new FormData()
    Array.from(files).slice(0, max - values.length).forEach(f => fd.append("file", f))
    const res  = await fetch("/api/upload", { method: "POST", body: fd })
    const data = await res.json()
    setUploading(false)
    if (res.ok) {
      const newUrls = data.urls ?? (data.url ? [data.url] : [])
      onChange([...values, ...newUrls].slice(0, max))
    }
  }

  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i))

  return (
    <div className="flex flex-wrap gap-3">
      {values.map((url, i) => (
        <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden group">
          <img src={url} alt="" className="w-full h-full object-cover" />
          <button type="button" onClick={() => remove(i)}
            className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      ))}

      {values.length < max && (
        <>
          <input ref={ref} type="file" accept="image/*" multiple className="hidden"
            onChange={e => { if (e.target.files?.length) upload(e.target.files) }} />
          <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
            className="w-24 h-24 rounded-xl border-2 border-dashed border-white/15 hover:border-primary/40 bg-white/5 flex flex-col items-center justify-center transition-colors">
            {uploading ? <Loader2 className="w-5 h-5 text-primary animate-spin" />
              : <><Plus className="w-5 h-5 text-white/25 mb-1" /><span className="text-white/20 text-[10px]">Add Photo</span></>}
          </button>
        </>
      )}
    </div>
  )
}
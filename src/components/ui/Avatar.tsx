// src/components/ui/Avatar.tsx
"use client"

/**
 * Shared Avatar component — shows image if available, otherwise gradient initials.
 * Works for members, trainers, gym owners.
 */
interface AvatarProps {
  name: string
  url?: string | null
  size?: number   // px — default 32
  rounded?: "full" | "lg"  // default "full"
}

export function Avatar({ name, url, size = 32, rounded = "full" }: AvatarProps) {
  const initials = (name || "?")
    .split(" ")
    .map((n: string) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const borderRadius = rounded === "full" ? "9999px" : "10px"
  const fontSize = Math.max(size * 0.33, 10)

  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  }

  if (url) {
    return (
      <div style={style}>
        <img
          src={url}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        ...style,
        background: "linear-gradient(135deg, #f97316, #ea580c)",
      }}
    >
      <span style={{ color: "white", fontWeight: "bold", fontSize, lineHeight: 1 }}>{initials}</span>
    </div>
  )
}
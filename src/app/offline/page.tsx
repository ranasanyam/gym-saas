'use client';
// src/app/offline/page.tsx
export default function OfflinePage() {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Inter, system-ui, sans-serif", background: "#0d1017", color: "white", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 400 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: "linear-gradient(135deg, #f97316, #fb923c)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", fontSize: 36, fontWeight: 700 }}>
            FH
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>You&apos;re offline</h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "2rem" }}>
            No internet connection detected. Please check your network and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: "linear-gradient(135deg, #f97316, #fb923c)", color: "white", border: "none", borderRadius: 12, padding: "0.75rem 2rem", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
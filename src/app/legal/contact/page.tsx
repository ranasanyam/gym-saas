// src/app/legal/contact/page.tsx
"use client"

import type { Metadata } from "next"
import { useState } from "react"
import { Mail, MessageSquare, Clock, CheckCircle } from "lucide-react"

// Note: metadata can't be exported from a client component.
// Move to a separate metadata file or use a server wrapper if needed.

const TOPICS = [
  "General Inquiry",
  "Technical Support",
  "Billing & Payments",
  "Privacy & Data",
  "Feature Request",
  "Partnership",
  "Other",
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", topic: "", message: "" })
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")
    // Fire-and-forget to your contact endpoint (implement as needed)
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      setStatus("sent")
    } catch {
      setStatus("error")
    }
  }

  return (
    <article className="prose-legal">
      <style>{`
        .prose-legal h1 { font-size:2.25rem; font-weight:800; line-height:1.2; margin-bottom:0.5rem; background:linear-gradient(135deg,#fff 60%,#f97316); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .prose-legal .meta { color:rgba(255,255,255,0.35); font-size:0.875rem; margin-bottom:3rem; }
        .prose-legal p { color:rgba(255,255,255,0.55); line-height:1.75; font-size:0.9375rem; }
        .prose-legal a { color:#f97316; text-decoration:none; }
        .prose-legal a:hover { text-decoration:underline; }
      `}</style>

      <h1 style={{ fontFamily: "Syne, sans-serif" }}>Contact Us</h1>
      <p className="meta">We&apos;re happy to help — pick the fastest route below.</p>

      {/* Contact cards */}
      {/* <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1rem", marginBottom: "3rem" }}>
        {[
          { icon: Mail, label: "Email", value: "support@gymstack.app", href: "mailto:support@gymstack.app", note: "General & billing" },
          { icon: Mail, label: "Privacy", value: "privacy@gymstack.app", href: "mailto:privacy@gymstack.app", note: "Data & privacy requests" },
          { icon: Clock, label: "Response time", value: "Within 24 hours", href: null, note: "Mon – Fri, 9 am – 6 pm IST" },
          { icon: MessageSquare, label: "Live chat", value: "Coming soon", href: null, note: "In-app chat support" },
        ].map(card => (
          <div key={card.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.875rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <card.icon style={{ width: 16, height: 16, color: "#f97316", flexShrink: 0 }} />
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8125rem" }}>{card.label}</span>
            </div>
            {card.href ? (
              <a href={card.href} style={{ display: "block", color: "#fff", fontWeight: 600, fontSize: "0.9375rem", textDecoration: "none", marginBottom: "0.25rem" }}>{card.value}</a>
            ) : (
              <span style={{ display: "block", color: "#fff", fontWeight: 600, fontSize: "0.9375rem", marginBottom: "0.25rem" }}>{card.value}</span>
            )}
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8125rem" }}>{card.note}</span>
          </div>
        ))}
      </div> */}

      {/* Contact form */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1rem", padding: "2rem" }}>
        <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.25rem", fontWeight: 700, color: "#fff", marginBottom: "1.5rem" }}>Send us a message</h2>

        {status === "sent" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem 0", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(249,115,22,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle style={{ width: 28, height: 28, color: "#f97316" }} />
            </div>
            <p style={{ color: "#fff", fontWeight: 600, fontSize: "1.125rem", margin: 0 }}>Message sent!</p>
            <p style={{ color: "rgba(255,255,255,0.45)", margin: 0 }}>We&apos;ll get back to you within 24 hours.</p>
            <button
              onClick={() => { setForm({ name: "", email: "", topic: "", message: "" }); setStatus("idle") }}
              style={{ marginTop: "0.5rem", padding: "0.5rem 1.25rem", borderRadius: "0.5rem", background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316", cursor: "pointer", fontSize: "0.875rem" }}
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.8125rem", marginBottom: "0.4rem" }}>Full name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Rahul Sharma"
                  style={{ width: "100%", padding: "0.625rem 0.875rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "0.9375rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.8125rem", marginBottom: "0.4rem" }}>Email address *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="rahul@example.com"
                  style={{ width: "100%", padding: "0.625rem 0.875rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "0.9375rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.8125rem", marginBottom: "0.4rem" }}>Topic</label>
              <select
                value={form.topic}
                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                style={{ width: "100%", padding: "0.625rem 0.875rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: form.topic ? "#fff" : "rgba(255,255,255,0.3)", fontSize: "0.9375rem", outline: "none" }}
              >
                <option value="" style={{ background: "#0f1117" }}>Select a topic…</option>
                {TOPICS.map(t => <option key={t} value={t} style={{ background: "#0f1117" }}>{t}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.8125rem", marginBottom: "0.4rem" }}>Message *</label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Describe your question or issue in detail…"
                style={{ width: "100%", padding: "0.625rem 0.875rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "0.9375rem", outline: "none", resize: "vertical", boxSizing: "border-box" }}
              />
            </div>

            {status === "error" && (
              <p style={{ color: "#f87171", fontSize: "0.875rem", margin: 0 }}>Something went wrong. Please email us directly at <a href="mailto:support@gymstack.app">support@gymstack.app</a>.</p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              style={{ alignSelf: "flex-start", padding: "0.7rem 1.75rem", borderRadius: "0.625rem", background: "linear-gradient(135deg,#f97316,#ea580c)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.9375rem", cursor: status === "sending" ? "not-allowed" : "pointer", opacity: status === "sending" ? 0.7 : 1 }}
            >
              {status === "sending" ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}
      </div>
    </article>
  )
}

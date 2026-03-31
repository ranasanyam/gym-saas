// src/app/legal/cookies/page.tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "GymStack Cookie Policy — what cookies we use and why.",
}

const COOKIE_TABLE = [
  { name: "next-auth.session-token", type: "Essential", duration: "30 days", purpose: "Keeps you logged in to GymStack (web)" },
  { name: "next-auth.csrf-token", type: "Essential", duration: "Session", purpose: "Protects against cross-site request forgery attacks" },
  { name: "next-auth.callback-url", type: "Essential", duration: "Session", purpose: "Remembers where to redirect after login" },
  { name: "__theme", type: "Functional", duration: "1 year", purpose: "Stores your dark/light theme preference" },
  { name: "_vercel_no_cache", type: "Functional", duration: "Session", purpose: "Prevents stale cache during active development" },
  { name: "_ga / _gid", type: "Analytics", duration: "2 years / 1 day", purpose: "Google Analytics — page views and user behaviour (optional)" },
]

export default function CookiePolicyPage() {
  return (
    <article className="prose-legal">
      <style>{`
        .prose-legal h1 { font-size:2.25rem; font-weight:800; line-height:1.2; margin-bottom:0.5rem; background:linear-gradient(135deg,#fff 60%,#f97316); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .prose-legal .meta { color:rgba(255,255,255,0.35); font-size:0.875rem; margin-bottom:3rem; }
        .prose-legal h2 { font-size:1.25rem; font-weight:700; color:#fff; margin-top:2.5rem; margin-bottom:0.75rem; padding-left:0.75rem; border-left:3px solid #f97316; }
        .prose-legal p, .prose-legal li { color:rgba(255,255,255,0.55); line-height:1.75; font-size:0.9375rem; }
        .prose-legal ul { padding-left:1.25rem; margin:0.5rem 0 1rem; list-style:disc; }
        .prose-legal li { margin-bottom:0.35rem; }
        .prose-legal a { color:#f97316; text-decoration:none; }
        .prose-legal a:hover { text-decoration:underline; }
        .prose-legal .notice { background:rgba(249,115,22,0.08); border:1px solid rgba(249,115,22,0.2); border-radius:0.75rem; padding:1rem 1.25rem; margin-bottom:2rem; color:rgba(255,255,255,0.6); font-size:0.875rem; }
        .cookie-table { width:100%; border-collapse:collapse; margin:1.5rem 0; font-size:0.875rem; }
        .cookie-table th { text-align:left; padding:0.6rem 0.875rem; background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.6); font-weight:600; border-bottom:1px solid rgba(255,255,255,0.08); }
        .cookie-table td { padding:0.6rem 0.875rem; color:rgba(255,255,255,0.45); border-bottom:1px solid rgba(255,255,255,0.05); vertical-align:top; }
        .cookie-table tr:last-child td { border-bottom:none; }
        .badge { display:inline-block; padding:0.15rem 0.5rem; border-radius:9999px; font-size:0.75rem; font-weight:600; }
        .badge-essential { background:rgba(249,115,22,0.15); color:#f97316; }
        .badge-functional { background:rgba(99,102,241,0.15); color:#818cf8; }
        .badge-analytics { background:rgba(34,197,94,0.12); color:#4ade80; }
      `}</style>

      <h1 style={{ fontFamily: "Syne, sans-serif" }}>Cookie Policy</h1>
      <p className="meta">Last updated: March 31, 2025</p>

      <div className="notice">
        This Cookie Policy explains what cookies GymStack uses, why, and how you can control them. Cookies are small text files placed on your device to make our platform work properly and improve your experience.
      </div>

      <h2>1. What Are Cookies?</h2>
      <p>Cookies are small data files stored on your browser when you visit a website. They allow the site to remember your preferences, keep you logged in, and understand how you use the service. Cookies can be &quot;session&quot; cookies (deleted when you close the browser) or &quot;persistent&quot; cookies (retained until they expire or you delete them).</p>

      <h2>2. Cookies We Use</h2>
      <p>The table below lists all cookies set by GymStack:</p>

      <table className="cookie-table">
        <thead>
          <tr>
            <th>Cookie Name</th>
            <th>Type</th>
            <th>Duration</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          {COOKIE_TABLE.map(row => (
            <tr key={row.name}>
              <td><code style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.7)", fontSize: "0.8125rem" }}>{row.name}</code></td>
              <td>
                <span className={`badge badge-${row.type.toLowerCase()}`}>{row.type}</span>
              </td>
              <td style={{ whiteSpace: "nowrap" }}>{row.duration}</td>
              <td>{row.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>3. Types of Cookies Explained</h2>
      <ul>
        <li><strong style={{ color: "#f97316" }}>Essential</strong> — Strictly necessary for the platform to function. These cannot be disabled without breaking core features like authentication.</li>
        <li><strong style={{ color: "#818cf8" }}>Functional</strong> — Enhance your experience by remembering preferences. Disabling them won&apos;t break the platform but may reduce convenience.</li>
        <li><strong style={{ color: "#4ade80" }}>Analytics</strong> — Help us understand how users interact with GymStack so we can improve the product. These are optional and anonymised where possible.</li>
      </ul>

      <h2>4. Third-Party Cookies</h2>
      <p>We may use third-party services that set their own cookies:</p>
      <ul>
        <li><strong style={{ color: "#fff" }}>Google Analytics</strong> — tracks anonymised page views and user journeys. Governed by Google&apos;s Privacy Policy.</li>
        <li><strong style={{ color: "#fff" }}>Razorpay</strong> — may set cookies on payment pages to detect fraud and manage secure checkout sessions.</li>
      </ul>
      <p>We do not control third-party cookies. Please review the respective privacy policies of these providers.</p>

      <h2>5. How to Control Cookies</h2>
      <p>You can control cookies through your browser settings. Most browsers allow you to:</p>
      <ul>
        <li>View cookies currently stored</li>
        <li>Block all or specific cookies</li>
        <li>Delete cookies when you close the browser</li>
      </ul>
      <p>Note that blocking essential cookies will prevent you from logging in and using GymStack. Links to cookie settings for common browsers:</p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">Apple Safari</a></li>
        <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
      </ul>

      <h2>6. Changes to This Policy</h2>
      <p>We may update this Cookie Policy when we add or remove cookies. We&apos;ll notify you of material changes via email or an in-app notice.</p>

      <h2>7. Contact</h2>
      <p>Questions about our cookie use? Email us at <a href="mailto:privacy@gymstack.app">privacy@gymstack.app</a> or visit our <a href="/legal/contact">Contact page</a>.</p>
    </article>
  )
}

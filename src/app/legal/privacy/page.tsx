// src/app/legal/privacy/page.tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "GymStack Privacy Policy — how we collect, use and protect your data.",
}

export default function PrivacyPolicyPage() {
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
      `}</style>

      <h1 style={{ fontFamily: "Syne, sans-serif" }}>Privacy Policy</h1>
      <p className="meta">Last updated: March 31, 2025</p>

      <div className="notice">
        This Privacy Policy explains how GymStack (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, and protects your personal information when you use our gym management platform. By using GymStack, you agree to the practices described here.
      </div>

      <h2>1. Information We Collect</h2>
      <p>We collect information you provide directly when creating an account or using our services:</p>
      <ul>
        <li><strong style={{ color: "#fff" }}>Account data</strong> — full name, email address, password (hashed), mobile number, city, and gender.</li>
        <li><strong style={{ color: "#fff" }}>Gym and business data</strong> — gym name, address, operating hours, membership plans, and financial records.</li>
        <li><strong style={{ color: "#fff" }}>Member data</strong> — attendance logs, membership history, workout plans, diet plans, and body metrics.</li>
        <li><strong style={{ color: "#fff" }}>Payment data</strong> — transaction amounts, dates, and plan details. We do not store raw card numbers; payments are processed by Razorpay.</li>
        <li><strong style={{ color: "#fff" }}>Usage data</strong> — IP address, browser type, pages visited, and feature interactions.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>Provide, operate, and improve the GymStack platform.</li>
        <li>Send transactional emails (welcome, OTP verification, password reset, notifications).</li>
        <li>Process payments through our third-party payment provider (Razorpay).</li>
        <li>Detect and prevent fraud, abuse, and security threats.</li>
        <li>Comply with applicable legal obligations.</li>
        <li>Send platform updates and product announcements (you can opt out at any time).</li>
      </ul>

      <h2>3. Sharing of Information</h2>
      <p>We do not sell your personal data. We may share information with:</p>
      <ul>
        <li><strong style={{ color: "#fff" }}>Service providers</strong> — Razorpay (payments), Resend (email delivery), Vercel (hosting), and Supabase/PostgreSQL (database). Each is bound by a data processing agreement.</li>
        <li><strong style={{ color: "#fff" }}>Legal authorities</strong> — when required by law, court order, or to protect the rights and safety of GymStack and its users.</li>
        <li><strong style={{ color: "#fff" }}>Business transfers</strong> — in the event of a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction.</li>
      </ul>

      <h2>4. Data Retention</h2>
      <p>We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us. Payment records may be retained longer to meet accounting and legal requirements.</p>

      <h2>5. Security</h2>
      <p>We implement industry-standard measures to protect your data, including TLS encryption in transit, bcrypt-hashed passwords, and access controls. No system is 100% secure — please use a strong, unique password and notify us immediately of any suspected unauthorized access.</p>

      <h2>6. Cookies and Tracking</h2>
      <p>We use essential cookies for authentication (session management) and analytics cookies to understand how the platform is used. See our <a href="/legal/cookies">Cookie Policy</a> for full details.</p>

      <h2>7. Your Rights</h2>
      <p>Depending on your jurisdiction you may have rights to:</p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Correct inaccurate data.</li>
        <li>Request deletion of your data.</li>
        <li>Object to or restrict certain processing.</li>
        <li>Port your data to another service.</li>
      </ul>
      <p>To exercise any of these rights, contact us at <a href="mailto:privacy@gymstack.app">privacy@gymstack.app</a>.</p>

      <h2>8. Children&apos;s Privacy</h2>
      <p>GymStack is not directed to children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us data, please contact us and we will delete it promptly.</p>

      <h2>9. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a prominent notice on the platform. Continued use of GymStack after changes constitutes acceptance of the updated policy.</p>

      <h2>10. Contact</h2>
      <p>Questions or concerns about this policy? Reach us at <a href="mailto:privacy@gymstack.app">privacy@gymstack.app</a> or visit our <a href="/legal/contact">Contact page</a>.</p>
    </article>
  )
}

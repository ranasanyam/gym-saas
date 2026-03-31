// src/app/legal/terms/page.tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "GymStack Terms of Service — the rules governing use of our platform.",
}

export default function TermsOfServicePage() {
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

      <h1 style={{ fontFamily: "Syne, sans-serif" }}>Terms of Service</h1>
      <p className="meta">Last updated: March 31, 2025</p>

      <div className="notice">
        Please read these Terms of Service carefully before using GymStack. By accessing or using the platform, you agree to be bound by these terms. If you do not agree, do not use GymStack.
      </div>

      <h2>1. Acceptance of Terms</h2>
      <p>These Terms of Service (&quot;Terms&quot;) form a legally binding agreement between you and GymStack (&quot;GymStack&quot;, &quot;we&quot;, &quot;us&quot;). By registering for an account or using any part of our platform, you confirm that you are at least 18 years old and have the legal authority to enter into this agreement.</p>

      <h2>2. Description of Service</h2>
      <p>GymStack is a Software-as-a-Service (SaaS) gym management platform that enables gym owners to manage members, trainers, attendance, payments, workout plans, diet plans, and analytics. Access is provided on a subscription basis.</p>

      <h2>3. Account Registration</h2>
      <ul>
        <li>You must provide accurate, current, and complete information during registration.</li>
        <li>You are responsible for maintaining the confidentiality of your credentials.</li>
        <li>You must notify us immediately of any unauthorized access to your account.</li>
        <li>One person or legal entity may not maintain more than one free account.</li>
      </ul>

      <h2>4. Subscriptions and Payments</h2>
      <ul>
        <li>GymStack offers tiered subscription plans. Current pricing is displayed on our pricing page.</li>
        <li>Subscriptions are billed in advance on a monthly or annual basis.</li>
        <li>All payments are processed securely through Razorpay. By subscribing, you agree to Razorpay&apos;s terms.</li>
        <li>Subscription fees are non-refundable except as required by applicable law or as explicitly stated in our refund policy.</li>
        <li>We reserve the right to change pricing with 30 days&apos; notice. Continued use after the notice period constitutes acceptance.</li>
      </ul>

      <h2>5. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the platform for any illegal, harmful, or fraudulent purpose.</li>
        <li>Attempt to gain unauthorized access to any part of the platform or its infrastructure.</li>
        <li>Scrape, harvest, or data-mine the platform without written permission.</li>
        <li>Upload malware, viruses, or any malicious code.</li>
        <li>Impersonate any person or entity.</li>
        <li>Violate the privacy of your gym members or use their data outside the intended purpose.</li>
      </ul>

      <h2>6. Your Data</h2>
      <p>You retain ownership of all data you input into GymStack. By using the platform, you grant us a limited license to store, process, and display your data solely to provide the service. We do not claim intellectual property rights over your content. See our <a href="/legal/privacy">Privacy Policy</a> for full details.</p>

      <h2>7. Intellectual Property</h2>
      <p>All software, design, trademarks, logos, and content of the GymStack platform (excluding your data) are the exclusive property of GymStack or its licensors. You may not copy, modify, distribute, or create derivative works without prior written consent.</p>

      <h2>8. Uptime and Availability</h2>
      <p>We aim for 99.5% monthly uptime. Scheduled maintenance windows will be announced in advance. We are not liable for service interruptions caused by third-party providers, force majeure events, or circumstances beyond our reasonable control.</p>

      <h2>9. Limitation of Liability</h2>
      <p>To the maximum extent permitted by applicable law, GymStack shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of or inability to use the platform. Our total aggregate liability shall not exceed the amount paid by you to GymStack in the 12 months preceding the claim.</p>

      <h2>10. Disclaimer of Warranties</h2>
      <p>GymStack is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the platform will be error-free or uninterrupted.</p>

      <h2>11. Termination</h2>
      <p>Either party may terminate the agreement at any time. We may suspend or terminate your account immediately for breach of these Terms. Upon termination, your right to access the platform ceases and we may delete your data after a 30-day grace period unless required to retain it by law.</p>

      <h2>12. Governing Law</h2>
      <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Delhi, India.</p>

      <h2>13. Changes to Terms</h2>
      <p>We may modify these Terms at any time. We will provide at least 14 days&apos; notice for material changes. Continued use after the effective date constitutes acceptance.</p>

      <h2>14. Contact</h2>
      <p>Questions about these Terms? Contact us at <a href="mailto:legal@gymstack.app">legal@gymstack.app</a> or visit our <a href="/legal/contact">Contact page</a>.</p>
    </article>
  )
}

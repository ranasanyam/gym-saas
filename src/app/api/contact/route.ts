// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { name, email, topic, message } = await req.json()

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Name, email and message are required." }, { status: 400 })
    }

    // Send contact email via Resend (same provider used for OTP/welcome emails)
    const { Resend } = await import("resend")
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: "GymStack Contact <noreply@gymstack.app>",
      to: "support@gymstack.app",
      replyTo: email.trim(),
      subject: `[Contact] ${topic || "General Inquiry"} — ${name.trim()}`,
      text: `Name: ${name.trim()}\nEmail: ${email.trim()}\nTopic: ${topic || "—"}\n\n${message.trim()}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 })
  }
}

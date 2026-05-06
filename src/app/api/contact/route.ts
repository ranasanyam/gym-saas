// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server"
import { sendContactFormEmail } from "@/lib/email"
export async function POST(req: NextRequest) {
  try {
    const { name, email, topic, message } = await req.json()

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Name, email and message are required." }, { status: 400 })
    }

    await sendContactFormEmail({
      name: name.trim(),  
      email: email.trim(),
      topic: topic?.trim() || "General Inquiry",
      message: message.trim(),
    })
    

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 })
  }
}

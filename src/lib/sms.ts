// src/lib/sms.ts
// SMS sending utility.  Plug in your provider (Twilio, MSG91, Fast2SMS, etc.)
// by setting the env vars and implementing the send() call in production mode.

export interface SmsOptions {
  to: string        // E.164 format preferred: +919876543210
  message: string
}

export async function sendSms({ to, message }: SmsOptions): Promise<void> {
  const mobile = to.startsWith("+") ? to : `+91${to.replace(/\D/g, "").slice(-10)}`

  if (process.env.NODE_ENV !== "production") {
    console.log(`\n📱 SMS (dev) → ${mobile}\n${message}\n`)
    return
  }

  // ── MSG91 (recommended for India) ──────────────────────────────────────────
  // Install: npm i axios
  // Env: MSG91_AUTH_KEY, MSG91_SENDER_ID, MSG91_TEMPLATE_ID
  //
  // const { default: axios } = await import("axios")
  // await axios.post("https://api.msg91.com/api/v5/flow/", {
  //   flow_id: process.env.MSG91_TEMPLATE_ID,
  //   sender: process.env.MSG91_SENDER_ID,
  //   mobiles: mobile,
  //   VAR1: message,
  // }, {
  //   headers: { authkey: process.env.MSG91_AUTH_KEY!, "Content-Type": "application/json" },
  // })

  // ── Fast2SMS (simpler India option) ────────────────────────────────────────
  // Env: FAST2SMS_API_KEY
  //
  // const { default: axios } = await import("axios")
  // await axios.post("https://www.fast2sms.com/dev/bulkV2", {
  //   message,
  //   language: "english",
  //   route: "q",
  //   numbers: mobile.replace("+91", ""),
  // }, {
  //   headers: { authorization: process.env.FAST2SMS_API_KEY! },
  // })

  // ── Twilio (international) ─────────────────────────────────────────────────
  // Install: npm i twilio
  // Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
  //
  // const twilio = require("twilio")
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  // await client.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to: mobile })

  // Remove this error once a provider is configured:
  console.warn("[SMS] No SMS provider configured. Set up a provider in src/lib/sms.ts")
}

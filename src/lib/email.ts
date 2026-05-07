
// const BREVO_API_KEY  = process.env.BREVO_API_KEY
// const FROM_EMAIL     = process.env.EMAIL_FROM_ADDRESS ?? "ranasanyam8445@gmail.com"
// const FROM_NAME      = process.env.EMAIL_FROM_NAME    ?? "GymStack"
// const APP_NAME       = "GymStack"

// // ── Core send function ────────────────────────────────────────────────────────

// interface EmailPayload {
//   to:      string
//   toName?: string
//   subject: string
//   html:    string
// }

// async function sendEmail(payload: EmailPayload): Promise<boolean> {
//   // Dev fallback — log to console when no API key is configured
//   if (!BREVO_API_KEY) {
//     console.log(`\n📧 [EMAIL - no API key set]`)
//     console.log(`   To:      ${payload.to}`)
//     console.log(`   Subject: ${payload.subject}`)
//     console.log(`   (Add BREVO_API_KEY to .env to send real emails)\n`)
//     return true
//   }

//   try {
//     const res = await fetch("https://api.brevo.com/v3/smtp/email", {
//       method:  "POST",
//       headers: {
//         "api-key":      BREVO_API_KEY,
//         "Content-Type": "application/json",
//         "Accept":       "application/json",
//       },
//       body: JSON.stringify({
//         sender: {
//           name:  FROM_NAME,
//           email: FROM_EMAIL,
//         },
//         to: [
//           {
//             email: payload.to,
//             name:  payload.toName ?? payload.to.split("@")[0],
//           },
//         ],
//         subject:     payload.subject,
//         htmlContent: payload.html,
//       }),
//     })

//     if (!res.ok) {
//       const err = await res.text()
//       console.error(`[Email] Brevo error ${res.status}:`, err)
//       return false
//     }

//     return true
//   } catch (err) {
//     console.error("[Email] Send failed:", err)
//     return false
//   }
// }

// // ── Shared base template ──────────────────────────────────────────────────────

// function baseTemplate(content: string): string {
//   return `<!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8" />
//   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//   <title>${APP_NAME}</title>
// </head>
// <body style="margin:0;padding:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
//   <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 16px;">
//     <tr><td align="center">
//       <table width="100%" style="max-width:560px;background:#131920;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">

//         <!-- Header -->
//         <tr>
//           <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 40px;text-align:center;">
//             <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
//               💪 ${APP_NAME}
//             </span>
//           </td>
//         </tr>

//         <!-- Body -->
//         <tr>
//           <td style="padding:36px 40px;">
//             ${content}
//           </td>
//         </tr>

//         <!-- Footer -->
//         <tr>
//           <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
//             <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);line-height:1.6;">
//               © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br/>
//               You received this because you have an account on ${APP_NAME}.
//             </p>
//           </td>
//         </tr>

//       </table>
//     </td></tr>
//   </table>
// </body>
// </html>`
// }

// // ── Shared button style ───────────────────────────────────────────────────────

// function ctaButton(label: string, href: string): string {
//   return `
//     <div style="text-align:center;margin:32px 0;">
//       <a href="${href}"
//         style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);
//                color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;
//                padding:14px 36px;border-radius:12px;
//                box-shadow:0 4px 20px rgba(249,115,22,0.35);">
//         ${label}
//       </a>
//     </div>`
// }

// // ── 1. Password reset ─────────────────────────────────────────────────────────

// export async function sendPasswordResetEmail({
//   to, fullName, resetLink,
// }: {
//   to: string; fullName: string; resetLink: string
// }): Promise<boolean> {
//   const html = baseTemplate(`
//     <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">
//       Reset your password
//     </h2>
//     <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
//       Hi ${fullName}, we received a request to reset your ${APP_NAME} password.
//       Click the button below — this link expires in
//       <strong style="color:#f97316;">1 hour</strong>.
//     </p>
//     ${ctaButton("Reset Password", resetLink)}
//     <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.35);line-height:1.6;">
//       If you didn't request this, contact us to keep your account safe.<br/>
//     </p>
//   `)

//   return sendEmail({
//     to,
//     toName:  fullName,
//     subject: `Reset your ${APP_NAME} password`,
//     html,
//   })
// }

// // ── 2. Member onboarding (owner adds a member) ────────────────────────────────

// export async function sendMemberWelcomeEmail({
//   to, memberName, gymName, ownerName, setupLink,
// }: {
//   to: string; memberName: string; gymName: string
//   ownerName: string; setupLink: string
// }): Promise<boolean> {
//   const html = baseTemplate(`
//     <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">
//       Welcome to ${gymName}! 💪
//     </h2>
//     <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
//       Hi ${memberName},
//       <strong style="color:#ffffff;">${ownerName}</strong> has added you as a member of
//       <strong style="color:#f97316;">${gymName}</strong> on ${APP_NAME}.
//     </p>
//     <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
//       Set up your password to access your workout plans, diet plans,
//       attendance history and payment records.
//     </p>
//     ${ctaButton("Set Up Your Account", setupLink)}
//     <div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.2);
//                 border-radius:12px;padding:20px;margin-top:8px;">
//       <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#f97316;">
//         📱 Download the App
//       </p>
//       <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6;">
//         Get the ${APP_NAME} mobile app to check in, follow your workouts
//         and track progress on the go. Available on Android and iOS.
//       </p>
//     </div>
//     <p style="margin:20px 0 0;font-size:13px;color:rgba(255,255,255,0.35);">
//       This link expires in 24 hours.
//     </p>
//   `)

//   return sendEmail({
//     to,
//     toName:  memberName,
//     subject: `You've been added to ${gymName} on ${APP_NAME}`,
//     html,
//   })
// }

// // ── 3. Welcome email after self-registration ──────────────────────────────────

// export async function sendWelcomeEmail({
//   to, fullName,
// }: {
//   to: string; fullName: string
// }): Promise<boolean> {
//   const loginUrl = `${process.env.NEXTAUTH_URL ?? "https://gymstack.app"}/login`

//   const html = baseTemplate(`
//     <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">
//       Welcome to ${APP_NAME}! 🎉
//     </h2>
//     <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
//       Hi ${fullName}, your account has been created successfully.
//       You can now sign in and start your fitness journey.
//     </p>
//     <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
//                 border-radius:12px;padding:20px;margin-bottom:24px;">
//       <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#ffffff;">
//         What you can do on ${APP_NAME}:
//       </p>
//       <table cellpadding="0" cellspacing="0" style="font-size:13px;color:rgba(255,255,255,0.5);line-height:2;">
//         <tr><td style="padding-right:8px;">💪</td><td>Follow personalised workout plans</td></tr>
//         <tr><td>🥗</td><td>Track your daily diet and nutrition</td></tr>
//         <tr><td>📅</td><td>Monitor attendance and streaks</td></tr>
//         <tr><td>💳</td><td>View payments and membership status</td></tr>
//         <tr><td>🎁</td><td>Earn rewards by referring friends</td></tr>
//       </table>
//     </div>
//     ${ctaButton("Go to Dashboard", loginUrl)}
//   `)

//   return sendEmail({
//     to,
//     toName:  fullName,
//     subject: `Welcome to ${APP_NAME} — You're all set!`,
//     html,
//   })
// }

// // ── 4. Membership expiry reminder ─────────────────────────────────────────────

// export async function sendExpiryReminderEmail({
//   to, memberName, gymName, daysLeft, renewLink,
// }: {
//   to: string; memberName: string; gymName: string
//   daysLeft: number; renewLink: string
// }): Promise<boolean> {
//   const urgent  = daysLeft <= 3
//   const subject = daysLeft === 0
//     ? `⚠️ Your ${gymName} membership has expired`
//     : `Your ${gymName} membership expires in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`

//   const html = baseTemplate(`
//     <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">
//       ${daysLeft === 0 ? "⚠️ Membership Expired" : `⏰ ${daysLeft} Day${daysLeft > 1 ? "s" : ""} Left`}
//     </h2>
//     <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
//       Hi ${memberName}, your membership at
//       <strong style="color:#f97316;">${gymName}</strong>
//       ${daysLeft === 0
//         ? "has expired. Renew now to continue checking in."
//         : `expires in <strong style="color:${urgent ? "#ef4444" : "#f59e0b"};">${daysLeft} day${daysLeft > 1 ? "s" : ""}</strong>. Renew early to avoid any interruption.`}
//     </p>
//     ${ctaButton("Renew Membership", renewLink)}
//   `)

//   return sendEmail({ to, toName: memberName, subject, html })
// }

// // ── 5. OTP verification email ─────────────────────────────────────────────────

// export async function sendOtpEmail({
//   to, fullName, otp,
// }: {
//   to: string; fullName: string; otp: string
// }): Promise<boolean> {
//   const html = baseTemplate(`
//     <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">
//       Verify your email
//     </h2>
//     <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
//       Hi ${fullName}, use this code to verify your email address.
//       It expires in <strong style="color:#f97316;">10 minutes</strong>.
//     </p>
//     <div style="text-align:center;margin:32px 0;">
//       <div style="display:inline-block;background:rgba(249,115,22,0.1);
//                   border:2px dashed rgba(249,115,22,0.4);border-radius:16px;
//                   padding:24px 48px;">
//         <span style="font-size:42px;font-weight:900;color:#f97316;
//                      letter-spacing:12px;font-family:monospace;">
//           ${otp}
//         </span>
//       </div>
//     </div>
//     <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.35);text-align:center;line-height:1.8;">
//       This code is valid for 10 minutes and can only be used once.<br/>
//       If you didn't request this, ignore this email.
//     </p>
//   `)

//   return sendEmail({
//     to,
//     toName:  fullName,
//     subject: `${otp} is your ${APP_NAME} verification code`,
//     html,
//   })
// }



// import nodemailer from "nodemailer"

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// })

// export async function sendPasswordResetEmail(opts: {
//   to: string; fullName: string; resetLink: string
// }) {
//   await transporter.sendMail({
//     from: process.env.EMAIL_FROM,
//     to: opts.to,
//     subject: "Reset your GymStack password",
//     html: `
//       <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
//         <h2 style="color:#f97316">Reset your password</h2>
//         <p>Hi ${opts.fullName},</p>
//         <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
//         <a href="${opts.resetLink}" style="display:inline-block;margin:20px 0;background:#f97316;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
//         <p style="color:#9ca3af;font-size:13px">If you didn't request this, ignore this email.</p>
//       </div>
//     `,
//   })
// }

// export async function sendMemberWelcomeEmail(opts: {
//   to: string; fullName: string; gymName: string; ownerName: string; setupLink: string
// }) {
//   await transporter.sendMail({
//     from: process.env.EMAIL_FROM,
//     to: opts.to,
//     subject: `You've been added to ${opts.gymName} on GymStack`,
//     html: `
//       <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
//         <h2 style="color:#f97316">Welcome to ${opts.gymName} 🎉</h2>
//         <p>Hi ${opts.fullName},</p>
//         <p><strong>${opts.ownerName}</strong> has added you as a member. Set your password to access your dashboard.</p>
//         <a href="${opts.setupLink}" style="display:inline-block;margin:20px 0;background:#f97316;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Set My Password</a>
//         <p style="color:#9ca3af;font-size:13px">This link expires in 24 hours. If you didn't expect this, ignore it.</p>
//       </div>
//     `,
//   })
// }

// src/lib/email.ts
// Centralised email sending via Resend.
// Install: npm install resend
//
// Required env vars:
//   RESEND_API_KEY=re_xxxxxxxxxxxx        ← from resend.com
//   EMAIL_FROM=noreply@yourdomain.com     ← must be a verified domain in Resend
//   NEXTAUTH_URL=https://yourdomain.com   ← used to build reset links

// const RESEND_API_KEY = process.env.RESEND_API_KEY
// const FROM_ADDRESS   = process.env.EMAIL_FROM ?? "GymStack <noreply@gymstack.app>"
// const APP_NAME       = "GymStack"

// interface EmailPayload {
//   to:      string
//   subject: string
//   html:    string
// }

// async function sendEmail(payload: EmailPayload): Promise<boolean> {
//   if (!RESEND_API_KEY) {
//     // Dev fallback — log to console instead of crashing
//     console.log(`\n📧 [DEV EMAIL] To: ${payload.to}`)
//     console.log(`   Subject: ${payload.subject}`)
//     console.log(`   (Set RESEND_API_KEY to send real emails)\n`)
//     return true
//   }

//   try {
//     const res = await fetch("https://api.resend.com/emails", {
//       method:  "POST",
//       headers: {
//         "Authorization": `Bearer ${RESEND_API_KEY}`,
//         "Content-Type":  "application/json",
//       },
//       body: JSON.stringify({
//         from:    FROM_ADDRESS,
//         to:      payload.to,
//         subject: payload.subject,
//         html:    payload.html,
//       }),
//     })

//     if (!res.ok) {
//       const err = await res.text()
//       console.error("[Email] Resend error:", err)
//       return false
//     }
//     return true
//   } catch (err) {
//     console.error("[Email] Send failed:", err)
//     return false
//   }
// }

// // ── Email templates ───────────────────────────────────────────────────────────

// function baseTemplate(content: string): string {
//   return `<!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8" />
//   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//   <title>${APP_NAME}</title>
// </head>
// <body style="margin:0;padding:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
//   <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 20px;">
//     <tr><td align="center">
//       <table width="100%" style="max-width:560px;background:#131920;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
//         <!-- Header -->
//         <tr><td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 40px;text-align:center;">
//           <div style="display:inline-flex;align-items:center;gap:10px;">
//             <span style="font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">💪 ${APP_NAME}</span>
//           </div>
//         </td></tr>
//         <!-- Body -->
//         <tr><td style="padding:40px;">
//           ${content}
//         </td></tr>
//         <!-- Footer -->
//         <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
//           <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);">
//             © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br/>
//             This email was sent to you because you have an account on ${APP_NAME}.
//           </p>
//         </td></tr>
//       </table>
//     </td></tr>
//   </table>
// </body>
// </html>`
// }

// // ── 1. Password reset email ───────────────────────────────────────────────────

// export async function sendPasswordResetEmail({
//   to, fullName, resetLink,
// }: {
//   to: string; fullName: string; resetLink: string
// }): Promise<boolean> {
//   const html = baseTemplate(`
//     <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">Reset your password</h2>
//     <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
//       Hi ${fullName}, we received a request to reset your ${APP_NAME} password.
//       Click the button below — this link expires in <strong style="color:#f97316;">1 hour</strong>.
//     </p>
//     <div style="text-align:center;margin:32px 0;">
//       <a href="${resetLink}"
//         style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:12px;box-shadow:0 4px 20px rgba(249,115,22,0.35);">
//         Reset Password
//       </a>
//     </div>
//     <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.35);line-height:1.6;">
//       If you didn't request a password reset, ignore this email — your account is safe.<br/>
//       Or copy this link: <span style="color:#f97316;word-break:break-all;">${resetLink}</span>
//     </p>
//   `)

//   return sendEmail({
//     to,
//     subject: `Reset your ${APP_NAME} password`,
//     html,
//   })
// }

// // ── 2. Member onboarding email (when owner adds a member) ─────────────────────

// export async function sendMemberWelcomeEmail({
//   to, memberName, gymName, ownerName, setupLink,
// }: {
//   to: string; memberName: string; gymName: string; ownerName: string; setupLink: string
// }): Promise<boolean> {
//   const html = baseTemplate(`
//     <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">Welcome to ${gymName}! 💪</h2>
//     <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
//       Hi ${memberName}, <strong style="color:#ffffff;">${ownerName}</strong> has added you as a member of
//       <strong style="color:#f97316;">${gymName}</strong> on ${APP_NAME}.<br/><br/>
//       Set up your password to access your dashboard — view your workout plans, diet plans,
//       attendance history, and payment records.
//     </p>
//     <div style="text-align:center;margin:32px 0;">
//       <a href="${setupLink}"
//         style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:12px;box-shadow:0 4px 20px rgba(249,115,22,0.35);">
//         Set Up Your Account
//       </a>
//     </div>
//     <div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.2);border-radius:12px;padding:20px;margin-top:24px;">
//       <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#f97316;">📱 Download the App</p>
//       <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6;">
//         Get the ${APP_NAME} mobile app to check in, view workouts, and track your progress on the go.
//         Available on Android and iOS.
//       </p>
//     </div>
//     <p style="margin:24px 0 0;font-size:13px;color:rgba(255,255,255,0.35);">
//       This link expires in 24 hours. If you have any questions, contact your gym directly.
//     </p>
//   `)

//   return sendEmail({
//     to,
//     subject: `You've been added to ${gymName} on ${APP_NAME}`,
//     html,
//   })
// }

// // ── 3. Welcome email after self-registration ──────────────────────────────────

// export async function sendWelcomeEmail({
//   to, fullName,
// }: {
//   to: string; fullName: string
// }): Promise<boolean> {
//   const html = baseTemplate(`
//     <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">Welcome to ${APP_NAME}! 🎉</h2>
//     <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
//       Hi ${fullName}, your account has been created successfully.<br/><br/>
//       You can now log in and start using ${APP_NAME} to manage your gym or fitness journey.
//     </p>
//     <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px;">
//       <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#ffffff;">What you can do:</p>
//       <ul style="margin:0;padding-left:20px;font-size:13px;color:rgba(255,255,255,0.5);line-height:2;">
//         <li>Manage gym members, trainers & plans</li>
//         <li>Create workout & diet plans</li>
//         <li>Track attendance & payments</li>
//         <li>Send push notifications to all members</li>
//       </ul>
//     </div>
//     <div style="text-align:center;">
//       <a href="${process.env.NEXTAUTH_URL ?? ""}/login"
//         style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:12px;box-shadow:0 4px 20px rgba(249,115,22,0.35);">
//         Go to Dashboard
//       </a>
//     </div>
//   `)

//   return sendEmail({
//     to,
//     subject: `Welcome to ${APP_NAME} — You're all set!`,
//     html,
//   })
// }
// src/lib/email.ts
// Centralised email sending via Brevo (formerly Sendinblue).
// Free tier: 300 emails/day, sends to ANY email address.
// No domain verification required to get started.
//
// Setup:
//   1. Sign up at brevo.com (free)
//   2. Go to: Account menu → SMTP & API → API Keys → Generate key
//   3. Add to .env:
//        BREVO_API_KEY="xkeysib-xxxxxxxxxxxxxxxxxxxx"
//        EMAIL_FROM="GymStack <noreply@yourdomain.com>"
//        EMAIL_FROM_NAME="GymStack"         (optional)

// const BREVO_API_KEY  = process.env.BREVO_API_KEY
// const FROM_EMAIL     = process.env.EMAIL_FROM_ADDRESS ?? "noreply@gymstack.app"
// const FROM_NAME      = process.env.EMAIL_FROM_NAME    ?? "GymStack"
// const APP_NAME       = "GymStack"

// // ── Core send function ────────────────────────────────────────────────────────

// interface EmailPayload {
//   to:      string
//   toName?: string
//   subject: string
//   html:    string
// }

// async function sendEmail(payload: EmailPayload): Promise<boolean> {
//   // Dev fallback — log to console when no API key is configured
//   if (!BREVO_API_KEY) {
//     console.log(`\n📧 [EMAIL - no API key set]`)
//     console.log(`   To:      ${payload.to}`)
//     console.log(`   Subject: ${payload.subject}`)
//     console.log(`   (Add BREVO_API_KEY to .env to send real emails)\n`)
//     return true
//   }

//   try {
//     const res = await fetch("https://api.brevo.com/v3/smtp/email", {
//       method:  "POST",
//       headers: {
//         "api-key":      BREVO_API_KEY,
//         "Content-Type": "application/json",
//         "Accept":       "application/json",
//       },
//       body: JSON.stringify({
//         sender: {
//           name:  FROM_NAME,
//           email: FROM_EMAIL,
//         },
//         to: [
//           {
//             email: payload.to,
//             name:  payload.toName ?? payload.to.split("@")[0],
//           },
//         ],
//         subject:     payload.subject,
//         htmlContent: payload.html,
//       }),
//     })

//     if (!res.ok) {
//       const err = await res.text()
//       console.error(`[Email] Brevo error ${res.status}:`, err)
//       return false
//     }

//     return true
//   } catch (err) {
//     console.error("[Email] Send failed:", err)
//     return false
//   }
// }

// // ── Shared base template ──────────────────────────────────────────────────────

// function baseTemplate(content: string): string {
//   return `<!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8" />
//   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//   <title>${APP_NAME}</title>
// </head>
// <body style="margin:0;padding:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
//   <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 16px;">
//     <tr><td align="center">
//       <table width="100%" style="max-width:560px;background:#131920;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">

//         <!-- Header -->
//         <tr>
//           <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 40px;text-align:center;">
//             <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
//               💪 ${APP_NAME}
//             </span>
//           </td>
//         </tr>

//         <!-- Body -->
//         <tr>
//           <td style="padding:36px 40px;">
//             ${content}
//           </td>
//         </tr>

//         <!-- Footer -->
//         <tr>
//           <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
//             <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);line-height:1.6;">
//               © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br/>
//               You received this because you have an account on ${APP_NAME}.
//             </p>
//           </td>
//         </tr>

//       </table>
//     </td></tr>
//   </table>
// </body>
// </html>`
// }

// // ── Shared button style ───────────────────────────────────────────────────────

// function ctaButton(label: string, href: string): string {
//   return `
//     <div style="text-align:center;margin:32px 0;">
//       <a href="${href}"
//         style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);
//                color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;
//                padding:14px 36px;border-radius:12px;
//                box-shadow:0 4px 20px rgba(249,115,22,0.35);">
//         ${label}
//       </a>
//     </div>`
// }

// // ── 1. Password reset ─────────────────────────────────────────────────────────

// export async function sendPasswordResetEmail({
//   to, fullName, resetLink,
// }: {
//   to: string; fullName: string; resetLink: string
// }): Promise<boolean> {
//   const html = baseTemplate(`
//     <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">
//       Reset your password
//     </h2>
//     <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
//       Hi ${fullName}, we received a request to reset your ${APP_NAME} password.
//       Click the button below — this link expires in
//       <strong style="color:#f97316;">1 hour</strong>.
//     </p>
//     ${ctaButton("Reset Password", resetLink)}
//     <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.35);line-height:1.6;">
//       If you didn't request this, you can safely ignore this email.<br/>
//       Or copy this link:<br/>
//       <span style="color:#f97316;word-break:break-all;font-size:12px;">${resetLink}</span>
//     </p>
//   `)

//   return sendEmail({
//     to,
//     toName:  fullName,
//     subject: `Reset your ${APP_NAME} password`,
//     html,
//   })
// }

// // ── 2. Member onboarding (owner adds a member) ────────────────────────────────

// export async function sendMemberWelcomeEmail({
//   to, memberName, gymName, ownerName, setupLink,
// }: {
//   to: string; memberName: string; gymName: string
//   ownerName: string; setupLink: string
// }): Promise<boolean> {
//   const html = baseTemplate(`
//     <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">
//       Welcome to ${gymName}! 💪
//     </h2>
//     <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
//       Hi ${memberName},
//       <strong style="color:#ffffff;">${ownerName}</strong> has added you as a member of
//       <strong style="color:#f97316;">${gymName}</strong> on ${APP_NAME}.
//     </p>
//     <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
//       Set up your password to access your workout plans, diet plans,
//       attendance history and payment records.
//     </p>
//     ${ctaButton("Set Up Your Account", setupLink)}
//     <div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.2);
//                 border-radius:12px;padding:20px;margin-top:8px;">
//       <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#f97316;">
//         📱 Download the App
//       </p>
//       <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6;">
//         Get the ${APP_NAME} mobile app to check in, follow your workouts
//         and track progress on the go. Available on Android and iOS.
//       </p>
//     </div>
//     <p style="margin:20px 0 0;font-size:13px;color:rgba(255,255,255,0.35);">
//       This link expires in 24 hours.
//     </p>
//   `)

//   return sendEmail({
//     to,
//     toName:  memberName,
//     subject: `You've been added to ${gymName} on ${APP_NAME}`,
//     html,
//   })
// }

// // ── 3. Welcome email after self-registration ──────────────────────────────────

// export async function sendWelcomeEmail({
//   to, fullName,
// }: {
//   to: string; fullName: string
// }): Promise<boolean> {
//   const loginUrl = `${process.env.NEXTAUTH_URL ?? "https://gymstack.app"}/login`

//   const html = baseTemplate(`
//     <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">
//       Welcome to ${APP_NAME}! 🎉
//     </h2>
//     <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
//       Hi ${fullName}, your account has been created successfully.
//       You can now sign in and start your fitness journey.
//     </p>
//     <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
//                 border-radius:12px;padding:20px;margin-bottom:24px;">
//       <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#ffffff;">
//         What you can do on ${APP_NAME}:
//       </p>
//       <table cellpadding="0" cellspacing="0" style="font-size:13px;color:rgba(255,255,255,0.5);line-height:2;">
//         <tr><td style="padding-right:8px;">💪</td><td>Follow personalised workout plans</td></tr>
//         <tr><td>🥗</td><td>Track your daily diet and nutrition</td></tr>
//         <tr><td>📅</td><td>Monitor attendance and streaks</td></tr>
//         <tr><td>💳</td><td>View payments and membership status</td></tr>
//         <tr><td>🎁</td><td>Earn rewards by referring friends</td></tr>
//       </table>
//     </div>
//     ${ctaButton("Go to Dashboard", loginUrl)}
//   `)

//   return sendEmail({
//     to,
//     toName:  fullName,
//     subject: `Welcome to ${APP_NAME} — You're all set!`,
//     html,
//   })
// }

// // ── 4. Membership expiry reminder ─────────────────────────────────────────────

// export async function sendExpiryReminderEmail({
//   to, memberName, gymName, daysLeft, renewLink,
// }: {
//   to: string; memberName: string; gymName: string
//   daysLeft: number; renewLink: string
// }): Promise<boolean> {
//   const urgent  = daysLeft <= 3
//   const subject = daysLeft === 0
//     ? `⚠️ Your ${gymName} membership has expired`
//     : `Your ${gymName} membership expires in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`

//   const html = baseTemplate(`
//     <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">
//       ${daysLeft === 0 ? "⚠️ Membership Expired" : `⏰ ${daysLeft} Day${daysLeft > 1 ? "s" : ""} Left`}
//     </h2>
//     <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
//       Hi ${memberName}, your membership at
//       <strong style="color:#f97316;">${gymName}</strong>
//       ${daysLeft === 0
//         ? "has expired. Renew now to continue checking in."
//         : `expires in <strong style="color:${urgent ? "#ef4444" : "#f59e0b"};">${daysLeft} day${daysLeft > 1 ? "s" : ""}</strong>. Renew early to avoid any interruption.`}
//     </p>
//     ${ctaButton("Renew Membership", renewLink)}
//   `)

//   return sendEmail({ to, toName: memberName, subject, html })
// }
// src/lib/email.ts
// Centralised email sending via Brevo (formerly Sendinblue).
// Free tier: 300 emails/day, sends to ANY email address.
// No domain verification required to get started.
//
// Setup:
//   1. Sign up at brevo.com (free)
//   2. Go to: Account menu → SMTP & API → API Keys → Generate key
//   3. Add to .env:
//        BREVO_API_KEY="xkeysib-xxxxxxxxxxxxxxxxxxxx"
//        EMAIL_FROM="GymStack <noreply@yourdomain.com>"
//        EMAIL_FROM_NAME="GymStack"         (optional)

const BREVO_API_KEY  = process.env.BREVO_API_KEY
const FROM_EMAIL     = process.env.EMAIL_FROM_ADDRESS ?? "welcome@gymstack.co.in"
const FROM_NAME      = process.env.EMAIL_FROM_NAME    ?? "GymStack"
const APP_NAME       = "GymStack"

// ── Sender aliases (set each in .env once domain is verified in Brevo) ────────
const WELCOME_FROM_EMAIL = process.env.WELCOME_FROM_EMAIL ?? FROM_EMAIL
const WELCOME_FROM_NAME  = process.env.WELCOME_FROM_NAME  ?? "GymStack Welcome"
const CONTACT_TO_EMAIL   = process.env.CONTACT_TO_EMAIL   ?? "contact@gymstack.co.in"
const CONTACT_FROM_EMAIL = process.env.CONTACT_FROM_EMAIL ?? FROM_EMAIL
const ADMIN_TO_EMAIL     = process.env.ADMIN_TO_EMAIL     ?? "info@gymstack.co.in"
const ADMIN_FROM_EMAIL   = process.env.ADMIN_FROM_EMAIL   ?? FROM_EMAIL

// ── Core send function ────────────────────────────────────────────────────────

interface EmailPayload {
  to:       string
  toName?:  string
  subject:  string
  html:     string
  from?:    { name: string; email: string }
  replyTo?: { email: string; name?: string }
}

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  // Dev fallback — log to console when no API key is configured
  if (!BREVO_API_KEY) {
    console.log(`\n📧 [EMAIL - no API key set]`)
    console.log(`   To:      ${payload.to}`)
    console.log(`   Subject: ${payload.subject}`)
    console.log(`   (Add BREVO_API_KEY to .env to send real emails)\n`)
    return true
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method:  "POST",
      headers: {
        "api-key":      BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept":       "application/json",
      },
      body: JSON.stringify({
        sender: payload.from ?? { name: FROM_NAME, email: FROM_EMAIL },
        to: [
          {
            email: payload.to,
            name:  payload.toName ?? payload.to.split("@")[0],
          },
        ],
        ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
        subject:     payload.subject,
        htmlContent: payload.html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`[Email] Brevo error ${res.status}:`, err)
      return false
    }

    return true
  } catch (err) {
    console.error("[Email] Send failed:", err)
    return false
  }
}

// ── Shared base template ──────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#131920;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 40px;text-align:center;">
            <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
              💪 ${APP_NAME}
            </span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);line-height:1.6;">
              © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br/>
              You received this because you have an account on ${APP_NAME}.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Shared button style ───────────────────────────────────────────────────────

function ctaButton(label: string, href: string): string {
  return `
    <div style="text-align:center;margin:32px 0;">
      <a href="${href}"
        style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);
               color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;
               padding:14px 36px;border-radius:12px;
               box-shadow:0 4px 20px rgba(249,115,22,0.35);">
        ${label}
      </a>
    </div>`
}

// ── 1. Password reset ─────────────────────────────────────────────────────────

export async function sendPasswordResetEmail({
  to, fullName, resetLink,
}: {
  to: string; fullName: string; resetLink: string
}): Promise<boolean> {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">
      Reset your password
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
      Hi ${fullName}, we received a request to reset your ${APP_NAME} password.
      Click the button below — this link expires in
      <strong style="color:#f97316;">1 hour</strong>.
    </p>
    ${ctaButton("Reset Password", resetLink)}
    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.35);line-height:1.6;">
      If you didn't request this, you can safely ignore this email.<br/>
      Or copy this link:<br/>
      <span style="color:#f97316;word-break:break-all;font-size:12px;">${resetLink}</span>
    </p>
  `)

  return sendEmail({
    to,
    toName:  fullName,
    subject: `Reset your ${APP_NAME} password`,
    html,
  })
}

// ── 2. Member onboarding (owner adds a member) ────────────────────────────────

export async function sendMemberWelcomeEmail({
  to, memberName, gymName, ownerName, setupLink,
}: {
  to: string; memberName: string; gymName: string
  ownerName: string; setupLink: string
}): Promise<boolean> {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">
      Welcome to ${gymName}! 💪
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
      Hi ${memberName},
      <strong style="color:#ffffff;">${ownerName}</strong> has added you as a member of
      <strong style="color:#f97316;">${gymName}</strong> on ${APP_NAME}.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
      Set up your password to access your workout plans, diet plans,
      attendance history and payment records.
    </p>
    ${ctaButton("Set Up Your Account", setupLink)}
    <div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.2);
                border-radius:12px;padding:20px;margin-top:8px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#f97316;">
        📱 Download the App
      </p>
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6;">
        Get the ${APP_NAME} mobile app to check in, follow your workouts
        and track progress on the go. Available on Android and iOS.
      </p>
    </div>
    <p style="margin:20px 0 0;font-size:13px;color:rgba(255,255,255,0.35);">
      This link expires in 24 hours.
    </p>
  `)

  return sendEmail({
    to,
    toName:  memberName,
    subject: `You've been added to ${gymName} on ${APP_NAME}`,
    html,
    from: { name: WELCOME_FROM_NAME, email: WELCOME_FROM_EMAIL },
  })
}

// ── 3. Welcome email after self-registration ──────────────────────────────────

export async function sendWelcomeEmail({
  to, fullName,
}: {
  to: string; fullName: string
}): Promise<boolean> {
  const loginUrl = `${process.env.NEXTAUTH_URL ?? "https://gymstack.app"}/login`

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">
      Welcome to ${APP_NAME}! 🎉
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
      Hi ${fullName}, your account has been created successfully.
      You can now sign in and start your fitness journey.
    </p>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
                border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#ffffff;">
        What you can do on ${APP_NAME}:
      </p>
      <table cellpadding="0" cellspacing="0" style="font-size:13px;color:rgba(255,255,255,0.5);line-height:2;">
        <tr><td style="padding-right:8px;">💪</td><td>Follow personalised workout plans</td></tr>
        <tr><td>🥗</td><td>Track your daily diet and nutrition</td></tr>
        <tr><td>📅</td><td>Monitor attendance and streaks</td></tr>
        <tr><td>💳</td><td>View payments and membership status</td></tr>
        <tr><td>🎁</td><td>Earn rewards by referring friends</td></tr>
      </table>
    </div>
    ${ctaButton("Go to Dashboard", loginUrl)}
  `)

  return sendEmail({
    to,
    toName:  fullName,
    subject: `Welcome to ${APP_NAME} — You're all set!`,
    html,
    from: { name: WELCOME_FROM_NAME, email: WELCOME_FROM_EMAIL },
  })
}

// ── 4. Membership expiry reminder ─────────────────────────────────────────────

export async function sendExpiryReminderEmail({
  to, memberName, gymName, daysLeft, renewLink,
}: {
  to: string; memberName: string; gymName: string
  daysLeft: number; renewLink: string
}): Promise<boolean> {
  const urgent  = daysLeft <= 3
  const subject = daysLeft === 0
    ? `⚠️ Your ${gymName} membership has expired`
    : `Your ${gymName} membership expires in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">
      ${daysLeft === 0 ? "⚠️ Membership Expired" : `⏰ ${daysLeft} Day${daysLeft > 1 ? "s" : ""} Left`}
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
      Hi ${memberName}, your membership at
      <strong style="color:#f97316;">${gymName}</strong>
      ${daysLeft === 0
        ? "has expired. Renew now to continue checking in."
        : `expires in <strong style="color:${urgent ? "#ef4444" : "#f59e0b"};">${daysLeft} day${daysLeft > 1 ? "s" : ""}</strong>. Renew early to avoid any interruption.`}
    </p>
    ${ctaButton("Renew Membership", renewLink)}
  `)

  return sendEmail({ to, toName: memberName, subject, html })
}

// ── 5. OTP verification email ─────────────────────────────────────────────────

export async function sendOtpEmail({
  to, fullName, otp,
}: {
  to: string; fullName: string; otp: string
}): Promise<boolean> {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">
      Verify your email
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
      Hi ${fullName}, use this code to verify your email address.
      It expires in <strong style="color:#f97316;">10 minutes</strong>.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <div style="display:inline-block;background:rgba(249,115,22,0.1);
                  border:2px dashed rgba(249,115,22,0.4);border-radius:16px;
                  padding:24px 48px;">
        <span style="font-size:42px;font-weight:900;color:#f97316;
                     letter-spacing:12px;font-family:monospace;">
          ${otp}
        </span>
      </div>
    </div>
    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.35);text-align:center;line-height:1.8;">
      This code is valid for 10 minutes and can only be used once.<br/>
      If you didn't request this, ignore this email.
    </p>
  `)

  return sendEmail({
    to,
    toName:  fullName,
    subject: `${otp} is your ${APP_NAME} verification code`,
    html,
  })
}

// ── 6. Gym created — congratulations to owner ────────────────────────────────

export async function sendGymCreatedEmail({
  to, ownerName, gymName,
}: {
  to: string; ownerName: string; gymName: string
}): Promise<boolean> {
  const dashboardUrl = `${process.env.NEXTAUTH_URL ?? "https://gymstack.app"}/owner/dashboard`

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">
      Congratulations! Your gym is live. 🎉
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
      Hi ${ownerName}, your gym <strong style="color:#f97316;">${gymName}</strong> has been
      successfully created on ${APP_NAME}. You're all set to start adding members, trainers,
      and membership plans.
    </p>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
                border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#ffffff;">Next steps:</p>
      <table cellpadding="0" cellspacing="0" style="font-size:13px;color:rgba(255,255,255,0.5);line-height:2;">
        <tr><td style="padding-right:8px;">👥</td><td>Add members and assign membership plans</td></tr>
        <tr><td>🏋️</td><td>Invite trainers and assign them to members</td></tr>
        <tr><td>📋</td><td>Create workout and diet plans</td></tr>
        <tr><td>💳</td><td>Set up billing and payment collection</td></tr>
        <tr><td>📢</td><td>Send push announcements to all members</td></tr>
      </table>
    </div>
    ${ctaButton("Go to Dashboard", dashboardUrl)}
  `)

  return sendEmail({
    to,
    toName:  ownerName,
    subject: `🎉 ${gymName} is live on ${APP_NAME}!`,
    html,
    from: { name: WELCOME_FROM_NAME, email: WELCOME_FROM_EMAIL },
  })
}

// ── 7. Trainer added by owner ─────────────────────────────────────────────────

export async function sendTrainerAddedEmail({
  to, trainerName, gymName, ownerName, setupLink,
}: {
  to: string; trainerName: string; gymName: string; ownerName: string; setupLink: string
}): Promise<boolean> {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">
      You've been added as a Trainer! 💪
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
      Hi ${trainerName},
      <strong style="color:#ffffff;">${ownerName}</strong> has added you as a trainer at
      <strong style="color:#f97316;">${gymName}</strong> on ${APP_NAME}.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
      Sign in to access your trainer dashboard — view your assigned members, build personalised
      workout and diet plans, track attendance, and more.
    </p>
    ${ctaButton("Access Trainer Dashboard", setupLink)}
    <div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.2);
                border-radius:12px;padding:20px;margin-top:8px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#f97316;">
        📱 Download the App
      </p>
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6;">
        Get the ${APP_NAME} mobile app to manage your members, update plans,
        and stay connected — on Android and iOS.
      </p>
    </div>
  `)

  return sendEmail({
    to,
    toName:  trainerName,
    subject: `You've been added as a trainer at ${gymName} on ${APP_NAME}`,
    html,
    from: { name: WELCOME_FROM_NAME, email: WELCOME_FROM_EMAIL },
  })
}

// ── 8. Admin — new subscription notification ──────────────────────────────────

export async function sendAdminSubscriptionNotification({
  subscriberName, subscriberEmail, planName, planAmount, role, subscriptionType,
}: {
  subscriberName:   string
  subscriberEmail?: string
  planName:         string
  planAmount?:      string
  role:             string
  subscriptionType: string
}): Promise<boolean> {
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">
      New Subscription Alert 🔔
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
      A new <strong style="color:#f97316;">${subscriptionType}</strong> subscription was purchased on ${APP_NAME}.
    </p>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
                border-radius:12px;padding:24px;margin-bottom:24px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;line-height:2;">
        <tr>
          <td style="color:rgba(255,255,255,0.35);width:140px;">Subscriber</td>
          <td style="color:#ffffff;font-weight:600;">${subscriberName}</td>
        </tr>
        ${subscriberEmail ? `<tr>
          <td style="color:rgba(255,255,255,0.35);">Email</td>
          <td style="color:#f97316;">${subscriberEmail}</td>
        </tr>` : ""}
        <tr>
          <td style="color:rgba(255,255,255,0.35);">Role</td>
          <td style="color:#ffffff;">${role}</td>
        </tr>
        <tr>
          <td style="color:rgba(255,255,255,0.35);">Plan</td>
          <td style="color:#ffffff;">${planName}</td>
        </tr>
        ${planAmount ? `<tr>
          <td style="color:rgba(255,255,255,0.35);">Amount</td>
          <td style="color:#10b981;font-weight:700;">₹${planAmount}</td>
        </tr>` : ""}
        <tr>
          <td style="color:rgba(255,255,255,0.35);">Time</td>
          <td style="color:rgba(255,255,255,0.6);">${now} IST</td>
        </tr>
      </table>
    </div>
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);">
      This is an automated admin notification from ${APP_NAME}.
    </p>
  `)

  return sendEmail({
    to:      ADMIN_TO_EMAIL,
    toName:  "GymStack Admin",
    subject: `[${APP_NAME}] New ${subscriptionType} — ${subscriberName} (${planName})`,
    html,
    from: { name: APP_NAME, email: ADMIN_FROM_EMAIL },
  })
}

// ── 9. SaaS subscription payment receipt ─────────────────────────────────────

export async function sendSaasPaymentReceiptEmail({
  to, fullName, planName, amount, paidAt, receiptNumber, razorpayPaymentId, downloadUrl,
}: {
  to: string; fullName: string; planName: string; amount: number
  paidAt: Date | string; receiptNumber: string
  razorpayPaymentId?: string | null; downloadUrl?: string
}): Promise<boolean> {
  const dateStr = new Date(paidAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  })
  const amountStr = Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">
      Payment Confirmed! 🎉
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
      Hi ${fullName}, thank you for subscribing to <strong style="color:#f97316;">${APP_NAME}</strong>.
      Your payment has been received and your subscription is now active.
    </p>

    <div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.25);
                border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);
                text-transform:uppercase;letter-spacing:0.08em;">Payment Summary</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;margin-top:12px;">
        <tr>
          <td style="font-size:13px;color:rgba(255,255,255,0.45);padding:6px 0;width:160px;">Plan</td>
          <td style="font-size:13px;color:#ffffff;font-weight:600;padding:6px 0;">${planName}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:rgba(255,255,255,0.45);padding:6px 0;">Amount Paid</td>
          <td style="font-size:14px;color:#10b981;font-weight:700;padding:6px 0;">₹${amountStr}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:rgba(255,255,255,0.45);padding:6px 0;">Date</td>
          <td style="font-size:13px;color:#ffffff;padding:6px 0;">${dateStr}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:rgba(255,255,255,0.45);padding:6px 0;">Receipt No.</td>
          <td style="font-size:13px;color:#f97316;font-weight:600;padding:6px 0;">${receiptNumber}</td>
        </tr>
        ${razorpayPaymentId ? `
        <tr>
          <td style="font-size:13px;color:rgba(255,255,255,0.45);padding:6px 0;">Transaction ID</td>
          <td style="font-size:12px;color:rgba(255,255,255,0.6);padding:6px 0;word-break:break-all;">${razorpayPaymentId}</td>
        </tr>` : ""}
      </table>
    </div>

    ${downloadUrl ? ctaButton("Download PDF Receipt", downloadUrl) : ""}

    <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.35);line-height:1.7;">
      You can also download your receipt anytime from the
      <strong style="color:rgba(255,255,255,0.55);">Billing</strong> section of your dashboard.<br/>
      For any questions, contact us at
      <a href="mailto:support@gymstack.co.in" style="color:#f97316;text-decoration:none;">support@gymstack.co.in</a>.
    </p>
  `)

  return sendEmail({
    to,
    toName:  fullName,
    subject: `Payment Confirmed — ${planName} (₹${amountStr})`,
    html,
  })
}

// ── 10. Contact form — forward query to support inbox ─────────────────────────

export async function sendContactFormEmail({
  name, email, topic, message,
}: {
  name: string; email: string; topic: string; message: string
}): Promise<boolean> {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">
      New Contact Form Submission
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
      Someone reached out via the ${APP_NAME} website contact form.
    </p>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
                border-radius:12px;padding:24px;margin-bottom:24px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;line-height:2.2;">
        <tr>
          <td style="color:rgba(255,255,255,0.35);width:80px;">Name</td>
          <td style="color:#ffffff;font-weight:600;">${name}</td>
        </tr>
        <tr>
          <td style="color:rgba(255,255,255,0.35);">Email</td>
          <td><a href="mailto:${email}" style="color:#f97316;text-decoration:none;">${email}</a></td>
        </tr>
        <tr>
          <td style="color:rgba(255,255,255,0.35);">Topic</td>
          <td style="color:#ffffff;">${topic || "General"}</td>
        </tr>
      </table>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.1em;">Message</p>
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7;white-space:pre-wrap;">${message}</p>
      </div>
    </div>
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);">
      Reply directly to this email to respond to ${name}.
    </p>
  `)

  return sendEmail({
    to:      CONTACT_TO_EMAIL,
    toName:  "GymStack Support",
    subject: `[Contact] ${topic || "General Inquiry"} — ${name}`,
    html,
    from:    { name: APP_NAME, email: CONTACT_FROM_EMAIL },
    replyTo: { email, name },
  })
}
// import { Resend } from "resend"

// const resend = new Resend(process.env.RESEND_API_KEY)
// const FROM = process.env.EMAIL_FROM ?? "ranasanyam8445@gmail.com"

// export async function sendPasswordResetEmail(opts: {
//   to: string
//   fullName: string
//   resetLink: string
// }) {
//   const { error } = await resend.emails.send({
//     from: FROM,
//     to: opts.to,
//     subject: "Reset your GymStack password",
//     html: `
//       <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
//         <h2 style="color:#f97316;margin:0 0 8px">Reset your password</h2>
//         <p style="color:#374151">Hi ${opts.fullName},</p>
//         <p style="color:#374151">Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
//         <a href="${opts.resetLink}" style="display:inline-block;margin:20px 0;background:#f97316;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">
//           Reset Password
//         </a>
//         <p style="color:#9ca3af;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
//       </div>
//     `,
//   })
//   if (error) throw new Error(error.message)
// }

// export async function sendMemberWelcomeEmail(opts: {
//   to: string
//   fullName: string
//   gymName: string
//   ownerName: string
//   setupLink: string
// }) {
//   const { error } = await resend.emails.send({
//     from: FROM,
//     to: opts.to,
//     subject: `You've been added to ${opts.gymName} on GymStack`,
//     html: `
//       <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
//         <h2 style="color:#f97316;margin:0 0 8px">Welcome to ${opts.gymName}!</h2>
//         <p style="color:#374151">Hi ${opts.fullName},</p>
//         <p style="color:#374151"><strong>${opts.ownerName}</strong> has added you as a member. Set your password to access your workout plans, diet plans, attendance, and more.</p>
//         <a href="${opts.setupLink}" style="display:inline-block;margin:20px 0;background:#f97316;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">
//           Set My Password
//         </a>
//         <p style="color:#9ca3af;font-size:13px">This link expires in 24 hours. If you didn't expect this email, you can safely ignore it.</p>
//       </div>
//     `,
//   })
//   if (error) throw new Error(error.message)
// }


import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendPasswordResetEmail(opts: {
  to: string; fullName: string; resetLink: string
}) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: opts.to,
    subject: "Reset your GymStack password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#f97316">Reset your password</h2>
        <p>Hi ${opts.fullName},</p>
        <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${opts.resetLink}" style="display:inline-block;margin:20px 0;background:#f97316;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
        <p style="color:#9ca3af;font-size:13px">If you didn't request this, ignore this email.</p>
      </div>
    `,
  })
}

export async function sendMemberWelcomeEmail(opts: {
  to: string; fullName: string; gymName: string; ownerName: string; setupLink: string
}) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: opts.to,
    subject: `You've been added to ${opts.gymName} on GymStack`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#f97316">Welcome to ${opts.gymName} 🎉</h2>
        <p>Hi ${opts.fullName},</p>
        <p><strong>${opts.ownerName}</strong> has added you as a member. Set your password to access your dashboard.</p>
        <a href="${opts.setupLink}" style="display:inline-block;margin:20px 0;background:#f97316;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Set My Password</a>
        <p style="color:#9ca3af;font-size:13px">This link expires in 24 hours. If you didn't expect this, ignore it.</p>
      </div>
    `,
  })
}
import nodemailer from 'nodemailer'
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
})
export async function sendTest(to: string) {
  return transporter.sendMail({ from: process.env.SMTP_FROM, to, subject: 'Teste Financeito', text: 'SMTP OK' })
}

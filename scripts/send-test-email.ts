import 'dotenv/config'
import { prisma } from '../src/lib/db'
import { sendSmtpEmail, type SmtpConfig } from '../src/lib/smtp-mailer'

const TO = 'tashrif.work@gmail.com'

function emailHtml(): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Test Email</title></head><body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,Helvetica,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:48px 16px;" align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;"><tr><td style="background:linear-gradient(135deg,#2563eb,#4f46e5);border-radius:16px 16px 0 0;padding:40px 48px;text-align:center;"><div style="font-size:52px;line-height:1;margin-bottom:14px;">✉️</div><h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.4px;">Test Email — CSS NGO ERP</h1></td></tr><tr><td style="background:#ffffff;padding:40px 48px;"><p style="margin:0 0 20px;font-size:16px;color:#111827;">Hello,</p><p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">This is a <strong style="color:#2563eb;">test email</strong> sent from your CSS NGO ERP system to verify that your SMTP configuration is working correctly.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;margin:20px 0;"><tr><td style="padding:16px 20px;"><p style="margin:0 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#2563eb;">Configuration Status</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:13px;color:#64748b;padding:5px 0;width:45%;">SMTP</td><td style="font-size:14px;color:#1e3a8a;font-weight:700;">✅ Connected</td></tr><tr><td style="font-size:13px;color:#64748b;padding:5px 0;">Email Delivery</td><td style="font-size:14px;color:#1e3a8a;font-weight:700;">✅ Working</td></tr><tr><td style="font-size:13px;color:#64748b;padding:5px 0;">HTML Templates</td><td style="font-size:14px;color:#1e3a8a;font-weight:700;">✅ Active</td></tr></table></td></tr></table><p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">If you received this email, your notification system is fully operational. All HR automated emails — recruitment updates, onboarding, offboarding, and payroll notifications — will be delivered successfully.</p><p style="margin:32px 0 0;font-size:14px;color:#6b7280;padding-top:24px;border-top:1px solid #f3f4f6;">Warm regards,<br><strong style="color:#374151;font-size:15px;">CSS NGO ERP System</strong></p></td></tr><tr><td style="background:#f8fafc;border-radius:0 0 16px 16px;border-top:1px solid #e5e7eb;padding:20px 48px;text-align:center;"><p style="margin:0;font-size:12px;color:#9ca3af;">This is an automated notification from <strong>CSS NGO ERP</strong>. Please do not reply to this email.</p></td></tr></table></td></tr></table></body></html>`
}

async function main() {
  console.log(`\n📧 Sending test email to ${TO}...\n`)

  const org = await prisma.organization.findFirst({ select: { id: true, name: true } })
  if (!org) {
    console.error('❌ No organization found in database.')
    process.exit(1)
  }
  console.log(`   Organization : ${org.name} (${org.id})`)

  const configs = await prisma.systemConfig.findMany({
    where: { organizationId: org.id, key: { startsWith: 'email.' } },
    select: { key: true, value: true },
  })

  const map = new Map(configs.map((c) => [c.key, c.value]))
  const host     = map.get('email.smtpServer') || ''
  const port     = Number(map.get('email.smtpPort') || 587)
  const security = (map.get('email.smtpSecurity') || 'STARTTLS') as SmtpConfig['security']
  const username = map.get('email.smtpUsername') || ''
  const password = map.get('email.smtpAppPassword') || ''
  const fromAddr = map.get('email.fromAddress') || username
  const fromName = map.get('email.fromName') || 'CSS NGO ERP'

  console.log(`   SMTP Host    : ${host || '(not set)'}`)
  console.log(`   SMTP Port    : ${port}`)
  console.log(`   Security     : ${security}`)
  console.log(`   From         : ${fromAddr}\n`)

  if (!host || !username || !password) {
    console.error('❌ SMTP is not fully configured. Please check /settings/notifications.')
    process.exit(1)
  }

  const smtpConfig: SmtpConfig = { host, port, security, username, password, fromAddress: fromAddr, fromName }

  await sendSmtpEmail(smtpConfig, {
    to: TO,
    subject: '✅ Test Email — CSS NGO ERP is working!',
    body: emailHtml(),
  })

  console.log(`✅ Email sent successfully to ${TO}`)
}

main()
  .catch((err) => {
    console.error('❌ Failed to send email:', err.message || err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

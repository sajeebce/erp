import 'dotenv/config'
import { HR_TEMPLATE_DEFAULTS } from '../src/lib/email-templates'
import fs from 'fs'

const VARS: Record<string, string> = {
  applicantName: 'Md Sajeeb Hossain',
  employeeName: 'Md Sajeeb Hossain',
  jobTitle: 'Software Engineer',
  applicationNo: 'APP-2026-001',
  employeeNo: 'EMP-2026-042',
  offboardingNo: 'OFF-2026-007',
  salaryGrade: 'G-05 — Senior Officer',
  grossSalary: '৳ 85,000',
  leaveBenefits: 'Annual: 18d, Casual: 10d, Sick: 14d',
  offerMessage: 'We look forward to welcoming you and believe you will be a great fit for our culture.',
  period: 'April 2026',
  netSalary: '৳ 72,400',
  stageName: 'Screened',
}

function fill(str: string) {
  return str.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => VARS[k] ?? `{{${k}}}`)
}

const LABELS: Record<string, string> = {
  APPLICATION_RECEIVED: 'Application Received',
  RECRUITMENT_SCREENED: 'Screened',
  RECRUITMENT_SHORTLISTED: 'Shortlisted',
  RECRUITMENT_TECHNICAL_TEST: 'Technical Test',
  RECRUITMENT_INTERVIEW: 'Interview',
  RECRUITMENT_REFERENCE_CHECK: 'Reference Check',
  RECRUITMENT_OFFER: 'Offer',
  RECRUITMENT_HIRED: 'Hired',
  ONBOARDING_STARTED: 'Onboarding Started',
  ONBOARDING_COMPLETED: 'Onboarding Completed',
  OFFBOARDING_STARTED: 'Offboarding Started',
  OFFBOARDING_COMPLETED: 'Offboarding Completed',
  PAYROLL_APPROVED: 'Payroll Approved',
}

const nav = Object.keys(HR_TEMPLATE_DEFAULTS).map(key =>
  `<a href="#${key}" style="display:block;padding:8px 16px;color:#94a3b8;text-decoration:none;font-size:13px;border-radius:6px;margin-bottom:2px;" onmouseover="this.style.background='#1e293b';this.style.color='#f8fafc'" onmouseout="this.style.background='transparent';this.style.color='#94a3b8'">${LABELS[key]}</a>`
).join('')

const cards = Object.entries(HR_TEMPLATE_DEFAULTS).map(([key, tpl]) => `
  <div id="${key}" style="margin-bottom:64px;scroll-margin-top:24px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
      <span style="background:#1e293b;color:#64748b;font-family:monospace;font-size:11px;padding:4px 10px;border-radius:4px;">${key}</span>
      <span style="color:#475569;font-size:13px;">Subject: <em style="color:#94a3b8;">${fill(tpl.subject)}</em></span>
    </div>
    <div style="border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.3);">
      ${fill(tpl.body)}
    </div>
  </div>
`).join('')

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Email Template Preview — CSS NGO ERP</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #020617; font-family: 'Segoe UI', Arial, sans-serif; display: flex; min-height: 100vh; }
  #sidebar { width: 220px; min-height: 100vh; background: #0f172a; border-right: 1px solid #1e293b; padding: 24px 12px; position: fixed; top: 0; left: 0; bottom: 0; overflow-y: auto; }
  #sidebar h2 { color: #f8fafc; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 0 8px; margin-bottom: 20px; opacity: .5; }
  #main { margin-left: 220px; padding: 40px 48px; max-width: 900px; }
  #main h1 { color: #f8fafc; font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 40px; opacity: .4; }
</style>
</head>
<body>
  <div id="sidebar">
    <h2>Templates</h2>
    ${nav}
  </div>
  <div id="main">
    <h1>CSS NGO ERP — Email Preview</h1>
    ${cards}
  </div>
</body>
</html>`

fs.writeFileSync('email-preview.html', html, 'utf8')
console.log('✅  email-preview.html created — open in browser to preview all 13 templates.')

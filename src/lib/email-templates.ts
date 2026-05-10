function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.75;">${text}</p>`
}

function infoBox(accent: string, rows: [string, string][]): string {
  const rowsHtml = rows.map(([k, v], i) =>
    `<tr><td style="padding:${i === 0 ? '0' : '12px'} 0 0;vertical-align:top;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;padding-bottom:3px;">${k}</td></tr><tr><td style="font-size:16px;font-weight:700;color:#0f172a;">${v}</td></tr></table></td></tr>`
  ).join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;border-left:4px solid ${accent};margin:24px 0;"><tr><td style="padding:20px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table></td></tr></table>`
}

function emailHtml(accent: string, headline: string, name: string, body: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${headline}</title></head><body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:40px 16px;" align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);"><tr><td style="background:${accent};height:5px;font-size:0;line-height:0;">&nbsp;</td></tr><tr><td style="padding:36px 48px 8px;text-align:center;"><span style="font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${accent};">CSS NGO ERP</span></td></tr><tr><td style="padding:16px 48px 0;text-align:center;"><h1 style="margin:0;font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;line-height:1.2;">${headline}</h1><div style="width:36px;height:3px;background:${accent};border-radius:2px;margin:16px auto 0;"></div></td></tr><tr><td style="padding:32px 48px;"><p style="margin:0 0 20px;font-size:15px;color:#0f172a;">Dear <strong>${name}</strong>,</p>${body}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;padding-top:24px;border-top:1px solid #f1f5f9;"><tr><td><p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">Warm regards,<br><strong style="color:#0f172a;font-size:15px;">CSS Human Resources</strong></p></td></tr></table></td></tr><tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 48px;text-align:center;"><p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">This is an automated notification from <strong style="color:#64748b;">CSS NGO ERP</strong>.<br>Please do not reply directly to this email.</p></td></tr></table></td></tr></table></body></html>`
}

export const HR_TEMPLATE_DEFAULTS: Record<string, { subject: string; body: string }> = {
  APPLICATION_RECEIVED: {
    subject: 'Application Received — {{jobTitle}}',
    body: emailHtml(
      '#2563eb', 'Application Received', '{{applicantName}}',
      p('Thank you for applying for <strong style="color:#1e40af;">{{jobTitle}}</strong>. We have successfully received your application and it is currently under review by our team.') +
      infoBox('#2563eb', [
        ['Application No', '{{applicationNo}}'],
        ['Position Applied', '{{jobTitle}}'],
      ]) +
      p('Our recruitment team will carefully evaluate your submission and keep you informed at every stage. We appreciate your interest in joining CSS.')
    ),
  },
  RECRUITMENT_SCREENED: {
    subject: 'Application Update — Screened | {{jobTitle}}',
    body: emailHtml(
      '#7c3aed', 'Application Screened', '{{applicantName}}',
      p('We are pleased to let you know that your application for <strong style="color:#5b21b6;">{{jobTitle}}</strong> has successfully passed our initial screening.') +
      p('Your profile has been reviewed and your application is progressing to the next stage of our recruitment process. We will be in touch with further updates shortly.') +
      p('Thank you for your patience throughout this process.')
    ),
  },
  RECRUITMENT_SHORTLISTED: {
    subject: "You've Been Shortlisted — {{jobTitle}}",
    body: emailHtml(
      '#0d9488', "You're Shortlisted", '{{applicantName}}',
      p('We are delighted to inform you that you have been <strong style="color:#0f766e;">shortlisted</strong> for the position of <strong style="color:#0f766e;">{{jobTitle}}</strong>.') +
      p('This milestone reflects the strength of your application and qualifications — our team was genuinely impressed by your profile.') +
      p('We will be in touch shortly with details on the next steps. Please ensure your contact information is up to date.')
    ),
  },
  RECRUITMENT_TECHNICAL_TEST: {
    subject: 'Next Step: Technical Test — {{jobTitle}}',
    body: emailHtml(
      '#b45309', 'Technical Test Invitation', '{{applicantName}}',
      p('Congratulations on progressing in your application for <strong style="color:#92400e;">{{jobTitle}}</strong>! You have been selected to proceed to the <strong style="color:#92400e;">Technical Test</strong> stage.') +
      p('Our team will send you detailed instructions on the test format, duration, and schedule shortly. Please keep an eye on your inbox.') +
      p('Do not hesitate to reach out if you have any questions in the meantime.')
    ),
  },
  RECRUITMENT_INTERVIEW: {
    subject: 'Interview Invitation — {{jobTitle}}',
    body: emailHtml(
      '#4338ca', 'Interview Invitation', '{{applicantName}}',
      p('We are pleased to invite you for an <strong style="color:#3730a3;">interview</strong> for the position of <strong style="color:#3730a3;">{{jobTitle}}</strong>.') +
      p('Our team will reach out shortly to schedule the interview at a time that is convenient for you. Please be prepared to discuss your experience, skills, and interest in our organization.') +
      p('We look forward to connecting with you. Thank you for your continued commitment throughout this process.')
    ),
  },
  RECRUITMENT_REFERENCE_CHECK: {
    subject: 'Reference Check Stage — {{jobTitle}}',
    body: emailHtml(
      '#475569', 'Reference Check', '{{applicantName}}',
      p('Your application for <strong style="color:#334155;">{{jobTitle}}</strong> has advanced to the <strong style="color:#334155;">Reference Check</strong> stage — one of the final steps in our process.') +
      p('We will be contacting the professional references you provided. This typically takes a few business days.') +
      p('If you need to update any reference details, please contact our HR team promptly. We appreciate your cooperation.')
    ),
  },
  RECRUITMENT_OFFER: {
    subject: 'Job Offer — {{jobTitle}}',
    body: emailHtml(
      '#059669', 'Congratulations — Job Offer', '{{applicantName}}',
      p('We are thrilled to extend you a formal offer for the position of <strong style="color:#047857;">{{jobTitle}}</strong>. After careful deliberation, we are confident you will be an exceptional addition to our team.') +
      infoBox('#059669', [
        ['Salary Grade', '{{salaryGrade}}'],
        ['Gross Salary', '{{grossSalary}}'],
        ['Leave Entitlements', '{{leaveBenefits}}'],
      ]) +
      p('{{offerMessage}}') +
      p('Please review the offer details carefully and respond at your earliest convenience. Our HR team is available to answer any questions you may have.')
    ),
  },
  RECRUITMENT_HIRED: {
    subject: 'Welcome to the Team — {{jobTitle}}',
    body: emailHtml(
      '#16a34a', 'Welcome to the Team', '{{applicantName}}',
      p('We are overjoyed to officially welcome you as a new member of CSS!') +
      p('Your application for <strong style="color:#15803d;">{{jobTitle}}</strong> has been confirmed — you are now officially <strong style="color:#15803d;">hired</strong>. An exciting journey begins here.') +
      p('Our HR team will be in touch shortly with your onboarding schedule and everything you need to get started. We truly look forward to working with you.')
    ),
  },
  ONBOARDING_STARTED: {
    subject: 'Your Onboarding Has Begun',
    body: emailHtml(
      '#0891b2', 'Onboarding Started', '{{employeeName}}',
      p('Welcome to CSS! Your onboarding process has officially been initiated by the HR department.') +
      infoBox('#0891b2', [
        ['Employee No', '{{employeeNo}}'],
        ['Status', 'Onboarding In Progress'],
      ]) +
      p('Our HR team has prepared a structured set of tasks to help you settle in smoothly — covering documentation, system access, orientation, and policy briefings.') +
      p('If you have any questions at any point, please do not hesitate to reach out to your assigned HR contact. We are here to help.')
    ),
  },
  ONBOARDING_COMPLETED: {
    subject: 'Onboarding Complete — Welcome Aboard!',
    body: emailHtml(
      '#16a34a', 'Onboarding Complete', '{{employeeName}}',
      p('Congratulations! You have successfully completed your full onboarding process.') +
      infoBox('#16a34a', [
        ['Employee No', '{{employeeNo}}'],
        ['Status', 'Completed'],
      ]) +
      p('You are now fully set up as an active member of our organization. All documentation, system access, and orientation requirements have been fulfilled.') +
      p('Welcome aboard — we are genuinely excited to have you with us. Here is to a great journey ahead!')
    ),
  },
  OFFBOARDING_STARTED: {
    subject: 'Offboarding Process Initiated',
    body: emailHtml(
      '#ea580c', 'Offboarding Initiated', '{{employeeName}}',
      p('This is to inform you that your offboarding process has been officially initiated by the HR department.') +
      infoBox('#ea580c', [
        ['Employee No', '{{employeeNo}}'],
        ['Reference No', '{{offboardingNo}}'],
        ['Status', 'In Progress'],
      ]) +
      p('Our HR team will guide you through every step to ensure a smooth and professional transition — including task completion, documentation, knowledge transfer, and asset returns.') +
      p('Please complete all assigned items promptly. Your HR representative is available for any assistance you may need.')
    ),
  },
  OFFBOARDING_COMPLETED: {
    subject: 'Offboarding Complete',
    body: emailHtml(
      '#64748b', 'Offboarding Complete', '{{employeeName}}',
      p('We are writing to confirm that your offboarding process has been successfully completed.') +
      infoBox('#64748b', [
        ['Employee No', '{{employeeNo}}'],
        ['Reference No', '{{offboardingNo}}'],
        ['Status', 'Completed'],
      ]) +
      p('On behalf of everyone at CSS, we sincerely thank you for your contributions and dedication. Your work has made a meaningful difference.') +
      p('We wish you all the very best in your next chapter. You will always be a valued part of the CSS family.')
    ),
  },
  INTERVIEW_SCHEDULED: {
    subject: 'Interview Scheduled — {{jobTitle}}',
    body: emailHtml(
      '#4338ca', 'Interview Scheduled', '{{applicantName}}',
      p('Great news! An interview has been scheduled for your application for <strong style="color:#3730a3;">{{jobTitle}}</strong>. Please review the details below and make sure to be available at the scheduled time.') +
      infoBox('#4338ca', [
        ['Interview Type', '{{interviewType}}'],
        ['Date & Time', '{{scheduledAt}}'],
        ['Duration', '{{duration}}'],
        ['Location / Platform', '{{location}}'],
      ]) +
      p('If you have any questions or need to reschedule, please contact our HR team as soon as possible. We look forward to speaking with you!')
    ),
  },
  PAYROLL_APPROVED: {
    subject: 'Payroll Approved — {{period}}',
    body: emailHtml(
      '#1d4ed8', 'Payroll Approved', '{{employeeName}}',
      p('Your salary for the period <strong style="color:#1e40af;">{{period}}</strong> has been approved and processed by the Finance department.') +
      infoBox('#1d4ed8', [
        ['Payroll Period', '{{period}}'],
        ['Net Salary', '{{netSalary}}'],
      ]) +
      p('Your salary will be transferred to your registered bank account per the standard payroll schedule.') +
      p('For any questions or discrepancies, please reach out to your HR department or the Finance team.')
    ),
  },
}

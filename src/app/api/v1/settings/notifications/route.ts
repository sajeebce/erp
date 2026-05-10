import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { apiSuccess, apiBadRequest, handleRouteError } from '@/lib/api-response'

const EMAIL_DEFAULTS: Record<string, { type: string; value: string }> = {
  smtpServer: { type: 'string', value: '' },
  smtpPort: { type: 'number', value: '587' },
  smtpSecurity: { type: 'string', value: 'STARTTLS' },
  smtpUsername: { type: 'string', value: '' },
  smtpAppPassword: { type: 'string', value: '' },
  fromAddress: { type: 'string', value: '' },
  fromName: { type: 'string', value: '' },
  dailySendLimit: { type: 'number', value: '500' },
}

const HR_TEMPLATE_DEFAULTS: Record<string, { subject: string; body: string }> = {
  APPLICATION_RECEIVED: {
    subject: 'Application received - {{jobTitle}}',
    body: 'Dear {{applicantName}}, we received your application for {{jobTitle}}. We will keep you updated.',
  },
  RECRUITMENT_SCREENED: {
    subject: 'Application update - Screened',
    body: 'Dear {{applicantName}}, your application for {{jobTitle}} is now at Screened stage.',
  },
  RECRUITMENT_SHORTLISTED: {
    subject: 'Application update - Shortlisted',
    body: 'Dear {{applicantName}}, your application for {{jobTitle}} has been shortlisted.',
  },
  RECRUITMENT_TECHNICAL_TEST: {
    subject: 'Application update - Technical test',
    body: 'Dear {{applicantName}}, your application for {{jobTitle}} is now at Technical Test stage.',
  },
  RECRUITMENT_INTERVIEW: {
    subject: 'Application update - Interview',
    body: 'Dear {{applicantName}}, your application for {{jobTitle}} is now at Interview stage.',
  },
  RECRUITMENT_REFERENCE_CHECK: {
    subject: 'Application update - Reference check',
    body: 'Dear {{applicantName}}, your application for {{jobTitle}} is now at Reference Check stage.',
  },
  RECRUITMENT_OFFER: {
    subject: 'Offer details - {{jobTitle}}',
    body: 'Dear {{applicantName}}, please review your offer details for {{jobTitle}}.\n\nSalary Grade: {{salaryGrade}}\nGross Salary: {{grossSalary}}\nLeave Benefits: {{leaveBenefits}}\n\n{{offerMessage}}',
  },
  RECRUITMENT_HIRED: {
    subject: 'Application update - Hired',
    body: 'Dear {{applicantName}}, congratulations. Your application for {{jobTitle}} has moved to Hired stage.',
  },
  ONBOARDING_STARTED: {
    subject: 'Onboarding started',
    body: 'Dear {{employeeName}}, your onboarding process has started.',
  },
  ONBOARDING_COMPLETED: {
    subject: 'Onboarding completed',
    body: 'Dear {{employeeName}}, your onboarding process has been completed.',
  },
  OFFBOARDING_STARTED: {
    subject: 'Offboarding started',
    body: 'Dear {{employeeName}}, your offboarding process has started.',
  },
  OFFBOARDING_COMPLETED: {
    subject: 'Offboarding completed',
    body: 'Dear {{employeeName}}, your offboarding process has been completed.',
  },
  PAYROLL_APPROVED: {
    subject: 'Payroll approved - {{period}}',
    body: 'Dear {{employeeName}}, payroll for {{period}} has been approved. Net payable: {{netSalary}}.',
  },
}

function parseConfigValue(value: string, type: string): string | number | boolean {
  if (type === 'number') return Number(value) || 0
  if (type === 'boolean') return value === 'true'
  return value
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, ['ADMIN', 'HR'])
    const configs = await prisma.systemConfig.findMany({
      where: { organizationId: auth.organizationId },
    })

    const configMap = new Map(configs.map((cfg) => [cfg.key, cfg]))
    const email: Record<string, string | number | boolean> = {}

    for (const [shortKey, def] of Object.entries(EMAIL_DEFAULTS)) {
      const stored = configMap.get(`email.${shortKey}`)
      email[shortKey] = parseConfigValue(stored?.value ?? def.value, def.type)
    }

    const templates = Object.entries(HR_TEMPLATE_DEFAULTS).map(([key, fallback]) => ({
      key,
      subject: configMap.get(`hrNotificationTemplate.${key}.subject`)?.value ?? fallback.subject,
      body: configMap.get(`hrNotificationTemplate.${key}.body`)?.value ?? fallback.body,
    }))

    const queueSummary = await prisma.emailQueue.groupBy({
      by: ['status'],
      where: { organizationId: auth.organizationId },
      _count: { _all: true },
    })

    return apiSuccess({
      email,
      templates,
      queueSummary: queueSummary.map((item) => ({ status: item.status, count: item._count._all })),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, ['ADMIN', 'HR'])
    const body = await request.json()
    const email = body.email as Record<string, unknown> | undefined
    const templates = body.templates as Array<{ key: string; subject: string; body: string }> | undefined

    if (!email && !templates) {
      return apiBadRequest('email or templates payload is required')
    }

    if (email) {
      for (const [shortKey, def] of Object.entries(EMAIL_DEFAULTS)) {
        if (email[shortKey] === undefined) continue

        await prisma.systemConfig.upsert({
          where: {
            organizationId_key: {
              organizationId: auth.organizationId,
              key: `email.${shortKey}`,
            },
          },
          create: {
            organizationId: auth.organizationId,
            key: `email.${shortKey}`,
            value: String(email[shortKey] ?? ''),
            type: def.type,
          },
          update: {
            value: String(email[shortKey] ?? ''),
          },
        })
      }
    }

    if (templates) {
      for (const template of templates) {
        if (!HR_TEMPLATE_DEFAULTS[template.key]) continue

        await Promise.all([
          prisma.systemConfig.upsert({
            where: {
              organizationId_key: {
                organizationId: auth.organizationId,
                key: `hrNotificationTemplate.${template.key}.subject`,
              },
            },
            create: {
              organizationId: auth.organizationId,
              key: `hrNotificationTemplate.${template.key}.subject`,
              value: template.subject || HR_TEMPLATE_DEFAULTS[template.key].subject,
              type: 'string',
            },
            update: {
              value: template.subject || HR_TEMPLATE_DEFAULTS[template.key].subject,
            },
          }),
          prisma.systemConfig.upsert({
            where: {
              organizationId_key: {
                organizationId: auth.organizationId,
                key: `hrNotificationTemplate.${template.key}.body`,
              },
            },
            create: {
              organizationId: auth.organizationId,
              key: `hrNotificationTemplate.${template.key}.body`,
              value: template.body || HR_TEMPLATE_DEFAULTS[template.key].body,
              type: 'string',
            },
            update: {
              value: template.body || HR_TEMPLATE_DEFAULTS[template.key].body,
            },
          }),
        ])
      }
    }

    return GET(request)
  } catch (error) {
    return handleRouteError(error)
  }
}

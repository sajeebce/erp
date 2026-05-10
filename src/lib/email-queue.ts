import { prisma } from '@/lib/db'
import { sendSmtpEmail, type SmtpConfig } from './smtp-mailer'
import { HR_TEMPLATE_DEFAULTS } from './email-templates'

type TemplateVars = Record<string, string | number | null | undefined>

interface QueueEmailInput {
  organizationId: string
  recipientEmail: string | null | undefined
  eventKey?: string
  templateKey?: string
  fallbackSubject: string
  fallbackBody: string
  variables?: TemplateVars
  relatedModule?: string
  relatedEntityId?: string
}

function renderTemplate(template: string, variables: TemplateVars = {}) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const value = variables[key]
    return value === null || value === undefined ? '' : String(value)
  })
}

async function getConfiguredTemplate(organizationId: string, templateKey?: string) {
  if (!templateKey) return null

  const [subject, body] = await Promise.all([
    prisma.systemConfig.findUnique({
      where: { organizationId_key: { organizationId, key: `hrNotificationTemplate.${templateKey}.subject` } },
    }),
    prisma.systemConfig.findUnique({
      where: { organizationId_key: { organizationId, key: `hrNotificationTemplate.${templateKey}.body` } },
    }),
  ])

  if (!subject?.value && !body?.value) return null
  return { subject: subject?.value || null, body: body?.value || null }
}

async function getSmtpConfig(organizationId: string): Promise<SmtpConfig | null> {
  const configs = await prisma.systemConfig.findMany({
    where: { organizationId, key: { startsWith: 'email.' } },
    select: { key: true, value: true },
  })
  const map = new Map(configs.map((c) => [c.key, c.value]))
  const host = map.get('email.smtpServer') || ''
  const username = map.get('email.smtpUsername') || ''
  const password = map.get('email.smtpAppPassword') || ''
  const fromAddress = map.get('email.fromAddress') || username
  if (!host || !username || !password) return null
  return {
    host,
    port: Number(map.get('email.smtpPort') || 587),
    security: (map.get('email.smtpSecurity') || 'STARTTLS') as SmtpConfig['security'],
    username,
    password,
    fromAddress,
    fromName: map.get('email.fromName') || '',
  }
}

async function trySendNow(id: string, organizationId: string, to: string, subject: string, body: string) {
  const config = await getSmtpConfig(organizationId)
  if (!config) return

  try {
    await prisma.emailQueue.update({ where: { id }, data: { status: 'SENDING', lastError: null } })
    await sendSmtpEmail(config, { to, subject, body })
    await prisma.emailQueue.update({ where: { id }, data: { status: 'SENT', sentAt: new Date() } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown SMTP error'
    await prisma.emailQueue.update({
      where: { id },
      data: {
        status: 'PENDING',
        retryCount: { increment: 1 },
        lastError: message.slice(0, 1000),
      },
    })
  }
}

export async function queueEmail(input: QueueEmailInput) {
  if (!input.recipientEmail) return null

  const configured = await getConfiguredTemplate(input.organizationId, input.templateKey)
  const htmlDefault = input.templateKey ? HR_TEMPLATE_DEFAULTS[input.templateKey] : undefined
  const variables = input.variables || {}
  const subject = renderTemplate(
    configured?.subject || htmlDefault?.subject || input.fallbackSubject,
    variables,
  )
  const body = renderTemplate(
    configured?.body || htmlDefault?.body || input.fallbackBody,
    variables,
  )

  if (input.eventKey) {
    const existing = await prisma.emailQueue.findUnique({
      where: {
        organizationId_eventKey: { organizationId: input.organizationId, eventKey: input.eventKey },
      },
    })
    if (existing) return existing
  }

  const entry = await prisma.emailQueue.create({
    data: {
      organizationId: input.organizationId,
      recipientEmail: input.recipientEmail,
      subject,
      body,
      eventKey: input.eventKey || null,
      relatedModule: input.relatedModule || null,
      relatedEntityId: input.relatedEntityId || null,
    },
  })

  // Send immediately — fire-and-forget so the API response is not delayed.
  // If this fails the entry stays PENDING and the cron job will retry.
  trySendNow(entry.id, input.organizationId, input.recipientEmail, subject, body).catch(() => {})

  return entry
}

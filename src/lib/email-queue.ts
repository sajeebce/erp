import { prisma } from '@/lib/db'

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
      where: {
        organizationId_key: {
          organizationId,
          key: `hrNotificationTemplate.${templateKey}.subject`,
        },
      },
    }),
    prisma.systemConfig.findUnique({
      where: {
        organizationId_key: {
          organizationId,
          key: `hrNotificationTemplate.${templateKey}.body`,
        },
      },
    }),
  ])

  if (!subject?.value && !body?.value) return null
  return {
    subject: subject?.value || null,
    body: body?.value || null,
  }
}

export async function queueEmail(input: QueueEmailInput) {
  if (!input.recipientEmail) return null

  const configured = await getConfiguredTemplate(input.organizationId, input.templateKey)
  const variables = input.variables || {}
  const subject = renderTemplate(configured?.subject || input.fallbackSubject, variables)
  const body = renderTemplate(configured?.body || input.fallbackBody, variables)

  if (input.eventKey) {
    const existing = await prisma.emailQueue.findUnique({
      where: {
        organizationId_eventKey: {
          organizationId: input.organizationId,
          eventKey: input.eventKey,
        },
      },
    })
    if (existing) return existing
  }

  return prisma.emailQueue.create({
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
}

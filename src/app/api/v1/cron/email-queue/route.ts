import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { sendSmtpEmail, type SmtpConfig } from '@/lib/smtp-mailer'
import { apiSuccess, apiUnauthorized, handleRouteError } from '@/lib/api-response'

export const runtime = 'nodejs'

function parseSmtpConfig(configs: Array<{ key: string; value: string }>): SmtpConfig | null {
  const map = new Map(configs.map((cfg) => [cfg.key, cfg.value]))
  const host = map.get('email.smtpServer') || ''
  const port = Number(map.get('email.smtpPort') || 587)
  const security = (map.get('email.smtpSecurity') || 'STARTTLS') as SmtpConfig['security']
  const username = map.get('email.smtpUsername') || ''
  const password = map.get('email.smtpAppPassword') || ''
  const fromAddress = map.get('email.fromAddress') || username
  const fromName = map.get('email.fromName') || ''

  if (!host || !username || !password || !fromAddress) return null
  return { host, port, security, username, password, fromAddress, fromName }
}

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && request.headers.get('x-cron-secret') !== cronSecret) {
      return apiUnauthorized('Invalid cron secret')
    }

    const limit = Math.min(50, Math.max(1, Number(new URL(request.url).searchParams.get('limit') || 10)))
    const now = new Date()
    const pending = await prisma.emailQueue.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: { lte: now },
        retryCount: { lt: 5 },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })

    let sent = 0
    let failed = 0
    let skipped = 0
    const configByOrg = new Map<string, SmtpConfig | null>()

    for (const item of pending) {
      let smtpConfig = configByOrg.get(item.organizationId)
      if (smtpConfig === undefined) {
        const configs = await prisma.systemConfig.findMany({
          where: {
            organizationId: item.organizationId,
            key: { startsWith: 'email.' },
          },
          select: { key: true, value: true },
        })
        smtpConfig = parseSmtpConfig(configs)
        configByOrg.set(item.organizationId, smtpConfig)
      }

      if (!smtpConfig) {
        skipped += 1
        await prisma.emailQueue.update({
          where: { id: item.id },
          data: {
            status: 'FAILED',
            retryCount: { increment: 1 },
            lastError: 'SMTP is not configured for this organization',
          },
        })
        continue
      }

      try {
        await prisma.emailQueue.update({
          where: { id: item.id },
          data: { status: 'SENDING', lastError: null },
        })

        await sendSmtpEmail(smtpConfig, {
          to: item.recipientEmail,
          subject: item.subject,
          body: item.body,
        })

        await prisma.emailQueue.update({
          where: { id: item.id },
          data: { status: 'SENT', sentAt: new Date(), lastError: null },
        })
        sent += 1
      } catch (error) {
        failed += 1
        const message = error instanceof Error ? error.message : 'Unknown SMTP error'
        await prisma.emailQueue.update({
          where: { id: item.id },
          data: {
            status: item.retryCount + 1 >= 5 ? 'FAILED' : 'PENDING',
            retryCount: { increment: 1 },
            lastError: message.slice(0, 1000),
            scheduledAt: new Date(Date.now() + 5 * 60 * 1000),
          },
        })
      }
    }

    return apiSuccess({ processed: pending.length, sent, failed, skipped })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}

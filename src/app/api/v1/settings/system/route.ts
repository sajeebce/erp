import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest, requireRoleFromRequest } from '@/lib/auth'
import { invalidateStorageCache } from '@/lib/storage/storage-factory'
import {
  apiSuccess,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

// Default system config keys with their types and defaults
const SYSTEM_CONFIG_DEFAULTS: Record<string, { type: string; value: string }> = {
  // Security
  'security.minPasswordLength': { type: 'number', value: '8' },
  'security.passwordComplexity': { type: 'string', value: 'uppercase+number+special' },
  'security.passwordExpiryDays': { type: 'number', value: '90' },
  'security.maxLoginAttempts': { type: 'number', value: '5' },
  'security.lockoutMinutes': { type: 'number', value: '30' },
  'security.sessionTimeoutMinutes': { type: 'number', value: '30' },
  'security.twoFactorAuth': { type: 'string', value: 'optional' },
  'security.ipWhitelist': { type: 'boolean', value: 'false' },
  'security.auditLogRetentionDays': { type: 'number', value: '365' },
  // Email / SMTP
  'email.smtpServer': { type: 'string', value: '' },
  'email.smtpPort': { type: 'number', value: '587' },
  'email.smtpSecurity': { type: 'string', value: 'STARTTLS' },
  'email.smtpUsername': { type: 'string', value: '' },
  'email.smtpAppPassword': { type: 'string', value: '' },
  'email.fromAddress': { type: 'string', value: '' },
  'email.fromName': { type: 'string', value: '' },
  'email.dailySendLimit': { type: 'number', value: '500' },
  // Tax
  'tax.vatRate': { type: 'number', value: '15' },
  'tax.tdsOnSalary': { type: 'string', value: 'As per income slab' },
  'tax.tdsOnConsultancy': { type: 'number', value: '10' },
  'tax.tdsOnSuppliers': { type: 'string', value: '3-7' },
  'tax.ait': { type: 'number', value: '5' },
  'tax.stampDuty': { type: 'number', value: '150' },
  // Defaults
  'defaults.approvalThreshold': { type: 'number', value: '50000' },
  'defaults.decimalPlaces': { type: 'number', value: '2' },
}

function parseConfigValue(value: string, type: string): string | number | boolean {
  if (type === 'number') return Number(value) || 0
  if (type === 'boolean') return value === 'true'
  return value
}

function maskSecret(secret: string | null | undefined): string {
  if (!secret) return ''
  if (secret.length <= 4) return '****'
  return '*'.repeat(secret.length - 4) + secret.slice(-4)
}

function isMaskedSecret(value: unknown): boolean {
  return typeof value === 'string' && /^\*+$/.test(value.trim())
}

async function buildSystemSettingsPayload(organizationId: string) {
  const configs = await prisma.systemConfig.findMany({
    where: { organizationId },
  })

  const configMap: Record<string, unknown> = {}
  for (const [key, def] of Object.entries(SYSTEM_CONFIG_DEFAULTS)) {
    configMap[key] = parseConfigValue(def.value, def.type)
  }
  for (const cfg of configs) {
    const def = SYSTEM_CONFIG_DEFAULTS[cfg.key]
    configMap[cfg.key] = def
      ? parseConfigValue(cfg.value, def.type)
      : cfg.value
  }

  const mediaSetting = await prisma.mediaSetting.findFirst({ where: { isActive: true } })
    ?? await prisma.mediaSetting.findFirst({ orderBy: { updatedAt: 'desc' } })

  configMap['storage.provider'] = mediaSetting?.provider ?? 'cloudflare_r2'
  configMap['storage.bucketName'] = mediaSetting?.bucketName ?? ''
  configMap['storage.region'] = mediaSetting?.region ?? 'auto'
  configMap['storage.endpoint'] = mediaSetting?.endpoint ?? ''
  configMap['storage.accessKeyId'] = mediaSetting?.accessKeyId ?? ''
  configMap['storage.secretAccessKey'] = maskSecret(mediaSetting?.secretAccessKey)
  configMap['storage.publicUrl'] = mediaSetting?.publicUrl ?? ''
  configMap['storage.maxFileSizeMb'] = mediaSetting?.maxFileSizeMb ?? 50
  configMap['storage.allowedMimeTypes'] = mediaSetting?.allowedMimeTypes
    ?? 'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  configMap['storage.isActive'] = mediaSetting?.isActive ?? false

  const sequences = await prisma.numberSequence.findMany({
    where: { organizationId },
    orderBy: { entity: 'asc' },
  })

  return {
    config: configMap,
    numberSequences: sequences,
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    return apiSuccess(await buildSystemSettingsPayload(auth.organizationId))
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')

    const body = await request.json()
    const { section, data } = body as { section: string; data: Record<string, unknown> }

    if (!section || !data) {
      return apiBadRequest('section and data are required')
    }

    if (section === 'numberSequences') {
      // Update number sequences
      const updates = data as unknown as Array<{
        id: string
        prefix?: string
        separator?: string
        includeYear?: boolean
        padLength?: number
        currentValue?: number
      }>

      if (!Array.isArray(updates)) {
        return apiBadRequest('data must be an array for numberSequences section')
      }

      for (const item of updates) {
        await prisma.numberSequence.update({
          where: { id: item.id },
          data: {
            ...(item.prefix !== undefined && { prefix: item.prefix }),
            ...(item.separator !== undefined && { separator: item.separator }),
            ...(item.includeYear !== undefined && { includeYear: item.includeYear }),
            ...(item.padLength !== undefined && { padLength: item.padLength }),
            ...(item.currentValue !== undefined && { currentValue: item.currentValue }),
          },
        })
      }
    } else if (section === 'storage') {
      const existing = await prisma.mediaSetting.findFirst({ orderBy: { updatedAt: 'desc' } })
      const provider = String(data.provider || 'cloudflare_r2')
      const bucketName = String(data.bucketName || '').trim()
      const region = String(data.region || 'auto').trim() || 'auto'
      let endpoint = String(data.endpoint || '').trim().replace(/\/+$/, '')
      const trailingBucket = `/${bucketName}`
      if (bucketName && endpoint.toLowerCase().endsWith(trailingBucket.toLowerCase())) {
        endpoint = endpoint.slice(0, -trailingBucket.length)
      }
      const accessKeyId = String(data.accessKeyId || '').trim()
      const providedSecret = String(data.secretAccessKey || '').trim()
      const secretAccessKey = providedSecret && !isMaskedSecret(providedSecret)
        ? providedSecret
        : existing?.secretAccessKey
      const publicUrl = String(data.publicUrl || '').trim()
      const maxFileSizeMb = Number(data.maxFileSizeMb || 50)
      const allowedMimeTypes = String(data.allowedMimeTypes || '').trim()
      const isActive = data.isActive === undefined ? true : Boolean(data.isActive)

      if (provider !== 'cloudflare_r2') {
        return apiBadRequest('Only cloudflare_r2 storage is supported from system settings')
      }
      if (!bucketName || !endpoint || !accessKeyId || !secretAccessKey) {
        return apiBadRequest('Bucket name, endpoint, access key id, and secret access key are required')
      }
      if (!Number.isFinite(maxFileSizeMb) || maxFileSizeMb < 1) {
        return apiBadRequest('Max file size must be a positive number')
      }

      const payload = {
        provider,
        bucketName,
        region,
        endpoint,
        accessKeyId,
        secretAccessKey,
        publicUrl: publicUrl || null,
        maxFileSizeMb,
        allowedMimeTypes: allowedMimeTypes || 'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        isActive,
      }

      if (existing) {
        await prisma.mediaSetting.update({
          where: { id: existing.id },
          data: payload,
        })
      } else {
        await prisma.mediaSetting.create({ data: payload })
      }
      invalidateStorageCache()
    } else {
      // Validate section prefix
      const validPrefixes = ['security', 'email', 'tax', 'defaults', 'hrNotificationTemplate']
      if (!validPrefixes.includes(section)) {
        return apiBadRequest(`Invalid section: ${section}. Must be one of: ${[...validPrefixes, 'storage'].join(', ')}`)
      }

      // Upsert each key-value pair
      for (const [shortKey, value] of Object.entries(data)) {
        const fullKey = `${section}.${shortKey}`
        const def = SYSTEM_CONFIG_DEFAULTS[fullKey]
        const type = def?.type || 'string'

        await prisma.systemConfig.upsert({
          where: {
            organizationId_key: {
              organizationId: auth.organizationId,
              key: fullKey,
            },
          },
          create: {
            organizationId: auth.organizationId,
            key: fullKey,
            value: String(value),
            type,
          },
          update: {
            value: String(value),
          },
        })
      }
    }

    return apiSuccess(await buildSystemSettingsPayload(auth.organizationId))
  } catch (error) {
    return handleRouteError(error)
  }
}

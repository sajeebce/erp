import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest, requireRoleFromRequest } from '@/lib/auth'
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

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    // Fetch SystemConfig key-value pairs
    const configs = await prisma.systemConfig.findMany({
      where: { organizationId: auth.organizationId },
    })

    // Build config object with defaults
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

    // Fetch NumberSequences
    const sequences = await prisma.numberSequence.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { entity: 'asc' },
    })

    return apiSuccess({
      config: configMap,
      numberSequences: sequences,
    })
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
    } else {
      // Validate section prefix
      const validPrefixes = ['security', 'email', 'tax', 'defaults', 'hrNotificationTemplate']
      if (!validPrefixes.includes(section)) {
        return apiBadRequest(`Invalid section: ${section}. Must be one of: ${validPrefixes.join(', ')}`)
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

    // Re-fetch and return updated data
    const configs = await prisma.systemConfig.findMany({
      where: { organizationId: auth.organizationId },
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

    const sequences = await prisma.numberSequence.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { entity: 'asc' },
    })

    return apiSuccess({
      config: configMap,
      numberSequences: sequences,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

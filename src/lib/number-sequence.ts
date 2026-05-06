import { prisma } from '@/lib/db'

const DEFAULT_SEQUENCE_CONFIG: Record<string, { prefix: string; padLength?: number; includeYear?: boolean; separator?: string }> = {
  voucher_dv: { prefix: 'DV', padLength: 4 },
  voucher_rv: { prefix: 'RV', padLength: 4 },
  voucher_cv: { prefix: 'CV', padLength: 4 },
  voucher_bv: { prefix: 'BV', padLength: 4 },
  voucher_jv: { prefix: 'JV', padLength: 4 },
  journal_entry: { prefix: 'JE', padLength: 4 },
  purchase_requisition: { prefix: 'PR', padLength: 4 },
  purchase_order: { prefix: 'PO', padLength: 4 },
  goods_receipt: { prefix: 'GRN', padLength: 4 },
  tender: { prefix: 'TND', padLength: 4 },
  contract: { prefix: 'CON', padLength: 4 },
  asset: { prefix: 'AST', padLength: 4 },
  employee: { prefix: 'EMP', padLength: 4 },
  'employee-contract': { prefix: 'EC', padLength: 4 },
  'job-posting': { prefix: 'JOB', padLength: 4 },
  beneficiary: { prefix: 'BEN', padLength: 4 },
  enrollment: { prefix: 'ENR', padLength: 4 },
  grant: { prefix: 'GR', padLength: 4 },
  fund_receipt: { prefix: 'FR', padLength: 4 },
  fund_requisition: { prefix: 'FRQ', padLength: 4 },
  project: { prefix: 'PRJ', padLength: 4 },
  grievance: { prefix: 'GRV', padLength: 4 },
  loan_application: { prefix: 'LA', padLength: 4 },
  loan_account: { prefix: 'LN', padLength: 4 },
  disbursement: { prefix: 'DSB', padLength: 4 },
  collection: { prefix: 'COL', padLength: 4 },
  leave_application: { prefix: 'LV', padLength: 4 },
  payroll_run: { prefix: 'PAY', padLength: 4 },
  budget: { prefix: 'BUD', padLength: 4 },
  budget_revision: { prefix: 'BR', padLength: 4 },
  asset_transfer: { prefix: 'AT', padLength: 4 },
  asset_maintenance: { prefix: 'AM', padLength: 4 },
  asset_disposal: { prefix: 'AD', padLength: 4 },
  donor_report: { prefix: 'DR', padLength: 4 },
  training: { prefix: 'TRN', padLength: 4 },
  samity: { prefix: 'SMT', padLength: 4 },
  vendor: { prefix: 'VND', padLength: 4 },
  vendor_invoice: { prefix: 'VI', padLength: 4 },
  vendor_payment: { prefix: 'VP', padLength: 4 },
}

async function ensureSequenceExists(organizationId: string, entity: string) {
  const config = DEFAULT_SEQUENCE_CONFIG[entity]
  if (!config) {
    throw new Error(`Number sequence not found for entity: ${entity}`)
  }

  await prisma.numberSequence.upsert({
    where: {
      organizationId_entity: { organizationId, entity },
    },
    update: {},
    create: {
      organizationId,
      entity,
      prefix: config.prefix,
      separator: config.separator ?? '-',
      includeYear: config.includeYear ?? true,
      currentValue: 0,
      padLength: config.padLength ?? 4,
    },
  })
}

/**
 * Generates the next number in a sequence for an entity within an organization.
 *
 * Example: entity="voucher_dv", prefix="DV", year=2026, padLength=3
 * → DV-2026-001, DV-2026-002, ...
 *
 * Thread-safe via Prisma transaction with atomic increment.
 */
export async function generateNextNumber(
  organizationId: string,
  entity: string
): Promise<string> {
  let sequence
  try {
    sequence = await prisma.$transaction(async (tx) => {
      const seq = await tx.numberSequence.update({
        where: {
          organizationId_entity: { organizationId, entity },
        },
        data: {
          currentValue: { increment: 1 },
        },
      })
      return seq
    })
  } catch {
    await ensureSequenceExists(organizationId, entity)
    sequence = await prisma.$transaction(async (tx) => {
      const seq = await tx.numberSequence.update({
        where: {
          organizationId_entity: { organizationId, entity },
        },
        data: {
          currentValue: { increment: 1 },
        },
      })
      return seq
    })
  }

  const year = new Date().getFullYear()
  const number = String(sequence.currentValue).padStart(sequence.padLength, '0')

  if (sequence.includeYear) {
    return `${sequence.prefix}${sequence.separator}${year}${sequence.separator}${number}`
  }

  return `${sequence.prefix}${sequence.separator}${number}`
}

/**
 * Preview what the next number will be without incrementing.
 */
export async function previewNextNumber(
  organizationId: string,
  entity: string
): Promise<string> {
  let sequence = await prisma.numberSequence.findUnique({
    where: {
      organizationId_entity: { organizationId, entity },
    },
  })

  if (!sequence) {
    await ensureSequenceExists(organizationId, entity)
    sequence = await prisma.numberSequence.findUnique({
      where: {
        organizationId_entity: { organizationId, entity },
      },
    })
  }

  if (!sequence) {
    throw new Error(`Number sequence not found for entity: ${entity}`)
  }

  const year = new Date().getFullYear()
  const nextValue = sequence.currentValue + 1
  const number = String(nextValue).padStart(sequence.padLength, '0')

  if (sequence.includeYear) {
    return `${sequence.prefix}${sequence.separator}${year}${sequence.separator}${number}`
  }

  return `${sequence.prefix}${sequence.separator}${number}`
}

/**
 * Reset a sequence to 0 (useful at fiscal year start).
 */
export async function resetSequence(
  organizationId: string,
  entity: string
): Promise<void> {
  await ensureSequenceExists(organizationId, entity)
  await prisma.numberSequence.update({
    where: {
      organizationId_entity: { organizationId, entity },
    },
    data: { currentValue: 0 },
  })
}

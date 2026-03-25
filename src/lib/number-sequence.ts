import { prisma } from '@/lib/db'

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
  const sequence = await prisma.$transaction(async (tx) => {
    // Atomic increment
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
  const sequence = await prisma.numberSequence.findUnique({
    where: {
      organizationId_entity: { organizationId, entity },
    },
  })

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
  await prisma.numberSequence.update({
    where: {
      organizationId_entity: { organizationId, entity },
    },
    data: { currentValue: 0 },
  })
}

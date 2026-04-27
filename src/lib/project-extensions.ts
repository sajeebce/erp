import { Prisma, Project, ProjectExtensionRequest } from '@prisma/client'
import { prisma } from '@/lib/db'
import { generateNextNumber } from '@/lib/number-sequence'

export const PROJECT_EXTENSION_ENTITY = 'project_extension'
export const PROJECT_EXTENSION_SELECT = {
  id: true,
  organizationId: true,
  projectId: true,
  requestNo: true,
  currentStartDate: true,
  currentEndDate: true,
  proposedEndDate: true,
  currentBudget: true,
  reason: true,
  impactNotes: true,
  approvalReference: true,
  attachmentUrl: true,
  status: true,
  requestedById: true,
  requestedAt: true,
  approvedById: true,
  approvedAt: true,
  approvalNotes: true,
  rejectedById: true,
  rejectedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
  project: {
    select: {
      id: true,
      projectNo: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      totalBudget: true,
      currency: true,
      donorId: true,
    },
  },
} satisfies Prisma.ProjectExtensionRequestSelect

export function parseRequiredDate(value: unknown, fieldName: string): Date {
  if (!value || typeof value !== 'string') {
    throw new Error(`${fieldName} is required`)
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid date`)
  }

  return date
}

export function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function assertExtensionAllowed(project: Pick<Project, 'status' | 'endDate'>) {
  if (!['ACTIVE', 'ON_HOLD'].includes(project.status)) {
    throw new Error('Only ACTIVE or ON_HOLD projects can request no-cost extension')
  }

  if (!project.endDate) {
    throw new Error('Project must have an existing end date before requesting extension')
  }
}

export function assertBudgetUnchanged(
  projectBudget: Prisma.Decimal,
  requestBudget: Prisma.Decimal
) {
  if (!projectBudget.equals(requestBudget)) {
    throw new Error('Project budget changed after extension request. Review budget integrity before approval.')
  }
}

export function calculateExtensionDays(currentEndDate: Date, proposedEndDate: Date) {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.ceil((proposedEndDate.getTime() - currentEndDate.getTime()) / msPerDay)
}

export function ensureFutureExtensionDate(currentEndDate: Date, proposedEndDate: Date) {
  if (proposedEndDate <= currentEndDate) {
    throw new Error('Proposed end date must be later than current project end date')
  }
}

export async function ensureProjectExtensionSequence(organizationId: string) {
  await prisma.numberSequence.upsert({
    where: {
      organizationId_entity: {
        organizationId,
        entity: PROJECT_EXTENSION_ENTITY,
      },
    },
    update: {},
    create: {
      organizationId,
      entity: PROJECT_EXTENSION_ENTITY,
      prefix: 'NCE',
      separator: '-',
      includeYear: true,
      padLength: 3,
      currentValue: 0,
    },
  })
}

export async function generateProjectExtensionNo(organizationId: string) {
  await ensureProjectExtensionSequence(organizationId)
  return generateNextNumber(organizationId, PROJECT_EXTENSION_ENTITY)
}

export function extensionSummary(extension: Pick<ProjectExtensionRequest, 'currentEndDate' | 'proposedEndDate'>) {
  return {
    extensionDays: calculateExtensionDays(extension.currentEndDate, extension.proposedEndDate),
  }
}

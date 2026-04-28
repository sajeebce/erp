import { prisma } from '@/lib/db'
import type { ApprovalStatus } from '@prisma/client'

interface StartApprovalParams {
  organizationId: string
  workflowName: string
  entityType: string
  entityId: string
  requestedById: string
  amount?: number
}

interface ApprovalStepResult {
  stepNumber: number
  name: string
  roleId: string
  roleName: string
  status: string
}

interface ApprovalResult {
  instanceId: string
  status: ApprovalStatus
  currentStep: number
  totalSteps: number
  isComplete: boolean
  currentStepName?: string
  currentRoleId?: string
  currentRoleName?: string
  steps?: ApprovalStepResult[]
}

const DEFAULT_PR_WORKFLOW_NAME = 'Purchase Requisition Approval'

function stepAppliesToAmount(step: { isRequired: boolean; amountMin: unknown; amountMax: unknown }, amount?: number | null) {
  if (!step.isRequired) return false
  if (amount === undefined || amount === null) return true

  const min = step.amountMin ? Number(step.amountMin) : 0
  const max = step.amountMax ? Number(step.amountMax) : Infinity
  return amount >= min && amount <= max
}

function toResult(instance: {
  id: string
  status: ApprovalStatus
  currentStep: number
  steps: Array<{
    stepNumber: number
    name: string
    roleId: string
    roleName: string
    status: string
  }>
}): ApprovalResult {
  const current = instance.steps.find((step) => step.stepNumber === instance.currentStep)

  return {
    instanceId: instance.id,
    status: instance.status,
    currentStep: instance.currentStep,
    totalSteps: instance.steps.length,
    isComplete: instance.status === 'APPROVED' || instance.status === 'REJECTED' || instance.status === 'CANCELLED',
    currentStepName: current?.name,
    currentRoleId: current?.roleId,
    currentRoleName: current?.roleName,
    steps: instance.steps.map((step) => ({
      stepNumber: step.stepNumber,
      name: step.name,
      roleId: step.roleId,
      roleName: step.roleName,
      status: step.status,
    })),
  }
}

async function findOrCreateWorkflow(params: StartApprovalParams) {
  const workflow = await prisma.approvalWorkflowDef.findFirst({
    where: {
      organizationId: params.organizationId,
      entityType: params.entityType,
      name: params.workflowName,
      isActive: true,
    },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
    },
  })

  if (workflow) return workflow

  if (params.entityType !== 'PURCHASE_REQUISITION' || params.workflowName !== DEFAULT_PR_WORKFLOW_NAME) {
    throw new Error(`Approval workflow "${params.workflowName}" not found for ${params.entityType}`)
  }

  const adminRole = await prisma.role.findFirst({
    where: { organizationId: params.organizationId, name: 'ADMIN' },
    select: { id: true },
  })

  if (!adminRole) {
    throw new Error('Default purchase requisition workflow requires an ADMIN role')
  }

  return prisma.approvalWorkflowDef.create({
    data: {
      organizationId: params.organizationId,
      name: DEFAULT_PR_WORKFLOW_NAME,
      module: 'PROCUREMENT',
      entityType: 'PURCHASE_REQUISITION',
      description: 'Default one-step admin approval for purchase requisitions.',
      steps: {
        create: {
          stepNumber: 1,
          name: 'Admin Approval',
          roleId: adminRole.id,
          isRequired: true,
        },
      },
    },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
    },
  })
}

/**
 * Start or resume an approval process for an entity.
 * The workflow steps are copied into ApprovalInstanceStep rows so in-flight
 * approvals keep their original routing if workflow settings later change.
 */
export async function startApproval(params: StartApprovalParams): Promise<ApprovalResult> {
  const existing = await prisma.approvalInstance.findFirst({
    where: {
      entityType: params.entityType,
      entityId: params.entityId,
      status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
    },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (existing) {
    const current = existing.steps.find((step) => step.stepNumber === existing.currentStep)
    if (current?.status === 'RETURNED') {
      const resumed = await prisma.approvalInstance.update({
        where: { id: existing.id },
        data: {
          status: 'SUBMITTED',
          steps: {
            update: {
              where: {
                instanceId_stepNumber: {
                  instanceId: existing.id,
                  stepNumber: existing.currentStep,
                },
              },
              data: {
                status: 'PENDING',
                action: null,
                actorId: null,
                comments: null,
                actedAt: null,
              },
            },
          },
        },
        include: {
          steps: {
            orderBy: { stepNumber: 'asc' },
          },
        },
      })

      return toResult(resumed)
    }

    return toResult(existing)
  }

  const workflow = await findOrCreateWorkflow(params)
  const applicableSteps = workflow.steps.filter((step) => stepAppliesToAmount(step, params.amount))

  if (applicableSteps.length === 0) {
    throw new Error('No applicable approval steps found for this amount')
  }

  const roleNames = await prisma.role.findMany({
    where: {
      id: { in: applicableSteps.map((step) => step.roleId) },
      organizationId: params.organizationId,
    },
    select: { id: true, name: true },
  })
  const roleNameById = new Map(roleNames.map((role) => [role.id, role.name]))

  const instance = await prisma.approvalInstance.create({
    data: {
      workflowId: workflow.id,
      entityType: params.entityType,
      entityId: params.entityId,
      currentStep: 1,
      status: 'SUBMITTED',
      requestedById: params.requestedById,
      amount: params.amount,
      steps: {
        create: applicableSteps.map((step, index) => ({
          stepNumber: index + 1,
          name: step.name,
          roleId: step.roleId,
          roleName: roleNameById.get(step.roleId) || 'UNKNOWN',
          status: index === 0 ? 'PENDING' : 'WAITING',
        })),
      },
    },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
    },
  })

  return toResult(instance)
}

/**
 * Process an approval action on the current pending approval step.
 */
export async function processApproval(
  instanceId: string,
  actorId: string,
  action: 'APPROVE' | 'REJECT' | 'RETURN',
  comments?: string
): Promise<ApprovalResult> {
  const instance = await prisma.approvalInstance.findUnique({
    where: { id: instanceId },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
    },
  })

  if (!instance) {
    throw new Error('Approval instance not found')
  }

  if (instance.status !== 'SUBMITTED' && instance.status !== 'UNDER_REVIEW') {
    throw new Error(`Cannot process approval: current status is ${instance.status}`)
  }

  const currentStep = instance.steps.find((step) => step.stepNumber === instance.currentStep)

  if (!currentStep) {
    throw new Error('Current approval step not found')
  }

  if (currentStep.status !== 'PENDING') {
    throw new Error(`Cannot process approval: current step is ${currentStep.status}`)
  }

  const actor = await prisma.user.findFirst({
    where: { id: actorId, deletedAt: null },
    select: {
      id: true,
      roleId: true,
      role: { select: { name: true } },
    },
  })

  if (!actor || actor.roleId !== currentStep.roleId) {
    throw new Error(`Forbidden: Current approval step requires role ${currentStep.roleName}`)
  }

  const totalSteps = instance.steps.length
  const isLastStep = instance.currentStep >= totalSteps
  const now = new Date()

  const updated = await prisma.$transaction(async (tx) => {
    await tx.approvalAction.create({
      data: {
        instanceId,
        stepNumber: instance.currentStep,
        action,
        actorId,
        comments,
      },
    })

    if (action === 'REJECT') {
      return tx.approvalInstance.update({
        where: { id: instanceId },
        data: {
          status: 'REJECTED',
          steps: {
            update: {
              where: {
                instanceId_stepNumber: {
                  instanceId,
                  stepNumber: instance.currentStep,
                },
              },
              data: {
                status: 'REJECTED',
                action,
                actorId,
                comments,
                actedAt: now,
              },
            },
          },
        },
        include: {
          steps: {
            orderBy: { stepNumber: 'asc' },
          },
        },
      })
    }

    if (action === 'RETURN') {
      return tx.approvalInstance.update({
        where: { id: instanceId },
        data: {
          status: 'SUBMITTED',
          steps: {
            update: {
              where: {
                instanceId_stepNumber: {
                  instanceId,
                  stepNumber: instance.currentStep,
                },
              },
              data: {
                status: 'RETURNED',
                action,
                actorId,
                comments,
                actedAt: now,
              },
            },
          },
        },
        include: {
          steps: {
            orderBy: { stepNumber: 'asc' },
          },
        },
      })
    }

    if (isLastStep) {
      return tx.approvalInstance.update({
        where: { id: instanceId },
        data: {
          status: 'APPROVED',
          steps: {
            update: {
              where: {
                instanceId_stepNumber: {
                  instanceId,
                  stepNumber: instance.currentStep,
                },
              },
              data: {
                status: 'APPROVED',
                action,
                actorId,
                comments,
                actedAt: now,
              },
            },
          },
        },
        include: {
          steps: {
            orderBy: { stepNumber: 'asc' },
          },
        },
      })
    }

    return tx.approvalInstance.update({
      where: { id: instanceId },
      data: {
        currentStep: instance.currentStep + 1,
        status: 'UNDER_REVIEW',
        steps: {
          update: [
            {
              where: {
                instanceId_stepNumber: {
                  instanceId,
                  stepNumber: instance.currentStep,
                },
              },
              data: {
                status: 'APPROVED',
                action,
                actorId,
                comments,
                actedAt: now,
              },
            },
            {
              where: {
                instanceId_stepNumber: {
                  instanceId,
                  stepNumber: instance.currentStep + 1,
                },
              },
              data: {
                status: 'PENDING',
              },
            },
          ],
        },
      },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    })
  })

  return toResult(updated)
}

/**
 * Get the current approval status for an entity.
 */
export async function getApprovalStatus(
  entityType: string,
  entityId: string
): Promise<ApprovalResult | null> {
  const instance = await prisma.approvalInstance.findFirst({
    where: { entityType, entityId },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!instance) return null

  return toResult(instance)
}

export { DEFAULT_PR_WORKFLOW_NAME }

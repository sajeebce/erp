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

interface ApprovalResult {
  instanceId: string
  status: ApprovalStatus
  currentStep: number
  totalSteps: number
  isComplete: boolean
}

/**
 * Start an approval process for an entity.
 * Finds the matching workflow definition and creates an instance.
 */
export async function startApproval(params: StartApprovalParams): Promise<ApprovalResult> {
  const workflow = await prisma.approvalWorkflowDef.findFirst({
    where: {
      organizationId: params.organizationId,
      name: params.workflowName,
      isActive: true,
    },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
    },
  })

  if (!workflow) {
    throw new Error(`Approval workflow "${params.workflowName}" not found`)
  }

  // Filter steps based on amount thresholds
  const applicableSteps = workflow.steps.filter((step) => {
    if (params.amount === undefined) return step.isRequired
    const min = step.amountMin ? Number(step.amountMin) : 0
    const max = step.amountMax ? Number(step.amountMax) : Infinity
    return params.amount! >= min && params.amount! <= max
  })

  if (applicableSteps.length === 0) {
    throw new Error('No applicable approval steps found for this amount')
  }

  const instance = await prisma.approvalInstance.create({
    data: {
      workflowId: workflow.id,
      entityType: params.entityType,
      entityId: params.entityId,
      currentStep: 1,
      status: 'SUBMITTED',
      requestedById: params.requestedById,
      amount: params.amount,
    },
  })

  return {
    instanceId: instance.id,
    status: instance.status,
    currentStep: 1,
    totalSteps: applicableSteps.length,
    isComplete: false,
  }
}

/**
 * Process an approval action (approve or reject) on an instance.
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
      workflow: {
        include: {
          steps: { orderBy: { stepNumber: 'asc' } },
        },
      },
    },
  })

  if (!instance) {
    throw new Error('Approval instance not found')
  }

  if (instance.status !== 'SUBMITTED' && instance.status !== 'UNDER_REVIEW') {
    throw new Error(`Cannot process approval: current status is ${instance.status}`)
  }

  // Verify actor has the right role for current step
  const currentStepDef = instance.workflow.steps.find(
    (s) => s.stepNumber === instance.currentStep
  )

  if (!currentStepDef) {
    throw new Error('Current step definition not found')
  }

  // Record the action
  await prisma.approvalAction.create({
    data: {
      instanceId,
      stepNumber: instance.currentStep,
      action,
      actorId,
      comments,
    },
  })

  // Determine applicable steps count
  const applicableSteps = instance.workflow.steps.filter((step) => {
    if (instance.amount === null) return step.isRequired
    const amt = Number(instance.amount)
    const min = step.amountMin ? Number(step.amountMin) : 0
    const max = step.amountMax ? Number(step.amountMax) : Infinity
    return amt >= min && amt <= max
  })

  const totalSteps = applicableSteps.length

  if (action === 'REJECT') {
    await prisma.approvalInstance.update({
      where: { id: instanceId },
      data: { status: 'REJECTED' },
    })
    return {
      instanceId,
      status: 'REJECTED',
      currentStep: instance.currentStep,
      totalSteps,
      isComplete: true,
    }
  }

  if (action === 'RETURN') {
    const prevStep = Math.max(1, instance.currentStep - 1)
    await prisma.approvalInstance.update({
      where: { id: instanceId },
      data: { currentStep: prevStep, status: 'SUBMITTED' },
    })
    return {
      instanceId,
      status: 'SUBMITTED',
      currentStep: prevStep,
      totalSteps,
      isComplete: false,
    }
  }

  // APPROVE — move to next step or complete
  const isLastStep = instance.currentStep >= totalSteps

  if (isLastStep) {
    await prisma.approvalInstance.update({
      where: { id: instanceId },
      data: { status: 'APPROVED' },
    })
    return {
      instanceId,
      status: 'APPROVED',
      currentStep: instance.currentStep,
      totalSteps,
      isComplete: true,
    }
  }

  // Move to next step
  const nextStep = instance.currentStep + 1
  await prisma.approvalInstance.update({
    where: { id: instanceId },
    data: { currentStep: nextStep, status: 'UNDER_REVIEW' },
  })

  return {
    instanceId,
    status: 'UNDER_REVIEW',
    currentStep: nextStep,
    totalSteps,
    isComplete: false,
  }
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
      workflow: {
        include: { steps: true },
      },
      actions: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!instance) return null

  return {
    instanceId: instance.id,
    status: instance.status,
    currentStep: instance.currentStep,
    totalSteps: instance.workflow.steps.length,
    isComplete: instance.status === 'APPROVED' || instance.status === 'REJECTED',
  }
}

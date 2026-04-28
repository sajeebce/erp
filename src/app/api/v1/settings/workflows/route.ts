import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest, requireRoleFromRequest } from '@/lib/auth'
import { apiBadRequest, apiCreated, apiSuccess, handleRouteError } from '@/lib/api-response'

interface WorkflowStepInput {
  name?: string
  roleId?: string
  amountMin?: number | string | null
  amountMax?: number | string | null
  isRequired?: boolean
}

function decimalOrNull(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return null
  return new Prisma.Decimal(value)
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const workflows = await prisma.approvalWorkflowDef.findMany({
      where: { organizationId: auth.organizationId },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
      orderBy: [{ module: 'asc' }, { name: 'asc' }],
    })

    const roleIds = workflows.flatMap((workflow) => workflow.steps.map((step) => step.roleId))
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds }, organizationId: auth.organizationId },
      select: { id: true, name: true },
    })
    const roleNameById = new Map(roles.map((role) => [role.id, role.name]))

    return apiSuccess(
      workflows.map((workflow) => ({
        id: workflow.id,
        name: workflow.name,
        module: workflow.module,
        entityType: workflow.entityType,
        description: workflow.description,
        isActive: workflow.isActive,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
        steps: workflow.steps.map((step) => ({
          id: step.id,
          stepNumber: step.stepNumber,
          name: step.name,
          roleId: step.roleId,
          roleName: roleNameById.get(step.roleId) || 'UNKNOWN',
          amountMin: step.amountMin?.toString() || null,
          amountMax: step.amountMax?.toString() || null,
          isRequired: step.isRequired,
        })),
      }))
    )
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const workflowModule = typeof body.module === 'string' ? body.module.trim() : ''
    const entityType = typeof body.entityType === 'string' ? body.entityType.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : null
    const isActive = typeof body.isActive === 'boolean' ? body.isActive : true
    const steps = Array.isArray(body.steps) ? (body.steps as WorkflowStepInput[]) : []

    if (!name) return apiBadRequest('Workflow name is required')
    if (!workflowModule) return apiBadRequest('Workflow module is required')
    if (!entityType) return apiBadRequest('Workflow entityType is required')
    if (steps.length === 0) return apiBadRequest('At least one workflow step is required')

    const cleanedSteps = steps.map((step, index) => ({
      stepNumber: index + 1,
      name: typeof step.name === 'string' && step.name.trim() ? step.name.trim() : `Step ${index + 1}`,
      roleId: typeof step.roleId === 'string' ? step.roleId : '',
      amountMin: decimalOrNull(step.amountMin),
      amountMax: decimalOrNull(step.amountMax),
      isRequired: step.isRequired !== false,
    }))

    if (cleanedSteps.some((step) => !step.roleId)) {
      return apiBadRequest('Each workflow step requires a roleId')
    }

    const roleCount = await prisma.role.count({
      where: {
        id: { in: cleanedSteps.map((step) => step.roleId) },
        organizationId: auth.organizationId,
      },
    })

    if (roleCount !== new Set(cleanedSteps.map((step) => step.roleId)).size) {
      return apiBadRequest('One or more workflow step roles do not belong to this organization')
    }

    const existing = await prisma.approvalWorkflowDef.findFirst({
      where: { organizationId: auth.organizationId, name },
      select: { id: true },
    })

    const workflow = await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.approvalWorkflowStep.deleteMany({ where: { workflowId: existing.id } })
        return tx.approvalWorkflowDef.update({
          where: { id: existing.id },
          data: {
            module: workflowModule,
            entityType,
            description,
            isActive,
            steps: { create: cleanedSteps },
          },
          include: { steps: { orderBy: { stepNumber: 'asc' } } },
        })
      }

      return tx.approvalWorkflowDef.create({
        data: {
          organizationId: auth.organizationId,
          name,
          module: workflowModule,
          entityType,
          description,
          isActive,
          steps: { create: cleanedSteps },
        },
        include: { steps: { orderBy: { stepNumber: 'asc' } } },
      })
    })

    return apiCreated(workflow)
  } catch (error) {
    return handleRouteError(error)
  }
}

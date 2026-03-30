import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ employeeId: string; checklistId: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { employeeId, checklistId } = await params
    const body = await request.json()

    // Validate employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: { id: true, fullName: true },
    })

    if (!employee) {
      return apiNotFound('Employee not found')
    }

    // Find the progress record
    const progress = await prisma.onboardingProgress.findUnique({
      where: {
        employeeId_checklistId: { employeeId, checklistId },
      },
      include: {
        checklist: {
          select: { name: true, requiresDocument: true },
        },
      },
    })

    if (!progress) {
      return apiNotFound('Onboarding task not found for this employee')
    }

    // If completing a task that requires a document, documentId must be provided
    if (body.isCompleted === true && progress.checklist.requiresDocument && !body.documentId) {
      return apiBadRequest(
        `This task requires a document upload. Provide documentId to complete "${progress.checklist.name}".`
      )
    }

    const updateData: Record<string, unknown> = {}

    if (body.isCompleted === true) {
      updateData.isCompleted = true
      updateData.completedAt = new Date()
      updateData.completedById = auth.userId
    } else if (body.isCompleted === false) {
      updateData.isCompleted = false
      updateData.completedAt = null
      updateData.completedById = null
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }

    if (body.documentId !== undefined) {
      updateData.documentId = body.documentId
    }

    const updated = await prisma.onboardingProgress.update({
      where: {
        employeeId_checklistId: { employeeId, checklistId },
      },
      data: updateData,
      include: {
        checklist: {
          select: { id: true, name: true, category: true },
        },
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'onboarding-task',
      resourceId: updated.id,
      description: `${body.isCompleted ? 'Completed' : 'Uncompleted'} onboarding task "${progress.checklist.name}" for "${employee.fullName}"`,
      newValues: { isCompleted: updated.isCompleted, checklistId, employeeId },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

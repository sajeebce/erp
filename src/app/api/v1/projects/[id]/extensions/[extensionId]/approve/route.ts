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
import {
  PROJECT_EXTENSION_SELECT,
  assertBudgetUnchanged,
  assertExtensionAllowed,
  ensureFutureExtensionDate,
  normalizeOptionalString,
} from '@/lib/project-extensions'

interface RouteParams {
  params: Promise<{ id: string; extensionId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id, extensionId } = await params
    const body = await request.json().catch(() => ({}))
    const approvalNotes = normalizeOptionalString(body.approvalNotes)

    const existing = await prisma.projectExtensionRequest.findFirst({
      where: {
        id: extensionId,
        projectId: id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      include: {
        project: true,
      },
    })
    if (!existing) return apiNotFound('Extension request not found')
    if (existing.status !== 'PENDING_APPROVAL') {
      return apiBadRequest(`Only PENDING_APPROVAL extension requests can be approved. Current status: ${existing.status}`)
    }

    assertExtensionAllowed(existing.project)
    assertBudgetUnchanged(existing.project.totalBudget, existing.currentBudget)
    ensureFutureExtensionDate(existing.project.endDate!, existing.proposedEndDate)

    const oldEndDate = existing.project.endDate
    const oldBudget = existing.project.totalBudget

    const approved = await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: { endDate: existing.proposedEndDate },
      })

      return tx.projectExtensionRequest.update({
        where: { id: extensionId },
        data: {
          status: 'APPROVED',
          approvedById: auth.userId,
          approvedAt: new Date(),
          approvalNotes,
        },
        select: PROJECT_EXTENSION_SELECT,
      })
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'APPROVE',
      module: 'project',
      resource: 'project_extension_request',
      resourceId: extensionId,
      description: `Approved no-cost extension request ${existing.requestNo} for project ${existing.project.projectNo}`,
      oldValues: {
        projectId: id,
        endDate: oldEndDate,
        totalBudget: oldBudget.toString(),
        requestStatus: existing.status,
      },
      newValues: {
        projectId: id,
        endDate: existing.proposedEndDate,
        totalBudget: oldBudget.toString(),
        requestStatus: 'APPROVED',
        approvalNotes,
      },
      ...auditCtx,
    })

    return apiSuccess(approved)
  } catch (error) {
    return handleRouteError(error)
  }
}

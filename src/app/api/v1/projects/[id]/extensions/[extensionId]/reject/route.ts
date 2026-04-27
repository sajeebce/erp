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
    const rejectionReason = normalizeOptionalString(body.rejectionReason)

    if (!rejectionReason) return apiBadRequest('rejectionReason is required')

    const existing = await prisma.projectExtensionRequest.findFirst({
      where: {
        id: extensionId,
        projectId: id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      include: {
        project: { select: { projectNo: true } },
      },
    })
    if (!existing) return apiNotFound('Extension request not found')
    if (existing.status !== 'PENDING_APPROVAL') {
      return apiBadRequest(`Only PENDING_APPROVAL extension requests can be rejected. Current status: ${existing.status}`)
    }

    const rejected = await prisma.projectExtensionRequest.update({
      where: { id: extensionId },
      data: {
        status: 'REJECTED',
        rejectedById: auth.userId,
        rejectedAt: new Date(),
        rejectionReason,
      },
      select: PROJECT_EXTENSION_SELECT,
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'REJECT',
      module: 'project',
      resource: 'project_extension_request',
      resourceId: extensionId,
      description: `Rejected no-cost extension request ${existing.requestNo} for project ${existing.project.projectNo}`,
      oldValues: { requestStatus: existing.status },
      newValues: { requestStatus: 'REJECTED', rejectionReason },
      ...auditCtx,
    })

    return apiSuccess(rejected)
  } catch (error) {
    return handleRouteError(error)
  }
}

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
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return apiBadRequest('reason is required')
    }

    const application = await prisma.jobApplication.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!application) {
      return apiNotFound('Application not found')
    }

    if (application.status === 'REJECTED') {
      return apiBadRequest('Application is already rejected')
    }

    if (application.status === 'HIRED') {
      return apiBadRequest('Cannot reject a hired application')
    }

    const updated = await prisma.jobApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'job-application',
      resourceId: id,
      description: `Rejected application "${application.applicationNo}" for ${application.applicantName}`,
      oldValues: { status: application.status },
      newValues: { status: 'REJECTED', rejectionReason: reason },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

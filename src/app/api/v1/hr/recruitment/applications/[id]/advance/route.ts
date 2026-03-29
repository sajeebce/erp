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

const PIPELINE_ORDER = [
  'APPLIED',
  'SCREENED',
  'SHORTLISTED',
  'TECHNICAL_TEST',
  'INTERVIEW',
  'REFERENCE_CHECK',
  'OFFER',
  'HIRED',
] as const

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const application = await prisma.jobApplication.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!application) {
      return apiNotFound('Application not found')
    }

    if (application.status === 'REJECTED' || application.status === 'WITHDRAWN') {
      return apiBadRequest('Cannot advance a rejected or withdrawn application')
    }

    const currentIndex = PIPELINE_ORDER.indexOf(application.status as typeof PIPELINE_ORDER[number])
    if (currentIndex === -1) {
      return apiBadRequest(`Application status "${application.status}" is not in the pipeline`)
    }

    if (currentIndex >= PIPELINE_ORDER.length - 1) {
      return apiBadRequest('Application is already at the final stage (HIRED)')
    }

    const nextStatus = PIPELINE_ORDER[currentIndex + 1]

    const updated = await prisma.jobApplication.update({
      where: { id },
      data: { status: nextStatus },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'job-application',
      resourceId: id,
      description: `Advanced application "${application.applicationNo}" from ${application.status} to ${nextStatus}`,
      oldValues: { status: application.status },
      newValues: { status: nextStatus },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

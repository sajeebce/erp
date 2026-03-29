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

    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!jobPosting) {
      return apiNotFound('Job posting not found')
    }

    if (jobPosting.status !== 'DRAFT' && jobPosting.status !== 'ON_HOLD') {
      return apiBadRequest('Job posting can only be published from DRAFT or ON_HOLD status')
    }

    const updated = await prisma.jobPosting.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'job-posting',
      resourceId: id,
      description: `Published job posting "${jobPosting.title}" (${jobPosting.postingNo})`,
      oldValues: { status: jobPosting.status },
      newValues: { status: 'PUBLISHED' },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

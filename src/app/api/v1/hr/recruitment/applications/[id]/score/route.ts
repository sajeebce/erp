import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { apiSuccess, apiNotFound, handleRouteError } from '@/lib/api-response'
import { autoScoreApplication } from '@/lib/recruitment-scoring'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.jobApplication.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true, applicationNo: true },
    })

    if (!existing) {
      return apiNotFound('Application not found')
    }

    await autoScoreApplication(id)

    const updated = await prisma.jobApplication.findUnique({
      where: { id },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'job-application',
      resourceId: id,
      description: `Auto-scored application "${existing.applicationNo}"`,
      newValues: updated?.scoreBreakdown && typeof updated.scoreBreakdown === 'object'
        ? { scoreBreakdown: updated.scoreBreakdown }
        : undefined,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

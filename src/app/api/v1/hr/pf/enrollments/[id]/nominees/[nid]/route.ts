import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiMessage, apiNotFound, handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string; nid: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id, nid } = await params

    const enrollment = await prisma.pFEnrollment.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true },
    })
    if (!enrollment) {
      return apiNotFound('PF enrollment not found')
    }

    const nominee = await prisma.pFNominee.findFirst({
      where: { id: nid, enrollmentId: id },
    })
    if (!nominee) {
      return apiNotFound('Nominee not found')
    }

    await prisma.pFNominee.delete({ where: { id: nid } })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'DELETE',
      module: 'hr',
      resource: 'pf_nominee',
      resourceId: nid,
      description: `Removed PF nominee "${nominee.name}"`,
      oldValues: { name: nominee.name, percentage: nominee.percentage.toString() },
      ...auditCtx,
    })

    return apiMessage('Nominee removed successfully')
  } catch (error) {
    return handleRouteError(error)
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess, apiBadRequest, apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string; tid: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id, tid } = await params

    const trust = await prisma.pFTrust.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true },
    })
    if (!trust) {
      return apiNotFound('PF trust not found')
    }

    const existing = await prisma.pFTrustee.findFirst({
      where: { id: tid, trustId: id },
    })
    if (!existing) {
      return apiNotFound('Trustee not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    const fields = ['name', 'role', 'employeeId', 'appointedDate', 'isActive']
    for (const f of fields) {
      if (body[f] !== undefined) {
        data[f] = f === 'appointedDate' && body[f] ? new Date(body[f]) : body[f]
      }
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.pFTrustee.update({ where: { id: tid }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'pf_trustee',
      resourceId: tid,
      description: `Updated trustee "${updated.name}"`,
      oldValues: { name: existing.name, role: existing.role },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

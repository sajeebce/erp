import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess, apiBadRequest, apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.pFTrust.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('PF trust not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    const fields = ['name', 'registrationNo', 'registrationDate', 'bankAccountId', 'isActive']
    for (const f of fields) {
      if (body[f] !== undefined) {
        data[f] = f === 'registrationDate' && body[f] ? new Date(body[f]) : body[f]
      }
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.pFTrust.update({ where: { id }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'pf_trust',
      resourceId: id,
      description: `Updated PF trust "${updated.name}"`,
      oldValues: { name: existing.name },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

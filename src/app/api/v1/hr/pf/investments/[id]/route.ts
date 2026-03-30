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

    const existing = await prisma.pFInvestment.findFirst({
      where: { id },
      include: {
        trust: { select: { organizationId: true } },
      },
    })
    if (!existing || existing.trust.organizationId !== auth.organizationId) {
      return apiNotFound('PF investment not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    const fields = ['currentValue', 'status', 'maturityDate']
    for (const f of fields) {
      if (body[f] !== undefined) {
        data[f] = f === 'maturityDate' && body[f] ? new Date(body[f]) : body[f]
      }
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.pFInvestment.update({ where: { id }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'pf_investment',
      resourceId: id,
      description: `Updated PF investment at ${existing.institutionName}`,
      oldValues: { status: existing.status },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

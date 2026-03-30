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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const policy = await prisma.gratuityPolicy.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!policy) {
      return apiNotFound('Gratuity policy not found')
    }

    return apiSuccess(policy)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.gratuityPolicy.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('Gratuity policy not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    const fields = ['name', 'isDefault', 'vestingPeriodMonths', 'minServiceMonths', 'formulaType', 'ratePerYear', 'calculationBase', 'rateBands', 'accrualFrequency', 'fundBankAccountId', 'maintainFund', 'isActive']
    for (const f of fields) {
      if (body[f] !== undefined) data[f] = body[f]
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    // If setting as default, unset others
    if (data.isDefault === true) {
      await prisma.gratuityPolicy.updateMany({
        where: { organizationId: auth.organizationId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      })
    }

    const updated = await prisma.gratuityPolicy.update({ where: { id }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'gratuity_policy',
      resourceId: id,
      description: `Updated gratuity policy "${updated.name}"`,
      oldValues: { name: existing.name },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated, apiSuccess, apiBadRequest, apiConflict,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const policies = await prisma.gratuityPolicy.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { createdAt: 'desc' },
    })

    return apiSuccess(policies)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { name, vestingPeriodMonths, minServiceMonths, formulaType, ratePerYear, calculationBase, rateBands, accrualFrequency, fundBankAccountId, maintainFund, isDefault } = body

    if (!name) {
      return apiBadRequest('name is required')
    }

    const existing = await prisma.gratuityPolicy.findFirst({
      where: { organizationId: auth.organizationId, name },
    })
    if (existing) {
      return apiConflict(`Gratuity policy "${name}" already exists`)
    }

    // If setting as default, unset others
    if (isDefault) {
      await prisma.gratuityPolicy.updateMany({
        where: { organizationId: auth.organizationId, isDefault: true },
        data: { isDefault: false },
      })
    }

    const policy = await prisma.gratuityPolicy.create({
      data: {
        organizationId: auth.organizationId,
        name: name.trim(),
        isDefault: isDefault || false,
        vestingPeriodMonths: vestingPeriodMonths ?? 60,
        minServiceMonths: minServiceMonths ?? 0,
        formulaType: formulaType || 'MONTHS_PER_YEAR',
        ratePerYear: ratePerYear ?? 1.0,
        calculationBase: calculationBase || 'LAST_BASIC',
        rateBands: rateBands || null,
        accrualFrequency: accrualFrequency || 'MONTHLY',
        fundBankAccountId: fundBankAccountId || null,
        maintainFund: maintainFund ?? true,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'gratuity_policy',
      resourceId: policy.id,
      description: `Created gratuity policy "${name}"`,
      newValues: { name },
      ...auditCtx,
    })

    return apiCreated(policy)
  } catch (error) {
    return handleRouteError(error)
  }
}

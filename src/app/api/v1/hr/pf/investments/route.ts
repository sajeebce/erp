import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated, apiSuccess, apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    // Get trust for this org
    const trust = await prisma.pFTrust.findFirst({
      where: { organizationId: auth.organizationId },
      select: { id: true },
    })

    if (!trust) {
      return apiSuccess([])
    }

    const investments = await prisma.pFInvestment.findMany({
      where: { trustId: trust.id },
      orderBy: { startDate: 'desc' },
    })

    return apiSuccess(investments)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { trustId, type, institutionName, accountNo, amount, interestRate, startDate, maturityDate } = body

    if (!trustId || !type || !institutionName || !amount || !interestRate || !startDate) {
      return apiBadRequest('trustId, type, institutionName, amount, interestRate, and startDate are required')
    }

    // Verify trust belongs to org
    const trust = await prisma.pFTrust.findFirst({
      where: { id: trustId, organizationId: auth.organizationId },
    })
    if (!trust) {
      return apiBadRequest('PF trust not found')
    }

    const investment = await prisma.pFInvestment.create({
      data: {
        trustId,
        type,
        institutionName: institutionName.trim(),
        accountNo: accountNo || null,
        amount,
        interestRate,
        startDate: new Date(startDate),
        maturityDate: maturityDate ? new Date(maturityDate) : null,
        currentValue: amount,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'pf_investment',
      resourceId: investment.id,
      description: `Created PF investment: ${type} at ${institutionName} for ${amount}`,
      newValues: { type, institutionName, amount },
      ...auditCtx,
    })

    return apiCreated(investment)
  } catch (error) {
    return handleRouteError(error)
  }
}

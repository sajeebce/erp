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

    const trusts = await prisma.pFTrust.findMany({
      where: { organizationId: auth.organizationId },
      include: {
        trustees: {
          where: { isActive: true },
          orderBy: { appointedDate: 'asc' },
        },
        investments: {
          where: { status: 'ACTIVE' },
        },
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 10,
        },
      },
    })

    return apiSuccess(trusts)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { name, registrationNo, registrationDate, bankAccountId } = body

    if (!name) {
      return apiBadRequest('name is required')
    }

    const trust = await prisma.pFTrust.create({
      data: {
        organizationId: auth.organizationId,
        name: name.trim(),
        registrationNo: registrationNo || null,
        registrationDate: registrationDate ? new Date(registrationDate) : null,
        bankAccountId: bankAccountId || null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'pf_trust',
      resourceId: trust.id,
      description: `Created PF trust "${name}"`,
      newValues: { name, registrationNo },
      ...auditCtx,
    })

    return apiCreated(trust)
  } catch (error) {
    return handleRouteError(error)
  }
}

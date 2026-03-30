import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiCreated, apiPaginated, apiBadRequest,
  handleRouteError, parsePaginationParams,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Prisma.PFWithdrawalWhereInput = {
      organizationId: auth.organizationId,
    }

    const status = url.searchParams.get('status')
    const employeeId = url.searchParams.get('employeeId')
    if (status) where.status = status
    if (employeeId) where.employeeId = employeeId

    const [withdrawals, total] = await Promise.all([
      prisma.pFWithdrawal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pFWithdrawal.count({ where }),
    ])

    return apiPaginated(withdrawals, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { employeeId, amount, reason, description, supportingDocs } = body

    if (!employeeId || !amount || !reason) {
      return apiBadRequest('employeeId, amount, and reason are required')
    }

    const enrollment = await prisma.pFEnrollment.findFirst({
      where: { organizationId: auth.organizationId, employeeId, status: 'ACTIVE' },
    })
    if (!enrollment) {
      return apiBadRequest('No active PF enrollment found for this employee')
    }

    // Check amount doesn't exceed balance
    if (new Prisma.Decimal(amount).gt(enrollment.totalEmployeeContrib)) {
      return apiBadRequest('Withdrawal amount exceeds employee contribution balance')
    }

    const withdrawalNo = await generateNextNumber(auth.organizationId, 'pf_withdrawal')

    const withdrawal = await prisma.pFWithdrawal.create({
      data: {
        organizationId: auth.organizationId,
        withdrawalNo,
        enrollmentId: enrollment.id,
        employeeId,
        amount,
        reason,
        description: description || null,
        supportingDocs: supportingDocs || null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'pf_withdrawal',
      resourceId: withdrawal.id,
      description: `Submitted PF withdrawal ${withdrawalNo} for ${amount}`,
      newValues: { withdrawalNo, amount, reason },
      ...auditCtx,
    })

    return apiCreated(withdrawal)
  } catch (error) {
    return handleRouteError(error)
  }
}

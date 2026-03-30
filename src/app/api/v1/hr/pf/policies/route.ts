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

    const policies = await prisma.pFPolicy.findMany({
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

    const { name, vestingSchedule } = body

    if (!name || !vestingSchedule) {
      return apiBadRequest('name and vestingSchedule are required')
    }

    const existing = await prisma.pFPolicy.findFirst({
      where: { organizationId: auth.organizationId, name },
    })
    if (existing) {
      return apiConflict(`PF policy "${name}" already exists`)
    }

    if (body.isDefault) {
      await prisma.pFPolicy.updateMany({
        where: { organizationId: auth.organizationId, isDefault: true },
        data: { isDefault: false },
      })
    }

    const policy = await prisma.pFPolicy.create({
      data: {
        organizationId: auth.organizationId,
        name: name.trim(),
        isDefault: body.isDefault || false,
        employeeContribRate: body.employeeContribRate ?? 10.0,
        employerContribRate: body.employerContribRate ?? 10.0,
        contributionBase: body.contributionBase || 'BASIC',
        eligibilityMonths: body.eligibilityMonths ?? 0,
        eligibilityTypes: body.eligibilityTypes || null,
        vestingSchedule,
        interestRate: body.interestRate ?? 9.0,
        interestCalcMethod: body.interestCalcMethod || 'MONTHLY_BALANCE',
        interestPostingFreq: body.interestPostingFreq || 'ANNUAL',
        allowPartialWithdraw: body.allowPartialWithdraw ?? true,
        maxWithdrawPercent: body.maxWithdrawPercent || null,
        withdrawalReasons: body.withdrawalReasons || null,
        minServiceForWithdraw: body.minServiceForWithdraw ?? 12,
        allowLoan: body.allowLoan ?? true,
        maxLoanPercent: body.maxLoanPercent ?? 80.0,
        loanInterestRate: body.loanInterestRate ?? 5.0,
        maxLoanRepayMonths: body.maxLoanRepayMonths ?? 36,
        maxActiveLoans: body.maxActiveLoans ?? 1,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'pf_policy',
      resourceId: policy.id,
      description: `Created PF policy "${name}"`,
      newValues: { name },
      ...auditCtx,
    })

    return apiCreated(policy)
  } catch (error) {
    return handleRouteError(error)
  }
}

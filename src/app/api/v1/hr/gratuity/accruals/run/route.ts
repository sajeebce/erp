import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess, apiBadRequest, handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { month, year } = body

    if (!month || !year) {
      return apiBadRequest('month and year are required')
    }

    // Get all active gratuity ledgers with employee and policy data
    const ledgers = await prisma.gratuityLedger.findMany({
      where: {
        organizationId: auth.organizationId,
        isActive: true,
      },
      include: {
        employee: {
          select: { id: true, fullName: true, basicSalary: true, status: true },
        },
      },
    })

    // Get policies
    const policyIds = [...new Set(ledgers.map((l) => l.policyId))]
    const policies = await prisma.gratuityPolicy.findMany({
      where: { id: { in: policyIds } },
    })
    const policyMap = new Map(policies.map((p) => [p.id, p]))

    let processedCount = 0
    let totalAccrualAmount = new Prisma.Decimal(0)

    for (const ledger of ledgers) {
      if (ledger.employee.status !== 'ACTIVE' || !ledger.employee.basicSalary) continue

      const policy = policyMap.get(ledger.policyId)
      if (!policy) continue

      // Check if already accrued for this month
      const existing = await prisma.gratuityAccrual.findFirst({
        where: { ledgerId: ledger.id, accrualMonth: month, accrualYear: year },
      })
      if (existing) continue

      const basicSalary = ledger.employee.basicSalary
      const accrualAmount = new Prisma.Decimal(basicSalary.toString())
        .div(12)
        .mul(policy.ratePerYear)

      const now = new Date()
      const serviceMs = now.getTime() - new Date(ledger.serviceStartDate).getTime()
      const serviceMonths = Math.floor(serviceMs / (30.44 * 24 * 60 * 60 * 1000))

      // Check vesting
      const isVested = serviceMonths >= policy.vestingPeriodMonths

      await prisma.$transaction([
        prisma.gratuityAccrual.create({
          data: {
            organizationId: auth.organizationId,
            ledgerId: ledger.id,
            employeeId: ledger.employeeId,
            accrualMonth: month,
            accrualYear: year,
            basicSalary,
            accrualAmount,
            serviceMonths,
          },
        }),
        prisma.gratuityLedger.update({
          where: { id: ledger.id },
          data: {
            totalAccrued: { increment: accrualAmount },
            currentBalance: { increment: accrualAmount },
            lastAccrualDate: new Date(),
            isVested,
          },
        }),
      ])

      processedCount++
      totalAccrualAmount = totalAccrualAmount.add(accrualAmount)
    }

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'gratuity_accrual_run',
      resourceId: `${year}-${month}`,
      description: `Ran gratuity accrual for ${month}/${year}: ${processedCount} employees, total ${totalAccrualAmount}`,
      newValues: { month, year, processedCount, totalAccrualAmount: totalAccrualAmount.toString() },
      ...auditCtx,
    })

    return apiSuccess({
      month,
      year,
      processedCount,
      totalAccrualAmount: totalAccrualAmount.toString(),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

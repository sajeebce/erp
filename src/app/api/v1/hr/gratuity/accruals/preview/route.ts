import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess, apiBadRequest, handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const url = new URL(request.url)

    const month = url.searchParams.get('month')
    const year = url.searchParams.get('year')

    if (!month || !year) {
      return apiBadRequest('month and year query params are required')
    }

    const monthInt = parseInt(month)
    const yearInt = parseInt(year)

    const ledgers = await prisma.gratuityLedger.findMany({
      where: {
        organizationId: auth.organizationId,
        isActive: true,
      },
      include: {
        employee: {
          select: { id: true, employeeNo: true, fullName: true, basicSalary: true, status: true },
        },
      },
    })

    const policyIds = [...new Set(ledgers.map((l) => l.policyId))]
    const policies = await prisma.gratuityPolicy.findMany({
      where: { id: { in: policyIds } },
    })
    const policyMap = new Map(policies.map((p) => [p.id, p]))

    const preview = []
    let totalAmount = new Prisma.Decimal(0)

    for (const ledger of ledgers) {
      if (ledger.employee.status !== 'ACTIVE' || !ledger.employee.basicSalary) continue

      const policy = policyMap.get(ledger.policyId)
      if (!policy) continue

      // Check if already accrued
      const existing = await prisma.gratuityAccrual.findFirst({
        where: { ledgerId: ledger.id, accrualMonth: monthInt, accrualYear: yearInt },
      })
      if (existing) continue

      const basicSalary = ledger.employee.basicSalary
      const accrualAmount = new Prisma.Decimal(basicSalary.toString())
        .div(12)
        .mul(policy.ratePerYear)

      const now = new Date()
      const serviceMs = now.getTime() - new Date(ledger.serviceStartDate).getTime()
      const serviceMonths = Math.floor(serviceMs / (30.44 * 24 * 60 * 60 * 1000))

      preview.push({
        employeeId: ledger.employeeId,
        employeeNo: ledger.employee.employeeNo,
        fullName: ledger.employee.fullName,
        basicSalary: basicSalary.toString(),
        accrualAmount: accrualAmount.toString(),
        serviceMonths,
        isVested: serviceMonths >= policy.vestingPeriodMonths,
      })

      totalAmount = totalAmount.add(accrualAmount)
    }

    return apiSuccess({
      month: monthInt,
      year: yearInt,
      employeeCount: preview.length,
      totalAmount: totalAmount.toString(),
      employees: preview,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

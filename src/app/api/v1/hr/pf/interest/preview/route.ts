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

    const rateParam = url.searchParams.get('interestRate')

    let rate: number
    if (rateParam) {
      rate = parseFloat(rateParam)
    } else {
      const defaultPolicy = await prisma.pFPolicy.findFirst({
        where: { organizationId: auth.organizationId, isDefault: true, isActive: true },
        select: { interestRate: true },
      })
      rate = defaultPolicy?.interestRate ? Number(defaultPolicy.interestRate) : 9.0
    }

    const enrollments = await prisma.pFEnrollment.findMany({
      where: {
        organizationId: auth.organizationId,
        status: 'ACTIVE',
      },
      include: {
        employee: {
          select: { id: true, employeeNo: true, fullName: true },
        },
      },
    })

    const preview = []
    let totalInterest = new Prisma.Decimal(0)

    for (const enrollment of enrollments) {
      if (enrollment.currentBalance.lte(0)) continue

      const interestAmount = new Prisma.Decimal(enrollment.currentBalance.toString())
        .mul(rate)
        .div(100)

      preview.push({
        employeeId: enrollment.employeeId,
        employeeNo: enrollment.employee.employeeNo,
        fullName: enrollment.employee.fullName,
        currentBalance: enrollment.currentBalance.toString(),
        interestRate: rate,
        interestAmount: interestAmount.toString(),
        projectedBalance: enrollment.currentBalance.add(interestAmount).toString(),
      })

      totalInterest = totalInterest.add(interestAmount)
    }

    return apiSuccess({
      interestRate: rate,
      memberCount: preview.length,
      totalInterest: totalInterest.toString(),
      members: preview,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

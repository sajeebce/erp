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

    const periodEnd = new Date(year, month, 0, 23, 59, 59)

    const enrollments = await prisma.pFEnrollment.findMany({
      where: {
        organizationId: auth.organizationId,
        status: 'ACTIVE',
        effectiveDate: { lte: periodEnd },
      },
      include: {
        employee: {
          select: { id: true, fullName: true, basicSalary: true, status: true },
        },
      },
    })

    let processedCount = 0
    let totalEmployeeAmount = new Prisma.Decimal(0)
    let totalEmployerAmount = new Prisma.Decimal(0)

    for (const enrollment of enrollments) {
      if (enrollment.employee.status !== 'ACTIVE' || !enrollment.employee.basicSalary) continue

      // Check if already contributed for this month
      const existing = await prisma.pFContribution.findFirst({
        where: { enrollmentId: enrollment.id, month, year },
      })
      if (existing) continue

      const basicSalary = enrollment.employee.basicSalary
      const employeeAmount = new Prisma.Decimal(basicSalary.toString())
        .mul(enrollment.employeeRate)
        .div(100)
      const employerAmount = new Prisma.Decimal(basicSalary.toString())
        .mul(enrollment.employerRate)
        .div(100)
      const totalAmount = employeeAmount.add(employerAmount)

      await prisma.$transaction([
        prisma.pFContribution.create({
          data: {
            organizationId: auth.organizationId,
            enrollmentId: enrollment.id,
            employeeId: enrollment.employeeId,
            month,
            year,
            basicSalary,
            employeeAmount,
            employerAmount,
            totalAmount,
          },
        }),
        prisma.pFEnrollment.update({
          where: { id: enrollment.id },
          data: {
            totalEmployeeContrib: { increment: employeeAmount },
            totalEmployerContrib: { increment: employerAmount },
            currentBalance: { increment: totalAmount },
          },
        }),
      ])

      processedCount++
      totalEmployeeAmount = totalEmployeeAmount.add(employeeAmount)
      totalEmployerAmount = totalEmployerAmount.add(employerAmount)
    }

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'pf_contribution_run',
      resourceId: `${year}-${month}`,
      description: `Ran PF contributions for ${month}/${year}: ${processedCount} employees`,
      newValues: {
        month, year, processedCount,
        totalEmployeeAmount: totalEmployeeAmount.toString(),
        totalEmployerAmount: totalEmployerAmount.toString(),
      },
      ...auditCtx,
    })

    return apiSuccess({
      month,
      year,
      processedCount,
      totalEmployeeAmount: totalEmployeeAmount.toString(),
      totalEmployerAmount: totalEmployerAmount.toString(),
      totalAmount: totalEmployeeAmount.add(totalEmployerAmount).toString(),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

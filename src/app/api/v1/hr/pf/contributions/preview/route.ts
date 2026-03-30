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

    const enrollments = await prisma.pFEnrollment.findMany({
      where: {
        organizationId: auth.organizationId,
        status: 'ACTIVE',
      },
      include: {
        employee: {
          select: { id: true, employeeNo: true, fullName: true, basicSalary: true, status: true },
        },
      },
    })

    const preview = []
    let totalEmployee = new Prisma.Decimal(0)
    let totalEmployer = new Prisma.Decimal(0)

    for (const enrollment of enrollments) {
      if (enrollment.employee.status !== 'ACTIVE' || !enrollment.employee.basicSalary) continue

      const existing = await prisma.pFContribution.findFirst({
        where: { enrollmentId: enrollment.id, month: monthInt, year: yearInt },
      })
      if (existing) continue

      const basicSalary = enrollment.employee.basicSalary
      const employeeAmount = new Prisma.Decimal(basicSalary.toString())
        .mul(enrollment.employeeRate)
        .div(100)
      const employerAmount = new Prisma.Decimal(basicSalary.toString())
        .mul(enrollment.employerRate)
        .div(100)

      preview.push({
        employeeId: enrollment.employeeId,
        employeeNo: enrollment.employee.employeeNo,
        fullName: enrollment.employee.fullName,
        basicSalary: basicSalary.toString(),
        employeeRate: enrollment.employeeRate.toString(),
        employerRate: enrollment.employerRate.toString(),
        employeeAmount: employeeAmount.toString(),
        employerAmount: employerAmount.toString(),
        totalAmount: employeeAmount.add(employerAmount).toString(),
      })

      totalEmployee = totalEmployee.add(employeeAmount)
      totalEmployer = totalEmployer.add(employerAmount)
    }

    return apiSuccess({
      month: monthInt,
      year: yearInt,
      employeeCount: preview.length,
      totalEmployeeAmount: totalEmployee.toString(),
      totalEmployerAmount: totalEmployer.toString(),
      totalAmount: totalEmployee.add(totalEmployer).toString(),
      employees: preview,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

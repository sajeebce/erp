import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiPaginated, handleRouteError, parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where = { organizationId: auth.organizationId }

    const [enrollments, total] = await Promise.all([
      prisma.pFEnrollment.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeNo: true,
              fullName: true,
              joiningDate: true,
              basicSalary: true,
              department: { select: { id: true, name: true } },
              designation: { select: { id: true, title: true } },
            },
          },
          nominees: {
            select: { name: true, relationship: true, percentage: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.pFEnrollment.count({ where }),
    ])

    const register = enrollments.map((e) => ({
      enrollmentId: e.id,
      employeeId: e.employeeId,
      employeeNo: e.employee.employeeNo,
      fullName: e.employee.fullName,
      department: e.employee.department?.name || null,
      designation: e.employee.designation?.title || null,
      enrollmentDate: e.enrollmentDate,
      employeeRate: e.employeeRate.toString(),
      employerRate: e.employerRate.toString(),
      totalEmployeeContrib: e.totalEmployeeContrib.toString(),
      totalEmployerContrib: e.totalEmployerContrib.toString(),
      totalInterest: e.totalInterest.toString(),
      currentBalance: e.currentBalance.toString(),
      status: e.status,
      nominees: e.nominees,
    }))

    return apiPaginated(register, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

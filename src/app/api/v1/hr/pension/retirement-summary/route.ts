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

    const orgId = auth.organizationId

    // Get active employees with their PF and gratuity data
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where: { organizationId: orgId, status: 'ACTIVE', deletedAt: null },
        select: {
          id: true,
          employeeNo: true,
          fullName: true,
          joiningDate: true,
          department: { select: { id: true, name: true } },
          designation: { select: { id: true, title: true } },
          pfEnrollment: {
            select: {
              currentBalance: true,
              totalEmployeeContrib: true,
              totalEmployerContrib: true,
              status: true,
              effectiveDate: true,
            },
          },
          gratuityLedger: {
            select: {
              currentBalance: true,
              isVested: true,
              serviceStartDate: true,
            },
          },
        },
        orderBy: { fullName: 'asc' },
        skip,
        take: limit,
      }),
      prisma.employee.count({
        where: { organizationId: orgId, status: 'ACTIVE', deletedAt: null },
      }),
    ])

    const now = new Date()

    const summary = employees.map((emp) => {
      const serviceMs = now.getTime() - new Date(emp.joiningDate).getTime()
      const serviceYears = Math.floor(serviceMs / (365.25 * 24 * 60 * 60 * 1000) * 100) / 100

      const pfBalance = emp.pfEnrollment ? Number(emp.pfEnrollment.currentBalance) : 0
      const gratuityBalance = emp.gratuityLedger ? Number(emp.gratuityLedger.currentBalance) : 0

      return {
        employeeId: emp.id,
        employeeNo: emp.employeeNo,
        fullName: emp.fullName,
        department: emp.department?.name || null,
        designation: emp.designation?.title || null,
        serviceYears,
        pfBalance: pfBalance.toString(),
        pfStatus: emp.pfEnrollment?.status || 'NOT_ENROLLED',
        gratuityBalance: gratuityBalance.toString(),
        gratuityVested: emp.gratuityLedger?.isVested || false,
        totalRetirementBenefit: (pfBalance + gratuityBalance).toString(),
      }
    })

    return apiPaginated(summary, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess, handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const ledgers = await prisma.gratuityLedger.findMany({
      where: { organizationId: auth.organizationId, isActive: true },
      include: {
        employee: {
          select: {
            id: true,
            employeeNo: true,
            fullName: true,
            basicSalary: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
    })

    const now = new Date()
    const employeeDetails = ledgers.map((l) => {
      const serviceMs = now.getTime() - new Date(l.serviceStartDate).getTime()
      const serviceYears = Math.floor(serviceMs / (365.25 * 24 * 60 * 60 * 1000) * 100) / 100
      return {
        employeeId: l.employeeId,
        employeeNo: l.employee.employeeNo,
        fullName: l.employee.fullName,
        department: l.employee.department?.name || null,
        serviceYears,
        totalAccrued: l.totalAccrued.toString(),
        totalPaid: l.totalPaid.toString(),
        currentBalance: l.currentBalance.toString(),
        isVested: l.isVested,
      }
    })

    const aggregate = await prisma.gratuityLedger.aggregate({
      where: { organizationId: auth.organizationId, isActive: true },
      _sum: { currentBalance: true, totalAccrued: true, totalPaid: true },
      _count: true,
    })

    const vestedCount = await prisma.gratuityLedger.count({
      where: { organizationId: auth.organizationId, isActive: true, isVested: true },
    })

    return apiSuccess({
      totalLiability: aggregate._sum.currentBalance?.toString() || '0',
      totalAccrued: aggregate._sum.totalAccrued?.toString() || '0',
      totalPaid: aggregate._sum.totalPaid?.toString() || '0',
      employeeCount: aggregate._count,
      vestedCount,
      employees: employeeDetails,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

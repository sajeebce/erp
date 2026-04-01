import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiSuccess, apiBadRequest, handleRouteError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')
    if (!employeeId) {
      return apiBadRequest('employeeId query parameter is required')
    }

    // Validate employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true },
    })
    if (!employee) {
      return apiBadRequest('Employee not found in this organization')
    }

    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId },
      include: {
        leaveType: { select: { id: true, name: true, code: true, daysPerYear: true } },
      },
      orderBy: { leaveType: { name: 'asc' } },
    })

    const data = balances.map(({ leaveType, ...rest }) => ({
      ...rest,
      leaveType: leaveType.name,
    }))

    return apiSuccess(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ employeeId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { employeeId } = await params

    // Validate employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true, fullName: true, employeeNo: true },
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

    return apiSuccess({
      employee: { id: employee.id, employeeNo: employee.employeeNo, fullName: employee.fullName },
      balances,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

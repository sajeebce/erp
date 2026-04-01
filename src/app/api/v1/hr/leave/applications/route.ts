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

    const limit = parseInt(url.searchParams.get('limit') || '10', 10)

    // Validate employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true },
    })
    if (!employee) {
      return apiBadRequest('Employee not found in this organization')
    }

    const applications = await prisma.leaveApplication.findMany({
      where: { employeeId },
      include: {
        leaveType: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const data = applications.map(({ leaveType, ...rest }) => ({
      ...rest,
      leaveType: leaveType.name,
    }))

    return apiSuccess(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

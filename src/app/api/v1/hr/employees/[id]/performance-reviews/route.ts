import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiSuccess, apiNotFound, handleRouteError } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!employee) return apiNotFound('Employee not found')

    const items = await prisma.performanceReview.findMany({
      where: { employeeId },
      orderBy: { reviewPeriod: 'desc' },
    })

    return apiSuccess(items)
  } catch (error) {
    return handleRouteError(error)
  }
}

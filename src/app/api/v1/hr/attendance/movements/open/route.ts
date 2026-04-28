import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiSuccess, handleRouteError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')

    const openMovements = await prisma.attendanceMovement.findMany({
      where: {
        organizationId: auth.organizationId,
        status: 'OPEN',
        ...(employeeId ? { employeeId } : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeNo: true,
            fullName: true,
            department: { select: { id: true, name: true } },
          },
        },
        operatingLocation: { select: { id: true, code: true, name: true } },
      },
      orderBy: { checkOutTime: 'asc' },
    })

    return apiSuccess(openMovements)
  } catch (error) {
    return handleRouteError(error)
  }
}

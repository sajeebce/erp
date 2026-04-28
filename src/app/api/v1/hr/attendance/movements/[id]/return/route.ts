import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiBadRequest,
  apiNotFound,
  apiSuccess,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    const movement = await prisma.attendanceMovement.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: { employee: { select: { id: true, fullName: true } } },
    })
    if (!movement) return apiNotFound('Attendance movement not found')
    if (movement.status !== 'OPEN') return apiBadRequest('Only OPEN movements can be returned')

    const actualReturnTime = body.actualReturnTime ? new Date(body.actualReturnTime) : new Date()
    if (actualReturnTime < movement.checkOutTime) {
      return apiBadRequest('actualReturnTime cannot be earlier than checkOutTime')
    }

    const updated = await prisma.attendanceMovement.update({
      where: { id },
      data: {
        actualReturnTime,
        status: 'RETURNED',
        supervisorNotes: body.supervisorNotes !== undefined ? body.supervisorNotes || null : movement.supervisorNotes,
        approvedById: body.approvedById !== undefined ? body.approvedById || null : movement.approvedById,
        geoLatIn: body.geoLatIn !== undefined && body.geoLatIn !== null ? new Prisma.Decimal(body.geoLatIn) : movement.geoLatIn,
        geoLngIn: body.geoLngIn !== undefined && body.geoLngIn !== null ? new Prisma.Decimal(body.geoLngIn) : movement.geoLngIn,
      },
      include: {
        employee: { select: { id: true, fullName: true, employeeNo: true } },
        operatingLocation: { select: { id: true, code: true, name: true } },
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'attendance_movement',
      resourceId: id,
      description: `Returned official movement for "${movement.employee.fullName}"`,
      newValues: { actualReturnTime, status: 'RETURNED' },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { apiBadRequest, apiNotFound, apiSuccess, handleRouteError } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    const attendance = await prisma.attendance.findFirst({
      where: {
        id,
        employee: { organizationId: auth.organizationId, deletedAt: null },
      },
    })
    if (!attendance) return apiNotFound('Attendance record not found')

    const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEKEND']
    if (body.status && !validStatuses.includes(body.status)) {
      return apiBadRequest(`status must be one of: ${validStatuses.join(', ')}`)
    }

    if (body.operatingLocationId) {
      const operatingLocation = await prisma.operatingLocation.findFirst({
        where: { id: body.operatingLocationId, organizationId: auth.organizationId },
        select: { id: true },
      })
      if (!operatingLocation) return apiBadRequest('Operating location not found in this organization')
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.checkIn !== undefined ? { checkIn: body.checkIn ? new Date(body.checkIn) : null } : {}),
        ...(body.checkOut !== undefined ? { checkOut: body.checkOut ? new Date(body.checkOut) : null } : {}),
        ...(body.attendanceMode !== undefined ? { attendanceMode: body.attendanceMode || null } : {}),
        ...(body.attendanceSource !== undefined ? { attendanceSource: body.attendanceSource || null } : {}),
        ...(body.operatingLocationId !== undefined ? { operatingLocationId: body.operatingLocationId || null } : {}),
        ...(body.geoLat !== undefined ? { geoLat: body.geoLat !== null ? new Prisma.Decimal(body.geoLat) : null } : {}),
        ...(body.geoLng !== undefined ? { geoLng: body.geoLng !== null ? new Prisma.Decimal(body.geoLng) : null } : {}),
        ...(body.geoAccuracyMeters !== undefined ? { geoAccuracyMeters: body.geoAccuracyMeters !== null ? new Prisma.Decimal(body.geoAccuracyMeters) : null } : {}),
        ...(body.geoAddress !== undefined ? { geoAddress: body.geoAddress || null } : {}),
        ...(body.validationStatus !== undefined ? { validationStatus: body.validationStatus || null } : {}),
        ...(body.syncedAt !== undefined ? { syncedAt: body.syncedAt ? new Date(body.syncedAt) : null } : {}),
        ...(body.deviceId !== undefined ? { deviceId: body.deviceId || null } : {}),
        ...(body.otHours !== undefined ? { otHours: body.otHours ? new Prisma.Decimal(body.otHours) : new Prisma.Decimal(0) } : {}),
        ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
      },
      include: {
        employee: { select: { id: true, employeeNo: true, fullName: true } },
        operatingLocation: { select: { id: true, code: true, name: true } },
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'attendance',
      resourceId: id,
      description: `Updated attendance for "${updated.employee.fullName}"`,
      newValues: body,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

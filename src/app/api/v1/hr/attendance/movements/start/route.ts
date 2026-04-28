import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiBadRequest,
  apiConflict,
  apiCreated,
  handleRouteError,
} from '@/lib/api-response'

const VALID_MOVEMENT_TYPES = ['OFFICIAL_DUTY', 'BANK_VISIT', 'GOVT_OFFICE', 'FIELD_VISIT', 'CLIENT_VISIT', 'OTHER']

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const {
      employeeId,
      movementType,
      purpose,
      destinationName,
      destinationAddress,
      operatingLocationId,
      checkOutTime,
      expectedReturnTime,
      geoLatOut,
      geoLngOut,
    } = body

    if (!employeeId || !movementType || !purpose || !destinationName || !checkOutTime) {
      return apiBadRequest('employeeId, movementType, purpose, destinationName, and checkOutTime are required')
    }

    if (!VALID_MOVEMENT_TYPES.includes(movementType)) {
      return apiBadRequest(`movementType must be one of: ${VALID_MOVEMENT_TYPES.join(', ')}`)
    }

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true, fullName: true },
    })
    if (!employee) return apiBadRequest('Employee not found in this organization')

    if (operatingLocationId) {
      const operatingLocation = await prisma.operatingLocation.findFirst({
        where: { id: operatingLocationId, organizationId: auth.organizationId },
        select: { id: true },
      })
      if (!operatingLocation) return apiBadRequest('Operating location not found in this organization')
    }

    const movementStart = new Date(checkOutTime)
    const dateKey = movementStart.toISOString().slice(0, 10)
    const dayStart = new Date(`${dateKey}T00:00:00.000Z`)
    const dayEnd = new Date(`${dateKey}T23:59:59.999Z`)

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: { gte: dayStart, lte: dayEnd },
      },
      select: { id: true, status: true },
    })
    if (!attendance) {
      return apiBadRequest('Attendance must be checked in before starting movement')
    }

    const existingOpenMovement = await prisma.attendanceMovement.findFirst({
      where: {
        organizationId: auth.organizationId,
        employeeId,
        status: 'OPEN',
      },
      select: { id: true },
    })
    if (existingOpenMovement) {
      return apiConflict('Employee already has an open movement')
    }

    const movement = await prisma.$transaction(async (tx) => {
      await tx.attendance.update({
        where: { id: attendance.id },
        data: { status: 'PRESENT' },
      })

      return tx.attendanceMovement.create({
        data: {
          organizationId: auth.organizationId,
          employeeId,
          attendanceId: attendance.id,
          movementType,
          purpose: String(purpose).trim(),
          destinationName: String(destinationName).trim(),
          destinationAddress: destinationAddress?.trim() || null,
          operatingLocationId: operatingLocationId || null,
          checkOutTime: movementStart,
          expectedReturnTime: expectedReturnTime ? new Date(expectedReturnTime) : null,
          status: 'OPEN',
          geoLatOut: geoLatOut !== undefined && geoLatOut !== null ? new Prisma.Decimal(geoLatOut) : null,
          geoLngOut: geoLngOut !== undefined && geoLngOut !== null ? new Prisma.Decimal(geoLngOut) : null,
        },
        include: {
          employee: { select: { id: true, fullName: true, employeeNo: true } },
          operatingLocation: { select: { id: true, code: true, name: true } },
        },
      })
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'attendance_movement',
      resourceId: movement.id,
      description: `Started official movement for "${employee.fullName}"`,
      newValues: {
        employeeId,
        movementType,
        destinationName,
        checkOutTime,
        status: 'OPEN',
      },
      ...auditCtx,
    })

    return apiCreated(movement)
  } catch (error) {
    return handleRouteError(error)
  }
}

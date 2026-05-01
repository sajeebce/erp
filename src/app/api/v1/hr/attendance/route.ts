import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  apiConflict,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'
import {
  assertCanUseEmployeeAttendance,
  getScopedAttendanceEmployeeId,
} from '@/lib/hr-attendance-access'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      employee: { organizationId: auth.organizationId, deletedAt: null },
    }

    const employeeId = await getScopedAttendanceEmployeeId(auth, url.searchParams.get('employeeId'))
    if (employeeId) where.employeeId = employeeId

    const departmentId = url.searchParams.get('departmentId')
    if (departmentId) where.employee = { organizationId: auth.organizationId, deletedAt: null, departmentId }

    const attendanceMode = url.searchParams.get('attendanceMode')
    if (attendanceMode) where.attendanceMode = attendanceMode

    const validationStatus = url.searchParams.get('validationStatus')
    if (validationStatus) where.validationStatus = validationStatus

    const operatingLocationId = url.searchParams.get('operatingLocationId')
    if (operatingLocationId) where.operatingLocationId = operatingLocationId

    const date = url.searchParams.get('date')
    if (date) where.date = new Date(date)

    const month = url.searchParams.get('month')
    const year = url.searchParams.get('year')
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1)
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59)
      where.date = { gte: startDate, lte: endDate }
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeNo: true,
              fullName: true,
              departmentId: true,
              department: { select: { id: true, name: true } },
            },
          },
          operatingLocation: { select: { id: true, code: true, name: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ])

    return apiPaginated(records, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { employeeId, date, status, operatingLocationId } = body

    if (!employeeId || !date) {
      return apiBadRequest('employeeId and date are required')
    }

    // Validate employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true, fullName: true, userId: true },
    })
    if (!employee) {
      return apiBadRequest('Employee not found in this organization')
    }
    assertCanUseEmployeeAttendance(auth, employee)

    if (operatingLocationId) {
      const operatingLocation = await prisma.operatingLocation.findFirst({
        where: { id: operatingLocationId, organizationId: auth.organizationId },
        select: { id: true },
      })
      if (!operatingLocation) {
        return apiBadRequest('Operating location not found in this organization')
      }
    }

    // Check unique per employee+date
    const attendanceDate = new Date(date)
    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: attendanceDate } },
    })
    if (existing) {
      return apiConflict('Attendance already recorded for this employee on this date')
    }

    const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEKEND']
    const attStatus = status || 'PRESENT'
    if (!validStatuses.includes(attStatus)) {
      return apiBadRequest(`status must be one of: ${validStatuses.join(', ')}`)
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        date: attendanceDate,
        status: attStatus,
        checkIn: body.checkIn ? new Date(body.checkIn) : null,
        checkOut: body.checkOut ? new Date(body.checkOut) : null,
        attendanceMode: body.attendanceMode?.trim() || null,
        attendanceSource: body.attendanceSource?.trim() || null,
        operatingLocationId: operatingLocationId || null,
        geoLat: body.geoLat !== undefined && body.geoLat !== null ? new Prisma.Decimal(body.geoLat) : null,
        geoLng: body.geoLng !== undefined && body.geoLng !== null ? new Prisma.Decimal(body.geoLng) : null,
        geoAccuracyMeters: body.geoAccuracyMeters !== undefined && body.geoAccuracyMeters !== null ? new Prisma.Decimal(body.geoAccuracyMeters) : null,
        geoAddress: body.geoAddress?.trim() || null,
        validationStatus: body.validationStatus?.trim() || null,
        syncedAt: body.syncedAt ? new Date(body.syncedAt) : null,
        deviceId: body.deviceId?.trim() || null,
        otHours: body.otHours ? new Prisma.Decimal(body.otHours) : new Prisma.Decimal(0),
        notes: body.notes || null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'attendance',
      resourceId: attendance.id,
      description: `Recorded attendance for "${employee.fullName}" on ${date}`,
      newValues: {
        employeeId,
        date,
        status: attStatus,
        attendanceMode: body.attendanceMode || null,
        attendanceSource: body.attendanceSource || null,
        operatingLocationId: operatingLocationId || null,
        geoLat: body.geoLat ?? null,
        geoLng: body.geoLng ?? null,
        geoAccuracyMeters: body.geoAccuracyMeters ?? null,
        geoAddress: body.geoAddress || null,
        validationStatus: body.validationStatus || null,
        syncedAt: body.syncedAt || null,
        deviceId: body.deviceId || null,
      },
      ...auditCtx,
    })

    return apiCreated(attendance)
  } catch (error) {
    return handleRouteError(error)
  }
}

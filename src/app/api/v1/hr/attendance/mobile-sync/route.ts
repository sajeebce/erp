import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiBadRequest, apiSuccess, handleRouteError } from '@/lib/api-response'

interface MobileSyncEvent {
  date: string
  status?: string
  checkIn?: string | null
  checkOut?: string | null
  attendanceMode?: string | null
  attendanceSource?: string | null
  operatingLocationId?: string | null
  geoLat?: number | null
  geoLng?: number | null
  geoAccuracyMeters?: number | null
  geoAddress?: string | null
  validationStatus?: string | null
  deviceId?: string | null
  notes?: string | null
}

const VALID_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEKEND']

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()
    const events = Array.isArray(body.events) ? body.events as MobileSyncEvent[] : []

    if (events.length === 0) {
      return apiBadRequest('events array is required')
    }

    const employee = await prisma.employee.findFirst({
      where: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: { id: true },
    })
    if (!employee) return apiBadRequest('Employee profile not found for current user')

    let created = 0
    let updated = 0
    let skipped = 0

    for (const event of events) {
      if (!event.date) {
        skipped++
        continue
      }

      const attendanceDate = new Date(event.date)
      const status = event.status || 'PRESENT'
      if (!VALID_STATUSES.includes(status)) {
        skipped++
        continue
      }

      if (event.operatingLocationId) {
        const operatingLocation = await prisma.operatingLocation.findFirst({
          where: { id: event.operatingLocationId, organizationId: auth.organizationId },
          select: { id: true },
        })
        if (!operatingLocation) {
          skipped++
          continue
        }
      }

      const existing = await prisma.attendance.findUnique({
        where: { employeeId_date: { employeeId: employee.id, date: attendanceDate } },
      })

      const commonData = {
        status,
        checkIn: event.checkIn ? new Date(event.checkIn) : null,
        checkOut: event.checkOut ? new Date(event.checkOut) : null,
        attendanceMode: event.attendanceMode || null,
        attendanceSource: event.attendanceSource || 'MOBILE',
        operatingLocationId: event.operatingLocationId || null,
        geoLat: event.geoLat !== undefined && event.geoLat !== null ? new Prisma.Decimal(event.geoLat) : null,
        geoLng: event.geoLng !== undefined && event.geoLng !== null ? new Prisma.Decimal(event.geoLng) : null,
        geoAccuracyMeters: event.geoAccuracyMeters !== undefined && event.geoAccuracyMeters !== null ? new Prisma.Decimal(event.geoAccuracyMeters) : null,
        geoAddress: event.geoAddress || null,
        validationStatus: event.validationStatus || null,
        syncedAt: new Date(),
        deviceId: event.deviceId || null,
        notes: event.notes || null,
      }

      if (!existing) {
        await prisma.attendance.create({
          data: {
            employeeId: employee.id,
            date: attendanceDate,
            otHours: new Prisma.Decimal(0),
            ...commonData,
          },
        })
        created++
        continue
      }

      const isDuplicate =
        existing.deviceId === (event.deviceId || null) &&
        String(existing.checkIn || '') === String(event.checkIn ? new Date(event.checkIn) : null) &&
        String(existing.checkOut || '') === String(event.checkOut ? new Date(event.checkOut) : null) &&
        existing.attendanceMode === (event.attendanceMode || null)

      if (isDuplicate) {
        skipped++
        continue
      }

      await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status,
          checkIn: event.checkIn ? new Date(event.checkIn) : existing.checkIn,
          checkOut: event.checkOut ? new Date(event.checkOut) : existing.checkOut,
          attendanceMode: event.attendanceMode || existing.attendanceMode,
          attendanceSource: event.attendanceSource || existing.attendanceSource || 'MOBILE',
          operatingLocationId: event.operatingLocationId || existing.operatingLocationId,
          geoLat: event.geoLat !== undefined && event.geoLat !== null ? new Prisma.Decimal(event.geoLat) : existing.geoLat,
          geoLng: event.geoLng !== undefined && event.geoLng !== null ? new Prisma.Decimal(event.geoLng) : existing.geoLng,
          geoAccuracyMeters: event.geoAccuracyMeters !== undefined && event.geoAccuracyMeters !== null ? new Prisma.Decimal(event.geoAccuracyMeters) : existing.geoAccuracyMeters,
          geoAddress: event.geoAddress || existing.geoAddress,
          validationStatus: event.validationStatus || existing.validationStatus,
          syncedAt: new Date(),
          deviceId: event.deviceId || existing.deviceId,
          notes: event.notes || existing.notes,
        },
      })
      updated++
    }

    return apiSuccess({ created, updated, skipped, total: events.length })
  } catch (error) {
    return handleRouteError(error)
  }
}

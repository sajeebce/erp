import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiMessage,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string; holidayId: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id, holidayId } = await params

    // Validate calendar belongs to org
    const calendar = await prisma.holidayCalendar.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true },
    })
    if (!calendar) {
      return apiNotFound('Holiday calendar not found')
    }

    const existing = await prisma.holiday.findFirst({
      where: { id: holidayId, calendarId: id },
    })
    if (!existing) {
      return apiNotFound('Holiday not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.name !== undefined) data.name = body.name.trim()
    if (body.localizedName !== undefined) data.localizedName = body.localizedName || null
    if (body.date !== undefined) data.date = new Date(body.date)
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null
    if (body.type !== undefined) data.type = body.type
    if (body.isRecurring !== undefined) data.isRecurring = body.isRecurring
    if (body.description !== undefined) data.description = body.description || null

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.holiday.update({ where: { id: holidayId }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'holiday',
      resourceId: holidayId,
      description: `Updated holiday "${existing.name}"`,
      oldValues: { name: existing.name, date: existing.date, type: existing.type },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id, holidayId } = await params

    // Validate calendar belongs to org
    const calendar = await prisma.holidayCalendar.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true },
    })
    if (!calendar) {
      return apiNotFound('Holiday calendar not found')
    }

    const holiday = await prisma.holiday.findFirst({
      where: { id: holidayId, calendarId: id },
    })
    if (!holiday) {
      return apiNotFound('Holiday not found')
    }

    await prisma.holiday.delete({ where: { id: holidayId } })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'DELETE',
      module: 'hr',
      resource: 'holiday',
      resourceId: holidayId,
      description: `Removed holiday "${holiday.name}"`,
      oldValues: { name: holiday.name, date: holiday.date },
      ...auditCtx,
    })

    return apiMessage('Holiday deleted successfully')
  } catch (error) {
    return handleRouteError(error)
  }
}

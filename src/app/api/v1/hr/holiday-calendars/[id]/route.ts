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
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const calendar = await prisma.holidayCalendar.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        holidays: { orderBy: { date: 'asc' } },
      },
    })

    if (!calendar) {
      return apiNotFound('Holiday calendar not found')
    }

    return apiSuccess(calendar)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.holidayCalendar.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('Holiday calendar not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.name !== undefined) data.name = body.name.trim()
    if (body.isDefault !== undefined) data.isDefault = body.isDefault
    if (body.isActive !== undefined) data.isActive = body.isActive

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.holidayCalendar.update({ where: { id }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'holiday_calendar',
      resourceId: id,
      description: `Updated holiday calendar "${existing.name}"`,
      oldValues: { name: existing.name, isDefault: existing.isDefault, isActive: existing.isActive },
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
    const { id } = await params

    const calendar = await prisma.holidayCalendar.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: { _count: { select: { holidays: true } } },
    })
    if (!calendar) {
      return apiNotFound('Holiday calendar not found')
    }

    const url = new URL(request.url)
    const force = url.searchParams.get('force') === 'true'

    if (calendar._count.holidays > 0 && !force) {
      return apiBadRequest(
        `Calendar has ${calendar._count.holidays} holidays. Use ?force=true to delete anyway.`
      )
    }

    await prisma.holidayCalendar.delete({ where: { id } })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'DELETE',
      module: 'hr',
      resource: 'holiday_calendar',
      resourceId: id,
      description: `Deleted holiday calendar "${calendar.name}" (${calendar.year})`,
      oldValues: { name: calendar.name, year: calendar.year },
      ...auditCtx,
    })

    return apiMessage('Holiday calendar deleted successfully')
  } catch (error) {
    return handleRouteError(error)
  }
}

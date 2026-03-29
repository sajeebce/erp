import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiSuccess,
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

    // Validate calendar belongs to org
    const calendar = await prisma.holidayCalendar.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true },
    })
    if (!calendar) {
      return apiNotFound('Holiday calendar not found')
    }

    const holidays = await prisma.holiday.findMany({
      where: { calendarId: id },
      orderBy: { date: 'asc' },
    })

    return apiSuccess(holidays)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    // Validate calendar belongs to org
    const calendar = await prisma.holidayCalendar.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true, name: true },
    })
    if (!calendar) {
      return apiNotFound('Holiday calendar not found')
    }

    const { name, date, type } = body

    if (!name || !date || !type) {
      return apiBadRequest('name, date, and type are required')
    }

    const holiday = await prisma.holiday.create({
      data: {
        calendarId: id,
        name: name.trim(),
        localizedName: body.localizedName || null,
        date: new Date(date),
        endDate: body.endDate ? new Date(body.endDate) : null,
        type,
        isRecurring: body.isRecurring ?? false,
        description: body.description || null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'holiday',
      resourceId: holiday.id,
      description: `Added holiday "${name}" to calendar "${calendar.name}"`,
      newValues: { name, date, type },
      ...auditCtx,
    })

    return apiCreated(holiday)
  } catch (error) {
    return handleRouteError(error)
  }
}

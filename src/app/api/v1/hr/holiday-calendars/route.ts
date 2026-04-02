import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
    }

    const year = url.searchParams.get('year')
    if (year) where.year = parseInt(year, 10)

    const isActive = url.searchParams.get('isActive')
    if (isActive !== null) where.isActive = isActive === 'true'

    const [calendars, total] = await Promise.all([
      prisma.holidayCalendar.findMany({
        where,
        include: {
          holidays: {
            orderBy: { date: 'asc' },
            select: {
              id: true,
              date: true,
              name: true,
              localizedName: true,
              type: true,
              description: true,
              isRecurring: true,
            },
          },
          _count: { select: { holidays: true } },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.holidayCalendar.count({ where }),
    ])

    return apiPaginated(calendars, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { name, year } = body

    if (!name || !year) {
      return apiBadRequest('name and year are required')
    }

    // Validate unique name+year per org
    const existing = await prisma.holidayCalendar.findFirst({
      where: {
        organizationId: auth.organizationId,
        name: name.trim(),
        year: parseInt(year, 10),
      },
    })
    if (existing) {
      return apiBadRequest(`A calendar named "${name}" already exists for year ${year}`)
    }

    const calendar = await prisma.holidayCalendar.create({
      data: {
        organizationId: auth.organizationId,
        name: name.trim(),
        year: parseInt(year, 10),
        isDefault: body.isDefault ?? false,
        isActive: body.isActive ?? true,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'holiday_calendar',
      resourceId: calendar.id,
      description: `Created holiday calendar "${name}" for year ${year}`,
      newValues: { name, year },
      ...auditCtx,
    })

    return apiCreated(calendar)
  } catch (error) {
    return handleRouteError(error)
  }
}

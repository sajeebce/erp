import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
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
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      grant: { donor: { organizationId: auth.organizationId } },
    }

    const grantId = url.searchParams.get('grantId')
    if (grantId) {
      where.grantId = grantId
    }

    const type = url.searchParams.get('type')
    if (type) {
      where.type = type
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.dueDate = dateFilter
    }

    const [reports, total] = await Promise.all([
      prisma.donorReport.findMany({
        where,
        select: {
          id: true,
          reportNo: true,
          type: true,
          grantId: true,
          periodStart: true,
          periodEnd: true,
          dueDate: true,
          submittedDate: true,
          status: true,
          preparedById: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          grant: {
            select: {
              id: true,
              grantNo: true,
              title: true,
              donor: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { dueDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.donorReport.count({ where }),
    ])

    return apiPaginated(reports, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const {
      type,
      grantId,
      periodStart,
      periodEnd,
      dueDate,
      notes,
    } = body

    if (!type || !grantId || !periodStart || !periodEnd || !dueDate) {
      return apiBadRequest('type, grantId, periodStart, periodEnd, and dueDate are required')
    }

    const validTypes = [
      'FINANCIAL',
      'NARRATIVE',
      'PROGRESS',
      'AUDIT',
      'FUND_UTILIZATION',
      'EXPENDITURE_STATEMENT',
    ]
    if (!validTypes.includes(type)) {
      return apiBadRequest(`type must be one of: ${validTypes.join(', ')}`)
    }

    // Validate grant belongs to org
    const grant = await prisma.grant.findFirst({
      where: {
        id: grantId,
        donor: { organizationId: auth.organizationId },
        deletedAt: null,
      },
      select: { id: true, grantNo: true, title: true },
    })

    if (!grant) {
      return apiBadRequest('Grant not found in this organization')
    }

    // Auto-generate report number
    const reportNo = await generateNextNumber(auth.organizationId, 'donor_report')

    const report = await prisma.donorReport.create({
      data: {
        reportNo,
        type,
        grantId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        dueDate: new Date(dueDate),
        status: 'DRAFT',
        preparedById: auth.userId,
        notes: notes || null,
      },
      select: {
        id: true,
        reportNo: true,
        type: true,
        grantId: true,
        periodStart: true,
        periodEnd: true,
        dueDate: true,
        submittedDate: true,
        status: true,
        preparedById: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        grant: {
          select: {
            id: true,
            grantNo: true,
            title: true,
            donor: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'donor',
      resource: 'donor_report',
      resourceId: report.id,
      description: `Created ${type} donor report ${reportNo} for grant ${grant.grantNo}`,
      newValues: { reportNo, type, grantId, periodStart, periodEnd, dueDate },
      ...auditCtx,
    })

    return apiCreated(report)
  } catch (error) {
    return handleRouteError(error)
  }
}

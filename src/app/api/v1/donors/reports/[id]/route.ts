import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
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

    const report = await prisma.donorReport.findFirst({
      where: {
        id,
        grant: { donor: { organizationId: auth.organizationId } },
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
            awardAmount: true,
            disbursedAmount: true,
            currencyCode: true,
            donor: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    })

    if (!report) {
      return apiNotFound('Donor report not found')
    }

    return apiSuccess(report)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.donorReport.findFirst({
      where: {
        id,
        grant: { donor: { organizationId: auth.organizationId } },
      },
      select: {
        id: true,
        reportNo: true,
        status: true,
      },
    })

    if (!existing) {
      return apiNotFound('Donor report not found')
    }

    const body = await request.json()

    const data: Record<string, unknown> = {}

    if (body.status !== undefined) {
      const validStatuses = [
        'DRAFT',
        'UNDER_REVIEW',
        'SUBMITTED',
        'ACCEPTED',
        'REVISION_REQUIRED',
      ]
      if (!validStatuses.includes(body.status)) {
        return apiBadRequest(`status must be one of: ${validStatuses.join(', ')}`)
      }
      data.status = body.status

      // If status changes to SUBMITTED, set submittedDate
      if (body.status === 'SUBMITTED' && existing.status !== 'SUBMITTED') {
        data.submittedDate = new Date()
      }
    }

    if (body.submittedDate !== undefined) {
      data.submittedDate = body.submittedDate ? new Date(body.submittedDate) : null
    }

    if (body.notes !== undefined) {
      data.notes = body.notes || null
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.donorReport.update({
      where: { id },
      data,
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

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

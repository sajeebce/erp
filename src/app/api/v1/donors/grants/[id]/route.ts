import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { Prisma } from '@prisma/client'
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

    const grant = await prisma.grant.findFirst({
      where: {
        id,
        donor: { organizationId: auth.organizationId },
        deletedAt: null,
      },
      select: {
        id: true,
        grantNo: true,
        title: true,
        donorId: true,
        projectId: true,
        awardAmount: true,
        disbursedAmount: true,
        currencyCode: true,
        startDate: true,
        endDate: true,
        status: true,
        lifecycleStage: true,
        ngoabFdNo: true,
        agreementRef: true,
        description: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        donor: {
          select: {
            id: true,
            name: true,
            type: true,
            country: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        fundReceipts: {
          where: { deletedAt: null },
          select: {
            id: true,
            receiptNo: true,
            date: true,
            amount: true,
            currencyCode: true,
            amountInBDT: true,
            status: true,
            bankReference: true,
            createdAt: true,
          },
          orderBy: { date: 'desc' },
        },
        fundRequisitions: {
          select: {
            id: true,
            requisitionNo: true,
            date: true,
            amount: true,
            purpose: true,
            status: true,
            createdAt: true,
          },
          orderBy: { date: 'desc' },
        },
        budgets: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            totalAmount: true,
            status: true,
          },
        },
      },
    })

    if (!grant) {
      return apiNotFound('Grant not found')
    }

    return apiSuccess(grant)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.grant.findFirst({
      where: {
        id,
        donor: { organizationId: auth.organizationId },
        deletedAt: null,
      },
    })

    if (!existing) {
      return apiNotFound('Grant not found')
    }

    const body = await request.json()

    const data: Record<string, unknown> = {}

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        return apiBadRequest('Title must be a non-empty string')
      }
      data.title = body.title.trim()
    }

    if (body.awardAmount !== undefined) {
      if (Number(body.awardAmount) <= 0) {
        return apiBadRequest('awardAmount must be greater than 0')
      }
      data.awardAmount = new Prisma.Decimal(body.awardAmount)
    }

    if (body.startDate !== undefined) {
      data.startDate = body.startDate ? new Date(body.startDate) : null
    }

    if (body.endDate !== undefined) {
      data.endDate = body.endDate ? new Date(body.endDate) : null
    }

    if (body.status !== undefined) {
      const validStatuses = [
        'PIPELINE',
        'PROPOSAL',
        'NEGOTIATION',
        'ACTIVE',
        'SUSPENDED',
        'COMPLETED',
        'CLOSED',
      ]
      if (!validStatuses.includes(body.status)) {
        return apiBadRequest(`status must be one of: ${validStatuses.join(', ')}`)
      }
      data.status = body.status
    }

    if (body.projectId !== undefined) {
      if (body.projectId) {
        const project = await prisma.project.findFirst({
          where: {
            id: body.projectId,
            organizationId: auth.organizationId,
          },
        })
        if (!project) {
          return apiBadRequest('Project not found in this organization')
        }
      }
      data.projectId = body.projectId || null
    }

    if (body.ngoabFdNo !== undefined) {
      data.ngoabFdNo = body.ngoabFdNo || null
    }

    if (body.agreementRef !== undefined) {
      data.agreementRef = body.agreementRef || null
    }

    if (body.description !== undefined) {
      data.description = body.description || null
    }

    if (body.notes !== undefined) {
      data.notes = body.notes || null
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.grant.update({
      where: { id },
      data,
      select: {
        id: true,
        grantNo: true,
        title: true,
        donorId: true,
        projectId: true,
        awardAmount: true,
        disbursedAmount: true,
        currencyCode: true,
        startDate: true,
        endDate: true,
        status: true,
        lifecycleStage: true,
        ngoabFdNo: true,
        agreementRef: true,
        description: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        donor: {
          select: { id: true, name: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

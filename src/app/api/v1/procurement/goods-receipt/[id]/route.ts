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

    const receipt = await prisma.goodsReceipt.findFirst({
      where: {
        id,
        vendor: { organizationId: auth.organizationId },
      },
      include: {
        lines: {
          include: {
            poLine: {
              select: { description: true, quantity: true, unitPrice: true },
            },
          },
        },
        purchaseOrder: {
          select: { poNo: true, status: true },
        },
        vendor: {
          select: { id: true, vendorNo: true, companyName: true },
        },
      },
    })

    if (!receipt) {
      return apiNotFound('Goods receipt not found')
    }

    return apiSuccess(receipt)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.goodsReceipt.findFirst({
      where: {
        id,
        vendor: { organizationId: auth.organizationId },
      },
    })

    if (!existing) {
      return apiNotFound('Goods receipt not found')
    }

    const body = await request.json()
    const { status, inspectionNotes } = body

    const data: Record<string, unknown> = {}

    if (status !== undefined) {
      const validStatuses = ['PENDING_INSPECTION', 'ACCEPTED', 'REJECTED', 'PARTIAL']
      if (!validStatuses.includes(status)) {
        return apiBadRequest(`status must be one of: ${validStatuses.join(', ')}`)
      }
      data.status = status
    }

    if (inspectionNotes !== undefined) {
      data.inspectionNotes = inspectionNotes || null
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.goodsReceipt.update({
      where: { id },
      data,
      select: {
        id: true,
        grnNo: true,
        date: true,
        poId: true,
        vendorId: true,
        receivedById: true,
        status: true,
        inspectionNotes: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

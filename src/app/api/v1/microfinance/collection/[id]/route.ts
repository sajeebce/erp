import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
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

    const collection = await prisma.collectionSheet.findUnique({
      where: { id },
      select: {
        id: true,
        collectionNo: true,
        samityId: true,
        date: true,
        membersPresent: true,
        totalCollectible: true,
        amountCollected: true,
        shortfall: true,
        onTimePercent: true,
        collectedById: true,
        status: true,
        depositedAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        samity: {
          select: {
            samityNo: true,
            name: true,
            branch: { select: { code: true, name: true, organizationId: true } },
          },
        },
      },
    })

    if (!collection) {
      return apiNotFound('Collection sheet not found')
    }

    // Tenant isolation check
    if (collection.samity.branch.organizationId !== auth.organizationId) {
      return apiNotFound('Collection sheet not found')
    }

    return apiSuccess(collection)
  } catch (error) {
    return handleRouteError(error)
  }
}

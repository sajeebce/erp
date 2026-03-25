import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  apiForbidden,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')
    const { id } = await params
    const body = await request.json()

    const { bidId } = body

    if (!bidId) {
      return apiBadRequest('bidId is required')
    }

    const tender = await prisma.tender.findUnique({
      where: { id },
      include: { bids: true },
    })

    if (!tender) {
      return apiNotFound('Tender not found')
    }

    if (tender.status === 'AWARDED') {
      return apiForbidden('Tender has already been awarded')
    }

    if (tender.status === 'CANCELLED') {
      return apiForbidden('Cannot award a cancelled tender')
    }

    const winnerBid = tender.bids.find((b) => b.id === bidId)
    if (!winnerBid) {
      return apiBadRequest('Bid not found in this tender')
    }

    // Validate vendor belongs to org
    const vendor = await prisma.vendor.findFirst({
      where: { id: winnerBid.vendorId, organizationId: auth.organizationId },
    })
    if (!vendor) {
      return apiForbidden('Bid vendor does not belong to your organization')
    }

    // Mark winning bid and update tender
    await prisma.$transaction([
      prisma.tenderBid.updateMany({
        where: { tenderId: id },
        data: { isWinner: false },
      }),
      prisma.tenderBid.update({
        where: { id: bidId },
        data: { isWinner: true },
      }),
      prisma.tender.update({
        where: { id },
        data: {
          status: 'AWARDED',
          awardedToId: winnerBid.vendorId,
          awardDate: new Date(),
        },
      }),
    ])

    const updated = await prisma.tender.findUnique({
      where: { id },
      include: {
        bids: {
          include: {
            vendor: { select: { id: true, companyName: true } },
          },
          orderBy: { combinedScore: 'desc' },
        },
      },
    })

    const audit = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'APPROVE',
      module: 'PROCUREMENT',
      resource: 'Tender',
      resourceId: id,
      description: `Awarded tender ${tender.tenderNo} to vendor ${vendor.companyName}`,
      ...audit,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuthFromRequest(request)
    const { id } = await params

    const tender = await prisma.tender.findUnique({ where: { id } })
    if (!tender) {
      return apiNotFound('Tender not found')
    }

    const bids = await prisma.tenderBid.findMany({
      where: { tenderId: id },
      include: {
        vendor: {
          select: { id: true, vendorNo: true, companyName: true },
        },
      },
      orderBy: { combinedScore: 'desc' },
    })

    return apiSuccess(bids)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    const tender = await prisma.tender.findUnique({ where: { id } })
    if (!tender) {
      return apiNotFound('Tender not found')
    }

    const { vendorId, bidAmount, technicalScore, financialScore, notes } = body

    if (!vendorId || bidAmount === undefined) {
      return apiBadRequest('vendorId and bidAmount are required')
    }

    // Validate vendor belongs to org
    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!vendor) {
      return apiBadRequest('Vendor not found or does not belong to your organization')
    }

    // Check duplicate bid
    const existingBid = await prisma.tenderBid.findFirst({
      where: { tenderId: id, vendorId },
    })
    if (existingBid) {
      return apiBadRequest('This vendor has already submitted a bid for this tender')
    }

    // Calculate combinedScore (average of technical and financial if both provided)
    let combinedScore: number | null = null
    if (technicalScore !== undefined && financialScore !== undefined) {
      combinedScore = (Number(technicalScore) + Number(financialScore)) / 2
    } else if (technicalScore !== undefined) {
      combinedScore = Number(technicalScore)
    } else if (financialScore !== undefined) {
      combinedScore = Number(financialScore)
    }

    const bid = await prisma.tenderBid.create({
      data: {
        tenderId: id,
        vendorId,
        bidAmount: new Prisma.Decimal(bidAmount),
        technicalScore: technicalScore !== undefined ? new Prisma.Decimal(technicalScore) : null,
        financialScore: financialScore !== undefined ? new Prisma.Decimal(financialScore) : null,
        combinedScore: combinedScore !== null ? new Prisma.Decimal(combinedScore) : null,
        notes: notes || null,
      },
      include: {
        vendor: {
          select: { id: true, vendorNo: true, companyName: true },
        },
      },
    })

    return apiCreated(bid)
  } catch (error) {
    return handleRouteError(error)
  }
}

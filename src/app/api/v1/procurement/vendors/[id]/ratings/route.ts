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

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const vendor = await prisma.vendor.findFirst({
      where: { id, organizationId: auth.organizationId, deletedAt: null },
    })

    if (!vendor) {
      return apiNotFound('Vendor not found')
    }

    const ratings = await prisma.vendorRating.findMany({
      where: { vendorId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        poId: true,
        quality: true,
        delivery: true,
        pricing: true,
        communication: true,
        overall: true,
        comments: true,
        ratedById: true,
        createdAt: true,
      },
    })

    return apiSuccess(ratings)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    const vendor = await prisma.vendor.findFirst({
      where: { id, organizationId: auth.organizationId, deletedAt: null },
    })

    if (!vendor) {
      return apiNotFound('Vendor not found')
    }

    const { quality, delivery, pricing, communication, poId, comments } = body

    for (const [field, value] of Object.entries({ quality, delivery, pricing, communication })) {
      if (value === undefined || value === null || typeof value !== 'number' || value < 1 || value > 5) {
        return apiBadRequest(`${field} must be an integer between 1 and 5`)
      }
    }

    const overall = (quality + delivery + pricing + communication) / 4

    const rating = await prisma.vendorRating.create({
      data: {
        vendorId: id,
        poId: poId || null,
        quality,
        delivery,
        pricing,
        communication,
        overall,
        comments: comments || null,
        ratedById: auth.userId,
      },
      select: {
        id: true,
        poId: true,
        quality: true,
        delivery: true,
        pricing: true,
        communication: true,
        overall: true,
        comments: true,
        ratedById: true,
        createdAt: true,
      },
    })

    // Update vendor average rating
    const aggregate = await prisma.vendorRating.aggregate({
      where: { vendorId: id },
      _avg: { overall: true },
    })

    await prisma.vendor.update({
      where: { id },
      data: { rating: aggregate._avg.overall ?? 0 },
    })

    return apiCreated(rating)
  } catch (error) {
    return handleRouteError(error)
  }
}

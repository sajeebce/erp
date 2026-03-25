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

    const vendor = await prisma.vendor.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        vendorNo: true,
        companyName: true,
        category: true,
        contactPerson: true,
        phone: true,
        email: true,
        address: true,
        tin: true,
        tradeLicense: true,
        rating: true,
        totalOrders: true,
        isApproved: true,
        isActive: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { purchaseOrders: true },
        },
      },
    })

    if (!vendor) {
      return apiNotFound('Vendor not found')
    }

    return apiSuccess(vendor)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.vendor.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
    })

    if (!existing) {
      return apiNotFound('Vendor not found')
    }

    const body = await request.json()

    const allowedFields = [
      'companyName', 'category', 'contactPerson', 'phone', 'email',
      'address', 'tin', 'tradeLicense', 'isApproved', 'isActive', 'notes',
    ] as const

    const data: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field]
      }
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    if (data.companyName !== undefined) {
      if (typeof data.companyName !== 'string' || data.companyName.trim().length === 0) {
        return apiBadRequest('companyName must be a non-empty string')
      }
      data.companyName = (data.companyName as string).trim()
    }

    const updated = await prisma.vendor.update({
      where: { id },
      data,
      select: {
        id: true,
        vendorNo: true,
        companyName: true,
        category: true,
        contactPerson: true,
        phone: true,
        email: true,
        address: true,
        tin: true,
        tradeLicense: true,
        rating: true,
        totalOrders: true,
        isApproved: true,
        isActive: true,
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

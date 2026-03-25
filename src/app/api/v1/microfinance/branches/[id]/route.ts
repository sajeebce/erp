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

    const branch = await prisma.branch.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: {
        id: true,
        code: true,
        name: true,
        location: true,
        managerId: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { samities: true } },
      },
    })

    if (!branch) {
      return apiNotFound('Branch not found')
    }

    return apiSuccess(branch)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.branch.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!existing) {
      return apiNotFound('Branch not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    const allowedFields = ['name', 'location', 'managerId', 'phone', 'isActive'] as const
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field]
      }
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.branch.update({
      where: { id },
      data,
      select: {
        id: true,
        code: true,
        name: true,
        location: true,
        managerId: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { samities: true } },
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

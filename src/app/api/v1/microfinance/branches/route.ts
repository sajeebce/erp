import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  apiConflict,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const url = new URL(request.url)
    const { page, limit, skip, search, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    }

    const isActive = url.searchParams.get('isActive')
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [branches, total] = await Promise.all([
      prisma.branch.findMany({
        where,
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
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.branch.count({ where }),
    ])

    return apiPaginated(branches, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()
    const { code, name, location, managerId, phone } = body

    if (!code || !name || !location) {
      return apiBadRequest('code, name, and location are required')
    }

    const existing = await prisma.branch.findUnique({
      where: {
        organizationId_code: {
          organizationId: auth.organizationId,
          code: code.trim(),
        },
      },
    })

    if (existing) {
      return apiConflict('Branch code already exists in this organization')
    }

    const branch = await prisma.branch.create({
      data: {
        organizationId: auth.organizationId,
        code: code.trim(),
        name: name.trim(),
        location: location.trim(),
        managerId: managerId || null,
        phone: phone || null,
      },
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
      },
    })

    return apiCreated(branch)
  } catch (error) {
    return handleRouteError(error)
  }
}

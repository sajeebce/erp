import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
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
      deletedAt: null,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const type = url.searchParams.get('type')
    if (type) {
      where.type = type
    }

    const isActive = url.searchParams.get('isActive')
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [donors, total] = await Promise.all([
      prisma.donor.findMany({
        where,
        select: {
          id: true,
          name: true,
          type: true,
          country: true,
          email: true,
          phone: true,
          website: true,
          relationshipStatus: true,
          totalFunded: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { grants: true },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.donor.count({ where }),
    ])

    return apiPaginated(donors, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const {
      name,
      type,
      country,
      address,
      phone,
      email,
      website,
      description,
      notes,
    } = body

    if (!name || !type) {
      return apiBadRequest('name and type are required')
    }

    const validTypes = [
      'BILATERAL',
      'MULTILATERAL',
      'FOUNDATION',
      'CORPORATE',
      'INDIVIDUAL',
      'GOVERNMENT',
      'INGO',
    ]
    if (!validTypes.includes(type)) {
      return apiBadRequest(`type must be one of: ${validTypes.join(', ')}`)
    }

    const donor = await prisma.donor.create({
      data: {
        organizationId: auth.organizationId,
        name: name.trim(),
        type,
        country: country || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        description: description || null,
        notes: notes || null,
      },
      select: {
        id: true,
        name: true,
        type: true,
        country: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        description: true,
        relationshipStatus: true,
        totalFunded: true,
        isActive: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return apiCreated(donor)
  } catch (error) {
    return handleRouteError(error)
  }
}

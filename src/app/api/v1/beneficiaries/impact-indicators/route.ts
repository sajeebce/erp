import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    // Auth required but no org filter - indicators are global
    await requireAuthFromRequest(request)

    const indicators = await prisma.impactIndicator.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        unit: true,
        category: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { assessments: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return apiSuccess(indicators)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)

    const body = await request.json()
    const { name, unit, category } = body

    if (!name || !unit) {
      return apiBadRequest('name and unit are required')
    }

    const indicator = await prisma.impactIndicator.create({
      data: {
        name: name.trim(),
        unit: unit.trim(),
        category: category || null,
      },
      select: {
        id: true,
        name: true,
        unit: true,
        category: true,
        isActive: true,
        createdAt: true,
      },
    })

    return apiCreated(indicator)
  } catch (error) {
    return handleRouteError(error)
  }
}

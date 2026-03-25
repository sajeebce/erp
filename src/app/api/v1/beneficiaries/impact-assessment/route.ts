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
    await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {}

    const indicatorId = url.searchParams.get('indicatorId')
    if (indicatorId) {
      where.indicatorId = indicatorId
    }

    const projectId = url.searchParams.get('projectId')
    if (projectId) {
      where.projectId = projectId
    }

    const [assessments, total] = await Promise.all([
      prisma.impactAssessment.findMany({
        where,
        select: {
          id: true,
          baseline: true,
          target: true,
          currentValue: true,
          achievementPct: true,
          dataSource: true,
          measurementDate: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          indicator: {
            select: {
              id: true,
              name: true,
              unit: true,
              category: true,
            },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.impactAssessment.count({ where }),
    ])

    return apiPaginated(assessments, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)

    const body = await request.json()
    const {
      indicatorId,
      projectId,
      baseline,
      target,
      currentValue,
      dataSource,
      measurementDate,
      notes,
    } = body

    if (!indicatorId || baseline === undefined || target === undefined || currentValue === undefined || !measurementDate) {
      return apiBadRequest('indicatorId, baseline, target, currentValue, and measurementDate are required')
    }

    // Validate indicator exists
    const indicator = await prisma.impactIndicator.findUnique({
      where: { id: indicatorId },
    })
    if (!indicator) {
      return apiBadRequest('Indicator not found')
    }

    // Calculate achievement percentage
    const baselineNum = Number(baseline)
    const targetNum = Number(target)
    const currentNum = Number(currentValue)
    let achievementPct = 0

    if (targetNum !== baselineNum) {
      achievementPct = ((currentNum - baselineNum) / (targetNum - baselineNum)) * 100
    }

    const assessment = await prisma.impactAssessment.create({
      data: {
        indicatorId,
        projectId: projectId || null,
        baseline,
        target,
        currentValue,
        achievementPct: Math.round(achievementPct * 100) / 100,
        dataSource: dataSource || null,
        measurementDate: new Date(measurementDate),
        notes: notes || null,
      },
      select: {
        id: true,
        baseline: true,
        target: true,
        currentValue: true,
        achievementPct: true,
        dataSource: true,
        measurementDate: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        indicator: {
          select: {
            id: true,
            name: true,
            unit: true,
            category: true,
          },
        },
      },
    })

    return apiCreated(assessment)
  } catch (error) {
    return handleRouteError(error)
  }
}

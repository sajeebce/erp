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
    await requireAuthFromRequest(request)
    const { id } = await params

    const assessment = await prisma.impactAssessment.findUnique({
      where: { id },
      select: {
        id: true,
        baseline: true,
        target: true,
        currentValue: true,
        achievementPct: true,
        dataSource: true,
        measurementDate: true,
        notes: true,
        projectId: true,
        createdAt: true,
        updatedAt: true,
        indicator: {
          select: {
            id: true,
            name: true,
            unit: true,
            category: true,
            isActive: true,
          },
        },
      },
    })

    if (!assessment) {
      return apiNotFound('Impact assessment not found')
    }

    return apiSuccess(assessment)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.impactAssessment.findUnique({
      where: { id },
    })

    if (!existing) {
      return apiNotFound('Impact assessment not found')
    }

    const body = await request.json()

    const allowedFields = [
      'currentValue',
      'dataSource',
      'notes',
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

    // Recalculate achievementPct if currentValue changed
    if (data.currentValue !== undefined) {
      const baselineNum = Number(existing.baseline)
      const targetNum = Number(existing.target)
      const currentNum = Number(data.currentValue)
      let achievementPct = 0

      if (targetNum !== baselineNum) {
        achievementPct = ((currentNum - baselineNum) / (targetNum - baselineNum)) * 100
      }

      data.achievementPct = Math.round(achievementPct * 100) / 100
    }

    const updated = await prisma.impactAssessment.update({
      where: { id },
      data,
      select: {
        id: true,
        baseline: true,
        target: true,
        currentValue: true,
        achievementPct: true,
        dataSource: true,
        measurementDate: true,
        notes: true,
        projectId: true,
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

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

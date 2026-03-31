import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const cycleId = url.searchParams.get('cycleId')

    if (!cycleId) {
      return apiBadRequest('cycleId query parameter is required')
    }

    // Fetch all objectives for this cycle
    const objectives = await prisma.oKRObjective.findMany({
      where: {
        organizationId: auth.organizationId,
        cycleId,
      },
      select: {
        id: true,
        ownerType: true,
        ownerId: true,
        progress: true,
        status: true,
        score: true,
      },
    })

    const total = objectives.length
    if (total === 0) {
      return apiSuccess({
        cycleId,
        totalObjectives: 0,
        onTrack: { count: 0, percentage: 0 },
        atRisk: { count: 0, percentage: 0 },
        behind: { count: 0, percentage: 0 },
        completionRate: 0,
        adoptionRate: 0,
        byOwnerType: {},
        averageProgress: 0,
        averageScore: null,
      })
    }

    // Categorize by progress
    let onTrack = 0
    let atRisk = 0
    let behind = 0
    let completed = 0
    let totalProgress = 0

    const scoreValues: number[] = []
    const individualOwnerIds = new Set<string>()

    for (const obj of objectives) {
      const progress = Number(obj.progress)
      totalProgress += progress

      if (progress >= 70) onTrack++
      else if (progress >= 30) atRisk++
      else behind++

      if (obj.status === 'COMPLETED') completed++
      if (obj.score !== null) scoreValues.push(Number(obj.score))
      if (obj.ownerType === 'INDIVIDUAL') individualOwnerIds.add(obj.ownerId)
    }

    // Calculate adoption rate: % of employees with objectives
    const totalEmployees = await prisma.employee.count({
      where: {
        organizationId: auth.organizationId,
        deletedAt: null,
        status: 'ACTIVE',
      },
    })

    const adoptionRate =
      totalEmployees > 0
        ? Math.round((individualOwnerIds.size / totalEmployees) * 10000) / 100
        : 0

    // Breakdown by owner type
    const byOwnerType: Record<string, { count: number; avgProgress: number }> = {}
    for (const obj of objectives) {
      const type = obj.ownerType
      if (!byOwnerType[type]) byOwnerType[type] = { count: 0, avgProgress: 0 }
      byOwnerType[type].count++
      byOwnerType[type].avgProgress += Number(obj.progress)
    }
    for (const type of Object.keys(byOwnerType)) {
      byOwnerType[type].avgProgress =
        Math.round((byOwnerType[type].avgProgress / byOwnerType[type].count) * 100) / 100
    }

    const averageScore =
      scoreValues.length > 0
        ? Math.round((scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) * 100) / 100
        : null

    return apiSuccess({
      cycleId,
      totalObjectives: total,
      onTrack: { count: onTrack, percentage: Math.round((onTrack / total) * 10000) / 100 },
      atRisk: { count: atRisk, percentage: Math.round((atRisk / total) * 10000) / 100 },
      behind: { count: behind, percentage: Math.round((behind / total) * 10000) / 100 },
      completionRate: Math.round((completed / total) * 10000) / 100,
      adoptionRate,
      byOwnerType,
      averageProgress: Math.round((totalProgress / total) * 100) / 100,
      averageScore,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

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

    // Fetch all objectives for this cycle in one query
    const objectives = await prisma.oKRObjective.findMany({
      where: {
        organizationId: auth.organizationId,
        cycleId,
      },
      include: {
        keyResults: {
          select: { id: true, title: true, progress: true, status: true },
        },
      },
      orderBy: [{ ownerType: 'asc' }, { createdAt: 'asc' }],
    })

    // Build a tree from flat list
    const objectiveMap = new Map<string, Record<string, unknown>>()
    for (const obj of objectives) {
      objectiveMap.set(obj.id, {
        ...obj,
        children: [] as Record<string, unknown>[],
      })
    }

    const roots: Record<string, unknown>[] = []
    for (const obj of objectives) {
      const node = objectiveMap.get(obj.id)!
      if (obj.parentObjectiveId && objectiveMap.has(obj.parentObjectiveId)) {
        const parent = objectiveMap.get(obj.parentObjectiveId)!
        ;(parent.children as Record<string, unknown>[]).push(node)
      } else {
        roots.push(node)
      }
    }

    return apiSuccess({
      cycleId,
      tree: roots,
      totalObjectives: objectives.length,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

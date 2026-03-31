import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { Prisma } from '@prisma/client'
import {
  apiCreated,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    const { scoreType, score, comments } = body

    if (!scoreType || score === undefined || score === null) {
      return apiBadRequest('scoreType and score are required')
    }

    const validScoreTypes = ['SELF', 'MANAGER', 'PEER']
    if (!validScoreTypes.includes(scoreType)) {
      return apiBadRequest(`scoreType must be one of: ${validScoreTypes.join(', ')}`)
    }

    const numericScore = Number(score)
    if (numericScore < 0 || numericScore > 1) {
      return apiBadRequest('score must be between 0.00 and 1.00')
    }

    // Validate objective belongs to org
    const objective = await prisma.oKRObjective.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!objective) {
      return apiNotFound('OKR objective not found')
    }

    // Upsert score (unique on objectiveId + scorerId + scoreType)
    const upsertedScore = await prisma.oKRScore.upsert({
      where: {
        objectiveId_scorerId_scoreType: {
          objectiveId: id,
          scorerId: auth.userId,
          scoreType,
        },
      },
      create: {
        objectiveId: id,
        scorerId: auth.userId,
        scoreType,
        score: new Prisma.Decimal(numericScore),
        comments: comments || null,
      },
      update: {
        score: new Prisma.Decimal(numericScore),
        comments: comments || null,
        scoredAt: new Date(),
      },
    })

    // Recalculate objective score as average of all scores
    const allScores = await prisma.oKRScore.findMany({
      where: { objectiveId: id },
      select: { score: true },
    })

    const avgScore =
      allScores.length > 0
        ? allScores.reduce((sum, s) => sum + Number(s.score), 0) / allScores.length
        : 0

    await prisma.oKRObjective.update({
      where: { id },
      data: { score: new Prisma.Decimal(Math.round(avgScore * 100) / 100) },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'okr_score',
      resourceId: upsertedScore.id,
      description: `Scored objective "${objective.title}" (${scoreType}: ${numericScore})`,
      newValues: { objectiveId: id, scoreType, score: numericScore },
      ...auditCtx,
    })

    return apiCreated(upsertedScore)
  } catch (error) {
    return handleRouteError(error)
  }
}

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
  params: Promise<{ krId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { krId } = await params
    const body = await request.json()

    const { newValue, note, blockers } = body

    if (newValue === undefined || newValue === null) {
      return apiBadRequest('newValue is required')
    }

    // Validate key result belongs to org
    const keyResult = await prisma.oKRKeyResult.findFirst({
      where: {
        id: krId,
        objective: { organizationId: auth.organizationId },
      },
      include: {
        objective: { select: { id: true, organizationId: true } },
      },
    })

    if (!keyResult) {
      return apiNotFound('Key result not found')
    }

    const startVal = Number(keyResult.startValue)
    const targetVal = Number(keyResult.targetValue)
    const newVal = Number(newValue)

    // Calculate progress: ((newValue - startValue) / (targetValue - startValue)) * 100
    let progress = 0
    if (targetVal !== startVal) {
      progress = Math.min(100, Math.max(0, ((newVal - startVal) / (targetVal - startVal)) * 100))
    } else if (newVal >= targetVal) {
      progress = 100
    }
    progress = Math.round(progress * 100) / 100

    // Create check-in and update key result in a transaction
    const [checkIn] = await prisma.$transaction(async (tx) => {
      // Create the check-in record
      const newCheckIn = await tx.oKRCheckIn.create({
        data: {
          keyResultId: krId,
          previousValue: keyResult.currentValue,
          newValue: new Prisma.Decimal(newVal),
          progress: new Prisma.Decimal(progress),
          note: note || null,
          blockers: blockers || null,
          createdById: auth.userId,
        },
      })

      // Update key result currentValue and progress
      await tx.oKRKeyResult.update({
        where: { id: krId },
        data: {
          currentValue: new Prisma.Decimal(newVal),
          progress: new Prisma.Decimal(progress),
        },
      })

      // Recalculate parent objective progress as average of KR progresses
      const allKRs = await tx.oKRKeyResult.findMany({
        where: { objectiveId: keyResult.objective.id },
        select: { progress: true },
      })

      const avgProgress =
        allKRs.length > 0
          ? allKRs.reduce((sum, kr) => sum + Number(kr.progress), 0) / allKRs.length
          : 0

      await tx.oKRObjective.update({
        where: { id: keyResult.objective.id },
        data: { progress: new Prisma.Decimal(Math.round(avgProgress * 100) / 100) },
      })

      return [newCheckIn]
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'okr_checkin',
      resourceId: checkIn.id,
      description: `Check-in on key result: ${Number(keyResult.currentValue)} → ${newVal} (${progress}%)`,
      newValues: { keyResultId: krId, newValue: newVal, progress },
      ...auditCtx,
    })

    return apiCreated(checkIn)
  } catch (error) {
    return handleRouteError(error)
  }
}

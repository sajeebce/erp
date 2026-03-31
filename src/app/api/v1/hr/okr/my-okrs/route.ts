import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    // Find the employee record for the current user
    const employee = await prisma.employee.findFirst({
      where: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: { id: true, fullName: true },
    })

    if (!employee) {
      return apiNotFound('Employee profile not found for current user')
    }

    const url = new URL(request.url)
    const cycleId = url.searchParams.get('cycleId')

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
      ownerType: 'INDIVIDUAL',
      ownerId: employee.id,
    }
    if (cycleId) where.cycleId = cycleId

    const objectives = await prisma.oKRObjective.findMany({
      where,
      include: {
        cycle: { select: { id: true, name: true, status: true } },
        keyResults: {
          include: {
            _count: { select: { checkIns: true } },
          },
        },
        parentObjective: { select: { id: true, title: true } },
        _count: { select: { scores: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return apiSuccess({
      employee: { id: employee.id, fullName: employee.fullName },
      objectives,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

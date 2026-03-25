import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)

    const leaveTypes = await prisma.leaveType.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        daysPerYear: true,
        isCarryForward: true,
        maxCarryForward: true,
        isPaid: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    })

    return apiSuccess(leaveTypes)
  } catch (error) {
    return handleRouteError(error)
  }
}

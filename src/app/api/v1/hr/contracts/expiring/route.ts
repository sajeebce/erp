import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get('days') || '30', 10)

    const now = new Date()
    const future = new Date()
    future.setDate(future.getDate() + days)

    const contracts = await prisma.employeeContract.findMany({
      where: {
        organizationId: auth.organizationId,
        status: 'ACTIVE',
        endDate: {
          gte: now,
          lte: future,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeNo: true,
            email: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { endDate: 'asc' },
    })

    return apiSuccess(contracts)
  } catch (error) {
    return handleRouteError(error)
  }
}

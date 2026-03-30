import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    // Find employee from auth user
    const employee = await prisma.employee.findFirst({
      where: { userId: auth.userId, organizationId: auth.organizationId },
    })
    if (!employee) {
      return apiBadRequest('No employee record found for the current user')
    }

    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
      employeeId: employee.id,
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    const [claims, total] = await Promise.all([
      prisma.expenseClaim.findMany({
        where,
        select: {
          id: true,
          claimNo: true,
          claimDate: true,
          totalAmount: true,
          approvedAmount: true,
          purpose: true,
          projectId: true,
          status: true,
          netPayable: true,
          paidAt: true,
          rejectionReason: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { items: true },
          },
        },
        orderBy: { claimDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.expenseClaim.count({ where }),
    ])

    const enriched = claims.map((c) => ({
      ...c,
      itemCount: c._count.items,
      _count: undefined,
    }))

    return apiPaginated(enriched, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

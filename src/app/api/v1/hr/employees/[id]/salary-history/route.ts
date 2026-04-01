import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiPaginated,
  apiNotFound,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId } = await params

    // Verify employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId },
      select: { id: true },
    })

    if (!employee) {
      return apiNotFound('Employee not found')
    }

    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where = {
      employeeId,
      organizationId: auth.organizationId,
    }

    const [revisions, total] = await Promise.all([
      prisma.salaryRevisionHistory.findMany({
        where,
        include: {
          previousGrade: { select: { id: true, code: true, name: true } },
          newGrade: { select: { id: true, code: true, name: true } },
        },
        orderBy: { revisionDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.salaryRevisionHistory.count({ where }),
    ])

    return apiPaginated(revisions, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

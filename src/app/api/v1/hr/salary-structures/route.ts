import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
    }

    const isActive = url.searchParams.get('isActive')
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const gradeId = url.searchParams.get('gradeId')
    if (gradeId) {
      where.gradeId = gradeId
    }

    const [structures, total] = await Promise.all([
      prisma.salaryStructure.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          gradeId: true,
          isDefault: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          grade: { select: { id: true, code: true, name: true } },
          _count: { select: { lines: true } },
          lines: {
            select: {
              id: true,
              componentId: true,
              calculationType: true,
              amount: true,
              percentage: true,
              sortOrder: true,
              component: { select: { id: true, code: true, name: true, type: true } },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.salaryStructure.count({ where }),
    ])

    return apiPaginated(structures, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { name, gradeId, description, isDefault, lines } = body

    if (!name) {
      return apiBadRequest('name is required')
    }

    const structure = await prisma.salaryStructure.create({
      data: {
        organizationId: auth.organizationId,
        name,
        gradeId: gradeId || null,
        description: description || null,
        isDefault: isDefault || false,
        lines: lines?.length
          ? {
              create: lines.map(
                (l: { componentId: string; calculationType: 'FIXED' | 'PERCENT_OF_BASIC' | 'PERCENT_OF_GROSS'; amount?: number; percentage?: number; sortOrder?: number }) => ({
                  componentId: l.componentId,
                  calculationType: l.calculationType as 'FIXED' | 'PERCENT_OF_BASIC' | 'PERCENT_OF_GROSS',
                  amount: l.amount ?? null,
                  percentage: l.percentage ?? null,
                  sortOrder: l.sortOrder ?? 0,
                })
              ),
            }
          : undefined,
      },
      include: {
        grade: { select: { id: true, code: true, name: true } },
        lines: {
          include: { component: { select: { id: true, code: true, name: true, type: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'salary_structure',
      resourceId: structure.id,
      description: `Created salary structure "${name}"`,
      newValues: { name, gradeId, lineCount: lines?.length || 0 },
      ...auditCtx,
    })

    return apiCreated(structure)
  } catch (error) {
    return handleRouteError(error)
  }
}

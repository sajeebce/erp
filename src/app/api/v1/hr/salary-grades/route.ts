import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  apiConflict,
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

    const search = url.searchParams.get('search')
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [grades, total] = await Promise.all([
      prisma.salaryGrade.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          level: true,
          description: true,
          minSalary: true,
          midSalary: true,
          maxSalary: true,
          currency: true,
          effectiveFrom: true,
          effectiveTo: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { steps: true } },
        },
        orderBy: { level: 'asc' },
        skip,
        take: limit,
      }),
      prisma.salaryGrade.count({ where }),
    ])

    return apiPaginated(grades, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { code, name, level, minSalary, midSalary, maxSalary, currency, effectiveFrom, description, steps } = body

    if (!code || !name || level == null || !minSalary || !midSalary || !maxSalary || !effectiveFrom) {
      return apiBadRequest('code, name, level, minSalary, midSalary, maxSalary, and effectiveFrom are required')
    }

    // Check unique code within org
    const existing = await prisma.salaryGrade.findUnique({
      where: { organizationId_code: { organizationId: auth.organizationId, code } },
    })
    if (existing) {
      return apiConflict(`Salary grade with code "${code}" already exists`)
    }

    const grade = await prisma.salaryGrade.create({
      data: {
        organizationId: auth.organizationId,
        code,
        name,
        level,
        description: description || null,
        minSalary,
        midSalary,
        maxSalary,
        currency: currency || 'BDT',
        effectiveFrom: new Date(effectiveFrom),
        steps: steps?.length
          ? {
              create: steps.map((s: { stepNumber: number; basicSalary: number; effectiveFrom: string }) => ({
                stepNumber: s.stepNumber,
                basicSalary: s.basicSalary,
                effectiveFrom: new Date(s.effectiveFrom),
              })),
            }
          : undefined,
      },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'salary_grade',
      resourceId: grade.id,
      description: `Created salary grade ${code} - ${name}`,
      newValues: { code, name, level, minSalary, maxSalary },
      ...auditCtx,
    })

    return apiCreated(grade)
  } catch (error) {
    return handleRouteError(error)
  }
}

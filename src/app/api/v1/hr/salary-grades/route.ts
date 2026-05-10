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
        include: {
          steps: { orderBy: { stepNumber: 'asc' } },
          structures: {
            where: { isActive: true },
            include: {
              lines: {
                include: { component: true },
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
        orderBy: { level: 'asc' },
        skip,
        take: limit,
      }),
      prisma.salaryGrade.count({ where }),
    ])

    const mapped = grades.map((grade) => ({
      ...grade,
      status: grade.isActive ? 'ACTIVE' : 'INACTIVE',
    }))

    return apiPaginated(mapped, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { code, name, level, minSalary, midSalary, maxSalary, currency, effectiveFrom, description, steps } = body
    const parsedLevel = Number(level)
    const parsedMinSalary = Number(minSalary)
    const parsedMidSalary = Number(midSalary)
    const parsedMaxSalary = Number(maxSalary)

    if (!code || !name || level == null || !minSalary || !midSalary || !maxSalary || !effectiveFrom) {
      return apiBadRequest('code, name, level, minSalary, midSalary, maxSalary, and effectiveFrom are required')
    }
    if (
      !Number.isInteger(parsedLevel) ||
      parsedLevel < 1 ||
      ![parsedMinSalary, parsedMidSalary, parsedMaxSalary].every(Number.isFinite) ||
      parsedMinSalary <= 0 ||
      parsedMidSalary <= 0 ||
      parsedMaxSalary <= 0 ||
      parsedMinSalary > parsedMidSalary ||
      parsedMidSalary > parsedMaxSalary
    ) {
      return apiBadRequest('Salary grade level and range are invalid')
    }

    const cleanedSteps = Array.isArray(steps)
      ? steps.map((step: { stepNumber: number | string; basicSalary: number | string; effectiveFrom?: string }) => ({
          stepNumber: Number(step.stepNumber),
          basicSalary: Number(step.basicSalary),
          effectiveFrom: step.effectiveFrom || effectiveFrom,
        }))
      : []

    if (
      cleanedSteps.some((step) => !Number.isInteger(step.stepNumber) || step.stepNumber < 1 || !Number.isFinite(step.basicSalary) || step.basicSalary <= 0) ||
      new Set(cleanedSteps.map((step) => step.stepNumber)).size !== cleanedSteps.length
    ) {
      return apiBadRequest('Salary grade steps are invalid')
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
        level: parsedLevel,
        description: description || null,
        minSalary: parsedMinSalary,
        midSalary: parsedMidSalary,
        maxSalary: parsedMaxSalary,
        currency: currency || 'BDT',
        effectiveFrom: new Date(effectiveFrom),
        steps: cleanedSteps.length
          ? {
              create: cleanedSteps.map((s) => ({
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

    return apiCreated({
      ...grade,
      status: grade.isActive ? 'ACTIVE' : 'INACTIVE',
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { generateNextNumber } from '@/lib/number-sequence'
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
    const { page, limit, skip, search, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
    }

    // If not admin, only show own grievances
    if (auth.roleName !== 'ADMIN') {
      const employee = await prisma.employee.findFirst({
        where: { userId: auth.userId, organizationId: auth.organizationId, deletedAt: null },
        select: { id: true },
      })
      if (employee) {
        where.employeeId = employee.id
      }
    }

    if (search) {
      where.OR = [
        { grievanceNo: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ]
    }

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const severity = url.searchParams.get('severity')
    if (severity) where.severity = severity

    const category = url.searchParams.get('category')
    if (category) where.category = category

    const [grievances, total] = await Promise.all([
      prisma.employeeGrievance.findMany({
        where,
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.employeeGrievance.count({ where }),
    ])

    return apiPaginated(grievances, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { category, subject, description } = body

    if (!category || !subject || !description) {
      return apiBadRequest('category, subject, and description are required')
    }

    const isAnonymous = body.isAnonymous ?? false

    // Determine employeeId
    let employeeId: string | null = null
    if (!isAnonymous) {
      const employee = await prisma.employee.findFirst({
        where: { userId: auth.userId, organizationId: auth.organizationId, deletedAt: null },
        select: { id: true },
      })
      employeeId = employee?.id || null
    }

    const grievanceNo = await generateNextNumber(auth.organizationId, 'grievance')

    const grievance = await prisma.employeeGrievance.create({
      data: {
        organizationId: auth.organizationId,
        grievanceNo,
        employeeId,
        isAnonymous,
        category,
        subject: subject.trim(),
        description,
        severity: body.severity || 'MEDIUM',
        evidencePaths: body.evidencePaths || null,
        status: 'SUBMITTED',
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'grievance',
      resourceId: grievance.id,
      description: `Submitted grievance "${grievanceNo}" — ${category}: ${subject}`,
      newValues: { grievanceNo, category, subject, isAnonymous },
      ...auditCtx,
    })

    return apiCreated(grievance)
  } catch (error) {
    return handleRouteError(error)
  }
}

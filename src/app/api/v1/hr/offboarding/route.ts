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

const DEFAULT_TASKS = [
  { taskName: 'Return Laptop & Equipment', category: 'IT', sortOrder: 1 },
  { taskName: 'Revoke Email & System Access', category: 'IT', sortOrder: 2 },
  { taskName: 'Return ID Badge & Keys', category: 'SECURITY', sortOrder: 3 },
  { taskName: 'Clear Financial Dues', category: 'FINANCE', sortOrder: 4 },
  { taskName: 'Knowledge Transfer Documentation', category: 'HR', sortOrder: 5 },
  { taskName: 'Exit Interview', category: 'HR', sortOrder: 6 },
  { taskName: 'Update Employee Records', category: 'HR', sortOrder: 7 },
  { taskName: 'Issue Experience Certificate', category: 'HR', sortOrder: 8 },
]

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, search, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
    }

    if (search) {
      where.OR = [
        { offboardingNo: { contains: search, mode: 'insensitive' } },
        { employee: { fullName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const [offboardings, total] = await Promise.all([
      prisma.offboarding.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              employeeNo: true,
              department: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.offboarding.count({ where }),
    ])

    return apiPaginated(offboardings, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { employeeId, separationType, lastWorkingDay } = body

    if (!employeeId || !separationType || !lastWorkingDay) {
      return apiBadRequest('employeeId, separationType, and lastWorkingDay are required')
    }

    // Validate employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true, fullName: true },
    })
    if (!employee) return apiBadRequest('Employee not found in this organization')

    const offboardingNo = await generateNextNumber(auth.organizationId, 'offboarding')

    const offboarding = await prisma.offboarding.create({
      data: {
        organizationId: auth.organizationId,
        offboardingNo,
        employeeId,
        separationType,
        lastWorkingDay: new Date(lastWorkingDay),
        noticeDate: body.noticeDate ? new Date(body.noticeDate) : null,
        noticePeriodDays: body.noticePeriodDays ?? 30,
        exitReason: body.exitReason || null,
        notes: body.notes || null,
        status: 'INITIATED',
        tasks: {
          create: DEFAULT_TASKS,
        },
      },
      include: {
        tasks: { orderBy: { sortOrder: 'asc' } },
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'offboarding',
      resourceId: offboarding.id,
      description: `Initiated offboarding "${offboardingNo}" for employee "${employee.fullName}"`,
      newValues: { offboardingNo, employeeId, separationType, lastWorkingDay },
      ...auditCtx,
    })

    return apiCreated(offboarding)
  } catch (error) {
    return handleRouteError(error)
  }
}

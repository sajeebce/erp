import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated, apiPaginated, apiBadRequest, apiConflict,
  handleRouteError, parsePaginationParams,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Prisma.PFEnrollmentWhereInput = {
      organizationId: auth.organizationId,
    }

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const [enrollments, total] = await Promise.all([
      prisma.pFEnrollment.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeNo: true,
              fullName: true,
              basicSalary: true,
              department: { select: { id: true, name: true } },
              designation: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pFEnrollment.count({ where }),
    ])

    return apiPaginated(enrollments, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { employeeId, policyId, enrollmentDate, effectiveDate, employeeRate, employerRate } = body

    if (!employeeId || !policyId) {
      return apiBadRequest('employeeId and policyId are required')
    }

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true, fullName: true },
    })
    if (!employee) {
      return apiBadRequest('Employee not found')
    }

    const policy = await prisma.pFPolicy.findFirst({
      where: { id: policyId, organizationId: auth.organizationId, isActive: true },
    })
    if (!policy) {
      return apiBadRequest('PF policy not found or inactive')
    }

    const existing = await prisma.pFEnrollment.findFirst({
      where: { organizationId: auth.organizationId, employeeId },
    })
    if (existing) {
      return apiConflict('Employee is already enrolled in PF')
    }

    const now = new Date()
    const enrollment = await prisma.pFEnrollment.create({
      data: {
        organizationId: auth.organizationId,
        employeeId,
        policyId,
        enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : now,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : now,
        employeeRate: employeeRate ?? policy.employeeContribRate,
        employerRate: employerRate ?? policy.employerContribRate,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'pf_enrollment',
      resourceId: enrollment.id,
      description: `Enrolled employee "${employee.fullName}" in PF`,
      newValues: { employeeId, policyId },
      ...auditCtx,
    })

    return apiCreated(enrollment)
  } catch (error) {
    return handleRouteError(error)
  }
}

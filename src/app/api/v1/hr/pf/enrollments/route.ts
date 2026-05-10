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

    const {
      employeeId,
      policyId,
      enrollmentDate,
      effectiveDate,
      employeeRate,
      employerRate,
      employeeContribRate,
      employerContribRate,
    } = body

    if (!employeeId || !policyId) {
      return apiBadRequest('employeeId and policyId are required')
    }

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        joiningDate: true,
        employmentType: true,
        status: true,
        basicSalary: true,
      },
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
    const requestedEffectiveDate = effectiveDate ? new Date(effectiveDate) : now

    if (policy.eligibilityMonths > 0) {
      const eligibilityDate = new Date(employee.joiningDate)
      eligibilityDate.setMonth(eligibilityDate.getMonth() + policy.eligibilityMonths)

      if (requestedEffectiveDate < eligibilityDate) {
        return apiBadRequest(`Employee is eligible for PF from ${eligibilityDate.toISOString().slice(0, 10)}`)
      }
    }

    if (Array.isArray(policy.eligibilityTypes) && policy.eligibilityTypes.length > 0) {
      const eligibleTypes = policy.eligibilityTypes.map(String)
      if (!eligibleTypes.includes(employee.employmentType)) {
        return apiBadRequest(`Employee type ${employee.employmentType} is not eligible for this PF policy`)
      }
    }

    const resolvedEmployeeRate = employeeRate ?? employeeContribRate ?? policy.employeeContribRate
    const resolvedEmployerRate = employerRate ?? employerContribRate ?? policy.employerContribRate
    const shouldPostInitialContribution =
      employee.status === 'ACTIVE' &&
      Boolean(employee.basicSalary) &&
      requestedEffectiveDate <= now

    const enrollment = await prisma.$transaction(async (tx) => {
      const createdEnrollment = await tx.pFEnrollment.create({
        data: {
          organizationId: auth.organizationId,
          employeeId,
          policyId,
          enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : now,
          effectiveDate: requestedEffectiveDate,
          employeeRate: resolvedEmployeeRate,
          employerRate: resolvedEmployerRate,
        },
      })

      if (!shouldPostInitialContribution || !employee.basicSalary) {
        return createdEnrollment
      }

      const month = requestedEffectiveDate.getMonth() + 1
      const year = requestedEffectiveDate.getFullYear()
      const basicSalary = employee.basicSalary
      const employeeAmount = new Prisma.Decimal(basicSalary.toString())
        .mul(resolvedEmployeeRate)
        .div(100)
      const employerAmount = new Prisma.Decimal(basicSalary.toString())
        .mul(resolvedEmployerRate)
        .div(100)
      const totalAmount = employeeAmount.add(employerAmount)

      await tx.pFContribution.create({
        data: {
          organizationId: auth.organizationId,
          enrollmentId: createdEnrollment.id,
          employeeId,
          month,
          year,
          basicSalary,
          employeeAmount,
          employerAmount,
          totalAmount,
        },
      })

      return tx.pFEnrollment.update({
        where: { id: createdEnrollment.id },
        data: {
          totalEmployeeContrib: { increment: employeeAmount },
          totalEmployerContrib: { increment: employerAmount },
          currentBalance: { increment: totalAmount },
        },
      })
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
      newValues: {
        employeeId,
        policyId,
        initialContributionPosted: shouldPostInitialContribution,
      },
      ...auditCtx,
    })

    return apiCreated(enrollment)
  } catch (error) {
    return handleRouteError(error)
  }
}

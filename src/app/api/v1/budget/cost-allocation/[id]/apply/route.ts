import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const body = await request.json()
    const { periodStart, periodEnd, allocations } = body

    // Validate required fields
    if (!periodStart || !periodEnd) {
      return apiBadRequest('periodStart and periodEnd are required')
    }

    if (!Array.isArray(allocations) || allocations.length === 0) {
      return apiBadRequest('At least one allocation is required')
    }

    // Validate the rule exists
    const rule = await prisma.costAllocationRule.findUnique({
      where: { id },
    })

    if (!rule) {
      return apiNotFound('Cost allocation rule not found')
    }

    if (!rule.isActive) {
      return apiBadRequest('Cost allocation rule is inactive')
    }

    // Validate percentages sum to 100
    const totalPercentage = allocations.reduce(
      (sum: number, a: { percentage: number }) => sum + Number(a.percentage),
      0
    )
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return apiBadRequest(
        `Allocation percentages must sum to 100 (currently ${totalPercentage})`
      )
    }

    // Validate each allocation
    for (let i = 0; i < allocations.length; i++) {
      const alloc = allocations[i]
      if (!alloc.projectId || alloc.percentage === undefined) {
        return apiBadRequest(`Allocation ${i + 1}: projectId and percentage are required`)
      }
      if (Number(alloc.percentage) <= 0) {
        return apiBadRequest(`Allocation ${i + 1}: percentage must be greater than 0`)
      }
    }

    // Validate all projectIds belong to org
    const projectIds = allocations.map((a: { projectId: string }) => a.projectId)
    const projects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
        organizationId: auth.organizationId,
      },
      select: { id: true },
    })

    if (projects.length !== new Set(projectIds).size) {
      return apiBadRequest('One or more project IDs are invalid or not found in this organization')
    }

    // Create allocation entries in a transaction
    const entries = await prisma.$transaction(async (tx) => {
      const created = await Promise.all(
        allocations.map(
          (alloc: { projectId: string; percentage: number }) => {
            const percentage = Number(alloc.percentage)
            const allocatedAmount = Number(rule.totalAmount) * percentage / 100

            return tx.costAllocationEntry.create({
              data: {
                ruleId: id,
                projectId: alloc.projectId,
                percentage: new Prisma.Decimal(percentage),
                allocatedAmount: new Prisma.Decimal(allocatedAmount),
                periodStart: new Date(periodStart),
                periodEnd: new Date(periodEnd),
              },
              include: {
                project: {
                  select: { id: true, name: true },
                },
              },
            })
          }
        )
      )

      return created
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'budget',
      resource: 'cost_allocation_entry',
      resourceId: id,
      description: `Applied cost allocation rule "${rule.name}" for period ${periodStart} to ${periodEnd}`,
      newValues: {
        ruleId: id,
        periodStart,
        periodEnd,
        allocationsCount: allocations.length,
        totalAmount: Number(rule.totalAmount),
      },
      ...auditCtx,
    })

    return apiCreated({
      ruleId: id,
      ruleName: rule.name,
      totalAmount: Number(rule.totalAmount),
      periodStart,
      periodEnd,
      entries,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

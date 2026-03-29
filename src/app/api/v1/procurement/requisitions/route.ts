import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, sort, order } = parsePaginationParams(url)

    // PR tenant isolation: through project.organizationId or requestedById user
    const where: Record<string, unknown> = {
      deletedAt: null,
      OR: [
        { project: { organizationId: auth.organizationId } },
        { requestedById: auth.userId },
      ],
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    const projectId = url.searchParams.get('projectId')
    if (projectId) {
      where.projectId = projectId
    }

    const priority = url.searchParams.get('priority')
    if (priority) {
      where.priority = priority
    }

    const [requisitions, total] = await Promise.all([
      prisma.purchaseRequisition.findMany({
        where,
        select: {
          id: true,
          prNo: true,
          date: true,
          requestedById: true,
          departmentId: true,
          projectId: true,
          priority: true,
          totalEstimate: true,
          status: true,
          justification: true,
          approvedById: true,
          approvedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.purchaseRequisition.count({ where }),
    ])

    return apiPaginated(requisitions, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { date, departmentId, projectId, priority, justification, notes, lines } = body

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return apiBadRequest('At least one line item is required')
    }

    // If projectId provided, validate it belongs to org
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, organizationId: auth.organizationId, deletedAt: null },
        select: { id: true, totalBudget: true, amountSpent: true },
      })
      if (!project) {
        return apiBadRequest('Project not found or does not belong to your organization')
      }

      // Validate project-level budget
      const linesTotal = lines.reduce(
        (sum: number, l: { quantity?: number; estimatedPrice?: number }) =>
          sum + (Number(l.quantity || 0) * Number(l.estimatedPrice || 0)),
        0
      )
      const remaining = Number(project.totalBudget) - Number(project.amountSpent)
      if (linesTotal > remaining) {
        return apiBadRequest(
          `Total estimate (${linesTotal}) exceeds remaining project budget (${remaining})`
        )
      }

      // Cross-module: validate against active/approved Budget if one exists
      const activeBudget = await prisma.budget.findFirst({
        where: {
          projectId,
          status: { in: ['APPROVED', 'ACTIVE'] },
          deletedAt: null,
        },
        select: { id: true, totalAmount: true },
      })

      if (activeBudget) {
        // Sum totalEstimate of all existing non-rejected PRs linked to this project
        const existingPRAggregate = await prisma.purchaseRequisition.aggregate({
          where: {
            projectId,
            status: { notIn: ['REJECTED', 'CANCELLED'] },
            deletedAt: null,
          },
          _sum: { totalEstimate: true },
        })

        const committedAmount = Number(existingPRAggregate._sum.totalEstimate || 0)
        const budgetTotal = Number(activeBudget.totalAmount)
        const availableBudget = budgetTotal - committedAmount

        if (linesTotal > availableBudget) {
          return apiBadRequest(
            `Insufficient budget. Available: ${availableBudget.toFixed(2)}, Requested: ${linesTotal.toFixed(2)}`
          )
        }
      }
    }

    const prNo = await generateNextNumber(auth.organizationId, 'purchase_requisition')

    // Calculate totalEstimate from lines
    const totalEstimate = lines.reduce(
      (sum: number, l: { quantity?: number; estimatedPrice?: number }) =>
        sum + (Number(l.quantity || 0) * Number(l.estimatedPrice || 0)),
      0
    )

    const requisition = await prisma.purchaseRequisition.create({
      data: {
        prNo,
        date: date ? new Date(date) : new Date(),
        requestedById: auth.userId,
        departmentId: departmentId || null,
        projectId: projectId || null,
        priority: priority || 'NORMAL',
        totalEstimate: new Prisma.Decimal(totalEstimate),
        justification: justification || null,
        notes: notes || null,
        lines: {
          create: lines.map(
            (
              l: { description: string; specification?: string; unit: string; quantity: number; estimatedPrice: number },
              i: number
            ) => ({
              description: l.description,
              specification: l.specification || null,
              unit: l.unit,
              quantity: new Prisma.Decimal(l.quantity),
              estimatedPrice: new Prisma.Decimal(l.estimatedPrice),
              totalEstimate: new Prisma.Decimal(Number(l.quantity) * Number(l.estimatedPrice)),
              sortOrder: i,
            })
          ),
        },
      },
      include: { lines: true },
    })

    const audit = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'PROCUREMENT',
      resource: 'PurchaseRequisition',
      resourceId: requisition.id,
      description: `Created purchase requisition ${prNo}`,
      ...audit,
    })

    return apiCreated(requisition)
  } catch (error) {
    return handleRouteError(error)
  }
}

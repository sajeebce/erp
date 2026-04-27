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

    // ADMIN sees all PRs in the org; others see only their own
    const where: Record<string, unknown> = { deletedAt: null }

    if (auth.roleName === 'ADMIN') {
      const orgUserIds = await prisma.user
        .findMany({ where: { organizationId: auth.organizationId }, select: { id: true } })
        .then((users) => users.map((u) => u.id))
      where.OR = [
        { project: { organizationId: auth.organizationId } },
        { requestedById: { in: orgUserIds } },
      ]
    } else {
      where.requestedById = auth.userId
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

    let budgetWarning: string | null = null

    // If projectId provided, validate it belongs to org
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, organizationId: auth.organizationId, deletedAt: null },
        select: { id: true, totalBudget: true, amountSpent: true },
      })
      if (!project) {
        return apiBadRequest('Project not found or does not belong to your organization')
      }

      const linesTotal = lines.reduce(
        (sum: number, l: { quantity?: number; estimatedPrice?: number }) =>
          sum + (Number(l.quantity || 0) * Number(l.estimatedPrice || 0)),
        0
      )

      // Project-level budget check — warn, do not block
      const remaining = Number(project.totalBudget) - Number(project.amountSpent)
      if (linesTotal > remaining) {
        budgetWarning = `Total estimate (${linesTotal.toFixed(2)}) exceeds remaining project budget (${remaining.toFixed(2)}). Proceed with approval at your discretion.`
      }

      // Cross-module: check against active/approved Budget if one exists — warn, do not block
      if (!budgetWarning) {
        const activeBudget = await prisma.budget.findFirst({
          where: {
            projectId,
            status: { in: ['APPROVED', 'ACTIVE'] },
            deletedAt: null,
          },
          select: { id: true, totalAmount: true },
        })

        if (activeBudget) {
          const existingPRAggregate = await prisma.purchaseRequisition.aggregate({
            where: {
              projectId,
              status: { notIn: ['REJECTED', 'CANCELLED'] as any },
              deletedAt: null,
            },
            _sum: { totalEstimate: true },
          })

          const committedAmount = Number(existingPRAggregate._sum.totalEstimate || 0)
          const budgetTotal = Number(activeBudget.totalAmount)
          const availableBudget = budgetTotal - committedAmount

          if (linesTotal > availableBudget) {
            budgetWarning = `Requested amount (${linesTotal.toFixed(2)}) exceeds available budget (${availableBudget.toFixed(2)}). Proceed with approval at your discretion.`
          }
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

    return apiCreated({ ...requisition, budgetWarning })
  } catch (error) {
    return handleRouteError(error)
  }
}

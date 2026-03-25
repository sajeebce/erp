import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
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
    const auth = await requireRoleFromRequest(request, 'ADMIN')
    const { id } = await params

    // Fetch revision with lines and budget
    const revision = await prisma.budgetRevision.findFirst({
      where: {
        id,
        budget: {
          project: { organizationId: auth.organizationId },
          deletedAt: null,
        },
      },
      include: {
        lines: true,
        budget: {
          select: { id: true, name: true },
        },
      },
    })

    if (!revision) {
      return apiNotFound('Budget revision not found')
    }

    if (revision.status !== 'DRAFT' && revision.status !== 'SUBMITTED') {
      return apiBadRequest(`Cannot approve a revision with status "${revision.status}"`)
    }

    // Approve in a transaction: update revision, update budget lines, update budget total
    const approved = await prisma.$transaction(async (tx) => {
      // Update revision status
      const updatedRevision = await tx.budgetRevision.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: auth.userId,
          approvedAt: new Date(),
        },
      })

      // Update each BudgetLine's totalAmount to the revised amount
      for (const revLine of revision.lines) {
        await tx.budgetLine.update({
          where: { id: revLine.budgetLineId },
          data: {
            totalAmount: revLine.revisedAmount,
          },
        })
      }

      // Update Budget's totalAmount to revisedTotal
      await tx.budget.update({
        where: { id: revision.budgetId },
        data: {
          totalAmount: new Prisma.Decimal(Number(revision.revisedTotal)),
        },
      })

      return updatedRevision
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'budget',
      resource: 'budget_revision',
      resourceId: id,
      description: `Approved budget revision ${revision.revisionNo} for budget "${revision.budget.name}"`,
      oldValues: { status: revision.status },
      newValues: {
        status: 'APPROVED',
        revisedTotal: Number(revision.revisedTotal),
        linesUpdated: revision.lines.length,
      },
      ...auditCtx,
    })

    return apiSuccess(approved)
  } catch (error) {
    return handleRouteError(error)
  }
}

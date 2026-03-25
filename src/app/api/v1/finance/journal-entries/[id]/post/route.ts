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

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRoleFromRequest(request, [
      'ADMIN',
      'FINANCE_ADMIN',
      'FINANCE_HEAD',
    ])
    const { id } = await params

    const journalEntry = await prisma.journalEntry.findFirst({
      where: {
        id,
        deletedAt: null,
        fiscalYear: { organizationId: auth.organizationId },
      },
    })

    if (!journalEntry) {
      return apiNotFound('Journal entry not found')
    }

    if (journalEntry.status !== 'DRAFT') {
      return apiBadRequest('Only DRAFT journal entries can be posted. Current status: ' + journalEntry.status)
    }

    const now = new Date()

    const updated = await prisma.journalEntry.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: auth.userId,
        approvedAt: now,
        postedAt: now,
      },
      include: {
        lines: {
          include: {
            account: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'APPROVE',
      module: 'finance',
      resource: 'journal_entry',
      resourceId: id,
      description: `Posted journal entry ${journalEntry.entryNo}`,
      oldValues: { status: 'DRAFT' },
      newValues: { status: 'APPROVED', approvedById: auth.userId, postedAt: now },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

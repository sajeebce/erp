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

    // Verify voucher belongs to this org via organizationId
    const voucher = await prisma.voucher.findFirst({
      where: { id, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!voucher) {
      return apiNotFound('Voucher not found')
    }

    if (voucher.status !== 'DRAFT') {
      return apiBadRequest('Only DRAFT vouchers can be approved. Current status: ' + voucher.status)
    }

    // Segregation of duty: approver must be different from preparer
    if (voucher.preparedById === auth.userId) {
      return apiBadRequest('The approver must be a different user than the preparer (segregation of duty)')
    }

    // Voucher must have a linked journal entry before approval
    if (!voucher.journalEntryId) {
      return apiBadRequest('Journal entry must be created and linked before approval')
    }

    const now = new Date()

    // Post the linked journal entry and approve the voucher in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Post the linked JE: set status=APPROVED, postedAt=now
      await tx.journalEntry.update({
        where: { id: voucher.journalEntryId! },
        data: {
          status: 'APPROVED',
          approvedById: auth.userId,
          approvedAt: now,
          postedAt: now,
        },
      })

      // Approve the voucher
      const updated = await tx.voucher.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: auth.userId,
          approvedAt: now,
        },
      })

      return updated
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'APPROVE',
      module: 'finance',
      resource: 'voucher',
      resourceId: id,
      description: `Approved voucher ${voucher.voucherNo} and posted linked journal entry`,
      oldValues: { status: 'DRAFT' },
      newValues: { status: 'APPROVED', approvedById: auth.userId, approvedAt: now },
      ...auditCtx,
    })

    return apiSuccess(result)
  } catch (error) {
    return handleRouteError(error)
  }
}

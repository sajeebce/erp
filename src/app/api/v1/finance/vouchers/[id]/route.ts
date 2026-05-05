import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'
import { validateDimensions } from '@/lib/dimension-validation'

const VALID_VOUCHER_TYPES = ['DEBIT', 'RECEIPT', 'CASH', 'BANK', 'JOURNAL', 'CONTRA'] as const

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const voucher = await prisma.voucher.findFirst({
      where: { id, organizationId: auth.organizationId, deletedAt: null },
      include: {
        project: {
          select: { id: true, name: true },
        },
        grant: {
          select: { id: true, title: true },
        },
        businessUnit: {
          select: { id: true, code: true, name: true, shortName: true },
        },
        bankAccount: {
          select: { id: true, accountName: true, bankName: true, accountNumber: true },
        },
        journalEntry: {
          include: {
            lines: {
              include: {
                account: {
                  select: { id: true, code: true, name: true },
                },
                businessUnit: {
                  select: { id: true, code: true, name: true, shortName: true },
                },
                costCenter: {
                  select: { id: true, code: true, name: true },
                },
                fundClass: {
                  select: { id: true, code: true, name: true },
                },
              },
            },
          },
        },
      },
    })

    if (!voucher) {
      return apiNotFound('Voucher not found')
    }

    return apiSuccess(voucher)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.voucher.findFirst({
      where: { id, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!existing) {
      return apiNotFound('Voucher not found')
    }

    if (existing.status !== 'DRAFT') {
      return apiBadRequest('Only DRAFT vouchers can be updated')
    }

    const body = await request.json()
    const {
      type,
      date,
      description,
      amount,
      payee,
      projectId,
      grantId,
      businessUnitId,
      bankAccountId,
      chequeNo,
      chequeDate,
    } = body

    const updateData: Record<string, unknown> = {}

    // Validate type if provided
    if (type !== undefined) {
      if (!VALID_VOUCHER_TYPES.includes(type)) {
        return apiBadRequest(`type must be one of: ${VALID_VOUCHER_TYPES.join(', ')}`)
      }
      updateData.type = type
    }

    // Validate amount if provided
    if (amount !== undefined) {
      const numAmount = Number(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        return apiBadRequest('amount must be greater than 0')
      }
      updateData.amount = new Prisma.Decimal(numAmount)
    }

    // Validate bankAccountId if provided
    if (bankAccountId !== undefined) {
      if (bankAccountId) {
        const bankAccount = await prisma.bankAccount.findFirst({
          where: {
            id: bankAccountId,
            organizationId: auth.organizationId,
          },
        })
        if (!bankAccount) {
          return apiBadRequest('Bank account not found in this organization')
        }
      }
      updateData.bankAccountId = bankAccountId || null
    }

    // Validate projectId if provided
    if (projectId !== undefined) {
      if (projectId) {
        const project = await prisma.project.findFirst({
          where: { id: projectId, organizationId: auth.organizationId },
        })
        if (!project) {
          return apiBadRequest('Invalid project ID')
        }
      }
      updateData.projectId = projectId || null
    }

    // Validate grantId if provided
    if (grantId !== undefined) {
      if (grantId) {
        const grant = await prisma.grant.findFirst({
          where: { id: grantId, donor: { organizationId: auth.organizationId } },
        })
        if (!grant) {
          return apiBadRequest('Invalid grant ID')
        }
      }
      updateData.grantId = grantId || null
    }

    // Validate businessUnitId if provided (and persist so DRAFT edits don't strip it)
    if (businessUnitId !== undefined) {
      if (businessUnitId) {
        const dimError = await validateDimensions(auth.organizationId, { businessUnitId })
        if (dimError) return dimError
      }
      updateData.businessUnitId = businessUnitId || null
    }

    if (date !== undefined) updateData.date = new Date(date)
    if (description !== undefined) updateData.description = description.trim()
    if (payee !== undefined) updateData.payee = payee || null
    if (chequeNo !== undefined) updateData.chequeNo = chequeNo || null
    if (chequeDate !== undefined) updateData.chequeDate = chequeDate ? new Date(chequeDate) : null

    const updated = await prisma.voucher.update({
      where: { id },
      data: updateData,
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'finance',
      resource: 'voucher',
      resourceId: id,
      description: `Updated voucher ${existing.voucherNo}`,
      oldValues: {
        type: existing.type,
        amount: existing.amount.toString(),
        description: existing.description,
      },
      newValues: updateData,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.voucher.findFirst({
      where: { id, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!existing) {
      return apiNotFound('Voucher not found')
    }

    if (existing.status !== 'DRAFT') {
      return apiBadRequest('Only DRAFT vouchers can be deleted')
    }

    await prisma.voucher.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'DELETE',
      module: 'finance',
      resource: 'voucher',
      resourceId: id,
      description: `Deleted voucher ${existing.voucherNo}`,
      oldValues: { voucherNo: existing.voucherNo, type: existing.type, amount: existing.amount.toString() },
      ...auditCtx,
    })

    return apiSuccess({ message: 'Voucher deleted successfully' })
  } catch (error) {
    return handleRouteError(error)
  }
}

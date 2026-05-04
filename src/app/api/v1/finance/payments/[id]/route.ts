import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { apiSuccess, apiNotFound, handleRouteError } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRoleFromRequest(request, ['ADMIN'])
    const { id } = await params

    const payment = await prisma.vendorPayment.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        invoice: {
          include: {
            grns: true,
          },
        },
      },
    })

    if (!payment) return apiNotFound('Payment not found')

    const [vendor, bankAccount, journalEntry, voucher] = await Promise.all([
      payment.invoice
        ? prisma.vendor.findFirst({
            where: { id: payment.invoice.vendorId, organizationId: auth.organizationId },
            select: { id: true, vendorNo: true, companyName: true },
          })
        : Promise.resolve(null),
      prisma.bankAccount.findFirst({
        where: { id: payment.bankAccountId, organizationId: auth.organizationId },
        select: {
          id: true,
          accountCode: true,
          accountName: true,
          bankName: true,
          branchName: true,
          type: true,
          currentBalance: true,
        },
      }),
      payment.journalEntryId
        ? prisma.journalEntry.findFirst({
            where: { id: payment.journalEntryId },
            include: {
              lines: {
                include: {
                  account: { select: { code: true, name: true, type: true } },
                },
              },
            },
          })
        : Promise.resolve(null),
      payment.voucherId
        ? prisma.voucher.findFirst({
            where: { id: payment.voucherId, organizationId: auth.organizationId },
            select: { id: true, voucherNo: true, type: true, status: true },
          })
        : Promise.resolve(null),
    ])

    return apiSuccess({
      ...payment,
      vendor,
      bankAccount,
      journalEntry,
      voucher,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

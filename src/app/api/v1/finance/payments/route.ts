import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { apiPaginated, handleRouteError, parsePaginationParams } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, ['ADMIN'])
    const url = new URL(request.url)
    const { page, limit, skip, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
    }

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const bankAccountId = url.searchParams.get('bankAccountId')
    if (bankAccountId) where.bankAccountId = bankAccountId

    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')
    if (dateFrom || dateTo) {
      where.paymentDate = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      }
    }

    const [payments, total] = await Promise.all([
      prisma.vendorPayment.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNo: true,
              invoiceDate: true,
              vendorId: true,
              grossAmount: true,
              outstandingAmount: true,
              status: true,
            },
          },
        },
        orderBy: { [sort === 'createdAt' ? 'paymentDate' : sort]: order },
        skip,
        take: limit,
      }),
      prisma.vendorPayment.count({ where }),
    ])

    const vendorIds = [...new Set(payments.map((payment) => payment.invoice?.vendorId).filter(Boolean) as string[])]
    const bankAccountIds = [...new Set(payments.map((payment) => payment.bankAccountId))]

    const [vendors, bankAccounts] = await Promise.all([
      vendorIds.length
        ? prisma.vendor.findMany({
            where: { id: { in: vendorIds }, organizationId: auth.organizationId },
            select: { id: true, vendorNo: true, companyName: true },
          })
        : Promise.resolve([]),
      bankAccountIds.length
        ? prisma.bankAccount.findMany({
            where: { id: { in: bankAccountIds }, organizationId: auth.organizationId },
            select: { id: true, accountCode: true, accountName: true, type: true },
          })
        : Promise.resolve([]),
    ])

    const vendorById = new Map(vendors.map((vendor) => [vendor.id, vendor]))
    const bankAccountById = new Map(bankAccounts.map((account) => [account.id, account]))

    const enriched = payments.map((payment) => ({
      ...payment,
      vendor: payment.invoice ? vendorById.get(payment.invoice.vendorId) || null : null,
      bankAccount: bankAccountById.get(payment.bankAccountId) || null,
    }))

    return apiPaginated(enriched, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

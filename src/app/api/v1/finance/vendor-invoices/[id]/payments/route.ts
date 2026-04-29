import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

const VENDOR_PAYMENT_SOURCE = 'VENDOR_PAYMENT'

type PaymentInput = {
  paymentDate?: string
  paymentMethod?: string
  bankAccountId?: string
  amount?: number | string
  tdsAmount?: number | string
  vdsAmount?: number | string
  reference?: string
  notes?: string
}

function num(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : NaN
}

function pickAccount<T extends { code: string; name: string }>(accounts: T[], code: string, pattern: RegExp) {
  return accounts.find((account) => account.code === code) ??
    accounts.find((account) => pattern.test(`${account.code} ${account.name}`)) ??
    null
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRoleFromRequest(request, ['ADMIN'])
    const { id } = await params
    const body = (await request.json()) as PaymentInput

    const paymentDate = body.paymentDate ? new Date(body.paymentDate) : new Date()
    const paymentMethod = typeof body.paymentMethod === 'string' && body.paymentMethod.trim()
      ? body.paymentMethod.trim().toUpperCase()
      : 'BANK'
    const bankAccountId = typeof body.bankAccountId === 'string' ? body.bankAccountId : ''
    const amount = num(body.amount)
    const tdsAmount = num(body.tdsAmount)
    const vdsAmount = num(body.vdsAmount)

    if (!bankAccountId) return apiBadRequest('bankAccountId is required')
    if (!Number.isFinite(amount) || amount <= 0) return apiBadRequest('amount must be greater than zero')
    if (tdsAmount < 0 || vdsAmount < 0 || tdsAmount + vdsAmount > amount) {
      return apiBadRequest('tdsAmount and vdsAmount must be non-negative and cannot exceed payment amount')
    }

    const invoice = await prisma.vendorInvoice.findFirst({
      where: { id, organizationId: auth.organizationId, deletedAt: null },
      include: { grns: true },
    })

    if (!invoice) return apiNotFound('Vendor invoice not found')
    if (invoice.status !== 'APPROVED' && invoice.status !== 'PARTIALLY_PAID') {
      return apiBadRequest(`Only APPROVED or PARTIALLY_PAID invoices can be paid. Current status: ${invoice.status}`)
    }

    const outstanding = Number(invoice.outstandingAmount)
    if (amount > outstanding) {
      return apiBadRequest(`Payment amount exceeds invoice outstanding amount (${outstanding.toFixed(2)})`)
    }

    const [vendor, bankAccount, fiscalYear, accounts] = await Promise.all([
      prisma.vendor.findFirst({
        where: { id: invoice.vendorId, organizationId: auth.organizationId },
        select: { companyName: true },
      }),
      prisma.bankAccount.findFirst({
        where: { id: bankAccountId, organizationId: auth.organizationId, isActive: true },
        include: { glAccount: { select: { id: true, code: true, name: true, type: true, isActive: true, isGroup: true } } },
      }),
      prisma.fiscalYear.findFirst({
        where: {
          organizationId: auth.organizationId,
          startDate: { lte: paymentDate },
          endDate: { gte: paymentDate },
          isClosed: false,
        },
        orderBy: { startDate: 'desc' },
      }),
      prisma.account.findMany({
        where: {
          organizationId: auth.organizationId,
          isActive: true,
          isGroup: false,
          deletedAt: null,
          type: { in: ['ASSET', 'LIABILITY'] },
        },
        select: { id: true, code: true, name: true, type: true, isBankAccount: true },
        orderBy: { code: 'asc' },
      }),
    ])

    if (!vendor) return apiBadRequest('Invoice vendor not found')
    if (!bankAccount) return apiBadRequest('Bank/cash account not found or inactive')
    if (!fiscalYear) return apiBadRequest('No open fiscal year found for payment date')

    const netPaid = amount - tdsAmount - vdsAmount
    if (Number(bankAccount.currentBalance) < netPaid) {
      return apiBadRequest(`Insufficient bank/cash balance. Available: ${Number(bankAccount.currentBalance).toFixed(2)}`)
    }

    const apAccount = pickAccount(accounts.filter((account) => account.type === 'LIABILITY'), '2101', /accounts payable|supplier|sundry creditor/i)
    const tdsAccount = tdsAmount > 0
      ? pickAccount(accounts.filter((account) => account.type === 'LIABILITY'), '2109', /tds payable|tax payable/i)
      : null
    const vdsAccount = vdsAmount > 0
      ? pickAccount(accounts.filter((account) => account.type === 'LIABILITY'), '2108', /vds payable|vat payable/i)
      : null
    const bankGlAccount = bankAccount.glAccount && bankAccount.glAccount.isActive && !bankAccount.glAccount.isGroup
      ? bankAccount.glAccount
      : accounts.find((account) => account.isBankAccount && account.type === 'ASSET') ?? null

    if (!apAccount) return apiBadRequest('Accounts Payable account not found')
    if (!bankGlAccount) return apiBadRequest('Bank/cash GL account not found for selected bank account')
    if (tdsAmount > 0 && !tdsAccount) return apiBadRequest('TDS payable account not found')
    if (vdsAmount > 0 && !vdsAccount) return apiBadRequest('VDS payable account not found')

    const paymentNo = await generateNextNumber(auth.organizationId, 'vendor_payment')
    const entryNo = await generateNextNumber(auth.organizationId, 'journal_entry')
    const voucherNo = await generateNextNumber(
      auth.organizationId,
      bankAccount.type === 'CASH' ? 'voucher_cv' : 'voucher_bv'
    )
    const voucherType = bankAccount.type === 'CASH' ? 'CASH' : 'BANK'
    const newOutstanding = Math.round((outstanding - amount) * 100) / 100
    const newStatus = newOutstanding <= 0 ? 'PAID' : 'PARTIALLY_PAID'

    const result = await prisma.$transaction(async (tx) => {
      const freshInvoice = await tx.vendorInvoice.findFirst({
        where: { id, organizationId: auth.organizationId, deletedAt: null },
        select: { status: true, outstandingAmount: true },
      })
      if (!freshInvoice) throw new Error('Vendor invoice not found')
      if (freshInvoice.status !== 'APPROVED' && freshInvoice.status !== 'PARTIALLY_PAID') {
        throw new Error(`Only APPROVED or PARTIALLY_PAID invoices can be paid. Current status: ${freshInvoice.status}`)
      }
      if (amount > Number(freshInvoice.outstandingAmount)) {
        throw new Error(`Payment amount exceeds invoice outstanding amount (${Number(freshInvoice.outstandingAmount).toFixed(2)})`)
      }

      const payment = await tx.vendorPayment.create({
        data: {
          organizationId: auth.organizationId,
          paymentNo,
          invoiceId: invoice.id,
          paymentDate,
          paymentMethod,
          bankAccountId,
          amount: new Prisma.Decimal(amount),
          tdsAmount: new Prisma.Decimal(tdsAmount),
          vdsAmount: new Prisma.Decimal(vdsAmount),
          netPaid: new Prisma.Decimal(netPaid),
          reference: body.reference || null,
          status: 'APPROVED',
          paidById: auth.userId,
          notes: body.notes || null,
        },
      })

      const journalEntry = await tx.journalEntry.create({
        data: {
          entryNo,
          date: paymentDate,
          description: `Vendor payment ${paymentNo} for invoice ${invoice.invoiceNo}`,
          reference: body.reference || paymentNo,
          fiscalYearId: fiscalYear.id,
          totalDebit: new Prisma.Decimal(amount),
          totalCredit: new Prisma.Decimal(amount),
          status: 'APPROVED',
          isAutoGenerated: true,
          sourceModule: VENDOR_PAYMENT_SOURCE,
          sourceId: payment.id,
          notes: `Auto-posted AP settlement for ${vendor.companyName}`,
          createdById: auth.userId,
          approvedById: auth.userId,
          approvedAt: new Date(),
          postedAt: new Date(),
          lines: {
            create: [
              {
                accountId: apAccount.id,
                description: `DR accounts payable for invoice ${invoice.invoiceNo}`,
                debit: new Prisma.Decimal(amount),
                credit: new Prisma.Decimal(0),
              },
              {
                accountId: bankGlAccount.id,
                description: `CR bank/cash paid to ${vendor.companyName}`,
                debit: new Prisma.Decimal(0),
                credit: new Prisma.Decimal(netPaid),
              },
              ...(tdsAmount > 0 && tdsAccount
                ? [{
                    accountId: tdsAccount.id,
                    description: `CR TDS payable for invoice ${invoice.invoiceNo}`,
                    debit: new Prisma.Decimal(0),
                    credit: new Prisma.Decimal(tdsAmount),
                  }]
                : []),
              ...(vdsAmount > 0 && vdsAccount
                ? [{
                    accountId: vdsAccount.id,
                    description: `CR VDS payable for invoice ${invoice.invoiceNo}`,
                    debit: new Prisma.Decimal(0),
                    credit: new Prisma.Decimal(vdsAmount),
                  }]
                : []),
            ],
          },
        },
      })

      const voucher = await tx.voucher.create({
        data: {
          organizationId: auth.organizationId,
          voucherNo,
          type: voucherType,
          date: paymentDate,
          description: `Payment for vendor invoice ${invoice.invoiceNo}`,
          amount: new Prisma.Decimal(netPaid),
          payee: vendor.companyName,
          bankAccountId,
          journalEntryId: journalEntry.id,
          status: 'APPROVED',
          preparedById: auth.userId,
          approvedById: auth.userId,
          approvedAt: new Date(),
        },
      })

      await tx.vendorPayment.update({
        where: { id: payment.id },
        data: {
          voucherId: voucher.id,
          journalEntryId: journalEntry.id,
        },
      })

      await tx.bankAccount.update({
        where: { id: bankAccountId },
        data: {
          currentBalance: { decrement: new Prisma.Decimal(netPaid) },
        },
      })

      await tx.vendorInvoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: { increment: new Prisma.Decimal(amount) },
          outstandingAmount: { decrement: new Prisma.Decimal(amount) },
          status: newStatus,
        },
      })

      return { payment, journalEntry, voucher }
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'FINANCE',
      resource: 'VendorPayment',
      resourceId: result.payment.id,
      description: `Posted vendor payment ${paymentNo} for invoice ${invoice.invoiceNo}`,
      newValues: {
        paymentNo,
        invoiceId: invoice.id,
        amount,
        tdsAmount,
        vdsAmount,
        netPaid,
        journalEntryId: result.journalEntry.id,
        voucherId: result.voucher.id,
      },
      ...auditCtx,
    })

    const payment = await prisma.vendorPayment.findUnique({
      where: { id: result.payment.id },
      include: { invoice: true },
    })

    return apiCreated({
      payment,
      journalEntryId: result.journalEntry.id,
      entryNo: result.journalEntry.entryNo,
      voucherId: result.voucher.id,
      voucherNo: result.voucher.voucherNo,
      invoiceStatus: newStatus,
      invoiceOutstandingAmount: newOutstanding,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

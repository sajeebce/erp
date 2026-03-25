import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
import { logAudit, getAuditContext } from '@/lib/audit'
import { Prisma } from '@prisma/client'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
      deletedAt: null,
    }

    const grantId = url.searchParams.get('grantId')
    if (grantId) {
      where.grantId = grantId
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.date = dateFilter
    }

    const [receipts, total] = await Promise.all([
      prisma.fundReceipt.findMany({
        where,
        select: {
          id: true,
          receiptNo: true,
          date: true,
          donorId: true,
          grantId: true,
          amount: true,
          currencyCode: true,
          exchangeRate: true,
          amountInBDT: true,
          bankAccountId: true,
          bankReference: true,
          status: true,
          notes: true,
          journalEntryId: true,
          createdAt: true,
          updatedAt: true,
          grant: {
            select: {
              id: true,
              grantNo: true,
              title: true,
              donor: {
                select: { id: true, name: true },
              },
            },
          },
          bankAccount: {
            select: {
              id: true,
              accountName: true,
              accountNumber: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.fundReceipt.count({ where }),
    ])

    return apiPaginated(receipts, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const {
      date,
      grantId,
      amount,
      currencyCode,
      exchangeRate,
      bankAccountId,
      bankReference,
      notes,
    } = body

    if (!date || !grantId || amount === undefined || !bankAccountId) {
      return apiBadRequest('date, grantId, amount, and bankAccountId are required')
    }

    if (Number(amount) <= 0) {
      return apiBadRequest('amount must be greater than 0')
    }

    // Validate grant belongs to org
    const grant = await prisma.grant.findFirst({
      where: {
        id: grantId,
        donor: { organizationId: auth.organizationId },
        deletedAt: null,
      },
      select: { id: true, donorId: true },
    })

    if (!grant) {
      return apiBadRequest('Grant not found in this organization')
    }

    // Validate bank account belongs to org
    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        organizationId: auth.organizationId,
        isActive: true,
      },
      select: { id: true },
    })

    if (!bankAccount) {
      return apiBadRequest('Bank account not found in this organization')
    }

    // Calculate amountInBDT
    const effectiveCurrency = currencyCode || 'BDT'
    const effectiveRate = exchangeRate ? Number(exchangeRate) : 1
    const amountNum = Number(amount)
    const amountInBDT =
      effectiveCurrency !== 'BDT' ? amountNum * effectiveRate : amountNum

    // Auto-generate receipt number
    const receiptNo = await generateNextNumber(auth.organizationId, 'fund_receipt')

    const receipt = await prisma.fundReceipt.create({
      data: {
        organizationId: auth.organizationId,
        receiptNo,
        date: new Date(date),
        donorId: grant.donorId,
        grantId,
        amount: new Prisma.Decimal(amount),
        currencyCode: effectiveCurrency,
        exchangeRate: new Prisma.Decimal(effectiveRate),
        amountInBDT: new Prisma.Decimal(amountInBDT),
        bankAccountId,
        bankReference: bankReference || null,
        status: 'PENDING',
        notes: notes || null,
      },
      select: {
        id: true,
        receiptNo: true,
        date: true,
        donorId: true,
        grantId: true,
        amount: true,
        currencyCode: true,
        exchangeRate: true,
        amountInBDT: true,
        bankAccountId: true,
        bankReference: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        grant: {
          select: {
            id: true,
            grantNo: true,
            title: true,
            donor: {
              select: { id: true, name: true },
            },
          },
        },
        bankAccount: {
          select: {
            id: true,
            accountName: true,
            accountNumber: true,
          },
        },
      },
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'donor',
      resource: 'fund_receipt',
      resourceId: receipt.id,
      description: `Created fund receipt ${receiptNo} for grant ${receipt.grant.grantNo}`,
      newValues: { receiptNo, grantId, amount, amountInBDT, bankAccountId },
      ...auditCtx,
    })

    return apiCreated(receipt)
  } catch (error) {
    return handleRouteError(error)
  }
}

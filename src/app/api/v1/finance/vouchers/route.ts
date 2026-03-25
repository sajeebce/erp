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

const VALID_VOUCHER_TYPES = ['DEBIT', 'RECEIPT', 'CASH', 'BANK', 'JOURNAL', 'CONTRA'] as const

const VOUCHER_TYPE_ENTITY_MAP: Record<string, string> = {
  DEBIT: 'voucher_dv',
  RECEIPT: 'voucher_rv',
  CASH: 'voucher_cv',
  BANK: 'voucher_bv',
  JOURNAL: 'voucher_jv',
  CONTRA: 'voucher_contra',
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, search } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
      deletedAt: null,
    }

    if (search) {
      where.OR = [
        { voucherNo: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { payee: { contains: search, mode: 'insensitive' } },
      ]
    }

    const type = url.searchParams.get('type')
    if (type) {
      where.type = type
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    const projectId = url.searchParams.get('projectId')
    if (projectId) {
      where.projectId = projectId
    }

    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.date = dateFilter
    }

    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        select: {
          id: true,
          voucherNo: true,
          type: true,
          date: true,
          description: true,
          amount: true,
          payee: true,
          projectId: true,
          grantId: true,
          bankAccountId: true,
          chequeNo: true,
          chequeDate: true,
          journalEntryId: true,
          status: true,
          preparedById: true,
          approvedById: true,
          approvedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.voucher.count({ where }),
    ])

    return apiPaginated(vouchers, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const {
      type,
      date,
      description,
      amount,
      payee,
      projectId,
      grantId,
      bankAccountId,
      chequeNo,
      chequeDate,
      journalEntryId,
    } = body

    // Validate required fields
    if (!type || !date || !description || amount === undefined || amount === null) {
      return apiBadRequest('type, date, description, and amount are required')
    }

    // Validate type
    if (!VALID_VOUCHER_TYPES.includes(type)) {
      return apiBadRequest(`type must be one of: ${VALID_VOUCHER_TYPES.join(', ')}`)
    }

    // Validate amount > 0
    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return apiBadRequest('amount must be greater than 0')
    }

    // Validate bankAccountId if provided
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

    // Validate projectId if provided
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, organizationId: auth.organizationId },
      })
      if (!project) {
        return apiBadRequest('Invalid project ID')
      }
    }

    // Validate grantId if provided (Grant links to org through donor)
    if (grantId) {
      const grant = await prisma.grant.findFirst({
        where: { id: grantId, donor: { organizationId: auth.organizationId } },
      })
      if (!grant) {
        return apiBadRequest('Invalid grant ID')
      }
    }

    // Generate voucher number based on type
    const entity = VOUCHER_TYPE_ENTITY_MAP[type]
    const voucherNo = await generateNextNumber(auth.organizationId, entity)

    const voucher = await prisma.voucher.create({
      data: {
        organizationId: auth.organizationId,
        voucherNo,
        type,
        date: new Date(date),
        description: description.trim(),
        amount: new Prisma.Decimal(numAmount),
        payee: payee || null,
        projectId: projectId || null,
        grantId: grantId || null,
        bankAccountId: bankAccountId || null,
        chequeNo: chequeNo || null,
        chequeDate: chequeDate ? new Date(chequeDate) : null,
        journalEntryId: journalEntryId || null,
        status: 'DRAFT',
        preparedById: auth.userId,
      },
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'finance',
      resource: 'voucher',
      resourceId: voucher.id,
      description: `Created ${type} voucher ${voucherNo}`,
      newValues: { voucherNo, type, amount: numAmount, description },
      ...auditCtx,
    })

    return apiCreated(voucher)
  } catch (error) {
    return handleRouteError(error)
  }
}

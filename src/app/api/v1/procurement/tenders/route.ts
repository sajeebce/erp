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
import { Prisma, type TenderStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, sort, order } = parsePaginationParams(url)

    // Tender tenant isolation: through bids' vendor.organizationId
    // or we scope tenders that have bids from org vendors
    // For simplicity, we list tenders that have at least one bid from an org vendor,
    // or were created by querying all tenders (no direct org FK)
    // Best approach: filter tenders where bids exist from org vendors
    const where: Record<string, unknown> = {
      bids: {
        some: {
          vendor: { organizationId: auth.organizationId },
        },
      },
    }

    const status = url.searchParams.get('status') as TenderStatus | null
    if (status) {
      where.status = status
    }

    // Also include tenders with no bids yet (org may have created them)
    // Since Tender has no direct org FK, we include all org-vendor-related tenders
    // plus tenders with zero bids (accessible globally for now)
    const fullWhere: Prisma.TenderWhereInput = {
      OR: [
        where,
        { bids: { none: {} } },
      ],
      ...(status ? { status } : {}),
    }

    const [tenders, total] = await Promise.all([
      prisma.tender.findMany({
        where: fullWhere,
        select: {
          id: true,
          tenderNo: true,
          title: true,
          category: true,
          estimatedValue: true,
          publicationDate: true,
          closingDate: true,
          status: true,
          awardedToId: true,
          awardDate: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { bids: true } },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.tender.count({ where: fullWhere }),
    ])

    return apiPaginated(tenders, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { title, category, description, estimatedValue, publicationDate, closingDate, notes } = body

    if (!title || !estimatedValue || !publicationDate || !closingDate) {
      return apiBadRequest('title, estimatedValue, publicationDate, and closingDate are required')
    }

    const tenderNo = await generateNextNumber(auth.organizationId, 'tender')

    const tender = await prisma.tender.create({
      data: {
        tenderNo,
        title: title.trim(),
        category: category || null,
        description: description || null,
        estimatedValue: new Prisma.Decimal(estimatedValue),
        publicationDate: new Date(publicationDate),
        closingDate: new Date(closingDate),
        notes: notes || null,
      },
      select: {
        id: true,
        tenderNo: true,
        title: true,
        category: true,
        description: true,
        estimatedValue: true,
        publicationDate: true,
        closingDate: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const audit = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'PROCUREMENT',
      resource: 'Tender',
      resourceId: tender.id,
      description: `Created tender ${tenderNo}`,
      ...audit,
    })

    return apiCreated(tender)
  } catch (error) {
    return handleRouteError(error)
  }
}

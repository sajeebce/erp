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

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, sort, order } = parsePaginationParams(url)

    // Contract tenant isolation: through vendor.organizationId
    const where: Record<string, unknown> = {
      vendor: { organizationId: auth.organizationId },
      deletedAt: null,
    }

    const vendorId = url.searchParams.get('vendorId')
    if (vendorId) {
      where.vendorId = vendorId
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    const type = url.searchParams.get('type')
    if (type) {
      where.type = type
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        select: {
          id: true,
          contractNo: true,
          title: true,
          vendorId: true,
          vendor: {
            select: { companyName: true },
          },
          type: true,
          startDate: true,
          endDate: true,
          value: true,
          status: true,
          renewalDate: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.contract.count({ where }),
    ])

    return apiPaginated(contracts, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const {
      title, vendorId, type, startDate, endDate, value,
      description, terms, renewalDate, notes,
    } = body

    if (!title || !vendorId || !type || !startDate || !endDate || value === undefined) {
      return apiBadRequest('title, vendorId, type, startDate, endDate, and value are required')
    }

    const validTypes = ['SUPPLY', 'SERVICE', 'WORKS', 'CONSULTANCY']
    if (!validTypes.includes(type)) {
      return apiBadRequest(`type must be one of: ${validTypes.join(', ')}`)
    }

    // Validate vendor belongs to org
    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!vendor) {
      return apiBadRequest('Vendor not found or does not belong to your organization')
    }

    const contractNo = await generateNextNumber(auth.organizationId, 'contract')

    const contract = await prisma.contract.create({
      data: {
        contractNo,
        title: title.trim(),
        vendorId,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        value: new Prisma.Decimal(value),
        description: description || null,
        terms: terms || null,
        renewalDate: renewalDate ? new Date(renewalDate) : null,
        notes: notes || null,
      },
      select: {
        id: true,
        contractNo: true,
        title: true,
        vendorId: true,
        type: true,
        startDate: true,
        endDate: true,
        value: true,
        status: true,
        description: true,
        terms: true,
        renewalDate: true,
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
      resource: 'Contract',
      resourceId: contract.id,
      description: `Created contract ${contractNo} with vendor ${vendor.companyName}`,
      ...audit,
    })

    return apiCreated(contract)
  } catch (error) {
    return handleRouteError(error)
  }
}

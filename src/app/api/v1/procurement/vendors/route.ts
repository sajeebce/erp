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

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, search, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
      deletedAt: null,
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const category = url.searchParams.get('category')
    if (category) {
      where.category = category
    }

    const isActive = url.searchParams.get('isActive')
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        select: {
          id: true,
          vendorNo: true,
          companyName: true,
          category: true,
          contactPerson: true,
          phone: true,
          email: true,
          rating: true,
          totalOrders: true,
          isApproved: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.vendor.count({ where }),
    ])

    return apiPaginated(vendors, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { companyName, category, contactPerson, phone, email, address, tin, tradeLicense, notes } = body

    if (!companyName) {
      return apiBadRequest('companyName is required')
    }

    const vendorNo = await generateNextNumber(auth.organizationId, 'vendor')

    const vendor = await prisma.vendor.create({
      data: {
        organizationId: auth.organizationId,
        vendorNo,
        companyName: companyName.trim(),
        category: category || null,
        contactPerson: contactPerson || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        tin: tin || null,
        tradeLicense: tradeLicense || null,
        notes: notes || null,
      },
      select: {
        id: true,
        vendorNo: true,
        companyName: true,
        category: true,
        contactPerson: true,
        phone: true,
        email: true,
        address: true,
        tin: true,
        tradeLicense: true,
        rating: true,
        totalOrders: true,
        isApproved: true,
        isActive: true,
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
      resource: 'Vendor',
      resourceId: vendor.id,
      description: `Created vendor ${vendorNo}`,
      newValues: { companyName, category },
      ...audit,
    })

    return apiCreated(vendor)
  } catch (error) {
    return handleRouteError(error)
  }
}

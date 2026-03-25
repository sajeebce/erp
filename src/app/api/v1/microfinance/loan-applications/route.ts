import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
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

    // Tenant isolation: member → samity → branch → org
    const where: Record<string, unknown> = {}

    // Build nested filter for tenant scope
    const memberFilter: Record<string, unknown> = {
      samity: { branch: { organizationId: auth.organizationId } },
    }

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const memberId = url.searchParams.get('memberId')
    if (memberId) where.memberId = memberId

    if (search) {
      where.OR = [
        { applicationNo: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } },
      ]
    }

    // We need a raw approach for deep tenant filtering via relations
    // Use a subquery approach: find member IDs in org first
    const orgMembers = await prisma.mFIMember.findMany({
      where: memberFilter,
      select: { id: true },
    })
    const orgMemberIds = orgMembers.map((m) => m.id)

    where.memberId = memberId
      ? (orgMemberIds.includes(memberId) ? memberId : '__none__')
      : { in: orgMemberIds }

    const [applications, total] = await Promise.all([
      prisma.loanApplication.findMany({
        where,
        select: {
          id: true,
          applicationNo: true,
          date: true,
          memberId: true,
          productId: true,
          amountRequested: true,
          purpose: true,
          durationMonths: true,
          status: true,
          approvedAmount: true,
          approvedAt: true,
          createdAt: true,
          product: { select: { id: true, productCode: true, name: true } },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.loanApplication.count({ where }),
    ])

    return apiPaginated(applications, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()
    const { memberId, productId, amountRequested, purpose, durationMonths, fieldOfficerId, notes } = body

    if (!memberId || !productId || amountRequested == null || !purpose || !durationMonths) {
      return apiBadRequest('memberId, productId, amountRequested, purpose, and durationMonths are required')
    }

    // Validate member → samity → branch → org
    const member = await prisma.mFIMember.findFirst({
      where: {
        id: memberId,
        samity: { branch: { organizationId: auth.organizationId } },
      },
      select: { id: true, status: true },
    })

    if (!member) {
      return apiBadRequest('Member not found or does not belong to your organization')
    }

    if (member.status !== 'ACTIVE') {
      return apiBadRequest('Member is not active')
    }

    // Validate product
    const product = await prisma.loanProduct.findUnique({
      where: { id: productId },
      select: { id: true, minAmount: true, maxAmount: true, isActive: true },
    })

    if (!product || !product.isActive) {
      return apiBadRequest('Loan product not found or inactive')
    }

    if (Number(amountRequested) < Number(product.minAmount) || Number(amountRequested) > Number(product.maxAmount)) {
      return apiBadRequest(`Amount must be between ${product.minAmount} and ${product.maxAmount}`)
    }

    const applicationNo = await generateNextNumber(auth.organizationId, 'mfi_loan_application')

    const application = await prisma.loanApplication.create({
      data: {
        applicationNo,
        date: new Date(),
        memberId,
        productId,
        amountRequested,
        purpose: purpose.trim(),
        durationMonths,
        fieldOfficerId: fieldOfficerId || null,
        notes: notes || null,
      },
      select: {
        id: true,
        applicationNo: true,
        date: true,
        memberId: true,
        productId: true,
        amountRequested: true,
        purpose: true,
        durationMonths: true,
        status: true,
        createdAt: true,
      },
    })

    return apiCreated(application)
  } catch (error) {
    return handleRouteError(error)
  }
}

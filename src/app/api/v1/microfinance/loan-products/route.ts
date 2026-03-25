import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)
    const url = new URL(request.url)
    const { page, limit, skip, search, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { productCode: { contains: search, mode: 'insensitive' } },
      ]
    }

    const category = url.searchParams.get('category')
    if (category) where.category = category

    const isActive = url.searchParams.get('isActive')
    if (isActive !== null) where.isActive = isActive === 'true'

    const [products, total] = await Promise.all([
      prisma.loanProduct.findMany({
        where,
        select: {
          id: true,
          productCode: true,
          name: true,
          category: true,
          minAmount: true,
          maxAmount: true,
          interestRate: true,
          interestMethod: true,
          maxDurationMonths: true,
          repaymentFrequency: true,
          gracePeriodDays: true,
          serviceCharge: true,
          requiresSavings: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.loanProduct.count({ where }),
    ])

    return apiPaginated(products, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)
    const body = await request.json()
    const {
      productCode, name, category, minAmount, maxAmount,
      interestRate, interestMethod, maxDurationMonths,
      repaymentFrequency, gracePeriodDays, serviceCharge, requiresSavings,
    } = body

    if (!productCode || !name || !category || minAmount == null || maxAmount == null || interestRate == null || !maxDurationMonths) {
      return apiBadRequest('productCode, name, category, minAmount, maxAmount, interestRate, and maxDurationMonths are required')
    }

    // MRA limit: interest rate must not exceed 24%
    if (Number(interestRate) > 24) {
      return apiBadRequest('Interest rate cannot exceed 24% (MRA regulatory limit)')
    }

    if (Number(minAmount) > Number(maxAmount)) {
      return apiBadRequest('minAmount cannot exceed maxAmount')
    }

    const product = await prisma.loanProduct.create({
      data: {
        productCode: productCode.trim(),
        name: name.trim(),
        category,
        minAmount,
        maxAmount,
        interestRate,
        interestMethod: interestMethod || 'DECLINING_BALANCE',
        maxDurationMonths,
        repaymentFrequency: repaymentFrequency || 'WEEKLY',
        gracePeriodDays: gracePeriodDays ?? 0,
        serviceCharge: serviceCharge ?? 0,
        requiresSavings: requiresSavings ?? true,
      },
      select: {
        id: true,
        productCode: true,
        name: true,
        category: true,
        minAmount: true,
        maxAmount: true,
        interestRate: true,
        interestMethod: true,
        maxDurationMonths: true,
        repaymentFrequency: true,
        gracePeriodDays: true,
        serviceCharge: true,
        requiresSavings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return apiCreated(product)
  } catch (error) {
    return handleRouteError(error)
  }
}

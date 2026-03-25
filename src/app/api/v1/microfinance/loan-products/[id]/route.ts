import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuthFromRequest(request)
    const { id } = await params

    const product = await prisma.loanProduct.findUnique({
      where: { id },
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
        _count: { select: { loanApplications: true, loanAccounts: true } },
      },
    })

    if (!product) {
      return apiNotFound('Loan product not found')
    }

    return apiSuccess(product)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.loanProduct.findUnique({ where: { id } })
    if (!existing) {
      return apiNotFound('Loan product not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    const allowedFields = [
      'name', 'category', 'minAmount', 'maxAmount', 'interestRate',
      'interestMethod', 'maxDurationMonths', 'repaymentFrequency',
      'gracePeriodDays', 'serviceCharge', 'requiresSavings', 'isActive',
    ] as const

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field]
      }
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    if (data.interestRate !== undefined && Number(data.interestRate) > 24) {
      return apiBadRequest('Interest rate cannot exceed 24% (MRA regulatory limit)')
    }

    if (data.minAmount !== undefined && data.maxAmount !== undefined) {
      if (Number(data.minAmount) > Number(data.maxAmount)) {
        return apiBadRequest('minAmount cannot exceed maxAmount')
      }
    }

    const updated = await prisma.loanProduct.update({
      where: { id },
      data,
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

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

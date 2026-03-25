import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const currencyId = url.searchParams.get('currencyId')
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')

    const where: Record<string, unknown> = {}

    if (currencyId) {
      where.currencyId = currencyId
    }

    if (dateFrom || dateTo) {
      const effectiveDateFilter: Record<string, Date> = {}
      if (dateFrom) {
        const from = new Date(dateFrom)
        if (isNaN(from.getTime())) {
          return apiBadRequest('Invalid dateFrom format')
        }
        effectiveDateFilter.gte = from
      }
      if (dateTo) {
        const to = new Date(dateTo)
        if (isNaN(to.getTime())) {
          return apiBadRequest('Invalid dateTo format')
        }
        effectiveDateFilter.lte = to
      }
      where.effectiveDate = effectiveDateFilter
    }

    const exchangeRates = await prisma.exchangeRate.findMany({
      where,
      include: {
        currency: {
          select: {
            id: true,
            code: true,
            name: true,
            symbol: true,
          },
        },
      },
      orderBy: { effectiveDate: 'desc' },
    })

    return apiSuccess(exchangeRates)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)

    const body = await request.json()
    const { currencyId, rate, effectiveDate } = body

    if (!currencyId || rate === undefined || rate === null || !effectiveDate) {
      return apiBadRequest('currencyId, rate, and effectiveDate are required')
    }

    const parsedRate = parseFloat(rate)
    if (isNaN(parsedRate) || parsedRate <= 0) {
      return apiBadRequest('Rate must be a positive number')
    }

    const parsedDate = new Date(effectiveDate)
    if (isNaN(parsedDate.getTime())) {
      return apiBadRequest('Invalid effectiveDate format')
    }

    // Verify currency exists
    const currency = await prisma.currency.findUnique({
      where: { id: currencyId },
    })

    if (!currency) {
      return apiBadRequest('Invalid currency ID')
    }

    if (currency.isBase) {
      return apiBadRequest('Cannot set exchange rate for the base currency (BDT)')
    }

    const exchangeRate = await prisma.exchangeRate.create({
      data: {
        currencyId,
        rate: parsedRate,
        effectiveDate: parsedDate,
      },
      include: {
        currency: {
          select: {
            id: true,
            code: true,
            name: true,
            symbol: true,
          },
        },
      },
    })

    return apiCreated(exchangeRate)
  } catch (error) {
    return handleRouteError(error)
  }
}

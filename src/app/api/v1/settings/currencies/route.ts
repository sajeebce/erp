import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request (user must be logged in) but no org filter needed
    await requireAuthFromRequest(request)

    const currencies = await prisma.currency.findMany({
      where: { isActive: true },
      orderBy: [{ isBase: 'desc' }, { code: 'asc' }],
    })

    return apiSuccess(currencies)
  } catch (error) {
    return handleRouteError(error)
  }
}

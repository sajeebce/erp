import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiSuccess, handleRouteError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const isActive = url.searchParams.get('isActive')

    const where: Record<string, unknown> = {}
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    } else {
      where.isActive = true
    }

    const components = await prisma.salaryComponent.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        isFixed: true,
        isPercentage: true,
        percentageOf: true,
        defaultValue: true,
        isActive: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return apiSuccess(components)
  } catch (error) {
    return handleRouteError(error)
  }
}

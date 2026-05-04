import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiSuccess, handleRouteError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)

    const permissions = await prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { resource: 'asc' },
        { action: 'asc' },
      ],
    })

    return apiSuccess(permissions)
  } catch (error) {
    return handleRouteError(error)
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiSuccess, handleRouteError } from '@/lib/api-response'
import { ProjectStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const url = new URL(request.url)
    const status = (url.searchParams.get('status') || 'ACTIVE') as ProjectStatus

    const projects = await prisma.project.findMany({
      where: {
        organizationId: auth.organizationId,
        deletedAt: null,
        status,
      },
      select: {
        id: true,
        projectNo: true,
        name: true,
        status: true,
      },
      orderBy: [{ name: 'asc' }, { projectNo: 'asc' }],
      take: 200,
    })

    return apiSuccess(projects)
  } catch (error) {
    return handleRouteError(error)
  }
}

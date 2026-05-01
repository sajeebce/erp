import { NextRequest } from 'next/server'
import { Prisma, ProjectExtensionStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import {
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'
import { PROJECT_EXTENSION_SELECT } from '@/lib/project-extensions'

const VALID_STATUSES: ProjectExtensionStatus[] = [
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
]

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, [])
    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)
    const statusParam = url.searchParams.get('status') || undefined
    const search = url.searchParams.get('search') || undefined

    if (statusParam && !VALID_STATUSES.includes(statusParam as ProjectExtensionStatus)) {
      return apiBadRequest(`status must be one of: ${VALID_STATUSES.join(', ')}`)
    }

    const where: Prisma.ProjectExtensionRequestWhereInput = {
      organizationId: auth.organizationId,
      deletedAt: null,
      ...(statusParam ? { status: statusParam as ProjectExtensionStatus } : {}),
      ...(search
        ? {
            OR: [
              { requestNo: { contains: search, mode: 'insensitive' as const } },
              { project: { name: { contains: search, mode: 'insensitive' as const } } },
              { project: { projectNo: { contains: search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    }

    const [extensions, total] = await Promise.all([
      prisma.projectExtensionRequest.findMany({
        where,
        select: PROJECT_EXTENSION_SELECT,
        orderBy: { requestedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.projectExtensionRequest.count({ where }),
    ])

    return apiPaginated(extensions, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

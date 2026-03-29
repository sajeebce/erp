import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiPaginated,
  apiNotFound,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    // Verify job posting belongs to org
    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true },
    })

    if (!jobPosting) {
      return apiNotFound('Job posting not found')
    }

    const where: Record<string, unknown> = {
      jobPostingId: id,
      organizationId: auth.organizationId,
    }

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        select: {
          id: true,
          applicationNo: true,
          applicantName: true,
          applicantEmail: true,
          applicantPhone: true,
          isInternal: true,
          autoScore: true,
          manualScore: true,
          finalScore: true,
          status: true,
          appliedAt: true,
          totalExperienceYears: true,
          _count: { select: { interviews: true } },
        },
        orderBy: { autoScore: 'desc' },
        skip,
        take: limit,
      }),
      prisma.jobApplication.count({ where }),
    ])

    return apiPaginated(applications, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
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
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      application: {
        organizationId: auth.organizationId,
      },
    }

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const jobId = url.searchParams.get('jobId')
    if (jobId) {
      where.application = {
        organizationId: auth.organizationId,
        jobPostingId: jobId,
      }
    }

    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    if (from || to) {
      const scheduledAt: Record<string, Date> = {}
      if (from) scheduledAt.gte = new Date(from)
      if (to) scheduledAt.lte = new Date(to)
      where.scheduledAt = scheduledAt
    }

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        select: {
          id: true,
          interviewType: true,
          scheduledAt: true,
          durationMinutes: true,
          location: true,
          isVirtual: true,
          meetingLink: true,
          status: true,
          overallRating: true,
          recommendation: true,
          completedAt: true,
          createdAt: true,
          application: {
            select: {
              id: true,
              applicationNo: true,
              applicantName: true,
              applicantEmail: true,
              jobPosting: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.interview.count({ where }),
    ])

    return apiPaginated(interviews, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { applicationId, interviewType, scheduledAt } = body

    if (!applicationId || !interviewType || !scheduledAt) {
      return apiBadRequest('applicationId, interviewType, and scheduledAt are required')
    }

    // Validate application belongs to org
    const application = await prisma.jobApplication.findFirst({
      where: { id: applicationId, organizationId: auth.organizationId },
      select: { id: true, applicationNo: true, applicantName: true },
    })
    if (!application) return apiBadRequest('Application not found in this organization')

    const interview = await prisma.interview.create({
      data: {
        applicationId,
        interviewType,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: body.durationMinutes || 60,
        location: body.location || null,
        isVirtual: body.isVirtual || false,
        meetingLink: body.meetingLink || null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'interview',
      resourceId: interview.id,
      description: `Scheduled ${interviewType} interview for "${application.applicantName}" (${application.applicationNo})`,
      newValues: { applicationId, interviewType, scheduledAt },
      ...auditCtx,
    })

    return apiCreated(interview)
  } catch (error) {
    return handleRouteError(error)
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'
import { autoScoreApplication } from '@/lib/recruitment-scoring'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, search, sort: rawSort, order } = parsePaginationParams(url)
    const sort = rawSort === 'createdAt' ? 'appliedAt' : rawSort

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
    }

    if (search) {
      where.OR = [
        { applicantName: { contains: search, mode: 'insensitive' } },
        { applicantEmail: { contains: search, mode: 'insensitive' } },
        { applicationNo: { contains: search, mode: 'insensitive' } },
      ]
    }

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const jobPostingId = url.searchParams.get('jobPostingId')
    if (jobPostingId) where.jobPostingId = jobPostingId

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
          jobPosting: { select: { id: true, title: true, postingNo: true } },
        },
        orderBy: { [sort]: order },
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

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { jobPostingId, applicantName, applicantEmail } = body

    if (!jobPostingId || !applicantName || !applicantEmail) {
      return apiBadRequest('jobPostingId, applicantName, and applicantEmail are required')
    }

    // Validate job posting belongs to org and is published
    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id: jobPostingId, organizationId: auth.organizationId },
      select: { id: true, title: true, status: true },
    })
    if (!jobPosting) return apiBadRequest('Job posting not found in this organization')
    if (jobPosting.status !== 'PUBLISHED') {
      return apiBadRequest('Job posting is not accepting applications')
    }

    const applicationNo = await generateNextNumber(auth.organizationId, 'job-application')

    const application = await prisma.jobApplication.create({
      data: {
        applicationNo,
        jobPostingId,
        organizationId: auth.organizationId,
        applicantName: applicantName.trim(),
        applicantEmail: applicantEmail.trim().toLowerCase(),
        applicantPhone: body.applicantPhone || null,
        applicantAddress: body.applicantAddress || null,
        isInternal: body.isInternal || false,
        employeeId: body.employeeId || null,
        cvFilePath: body.cvFilePath || null,
        coverLetterPath: body.coverLetterPath || null,
        additionalDocs: body.additionalDocs || null,
        parsedEducation: body.parsedEducation || null,
        parsedExperience: body.parsedExperience || null,
        parsedSkills: body.parsedSkills || null,
        parsedLanguages: body.parsedLanguages || null,
        parsedCertifications: body.parsedCertifications || null,
        totalExperienceYears: body.totalExperienceYears ?? null,
        customResponses: body.customResponses || null,
        notes: body.notes || null,
      },
    })

    // Auto-trigger scoring immediately after creation
    autoScoreApplication(application.id).catch((err) => {
      console.error('Auto-score failed for application', application.id, err)
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'job-application',
      resourceId: application.id,
      description: `Created application for "${applicantName}" on "${jobPosting.title}" (${applicationNo})`,
      newValues: { applicationNo, applicantName, applicantEmail, jobPostingId },
      ...auditCtx,
    })

    return apiCreated(application)
  } catch (error) {
    return handleRouteError(error)
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { queueEmail } from '@/lib/email-queue'
import {
  apiBadRequest,
  apiNotFound,
  apiSuccess,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

const PIPELINE_ORDER = [
  'APPLIED',
  'SCREENED',
  'SHORTLISTED',
  'TECHNICAL_TEST',
  'INTERVIEW',
  'REFERENCE_CHECK',
  'OFFER',
  'HIRED',
] as const

type PipelineStage = typeof PIPELINE_ORDER[number]

function isPipelineStage(value: unknown): value is PipelineStage {
  return typeof value === 'string' && PIPELINE_ORDER.includes(value as PipelineStage)
}

function normalizeSkills(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .flatMap((item) => String(item).split(','))
    .map((skill) => skill.trim())
    .filter(Boolean)
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    const targetStage = body.targetStage
    if (!isPipelineStage(targetStage)) {
      return apiBadRequest(`targetStage must be one of: ${PIPELINE_ORDER.join(', ')}`)
    }

    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true, postingNo: true, title: true },
    })

    if (!jobPosting) {
      return apiNotFound('Job posting not found')
    }

    const mode = body.mode === 'filtered' ? 'filtered' : 'ids'
    const where: Record<string, unknown> = {
      jobPostingId: id,
      organizationId: auth.organizationId,
      status: { in: PIPELINE_ORDER.filter((stage) => stage !== targetStage) },
    }

    if (mode === 'ids') {
      const applicationIds = Array.isArray(body.applicationIds)
        ? body.applicationIds.map(String).filter(Boolean)
        : []

      if (applicationIds.length === 0) {
        return apiBadRequest('applicationIds is required')
      }

      where.id = { in: applicationIds }
    } else {
      const filters = body.filters || {}
      const q = typeof filters.q === 'string' ? filters.q.trim() : ''
      const minScore = filters.minScore
      const skills = normalizeSkills(filters.skills)
      const sourceStage = filters.sourceStage

      if (q) {
        where.OR = [
          { applicantName: { contains: q, mode: 'insensitive' } },
          { applicantEmail: { contains: q, mode: 'insensitive' } },
        ]
      }

      if (minScore !== '' && minScore != null) {
        const score = Number(minScore)
        if (Number.isFinite(score)) {
          where.autoScore = { gte: score }
        }
      }

      if (isPipelineStage(sourceStage)) {
        where.status = sourceStage === targetStage
          ? { in: [] }
          : sourceStage
      }

      if (skills.length > 0) {
        const normalizedSkills = skills.map((skill) => skill.toLowerCase())
        const matched = await prisma.jobApplication.findMany({
          where,
          select: { id: true, parsedSkills: true },
        })
        const matchedIds = matched
          .filter((application) => {
            const applicationSkills = Array.isArray(application.parsedSkills)
              ? application.parsedSkills.map((skill) => String(skill).toLowerCase().trim())
              : []
            return normalizedSkills.every((skill) => applicationSkills.includes(skill))
          })
          .map((application) => application.id)

        where.id = { in: matchedIds }
      }
    }

    const matchingApplications = await prisma.jobApplication.findMany({
      where,
      select: { id: true, applicationNo: true, status: true, applicantName: true, applicantEmail: true },
    })

    if (matchingApplications.length === 0) {
      return apiSuccess({ updatedCount: 0, applications: [] })
    }

    const updated = await prisma.jobApplication.updateMany({
      where: { id: { in: matchingApplications.map((application) => application.id) } },
      data: { status: targetStage },
    })

    // OFFER email is sent later from the application PATCH route once offer details are filled in
    if (targetStage !== 'APPLIED' && targetStage !== 'OFFER') {
      await Promise.all(
        matchingApplications.map((application) =>
          queueEmail({
            organizationId: auth.organizationId,
            recipientEmail: application.applicantEmail,
            templateKey: `RECRUITMENT_${targetStage}`,
            fallbackSubject: `Application update — ${targetStage}`,
            fallbackBody: `Dear {{applicantName}}, your application for {{jobTitle}} has been moved to ${targetStage} stage.`,
            variables: {
              applicantName: application.applicantName,
              jobTitle: jobPosting.title,
              stageName: targetStage,
            },
            relatedModule: 'recruitment',
            relatedEntityId: application.id,
          })
        )
      )
    }

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'job-application',
      resourceId: id,
      description: `Bulk moved ${updated.count} applications for "${jobPosting.title}" (${jobPosting.postingNo}) to ${targetStage}`,
      oldValues: {
        mode,
        statuses: matchingApplications.reduce<Record<string, number>>((counts, application) => {
          counts[application.status] = (counts[application.status] || 0) + 1
          return counts
        }, {}),
      },
      newValues: { status: targetStage, updatedCount: updated.count },
      ...auditCtx,
    })

    const applications = await prisma.jobApplication.findMany({
      where: {
        jobPostingId: id,
        organizationId: auth.organizationId,
      },
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
        parsedSkills: true,
        appliedAt: true,
        totalExperienceYears: true,
        _count: { select: { interviews: true } },
      },
      orderBy: { autoScore: 'desc' },
      take: 100,
    })

    return apiSuccess({ updatedCount: updated.count, applications })
  } catch (error) {
    return handleRouteError(error)
  }
}

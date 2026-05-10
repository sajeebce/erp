import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { queueEmail } from '@/lib/email-queue'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const application = await prisma.jobApplication.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        jobPosting: {
          select: {
            id: true,
            postingNo: true,
            title: true,
            departmentId: true,
            location: true,
            status: true,
            department: { select: { id: true, name: true } },
          },
        },
        interviews: {
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
          },
          orderBy: { scheduledAt: 'asc' },
        },
        evaluations: {
          select: {
            id: true,
            evaluatorId: true,
            criteria: true,
            score: true,
            comments: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        offerSalaryGrade: {
          include: {
            steps: { orderBy: { stepNumber: 'asc' } },
            structures: {
              where: { isActive: true },
              include: {
                lines: {
                  include: { component: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    })

    if (!application) {
      return apiNotFound('Application not found')
    }

    return apiSuccess(application)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.jobApplication.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('Application not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.status !== undefined) data.status = body.status
    if (body.notes !== undefined) data.notes = body.notes || null
    if (body.manualScore !== undefined) data.manualScore = body.manualScore ? new Prisma.Decimal(body.manualScore) : null
    if (body.finalScore !== undefined) data.finalScore = body.finalScore ? new Prisma.Decimal(body.finalScore) : null
    if (body.rejectionReason !== undefined) data.rejectionReason = body.rejectionReason || null
    if (body.offeredSalary !== undefined) data.offeredSalary = body.offeredSalary ? new Prisma.Decimal(body.offeredSalary) : null
    if (body.offerSalaryGradeId !== undefined) {
      if (body.offerSalaryGradeId) {
        const grade = await prisma.salaryGrade.findFirst({
          where: {
            id: body.offerSalaryGradeId,
            organizationId: auth.organizationId,
            isActive: true,
          },
          select: { id: true },
        })
        if (!grade) return apiBadRequest('Active salary grade not found in this organization')
      }
      data.offerSalaryGradeId = body.offerSalaryGradeId || null
    }
    if (body.offerMessage !== undefined) data.offerMessage = body.offerMessage || null
    if (body.offerLeaveBenefits !== undefined) data.offerLeaveBenefits = body.offerLeaveBenefits || Prisma.JsonNull
    if (body.offerSentAt !== undefined) data.offerSentAt = body.offerSentAt ? new Date(body.offerSentAt) : null
    if (body.offerLetterPath !== undefined) data.offerLetterPath = body.offerLetterPath || null
    if (body.offerAcceptedAt !== undefined) data.offerAcceptedAt = body.offerAcceptedAt ? new Date(body.offerAcceptedAt) : null
    if (body.offerDeclinedAt !== undefined) data.offerDeclinedAt = body.offerDeclinedAt ? new Date(body.offerDeclinedAt) : null
    if (body.parsedEducation !== undefined) data.parsedEducation = body.parsedEducation || null
    if (body.parsedExperience !== undefined) data.parsedExperience = body.parsedExperience || null
    if (body.parsedSkills !== undefined) data.parsedSkills = body.parsedSkills || null
    if (body.parsedLanguages !== undefined) data.parsedLanguages = body.parsedLanguages || null
    if (body.parsedCertifications !== undefined) data.parsedCertifications = body.parsedCertifications || null
    if (body.totalExperienceYears !== undefined) data.totalExperienceYears = body.totalExperienceYears ?? null
    if (body.cvFilePath !== undefined) data.cvFilePath = body.cvFilePath || null
    if (body.coverLetterPath !== undefined) data.coverLetterPath = body.coverLetterPath || null

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.jobApplication.update({
      where: { id },
      data,
      include: {
        jobPosting: { select: { title: true } },
        offerSalaryGrade: {
          include: {
            structures: {
              where: { isActive: true },
              include: {
                lines: {
                  include: { component: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
              take: 1,
            },
          },
        },
      },
    })

    if (body.offerSentAt && updated.offerSalaryGrade) {
      const grossSalary = updated.offeredSalary
        ? `BDT ${Number(updated.offeredSalary).toLocaleString()}`
        : `${updated.offerSalaryGrade.currency} ${Number(updated.offerSalaryGrade.midSalary).toLocaleString()}`
      const leaveBenefits = Array.isArray(updated.offerLeaveBenefits)
        ? updated.offerLeaveBenefits
            .map((leave) => {
              const item = leave as { name?: string; days?: number | string }
              return `${item.name || 'Leave'}: ${item.days || 0} days`
            })
            .join(', ')
        : 'Annual Leave: 18 days, Casual Leave: 10 days, Sick Leave: 14 days, Maternity Leave: 112 days'

      await queueEmail({
        organizationId: auth.organizationId,
        recipientEmail: updated.applicantEmail,
        eventKey: `application:${updated.id}:offer:${updated.offerSentAt?.toISOString() ?? Date.now()}`,
        templateKey: 'RECRUITMENT_OFFER',
        fallbackSubject: 'Offer details - {{jobTitle}}',
        fallbackBody: 'Dear {{applicantName}}, please review your offer details for {{jobTitle}}.\n\nSalary Grade: {{salaryGrade}}\nGross Salary: {{grossSalary}}\nLeave Benefits: {{leaveBenefits}}\n\n{{offerMessage}}',
        variables: {
          applicantName: updated.applicantName,
          jobTitle: updated.jobPosting.title,
          salaryGrade: `${updated.offerSalaryGrade.code} - ${updated.offerSalaryGrade.name}`,
          grossSalary,
          leaveBenefits,
          offerMessage: updated.offerMessage,
        },
        relatedModule: 'recruitment',
        relatedEntityId: updated.id,
      })
    }

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'job-application',
      resourceId: id,
      description: `Updated application "${existing.applicationNo}" for ${existing.applicantName}`,
      oldValues: { status: existing.status },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

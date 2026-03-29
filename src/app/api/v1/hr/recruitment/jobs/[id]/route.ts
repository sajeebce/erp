import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
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

    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { applications: true } },
      },
    })

    if (!jobPosting) {
      return apiNotFound('Job posting not found')
    }

    return apiSuccess(jobPosting)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.jobPosting.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('Job posting not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.title !== undefined) data.title = body.title.trim()
    if (body.departmentId !== undefined) data.departmentId = body.departmentId
    if (body.designationId !== undefined) data.designationId = body.designationId || null
    if (body.hiringManagerId !== undefined) data.hiringManagerId = body.hiringManagerId || null
    if (body.employmentType !== undefined) data.employmentType = body.employmentType
    if (body.location !== undefined) data.location = body.location.trim()
    if (body.isRemote !== undefined) data.isRemote = body.isRemote
    if (body.vacancies !== undefined) data.vacancies = body.vacancies
    if (body.salaryMin !== undefined) data.salaryMin = body.salaryMin ? new Prisma.Decimal(body.salaryMin) : null
    if (body.salaryMax !== undefined) data.salaryMax = body.salaryMax ? new Prisma.Decimal(body.salaryMax) : null
    if (body.currency !== undefined) data.currency = body.currency
    if (body.showSalary !== undefined) data.showSalary = body.showSalary
    if (body.description !== undefined) data.description = body.description
    if (body.responsibilities !== undefined) data.responsibilities = body.responsibilities
    if (body.qualifications !== undefined) data.qualifications = body.qualifications
    if (body.preferredSkills !== undefined) data.preferredSkills = body.preferredSkills || null
    if (body.benefits !== undefined) data.benefits = body.benefits || null
    if (body.minEducation !== undefined) data.minEducation = body.minEducation || null
    if (body.minExperience !== undefined) data.minExperience = body.minExperience ?? null
    if (body.requiredSkills !== undefined) data.requiredSkills = body.requiredSkills || null
    if (body.requiredLanguages !== undefined) data.requiredLanguages = body.requiredLanguages || null
    if (body.requiredCertifications !== undefined) data.requiredCertifications = body.requiredCertifications || null
    if (body.projectId !== undefined) data.projectId = body.projectId || null
    if (body.grantId !== undefined) data.grantId = body.grantId || null
    if (body.applicationDeadline !== undefined) data.applicationDeadline = new Date(body.applicationDeadline)
    if (body.expectedStartDate !== undefined) data.expectedStartDate = body.expectedStartDate ? new Date(body.expectedStartDate) : null
    if (body.isInternal !== undefined) data.isInternal = body.isInternal
    if (body.allowInternalApplicants !== undefined) data.allowInternalApplicants = body.allowInternalApplicants
    if (body.requireCoverLetter !== undefined) data.requireCoverLetter = body.requireCoverLetter
    if (body.customQuestions !== undefined) data.customQuestions = body.customQuestions || null

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.jobPosting.update({ where: { id }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'job-posting',
      resourceId: id,
      description: `Updated job posting "${updated.title}"`,
      oldValues: { title: existing.title, status: existing.status },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.jobPosting.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('Job posting not found')
    }

    if (existing.status === 'DRAFT') {
      // Hard delete for drafts
      await prisma.jobPosting.delete({ where: { id } })
    } else {
      // Soft-delete by setting status to CANCELLED
      await prisma.jobPosting.update({
        where: { id },
        data: { status: 'CANCELLED' },
      })
    }

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'DELETE',
      module: 'hr',
      resource: 'job-posting',
      resourceId: id,
      description: `Deleted job posting "${existing.title}" (${existing.postingNo})`,
      oldValues: { title: existing.title, status: existing.status },
      ...auditCtx,
    })

    return apiSuccess({ deleted: true })
  } catch (error) {
    return handleRouteError(error)
  }
}

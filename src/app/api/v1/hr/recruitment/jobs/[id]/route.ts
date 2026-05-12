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
import { upsertRecruitmentTags } from '@/lib/recruitment-tags'

interface RouteParams {
  params: Promise<{ id: string }>
}

function normalizeStringArray(value: unknown): string[] {
  if (typeof value === 'string') {
    try {
      return normalizeStringArray(JSON.parse(value))
    } catch {
      return value.trim() ? [value.trim()] : []
    }
  }
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

function normalizeRequiredLanguages(value: unknown): { language: string; level?: string }[] {
  if (typeof value === 'string') {
    try {
      return normalizeRequiredLanguages(JSON.parse(value))
    } catch {
      const language = value.trim()
      return language ? [{ language }] : []
    }
  }
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') {
        const language = item.trim()
        return language ? { language } : null
      }
      if (item && typeof item === 'object') {
        const language = typeof (item as { language?: unknown }).language === 'string'
          ? (item as { language: string }).language.trim()
          : ''
        const level = typeof (item as { level?: unknown }).level === 'string'
          ? (item as { level: string }).level.trim()
          : ''
        return language ? { language, ...(level ? { level } : {}) } : null
      }
      return null
    })
    .filter((item): item is { language: string; level?: string } => Boolean(item))
}

function normalizeEducationLevel(value: string | null): string | null {
  if (!value) return null
  const normalized = value.trim().toUpperCase()
  const aliases: Record<string, string> = {
    PHD: 'PHD',
    PH_D: 'PHD',
    DOCTORATE: 'PHD',
    MASTERS: 'MASTERS',
    MASTER: 'MASTERS',
    BACHELORS: 'BACHELORS',
    BACHELOR: 'BACHELORS',
    DIPLOMA: 'DIPLOMA',
    HIGH_SCHOOL: 'HIGH_SCHOOL',
    'HIGH SCHOOL': 'HIGH_SCHOOL',
  }
  return aliases[normalized] || normalized
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        department: { select: { id: true, name: true, code: true } },
        organization: { select: { slug: true } },
        _count: { select: { applications: true } },
      },
    })

    if (!jobPosting) {
      return apiNotFound('Job posting not found')
    }

    return apiSuccess({
      ...jobPosting,
      minEducation: normalizeEducationLevel(jobPosting.minEducation),
      requiredSkills: normalizeStringArray(jobPosting.requiredSkills),
      requiredLanguages: normalizeRequiredLanguages(jobPosting.requiredLanguages),
      requiredCertifications: normalizeStringArray(jobPosting.requiredCertifications),
    })
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
    if (body.qualifications !== undefined) data.qualifications = body.qualifications || 'See structured requirements'
    if (body.preferredSkills !== undefined) data.preferredSkills = null
    if (body.benefits !== undefined) data.benefits = body.benefits || null
    if (body.minEducation !== undefined) data.minEducation = body.minEducation || null
    if (body.minExperience !== undefined) data.minExperience = body.minExperience ?? null
    const normalizedSkills = body.requiredSkills !== undefined ? normalizeStringArray(body.requiredSkills) : null
    const normalizedLanguages = body.requiredLanguages !== undefined ? normalizeRequiredLanguages(body.requiredLanguages) : null
    const normalizedCertifications = body.requiredCertifications !== undefined ? normalizeStringArray(body.requiredCertifications) : null

    if (body.departmentId !== undefined) {
      const department = await prisma.department.findFirst({
        where: { id: body.departmentId, organizationId: auth.organizationId, isActive: true },
        select: { id: true },
      })
      if (!department) return apiBadRequest('Active department not found in this organization')
    }

    if (body.requiredSkills !== undefined) data.requiredSkills = normalizedSkills && normalizedSkills.length > 0 ? normalizedSkills : Prisma.JsonNull
    if (body.requiredLanguages !== undefined) data.requiredLanguages = normalizedLanguages && normalizedLanguages.length > 0 ? normalizedLanguages : Prisma.JsonNull
    if (body.requiredCertifications !== undefined) data.requiredCertifications = normalizedCertifications && normalizedCertifications.length > 0 ? normalizedCertifications : Prisma.JsonNull
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

    await Promise.all([
      normalizedSkills ? upsertRecruitmentTags(auth.organizationId, 'SKILL', normalizedSkills) : Promise.resolve(),
      normalizedLanguages ? upsertRecruitmentTags(auth.organizationId, 'LANGUAGE', normalizedLanguages.map((item) => item.language)) : Promise.resolve(),
      normalizedCertifications ? upsertRecruitmentTags(auth.organizationId, 'CERTIFICATION', normalizedCertifications) : Promise.resolve(),
    ])

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

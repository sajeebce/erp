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
import { Prisma } from '@prisma/client'
import { upsertRecruitmentTags } from '@/lib/recruitment-tags'

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

function normalizeRequiredLanguages(value: unknown): { language: string; level?: string }[] {
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

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, search, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { postingNo: { contains: search, mode: 'insensitive' } },
      ]
    }

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const departmentId = url.searchParams.get('departmentId')
    if (departmentId) where.departmentId = departmentId

    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        select: {
          id: true,
          postingNo: true,
          title: true,
          slug: true,
          departmentId: true,
          employmentType: true,
          location: true,
          isRemote: true,
          vacancies: true,
          salaryMin: true,
          salaryMax: true,
          showSalary: true,
          status: true,
          publishedAt: true,
          applicationDeadline: true,
          isInternal: true,
          createdAt: true,
          department: { select: { id: true, name: true } },
          organization: { select: { slug: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.jobPosting.count({ where }),
    ])

    return apiPaginated(
      jobs.map((job) => ({
        ...job,
        applicationsCount: job._count.applications,
      })),
      total,
      page,
      limit
    )
  } catch (error) {
    return handleRouteError(error)
  }
}

function generateSlug(title: string, location: string): string {
  const base = `${title}-${location}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return base
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const {
      title,
      departmentId,
      description,
      responsibilities,
      qualifications,
      applicationDeadline,
      location,
    } = body

    if (!title || !departmentId || !description || !responsibilities || !qualifications || !applicationDeadline || !location) {
      return apiBadRequest('title, departmentId, description, responsibilities, qualifications, applicationDeadline, and location are required')
    }

    // Validate department belongs to org
    const dept = await prisma.department.findFirst({
      where: { id: departmentId, organizationId: auth.organizationId },
      select: { id: true },
    })
    if (!dept) return apiBadRequest('Department not found in this organization')

    const postingNo = await generateNextNumber(auth.organizationId, 'job-posting')

    // Generate unique slug
    let slug = generateSlug(title, location)
    const existingSlug = await prisma.jobPosting.findUnique({ where: { slug } })
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
    }

    const normalizedSkills = normalizeStringArray(body.requiredSkills)
    const normalizedLanguages = normalizeRequiredLanguages(body.requiredLanguages)
    const normalizedCertifications = normalizeStringArray(body.requiredCertifications)

    const jobPosting = await prisma.jobPosting.create({
      data: {
        organizationId: auth.organizationId,
        postingNo,
        title: title.trim(),
        slug,
        departmentId,
        designationId: body.designationId || null,
        hiringManagerId: body.hiringManagerId || null,
        employmentType: body.employmentType || 'FULL_TIME',
        location: location.trim(),
        isRemote: body.isRemote || false,
        vacancies: body.vacancies || 1,
        salaryMin: body.salaryMin ? new Prisma.Decimal(body.salaryMin) : null,
        salaryMax: body.salaryMax ? new Prisma.Decimal(body.salaryMax) : null,
        currency: body.currency || 'BDT',
        showSalary: body.showSalary || false,
        description,
        responsibilities,
        qualifications,
        preferredSkills: body.preferredSkills || null,
        benefits: body.benefits || null,
        minEducation: body.minEducation || null,
        minExperience: body.minExperience ?? null,
        requiredSkills: normalizedSkills.length > 0 ? normalizedSkills : Prisma.JsonNull,
        requiredLanguages: normalizedLanguages.length > 0 ? normalizedLanguages : Prisma.JsonNull,
        requiredCertifications: normalizedCertifications.length > 0 ? normalizedCertifications : Prisma.JsonNull,
        projectId: body.projectId || null,
        grantId: body.grantId || null,
        applicationDeadline: new Date(applicationDeadline),
        expectedStartDate: body.expectedStartDate ? new Date(body.expectedStartDate) : null,
        isInternal: body.isInternal || false,
        allowInternalApplicants: body.allowInternalApplicants ?? true,
        requireCoverLetter: body.requireCoverLetter || false,
        customQuestions: body.customQuestions || null,
        createdById: auth.userId,
      },
    })

    await Promise.all([
      upsertRecruitmentTags(auth.organizationId, 'SKILL', normalizedSkills),
      upsertRecruitmentTags(auth.organizationId, 'LANGUAGE', normalizedLanguages.map((item) => item.language)),
      upsertRecruitmentTags(auth.organizationId, 'CERTIFICATION', normalizedCertifications),
    ])

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'job-posting',
      resourceId: jobPosting.id,
      description: `Created job posting "${title}" (${postingNo})`,
      newValues: { postingNo, title, departmentId, location },
      ...auditCtx,
    })

    return apiCreated(jobPosting)
  } catch (error) {
    return handleRouteError(error)
  }
}

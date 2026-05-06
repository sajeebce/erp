import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { apiSuccess, apiNotFound, handleRouteError } from '@/lib/api-response'

function normalizePublicLanguages(value: unknown): { language: string; level?: string }[] {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; jobSlug: string }> }
) {
  try {
    const { orgSlug, jobSlug } = await params

    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true, name: true, logo: true },
    })

    if (!org) return apiNotFound('Organization not found')

    const job = await prisma.jobPosting.findFirst({
      where: {
        slug: jobSlug,
        organizationId: org.id,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        location: true,
        employmentType: true,
        applicationDeadline: true,
        salaryMin: true,
        salaryMax: true,
        currency: true,
        showSalary: true,
        isRemote: true,
        vacancies: true,
        description: true,
        responsibilities: true,
        qualifications: true,
        preferredSkills: true,
        benefits: true,
        minEducation: true,
        minExperience: true,
        requiredSkills: true,
        requiredLanguages: true,
        requiredCertifications: true,
        requireCoverLetter: true,
        customQuestions: true,
        department: { select: { name: true } },
      },
    })

    if (!job) return apiNotFound('Job posting not found')

    return apiSuccess({
      ...job,
      requiredLanguages: normalizePublicLanguages(job.requiredLanguages),
      organization: org,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { apiSuccess, apiNotFound, handleRouteError } from '@/lib/api-response'

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
        requireCoverLetter: true,
        customQuestions: true,
        department: { select: { name: true } },
      },
    })

    if (!job) return apiNotFound('Job posting not found')

    return apiSuccess({ ...job, organization: org })
  } catch (error) {
    return handleRouteError(error)
  }
}

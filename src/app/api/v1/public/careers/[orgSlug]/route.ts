import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { apiSuccess, apiNotFound, handleRouteError } from '@/lib/api-response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params

    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true, name: true, logo: true, website: true },
    })

    if (!org) return apiNotFound('Organization not found')

    const jobs = await prisma.jobPosting.findMany({
      where: {
        organizationId: org.id,
        status: 'PUBLISHED',
        applicationDeadline: { gte: new Date() },
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
        showSalary: true,
        isRemote: true,
        vacancies: true,
        department: { select: { name: true } },
      },
      orderBy: { publishedAt: 'desc' },
    })

    return apiSuccess({ organization: org, jobs })
  } catch (error) {
    return handleRouteError(error)
  }
}

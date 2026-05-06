import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiNotFound, apiSuccess, handleRouteError } from '@/lib/api-response'
import { autoScoreApplication } from '@/lib/recruitment-scoring'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true },
    })

    if (!jobPosting) {
      return apiNotFound('Job posting not found')
    }

    const applications = await prisma.jobApplication.findMany({
      where: {
        jobPostingId: id,
        organizationId: auth.organizationId,
      },
      select: { id: true },
    })

    await Promise.all(applications.map((application) => autoScoreApplication(application.id)))

    const updatedApplications = await prisma.jobApplication.findMany({
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
    })

    return apiSuccess(updatedApplications)
  } catch (error) {
    return handleRouteError(error)
  }
}

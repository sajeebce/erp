import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const url = new URL(request.url)
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10)))

    // Verify job posting belongs to org
    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true, title: true, postingNo: true },
    })

    if (!jobPosting) {
      return apiNotFound('Job posting not found')
    }

    const applications = await prisma.jobApplication.findMany({
      where: { jobPostingId: id },
      select: {
        id: true,
        applicationNo: true,
        applicantName: true,
        applicantEmail: true,
        autoScore: true,
        finalScore: true,
        scoreBreakdown: true,
        parsedEducation: true,
        parsedExperience: true,
        parsedSkills: true,
        totalExperienceYears: true,
        status: true,
        appliedAt: true,
      },
      orderBy: [
        { finalScore: { sort: 'desc', nulls: 'last' } },
        { autoScore: { sort: 'desc', nulls: 'last' } },
      ],
      take: limit,
    })

    return apiSuccess({
      jobPosting,
      candidates: applications,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const application = await prisma.jobApplication.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        jobPosting: {
          select: {
            title: true,
            departmentId: true,
            designationId: true,
            employmentType: true,
            location: true,
          },
        },
      },
    })

    if (!application) {
      return apiNotFound('Application not found')
    }

    if (application.status !== 'HIRED') {
      return apiBadRequest(
        `Cannot convert — application status is "${application.status}". Only HIRED applications can be converted.`
      )
    }

    return apiSuccess({
      prefill: {
        fullName: application.applicantName,
        email: application.applicantEmail,
        phone: application.applicantPhone,
        convertedFromApplicationId: application.id,
        education: application.parsedEducation,
        experience: application.parsedExperience,
        skills: application.parsedSkills,
      },
      jobPosting: {
        title: application.jobPosting.title,
        departmentId: application.jobPosting.departmentId,
        designationId: application.jobPosting.designationId,
        employmentType: application.jobPosting.employmentType,
        location: application.jobPosting.location,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

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

async function getConversionPrefill(request: NextRequest, { params }: RouteParams) {
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
        offerSalaryGrade: {
          select: {
            id: true,
            midSalary: true,
            maxSalary: true,
            minSalary: true,
            structures: {
              where: { isActive: true },
              select: { id: true },
              take: 1,
            },
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
        religion: application.religion,
        convertedFromApplicationId: application.id,
        education: application.parsedEducation,
        experience: application.parsedExperience,
        skills: application.parsedSkills,
        salaryGradeId: application.offerSalaryGradeId,
        salaryStructureId: application.offerSalaryGrade?.structures?.[0]?.id || null,
        basicSalary: application.offerSalaryGrade
          ? Number(application.offerSalaryGrade.midSalary || application.offerSalaryGrade.maxSalary || application.offerSalaryGrade.minSalary || 0)
          : application.offeredSalary ? Number(application.offeredSalary) : null,
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

export async function GET(request: NextRequest, context: RouteParams) {
  return getConversionPrefill(request, context)
}

export async function POST(request: NextRequest, context: RouteParams) {
  return getConversionPrefill(request, context)
}

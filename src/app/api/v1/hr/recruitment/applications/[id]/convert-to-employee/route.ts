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

function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    : []
}

function addressToText(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const address = value as Record<string, unknown>
  const parts = ['village', 'postOffice', 'union', 'thana', 'district']
    .map((key) => String(address[key] || '').trim())
    .filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

async function findFallbackSalaryStructureId(organizationId: string, salaryGradeId?: string | null) {
  if (salaryGradeId) {
    const gradeStructure = await prisma.salaryStructure.findFirst({
      where: { organizationId, gradeId: salaryGradeId, isActive: true },
      select: { id: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    })
    if (gradeStructure) return gradeStructure.id
  }

  const defaultStructure = await prisma.salaryStructure.findFirst({
    where: { organizationId, gradeId: null, isActive: true, isDefault: true },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })
  if (defaultStructure) return defaultStructure.id

  const globalStructure = await prisma.salaryStructure.findFirst({
    where: { organizationId, gradeId: null, isActive: true },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })
  return globalStructure?.id || null
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
            steps: {
              orderBy: { stepNumber: 'asc' },
              select: { stepNumber: true, basicSalary: true },
            },
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

    const salaryStructureId =
      application.offerSalaryGrade?.structures?.[0]?.id ||
      await findFallbackSalaryStructureId(auth.organizationId, application.offerSalaryGradeId)

    return apiSuccess({
      prefill: {
        fullName: application.applicantName,
        localizedName: application.applicantNameBn,
        email: application.applicantEmail,
        phone: application.applicantPhone,
        alternatePhone: application.phoneAlt,
        fatherName: application.fatherSpouseName,
        motherName: application.motherName,
        dateOfBirth: application.dateOfBirth,
        gender: application.gender,
        nationality: application.nationality,
        nidNumber: application.nidNumber,
        religion: application.religion,
        bloodGroup: application.bloodGroup,
        maritalStatus: application.maritalStatus,
        presentAddress: addressToText(application.presentAddress),
        permanentAddress: addressToText(application.permanentAddress),
        emergencyContact: asRecordArray(application.emergencyContacts)
          .map((contact) => [contact.name, contact.relationship, contact.mobile].filter(Boolean).join(' - '))
          .filter(Boolean)
          .join('; '),
        educationRecords: asRecordArray(application.educationRecords),
        previousEmployments: asRecordArray(application.previousEmployments),
        references: asRecordArray(application.references),
        emergencyContacts: asRecordArray(application.emergencyContacts),
        languages: application.parsedLanguages,
        certifications: application.parsedCertifications,
        trainingDetails: application.trainingDetails,
        professionName: application.professionName,
        hasProfessionalLicense: application.hasProfessionalLicense,
        hasLegalCase: application.hasLegalCase,
        hasRelativeInOrg: application.hasRelativeInOrg,
        convertedFromApplicationId: application.id,
        education: application.parsedEducation,
        experience: application.parsedExperience,
        skills: application.parsedSkills,
        salaryGradeId: application.offerSalaryGradeId,
        salaryStructureId,
        basicSalary: application.offeredSalary
          ? Number(application.offeredSalary)
          : application.offerSalaryGrade
            ? Number(application.offerSalaryGrade.steps?.[0]?.basicSalary || application.offerSalaryGrade.minSalary || application.offerSalaryGrade.midSalary || application.offerSalaryGrade.maxSalary || 0)
            : null,
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

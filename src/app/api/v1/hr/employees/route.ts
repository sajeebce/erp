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

function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    : []
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .map((item) => typeof item === 'string' ? item.trim() : '')
        .filter(Boolean)
    : []
}

function text(value: unknown): string {
  return String(value || '').trim()
}

function parseYearDate(value: unknown): Date | null {
  const match = text(value).match(/\b(19|20)\d{2}\b/)
  return match ? new Date(`${match[0]}-01-01T00:00:00.000Z`) : null
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

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, search, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
      deletedAt: null,
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { employeeNo: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const departmentId = url.searchParams.get('departmentId')
    if (departmentId) where.departmentId = departmentId

    const designationId = url.searchParams.get('designationId')
    if (designationId) where.designationId = designationId

    const dutyStation = url.searchParams.get('dutyStation')
    if (dutyStation) where.dutyStation = dutyStation

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const employmentType = url.searchParams.get('employmentType')
    if (employmentType) where.employmentType = employmentType

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        select: {
          id: true,
          employeeNo: true,
          fullName: true,
          email: true,
          phone: true,
          religion: true,
          departmentId: true,
          designationId: true,
          employmentType: true,
          joiningDate: true,
          status: true,
          basicSalary: true,
          photo: true,
          dutyStation: true,
          localizedName: true,
          createdAt: true,
          department: { select: { id: true, name: true } },
          designation: { select: { id: true, title: true } },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ])

    return apiPaginated(employees, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { fullName, departmentId, designationId, joiningDate, primaryBusinessUnitId, workLocationId } = body

    if (!fullName || !departmentId || !designationId || !joiningDate) {
      return apiBadRequest('fullName, departmentId, designationId, and joiningDate are required')
    }

    // Validate department belongs to org
    const dept = await prisma.department.findFirst({
      where: { id: departmentId, organizationId: auth.organizationId },
      select: { id: true },
    })
    if (!dept) return apiBadRequest('Department not found in this organization')

    // Validate designation exists
    const desig = await prisma.designation.findUnique({
      where: { id: designationId },
      select: { id: true },
    })
    if (!desig) return apiBadRequest('Designation not found')

    if (primaryBusinessUnitId) {
      const businessUnit = await prisma.businessUnit.findFirst({
        where: { id: primaryBusinessUnitId, organizationId: auth.organizationId },
        select: { id: true },
      })
      if (!businessUnit) return apiBadRequest('Business unit not found in this organization')
    }

    if (workLocationId) {
      const workLocation = await prisma.operatingLocation.findFirst({
        where: { id: workLocationId, organizationId: auth.organizationId },
        select: { id: true },
      })
      if (!workLocation) return apiBadRequest('Work location not found in this organization')
    }

    let resolvedSalaryStepNo = body.salaryStepNo || null

    if (body.salaryGradeId) {
      const salaryGrade = await prisma.salaryGrade.findFirst({
        where: { id: body.salaryGradeId, organizationId: auth.organizationId, isActive: true },
        select: { id: true, steps: { orderBy: { stepNumber: 'asc' } } },
      })
      if (!salaryGrade) return apiBadRequest('Salary grade not found in this organization')

      if (!resolvedSalaryStepNo) {
        const basicSalary = Number(body.basicSalary || 0)
        const matchingStep = basicSalary > 0
          ? salaryGrade.steps.find((step) => Number(step.basicSalary) === basicSalary)
          : null
        resolvedSalaryStepNo = matchingStep?.stepNumber || salaryGrade.steps[0]?.stepNumber || 1
      }
    }

    if (body.salaryStructureId) {
      const salaryStructure = await prisma.salaryStructure.findFirst({
        where: { id: body.salaryStructureId, organizationId: auth.organizationId, isActive: true },
        select: { id: true },
      })
      if (!salaryStructure) return apiBadRequest('Salary structure not found in this organization')
    }

    const resolvedSalaryStructureId = body.salaryStructureId || await findFallbackSalaryStructureId(auth.organizationId, body.salaryGradeId)

    const employeeNo = await generateNextNumber(auth.organizationId, 'employee')
    const contractNo = await generateNextNumber(auth.organizationId, 'employee-contract')

    // Auto-start Onboarding
    const checklists = await prisma.onboardingChecklist.findMany({
      where: {
        isActive: true,
        OR: [
          { organizationId: auth.organizationId },
          { organizationId: null },
        ],
      },
    })

    const employee = await prisma.$transaction(async (tx) => {
      const createdEmployee = await tx.employee.create({
        data: {
          organizationId: auth.organizationId,
          employeeNo,
          fullName: fullName.trim(),
          localizedName: body.localizedName || null,
          fatherName: body.fatherName || null,
          motherName: body.motherName || null,
          spouseName: body.spouseName || null,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
          gender: body.gender || null,
          maritalStatus: body.maritalStatus || null,
          nationality: body.nationality || 'Bangladeshi',
          religion: body.religion || null,
          bloodGroup: body.bloodGroup || null,
          nidNumber: body.nidNumber || null,
          passport: body.passport || null,
          phone: body.phone || null,
          email: body.email || null,
          emergencyContact: body.emergencyContact || null,
          presentAddress: body.presentAddress || null,
          permanentAddress: body.permanentAddress || null,
          departmentId,
          designationId,
          primaryBusinessUnitId: primaryBusinessUnitId || null,
          workLocationId: workLocationId || null,
          employmentType: body.employmentType || 'FULL_TIME',
          joiningDate: new Date(joiningDate),
          confirmationDate: body.confirmationDate ? new Date(body.confirmationDate) : null,
          endDate: body.endDate ? new Date(body.endDate) : null,
          reportingToId: body.reportingToId || null,
          status: body.status || 'ACTIVE',
          dutyStation: body.dutyStation || null,
          salaryGradeId: body.salaryGradeId || null,
          salaryStepNo: resolvedSalaryStepNo,
          salaryStructureId: resolvedSalaryStructureId || null,
          basicSalary: body.basicSalary ? new Prisma.Decimal(body.basicSalary) : null,
          grossSalary: body.basicSalary ? new Prisma.Decimal(body.basicSalary) : null,
          bankAccountNo: body.bankAccountNo || null,
          bankName: body.bankName || null,
          tinNumber: body.tinNumber || null,
          notes: body.notes || null,
          convertedFromApplicationId: body.convertedFromApplicationId || null,
        },
      })

      const educationRecords = asRecordArray(body.educationRecords)
        .map((record) => ({
          employeeId: createdEmployee.id,
          degree: text(record.examName || record.degree),
          institution: text(record.institution),
          fieldOfStudy: text(record.board || record.fieldOfStudy) || null,
          endYear: Number.isFinite(Number(record.passingYear || record.endYear)) ? Number(record.passingYear || record.endYear) : null,
          grade: text(record.gradeGpa || record.grade) || null,
          country: 'Bangladesh',
        }))
        .filter((record) => record.degree && record.institution)

      if (educationRecords.length > 0) {
        await tx.employeeEducation.createMany({ data: educationRecords })
      }

      const previousEmployments = asRecordArray(body.previousEmployments)
        .map((record) => ({
          employeeId: createdEmployee.id,
          employer: text(record.orgName || record.employer),
          jobTitle: text(record.designation || record.jobTitle),
          startDate: parseYearDate(record.period || record.startDate),
          reasonForLeaving: text(record.reasonForLeaving) || null,
          responsibilities: text(record.lastSalary) ? `Last salary: ${text(record.lastSalary)}` : null,
        }))
        .filter((record): record is Omit<typeof record, 'startDate'> & { startDate: Date } => Boolean(record.employer && record.jobTitle && record.startDate))

      if (previousEmployments.length > 0) {
        await tx.employeeWorkHistory.createMany({ data: previousEmployments })
      }

      const emergencyContacts = asRecordArray(body.emergencyContacts)
        .map((record, index) => ({
          employeeId: createdEmployee.id,
          contactName: text(record.name || record.contactName),
          relationship: text(record.relationship) || 'OTHER',
          phone: text(record.mobile || record.phone),
          isPrimary: index === 0,
        }))
        .filter((record) => record.contactName && record.phone)

      if (emergencyContacts.length > 0) {
        await tx.employeeEmergencyContact.createMany({ data: emergencyContacts })
      }

      const skillNames = asStringArray(body.skills)
      if (skillNames.length > 0) {
        await tx.employeeSkill.createMany({
          data: skillNames.map((skillName) => ({
            employeeId: createdEmployee.id,
            skillName,
            proficiency: 'INTERMEDIATE',
          })),
          skipDuplicates: true,
        })
      }

      const languageRecords: Array<{ language: string; level: string }> = Array.isArray(body.languages)
        ? (body.languages as unknown[])
            .map((item: unknown) => {
              if (typeof item === 'string') {
                return { language: item.trim(), level: '' }
              }
              if (item && typeof item === 'object' && !Array.isArray(item)) {
                const record = item as Record<string, unknown>
                return {
                  language: text(record.language || record.name),
                  level: text(record.level),
                }
              }
              return { language: '', level: '' }
            })
            .filter((record: { language: string; level: string }) => record.language)
        : []

      if (languageRecords.length > 0) {
        await tx.employeeLanguage.createMany({
          data: languageRecords.map((record: { language: string; level: string }) => ({
            employeeId: createdEmployee.id,
            language: record.language,
            readLevel: record.level || null,
            writeLevel: record.level || null,
            speakLevel: record.level || null,
          })),
          skipDuplicates: true,
        })
      }

      const certifications = asStringArray(body.certifications)
      if (certifications.length > 0) {
        await tx.employeeCertification.createMany({
          data: certifications.map((name) => ({
            employeeId: createdEmployee.id,
            name,
            issuingOrg: 'Candidate declared',
          })),
        })
      }

      await tx.employeeContract.create({
        data: {
          organizationId: auth.organizationId,
          contractNo,
          employeeId: createdEmployee.id,
          contractType: body.employmentType || 'FULL_TIME',
          title: `${body.fullName} - Employment Contract`,
          startDate: new Date(body.joiningDate),
          endDate: body.endDate ? new Date(body.endDate) : null,
          basicSalary: body.basicSalary ? new Prisma.Decimal(body.basicSalary) : new Prisma.Decimal(0),
          status: 'DRAFT',
        },
      })

      if (checklists.length > 0) {
        await tx.onboardingProgress.createMany({
          data: checklists.map((c) => ({
            employeeId: createdEmployee.id,
            checklistId: c.id,
          })),
        })
      }

      return createdEmployee
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'employee',
      resourceId: employee.id,
      description: `Created employee "${fullName}" (${employeeNo})`,
      newValues: { employeeNo, fullName, departmentId, designationId },
      ...auditCtx,
    })

    return apiCreated(employee)
  } catch (error) {
    return handleRouteError(error)
  }
}

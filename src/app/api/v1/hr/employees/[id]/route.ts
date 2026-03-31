import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const employee = await prisma.employee.findFirst({
      where: { id, organizationId: auth.organizationId, deletedAt: null },
      include: {
        department: { select: { id: true, name: true, code: true } },
        designation: { select: { id: true, title: true, level: true } },
        reportingTo: { select: { id: true, fullName: true, employeeNo: true } },
        directReports: {
          where: { deletedAt: null },
          select: { id: true, fullName: true, employeeNo: true },
        },
        emergencyContacts: { orderBy: { isPrimary: 'desc' } },
        educationHistory: { orderBy: { endYear: 'desc' } },
        workHistory: { orderBy: { startDate: 'desc' } },
        dependents: true,
        skills: true,
        languages: true,
        certifications: { orderBy: { issueDate: 'desc' } },
        documents: { orderBy: { uploadedAt: 'desc' } },
      },
    })

    if (!employee) {
      return apiNotFound('Employee not found')
    }

    return apiSuccess(employee)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.employee.findFirst({
      where: { id, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!existing) {
      return apiNotFound('Employee not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.fullName !== undefined) data.fullName = body.fullName.trim()
    if (body.localizedName !== undefined) data.localizedName = body.localizedName || null
    if (body.fatherName !== undefined) data.fatherName = body.fatherName || null
    if (body.motherName !== undefined) data.motherName = body.motherName || null
    if (body.dateOfBirth !== undefined) data.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null
    if (body.gender !== undefined) data.gender = body.gender || null
    if (body.maritalStatus !== undefined) data.maritalStatus = body.maritalStatus || null
    if (body.phone !== undefined) data.phone = body.phone || null
    if (body.email !== undefined) data.email = body.email || null
    if (body.emergencyContact !== undefined) data.emergencyContact = body.emergencyContact || null
    if (body.presentAddress !== undefined) data.presentAddress = body.presentAddress || null
    if (body.permanentAddress !== undefined) data.permanentAddress = body.permanentAddress || null
    if (body.departmentId !== undefined) data.departmentId = body.departmentId
    if (body.designationId !== undefined) data.designationId = body.designationId
    if (body.employmentType !== undefined) data.employmentType = body.employmentType
    if (body.reportingToId !== undefined) data.reportingToId = body.reportingToId || null
    if (body.status !== undefined) data.status = body.status
    if (body.basicSalary !== undefined) data.basicSalary = body.basicSalary ? new Prisma.Decimal(body.basicSalary) : null
    if (body.bankAccountNo !== undefined) data.bankAccountNo = body.bankAccountNo || null
    if (body.bankName !== undefined) data.bankName = body.bankName || null
    if (body.tinNumber !== undefined) data.tinNumber = body.tinNumber || null
    if (body.confirmationDate !== undefined) data.confirmationDate = body.confirmationDate ? new Date(body.confirmationDate) : null
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null
    if (body.notes !== undefined) data.notes = body.notes || null

    // Phase 12 — String fields (null if empty)
    if (body.spouseName !== undefined) data.spouseName = body.spouseName || null
    if (body.nationality !== undefined) data.nationality = body.nationality || null
    if (body.religion !== undefined) data.religion = body.religion || null
    if (body.bloodGroup !== undefined) data.bloodGroup = body.bloodGroup || null
    if (body.birthPlace !== undefined) data.birthPlace = body.birthPlace || null
    if (body.disability !== undefined) data.disability = body.disability || null
    if (body.dutyStation !== undefined) data.dutyStation = body.dutyStation || null
    if (body.gradeLevel !== undefined) data.gradeLevel = body.gradeLevel || null
    if (body.costCenter !== undefined) data.costCenter = body.costCenter || null
    if (body.shiftSchedule !== undefined) data.shiftSchedule = body.shiftSchedule || null
    if (body.bankBranch !== undefined) data.bankBranch = body.bankBranch || null
    if (body.bankRoutingNo !== undefined) data.bankRoutingNo = body.bankRoutingNo || null
    if (body.mobileBankingProvider !== undefined) data.mobileBankingProvider = body.mobileBankingProvider || null
    if (body.mobileBankingNumber !== undefined) data.mobileBankingNumber = body.mobileBankingNumber || null
    if (body.paymentMethod !== undefined) data.paymentMethod = body.paymentMethod || null
    if (body.taxCircle !== undefined) data.taxCircle = body.taxCircle || null
    if (body.taxZone !== undefined) data.taxZone = body.taxZone || null
    if (body.payFrequency !== undefined) data.payFrequency = body.payFrequency || null
    if (body.fd4ReferenceNo !== undefined) data.fd4ReferenceNo = body.fd4ReferenceNo || null
    if (body.fd4ApprovalStatus !== undefined) data.fd4ApprovalStatus = body.fd4ApprovalStatus || null
    if (body.backgroundCheckStatus !== undefined) data.backgroundCheckStatus = body.backgroundCheckStatus || null

    // Phase 12 — Int fields
    if (body.numberOfDependents !== undefined) data.numberOfDependents = body.numberOfDependents !== null ? parseInt(body.numberOfDependents, 10) : null
    if (body.noticePeriodDays !== undefined) data.noticePeriodDays = body.noticePeriodDays !== null ? parseInt(body.noticePeriodDays, 10) : null

    // Phase 12 — Boolean fields
    if (body.isExpatriate !== undefined) data.isExpatriate = Boolean(body.isExpatriate)
    if (body.ngoabNotified !== undefined) data.ngoabNotified = Boolean(body.ngoabNotified)
    if (body.codeOfConductSigned !== undefined) data.codeOfConductSigned = Boolean(body.codeOfConductSigned)
    if (body.pseaDeclarationSigned !== undefined) data.pseaDeclarationSigned = Boolean(body.pseaDeclarationSigned)
    if (body.mdsCheckCompleted !== undefined) data.mdsCheckCompleted = Boolean(body.mdsCheckCompleted)

    // Phase 12 — DateTime fields
    if (body.probationEndDate !== undefined) data.probationEndDate = body.probationEndDate ? new Date(body.probationEndDate) : null
    if (body.fd4SubmissionDate !== undefined) data.fd4SubmissionDate = body.fd4SubmissionDate ? new Date(body.fd4SubmissionDate) : null
    if (body.codeOfConductDate !== undefined) data.codeOfConductDate = body.codeOfConductDate ? new Date(body.codeOfConductDate) : null
    if (body.safeguardingTrainingDate !== undefined) data.safeguardingTrainingDate = body.safeguardingTrainingDate ? new Date(body.safeguardingTrainingDate) : null
    if (body.safeguardingTrainingExpiry !== undefined) data.safeguardingTrainingExpiry = body.safeguardingTrainingExpiry ? new Date(body.safeguardingTrainingExpiry) : null
    if (body.backgroundCheckDate !== undefined) data.backgroundCheckDate = body.backgroundCheckDate ? new Date(body.backgroundCheckDate) : null

    // Phase 12 — Decimal fields
    if (body.workingHoursPerWeek !== undefined) data.workingHoursPerWeek = body.workingHoursPerWeek ? new Prisma.Decimal(body.workingHoursPerWeek) : null
    if (body.houseRentAllowance !== undefined) data.houseRentAllowance = body.houseRentAllowance ? new Prisma.Decimal(body.houseRentAllowance) : null
    if (body.medicalAllowance !== undefined) data.medicalAllowance = body.medicalAllowance ? new Prisma.Decimal(body.medicalAllowance) : null
    if (body.transportAllowance !== undefined) data.transportAllowance = body.transportAllowance ? new Prisma.Decimal(body.transportAllowance) : null
    if (body.grossSalary !== undefined) data.grossSalary = body.grossSalary ? new Prisma.Decimal(body.grossSalary) : null

    // Phase 12 — Json field
    if (body.otherAllowances !== undefined) data.otherAllowances = body.otherAllowances ?? null

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.employee.update({ where: { id }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'employee',
      resourceId: id,
      description: `Updated employee "${updated.fullName}"`,
      oldValues: { fullName: existing.fullName, status: existing.status },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

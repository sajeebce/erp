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
    if (body.nameInBangla !== undefined) data.nameInBangla = body.nameInBangla || null
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

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
          departmentId: true,
          designationId: true,
          employmentType: true,
          joiningDate: true,
          status: true,
          basicSalary: true,
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

    const { fullName, departmentId, designationId, joiningDate } = body

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

    const employeeNo = await generateNextNumber(auth.organizationId, 'employee')

    const employee = await prisma.employee.create({
      data: {
        organizationId: auth.organizationId,
        employeeNo,
        fullName: fullName.trim(),
        nameInBangla: body.nameInBangla || null,
        fatherName: body.fatherName || null,
        motherName: body.motherName || null,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        gender: body.gender || null,
        maritalStatus: body.maritalStatus || null,
        nidNumber: body.nidNumber || null,
        passport: body.passport || null,
        phone: body.phone || null,
        email: body.email || null,
        emergencyContact: body.emergencyContact || null,
        presentAddress: body.presentAddress || null,
        permanentAddress: body.permanentAddress || null,
        departmentId,
        designationId,
        employmentType: body.employmentType || 'FULL_TIME',
        joiningDate: new Date(joiningDate),
        confirmationDate: body.confirmationDate ? new Date(body.confirmationDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        reportingToId: body.reportingToId || null,
        status: body.status || 'ACTIVE',
        basicSalary: body.basicSalary ? new Prisma.Decimal(body.basicSalary) : null,
        bankAccountNo: body.bankAccountNo || null,
        bankName: body.bankName || null,
        tinNumber: body.tinNumber || null,
        notes: body.notes || null,
      },
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

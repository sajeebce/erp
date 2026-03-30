import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated, apiBadRequest, apiConflict, handleRouteError,
} from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { employeeId, policyId, serviceStartDate } = body

    if (!employeeId || !policyId) {
      return apiBadRequest('employeeId and policyId are required')
    }

    // Check employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true, fullName: true, joiningDate: true },
    })
    if (!employee) {
      return apiBadRequest('Employee not found')
    }

    // Check policy belongs to org
    const policy = await prisma.gratuityPolicy.findFirst({
      where: { id: policyId, organizationId: auth.organizationId, isActive: true },
    })
    if (!policy) {
      return apiBadRequest('Gratuity policy not found or inactive')
    }

    // Check not already enrolled
    const existing = await prisma.gratuityLedger.findFirst({
      where: { organizationId: auth.organizationId, employeeId },
    })
    if (existing) {
      return apiConflict('Employee is already enrolled in gratuity')
    }

    const ledger = await prisma.gratuityLedger.create({
      data: {
        organizationId: auth.organizationId,
        employeeId,
        policyId,
        serviceStartDate: serviceStartDate ? new Date(serviceStartDate) : employee.joiningDate,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'gratuity_ledger',
      resourceId: ledger.id,
      description: `Enrolled employee "${employee.fullName}" in gratuity`,
      newValues: { employeeId, policyId },
      ...auditCtx,
    })

    return apiCreated(ledger)
  } catch (error) {
    return handleRouteError(error)
  }
}

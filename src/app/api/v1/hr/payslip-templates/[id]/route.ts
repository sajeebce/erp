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

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const template = await prisma.payslipTemplate.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!template) {
      return apiNotFound('Payslip template not found')
    }

    return apiSuccess(template)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.payslipTemplate.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!existing) {
      return apiNotFound('Payslip template not found')
    }

    // If setting this as default, unset other defaults
    if (body.isDefault && !existing.isDefault) {
      await prisma.payslipTemplate.updateMany({
        where: { organizationId: auth.organizationId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      })
    }

    const updated = await prisma.payslipTemplate.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.headerText !== undefined && { headerText: body.headerText }),
        ...(body.footerText !== undefined && { footerText: body.footerText }),
        ...(body.logoPath !== undefined && { logoPath: body.logoPath }),
        ...(body.showYTD !== undefined && { showYTD: body.showYTD }),
        ...(body.showEmployerContributions !== undefined && { showEmployerContributions: body.showEmployerContributions }),
        ...(body.showAttendanceSummary !== undefined && { showAttendanceSummary: body.showAttendanceSummary }),
        ...(body.showNetPayInWords !== undefined && { showNetPayInWords: body.showNetPayInWords }),
        ...(body.paperSize !== undefined && { paperSize: body.paperSize }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'payslip_template',
      resourceId: id,
      description: `Updated payslip template "${updated.name}"`,
      oldValues: { name: existing.name },
      newValues: { name: updated.name },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

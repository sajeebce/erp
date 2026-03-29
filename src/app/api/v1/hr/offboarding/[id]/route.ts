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

    const offboarding = await prisma.offboarding.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeNo: true,
            email: true,
            phone: true,
            joiningDate: true,
            basicSalary: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, title: true } },
          },
        },
        tasks: { orderBy: { sortOrder: 'asc' } },
      },
    })

    if (!offboarding) {
      return apiNotFound('Offboarding not found')
    }

    return apiSuccess(offboarding)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.offboarding.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('Offboarding not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.lastWorkingDay !== undefined) data.lastWorkingDay = new Date(body.lastWorkingDay)
    if (body.noticeDate !== undefined) data.noticeDate = body.noticeDate ? new Date(body.noticeDate) : null
    if (body.noticePeriodDays !== undefined) data.noticePeriodDays = body.noticePeriodDays
    if (body.exitInterviewDate !== undefined) data.exitInterviewDate = body.exitInterviewDate ? new Date(body.exitInterviewDate) : null
    if (body.exitInterviewerId !== undefined) data.exitInterviewerId = body.exitInterviewerId || null
    if (body.exitInterviewNotes !== undefined) data.exitInterviewNotes = body.exitInterviewNotes || null
    if (body.exitReason !== undefined) data.exitReason = body.exitReason || null
    if (body.wouldRehire !== undefined) data.wouldRehire = body.wouldRehire
    if (body.experienceCertPath !== undefined) data.experienceCertPath = body.experienceCertPath || null
    if (body.notes !== undefined) data.notes = body.notes || null
    if (body.status !== undefined) data.status = body.status

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.offboarding.update({ where: { id }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'offboarding',
      resourceId: id,
      description: `Updated offboarding "${existing.offboardingNo}"`,
      oldValues: { status: existing.status },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

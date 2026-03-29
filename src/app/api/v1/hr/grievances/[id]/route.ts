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

    const grievance = await prisma.employeeGrievance.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!grievance) {
      return apiNotFound('Grievance not found')
    }

    return apiSuccess(grievance)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.employeeGrievance.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('Grievance not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.assignedToId !== undefined) data.assignedToId = body.assignedToId || null
    if (body.investigationNotes !== undefined) data.investigationNotes = body.investigationNotes || null
    if (body.severity !== undefined) data.severity = body.severity
    if (body.status !== undefined) data.status = body.status
    if (body.evidencePaths !== undefined) data.evidencePaths = body.evidencePaths

    // If resolution is provided, set resolved status
    if (body.resolution !== undefined) {
      data.resolution = body.resolution
      data.resolutionDate = new Date()
      data.status = 'RESOLVED'
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.employeeGrievance.update({ where: { id }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'grievance',
      resourceId: id,
      description: `Updated grievance "${existing.grievanceNo}"`,
      oldValues: { status: existing.status },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

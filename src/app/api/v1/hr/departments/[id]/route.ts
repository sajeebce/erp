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

    const department = await prisma.department.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        employees: {
          where: { deletedAt: null },
          select: {
            id: true,
            employeeNo: true,
            fullName: true,
            designationId: true,
            status: true,
            designation: { select: { id: true, title: true } },
          },
          orderBy: { fullName: 'asc' },
        },
        children: {
          select: { id: true, name: true, code: true, isActive: true },
        },
        parent: {
          select: { id: true, name: true, code: true },
        },
      },
    })

    if (!department) {
      return apiNotFound('Department not found')
    }

    return apiSuccess(department)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.department.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('Department not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.name !== undefined) data.name = body.name.trim()
    if (body.code !== undefined) data.code = body.code.trim()
    if (body.headId !== undefined) data.headId = body.headId || null
    if (body.parentId !== undefined) data.parentId = body.parentId || null
    if (body.isActive !== undefined) data.isActive = body.isActive

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.department.update({ where: { id }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'department',
      resourceId: id,
      description: `Updated department "${updated.name}"`,
      oldValues: { name: existing.name },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

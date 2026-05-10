import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  apiConflict,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const isActive = url.searchParams.get('isActive')

    const departments = await prisma.department.findMany({
      where: {
        organizationId: auth.organizationId,
        ...(isActive !== null ? { isActive: isActive === 'true' } : {}),
      },
      select: {
        id: true,
        name: true,
        code: true,
        headId: true,
        parentId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    })

    // Fetch head names for departments that have heads
    const headIds = departments.map((d) => d.headId).filter(Boolean) as string[]
    const heads = headIds.length > 0
      ? await prisma.employee.findMany({
          where: { id: { in: headIds } },
          select: { id: true, fullName: true },
        })
      : []
    const headMap = new Map(heads.map((h) => [h.id, h.fullName]))

    const result = departments.map((d) => ({
      ...d,
      headName: d.headId ? headMap.get(d.headId) || null : null,
    }))

    return apiSuccess(result)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { name, code, headId, parentId } = body

    if (!name || !code) {
      return apiBadRequest('name and code are required')
    }

    // Check unique name within org
    const existingName = await prisma.department.findFirst({
      where: { organizationId: auth.organizationId, name },
    })
    if (existingName) {
      return apiConflict(`Department name "${name}" already exists`)
    }

    // Check unique code within org
    const existingCode = await prisma.department.findFirst({
      where: { organizationId: auth.organizationId, code },
    })
    if (existingCode) {
      return apiConflict(`Department code "${code}" already exists`)
    }

    // Validate parent belongs to org if provided
    if (parentId) {
      const parent = await prisma.department.findFirst({
        where: { id: parentId, organizationId: auth.organizationId },
        select: { id: true },
      })
      if (!parent) return apiBadRequest('Parent department not found in this organization')
    }

    const department = await prisma.department.create({
      data: {
        organizationId: auth.organizationId,
        name: name.trim(),
        code: code.trim(),
        headId: headId || null,
        parentId: parentId || null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'department',
      resourceId: department.id,
      description: `Created department "${name}" (${code})`,
      newValues: { name, code },
      ...auditCtx,
    })

    return apiCreated(department)
  } catch (error) {
    return handleRouteError(error)
  }
}

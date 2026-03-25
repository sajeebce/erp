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
    await requireAuthFromRequest(request)

    const designations = await prisma.designation.findMany({
      select: {
        id: true,
        title: true,
        level: true,
        isActive: true,
        createdAt: true,
        _count: { select: { employees: true } },
      },
      orderBy: [{ level: 'asc' }, { title: 'asc' }],
    })

    return apiSuccess(designations)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { title, level } = body

    if (!title) {
      return apiBadRequest('title is required')
    }

    const existing = await prisma.designation.findUnique({
      where: { title },
    })
    if (existing) {
      return apiConflict(`Designation "${title}" already exists`)
    }

    const designation = await prisma.designation.create({
      data: {
        title: title.trim(),
        level: level ?? null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'designation',
      resourceId: designation.id,
      description: `Created designation "${title}"`,
      newValues: { title, level },
      ...auditCtx,
    })

    return apiCreated(designation)
  } catch (error) {
    return handleRouteError(error)
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated, apiSuccess, apiBadRequest, apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const trust = await prisma.pFTrust.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true },
    })
    if (!trust) {
      return apiNotFound('PF trust not found')
    }

    const trustees = await prisma.pFTrustee.findMany({
      where: { trustId: id },
      orderBy: { appointedDate: 'asc' },
    })

    return apiSuccess(trustees)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    const trust = await prisma.pFTrust.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true, name: true },
    })
    if (!trust) {
      return apiNotFound('PF trust not found')
    }

    const { name, role, employeeId, appointedDate } = body

    if (!name || !role || !appointedDate) {
      return apiBadRequest('name, role, and appointedDate are required')
    }

    const trustee = await prisma.pFTrustee.create({
      data: {
        trustId: id,
        name: name.trim(),
        role,
        employeeId: employeeId || null,
        appointedDate: new Date(appointedDate),
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'pf_trustee',
      resourceId: trustee.id,
      description: `Added trustee "${name}" to PF trust "${trust.name}"`,
      newValues: { name, role },
      ...auditCtx,
    })

    return apiCreated(trustee)
  } catch (error) {
    return handleRouteError(error)
  }
}

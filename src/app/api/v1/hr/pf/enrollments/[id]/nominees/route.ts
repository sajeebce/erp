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

    const enrollment = await prisma.pFEnrollment.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true },
    })
    if (!enrollment) {
      return apiNotFound('PF enrollment not found')
    }

    const nominees = await prisma.pFNominee.findMany({
      where: { enrollmentId: id },
    })

    return apiSuccess(nominees)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    const enrollment = await prisma.pFEnrollment.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true },
    })
    if (!enrollment) {
      return apiNotFound('PF enrollment not found')
    }

    const { name, relationship, percentage, nidNumber, phone, address } = body

    if (!name || !relationship || percentage === undefined) {
      return apiBadRequest('name, relationship, and percentage are required')
    }

    // Check total percentage doesn't exceed 100
    const existingNominees = await prisma.pFNominee.findMany({
      where: { enrollmentId: id },
      select: { percentage: true },
    })
    const currentTotal = existingNominees.reduce((sum, n) => sum + Number(n.percentage), 0)
    if (currentTotal + Number(percentage) > 100) {
      return apiBadRequest(`Total nominee percentage would exceed 100% (current: ${currentTotal}%)`)
    }

    const nominee = await prisma.pFNominee.create({
      data: {
        enrollmentId: id,
        name: name.trim(),
        relationship,
        percentage,
        nidNumber: nidNumber || null,
        phone: phone || null,
        address: address || null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'pf_nominee',
      resourceId: nominee.id,
      description: `Added PF nominee "${name}" (${percentage}%)`,
      newValues: { name, relationship, percentage },
      ...auditCtx,
    })

    return apiCreated(nominee)
  } catch (error) {
    return handleRouteError(error)
  }
}

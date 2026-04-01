import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess, apiMessage, apiBadRequest, apiNotFound, handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string; nid: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id, nid } = await params
    const body = await request.json()

    const enrollment = await prisma.pFEnrollment.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true },
    })
    if (!enrollment) {
      return apiNotFound('PF enrollment not found')
    }

    const existing = await prisma.pFNominee.findFirst({
      where: { id: nid, enrollmentId: id },
    })
    if (!existing) {
      return apiNotFound('Nominee not found')
    }

    const { name, relationship, percentage, nidNumber, phone, address, photo, nidDocPath, otherDocPath } = body

    if (!name || !relationship || percentage === undefined) {
      return apiBadRequest('name, relationship, and percentage are required')
    }

    // Check total percentage doesn't exceed 100 (excluding current nominee)
    const otherNominees = await prisma.pFNominee.findMany({
      where: { enrollmentId: id, NOT: { id: nid } },
      select: { percentage: true },
    })
    const othersTotal = otherNominees.reduce((sum, n) => sum + Number(n.percentage), 0)
    if (othersTotal + Number(percentage) > 100) {
      return apiBadRequest(`Total nominee percentage would exceed 100% (others: ${othersTotal}%)`)
    }

    const nominee = await prisma.pFNominee.update({
      where: { id: nid },
      data: {
        name: name.trim(),
        relationship,
        percentage,
        nidNumber: nidNumber || null,
        phone: phone || null,
        address: address || null,
        photo: photo || null,
        nidDocPath: nidDocPath || null,
        otherDocPath: otherDocPath || null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'pf_nominee',
      resourceId: nid,
      description: `Updated PF nominee "${name}" (${percentage}%)`,
      oldValues: { name: existing.name, percentage: existing.percentage.toString() },
      newValues: { name, percentage },
      ...auditCtx,
    })

    return apiSuccess(nominee)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id, nid } = await params

    const enrollment = await prisma.pFEnrollment.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true },
    })
    if (!enrollment) {
      return apiNotFound('PF enrollment not found')
    }

    const nominee = await prisma.pFNominee.findFirst({
      where: { id: nid, enrollmentId: id },
    })
    if (!nominee) {
      return apiNotFound('Nominee not found')
    }

    await prisma.pFNominee.delete({ where: { id: nid } })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'DELETE',
      module: 'hr',
      resource: 'pf_nominee',
      resourceId: nid,
      description: `Removed PF nominee "${nominee.name}"`,
      oldValues: { name: nominee.name, percentage: nominee.percentage.toString() },
      ...auditCtx,
    })

    return apiMessage('Nominee removed successfully')
  } catch (error) {
    return handleRouteError(error)
  }
}

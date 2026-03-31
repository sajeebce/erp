import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string; docId: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId, docId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true },
    })
    if (!employee) {
      return apiNotFound('Employee not found')
    }

    const document = await prisma.employeeDocument.findFirst({
      where: { id: docId, employeeId },
    })
    if (!document) {
      return apiNotFound('Document not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.documentNumber !== undefined) data.documentNumber = body.documentNumber || null
    if (body.issuedDate !== undefined) data.issuedDate = body.issuedDate ? new Date(body.issuedDate) : null
    if (body.expiryDate !== undefined) data.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null
    if (body.issuingAuthority !== undefined) data.issuingAuthority = body.issuingAuthority || null
    if (body.notes !== undefined) data.notes = body.notes || null

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.employeeDocument.update({
      where: { id: docId },
      data,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId, docId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true },
    })
    if (!employee) {
      return apiNotFound('Employee not found')
    }

    const document = await prisma.employeeDocument.findFirst({
      where: { id: docId, employeeId },
    })
    if (!document) {
      return apiNotFound('Document not found')
    }

    await prisma.employeeDocument.delete({
      where: { id: docId },
    })

    return apiSuccess({ deleted: true })
  } catch (error) {
    return handleRouteError(error)
  }
}

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

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    if (!body.status || !['VERIFIED', 'REJECTED'].includes(body.status)) {
      return apiBadRequest('Status must be either VERIFIED or REJECTED')
    }

    const updated = await prisma.employeeDocument.update({
      where: { id: docId },
      data: {
        verificationStatus: body.status,
        verifiedBy: auth.userId,
        verifiedAt: new Date(),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

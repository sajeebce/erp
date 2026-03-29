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

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.disciplinaryCase.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('Disciplinary case not found')
    }

    if (existing.appealFiled) {
      return apiBadRequest('An appeal has already been filed for this case')
    }

    const body = await request.json()

    const updated = await prisma.disciplinaryCase.update({
      where: { id },
      data: {
        appealFiled: true,
        appealDate: new Date(),
        notes: body.appealReason
          ? `${existing.notes ? existing.notes + '\n\n' : ''}Appeal reason: ${body.appealReason}`
          : existing.notes,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'disciplinary_case',
      resourceId: id,
      description: `Appeal filed for disciplinary case "${existing.caseNo}"`,
      oldValues: { appealFiled: false },
      newValues: { appealFiled: true, appealDate: new Date() },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

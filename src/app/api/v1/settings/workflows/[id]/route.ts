import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { apiNotFound, apiSuccess, handleRouteError } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')
    const { id } = await params

    const workflow = await prisma.approvalWorkflowDef.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true },
    })

    if (!workflow) return apiNotFound('Workflow not found')

    const updated = await prisma.approvalWorkflowDef.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        module: true,
        entityType: true,
        isActive: true,
        updatedAt: true,
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

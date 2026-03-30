import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiMessage,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    // Verify checklist item belongs to this org (cannot edit global items)
    const existing = await prisma.onboardingChecklist.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!existing) {
      return apiNotFound('Checklist item not found in this organization')
    }

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.description !== undefined) updateData.description = body.description
    if (body.category !== undefined) updateData.category = body.category
    if (body.isRequired !== undefined) updateData.isRequired = body.isRequired
    if (body.requiresDocument !== undefined) updateData.requiresDocument = body.requiresDocument
    if (body.documentType !== undefined) updateData.documentType = body.documentType
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const updated = await prisma.onboardingChecklist.update({
      where: { id },
      data: updateData,
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'onboarding-checklist',
      resourceId: id,
      description: `Updated onboarding checklist item "${updated.name}"`,
      oldValues: { name: existing.name, category: existing.category, isActive: existing.isActive },
      newValues: updateData,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    // Verify checklist item belongs to this org
    const existing = await prisma.onboardingChecklist.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!existing) {
      return apiNotFound('Checklist item not found in this organization')
    }

    // Check if any progress records reference this checklist item
    const progressCount = await prisma.onboardingProgress.count({
      where: { checklistId: id },
    })

    if (progressCount > 0) {
      // Soft-disable instead of hard delete
      await prisma.onboardingChecklist.update({
        where: { id },
        data: { isActive: false },
      })

      const auditCtx = getAuditContext(request)
      await logAudit({
        organizationId: auth.organizationId,
        userId: auth.userId,
        action: 'UPDATE',
        module: 'hr',
        resource: 'onboarding-checklist',
        resourceId: id,
        description: `Deactivated onboarding checklist item "${existing.name}" (has ${progressCount} linked progress records)`,
        newValues: { isActive: false },
        ...auditCtx,
      })

      return apiBadRequest(
        `Cannot delete — ${progressCount} progress records reference this item. It has been deactivated instead.`
      )
    }

    // Safe to hard delete
    await prisma.onboardingChecklist.delete({ where: { id } })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'DELETE',
      module: 'hr',
      resource: 'onboarding-checklist',
      resourceId: id,
      description: `Deleted onboarding checklist item "${existing.name}"`,
      ...auditCtx,
    })

    return apiMessage('Checklist item deleted')
  } catch (error) {
    return handleRouteError(error)
  }
}
